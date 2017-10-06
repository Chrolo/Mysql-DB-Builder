// *Import all required libraries* //
const argv = require('./nodeArgsHandler.js');
const mysql = require('mysql');
const databaseConfig = require('./databaseConfig');
const {tableCreator} = require('./tableCreator.js');
const {addForiegnKeyConstraints, removeForeignKeyConstraintsFromTables} = require('./sql/constraints');
const {truncateTable} = require('./sql/tables');
const {promiseQuery} = require('./sql/utils');
const {addDataFromFile} = require('./dataFiller.js');
const tableValidator = require('./tableValidator.js');
const tableReconciliator = require('./tableReconciliator.js');
const getPasswordFromStdin = require('../src/passwordstdin.js');
const {intialiseStatusForTable, setTableStatus, getStatusesAsArray} = require('./tableStatuses');

//GLOBAL DEFINITIONS
let mysqlConnection;

//Processing begin:
new Promise((resolve) => {
//-- CONFIG STAGE --//
    //Load config file
    databaseConfig.loadConfigFromFile(argv.config);
    if (databaseConfig.getConfig() === null) {
        console.error('[MySQLBuilder] config file could not be loaded.');
        process.exit(1);
    }
    //TODO: verify that the database schema is valid

    // get database password
    let passwordPromise = null;
    if(argv.db_pass === true){
        //flag was set, but was not a string, so get password via stdin:
        passwordPromise = getPasswordFromStdin().then((pass) => {
            if(pass.length < 1){
                return void 0;
            }
            return pass;
        });
    } else {
        passwordPromise = Promise.resolve(argv.db_pass);
    }

    passwordPromise.then((password) => {
        //setup connection config
        const mysqlConfig = {
            host: argv.db_host || 'localhost',
            user: argv.db_user,
            password: password,
            database: argv.db_name || databaseConfig.getConfig().name
        };

        //verify it's all there:
        ['database', 'user', 'host'].forEach((requiredField) => {
            if(!mysqlConfig[requiredField]){
                console.error(`Startup did not get required connection field ${requiredField}.`);
                process.exit(1);
            }
        });
        return mysqlConfig;
    }).then((res) => {
        resolve(res);
    });

}).then((mysqlConfig) => {
//-- CONNECTION STAGE --//
    console.info(`Connecting to database: '${mysqlConfig.database}'  on '${mysqlConfig.host}' using user '${mysqlConfig.user}'`);
    mysqlConnection = mysql.createConnection(mysqlConfig);

    mysqlConnection.connect();
    return promiseQuery(mysqlConnection, 'SELECT 1 + 1 AS solution;');
}).then(() => {
//-- STATUS PREP STAGE --//
    //initialise tableStatuses:
    databaseConfig.getTablesAsArray().forEach((tableConfig) => {
        intialiseStatusForTable(tableConfig);
    });

    //Check status of each table against the schemas given.
    return Promise.all(databaseConfig.getTablesAsArray().map((schema) => {
        return tableValidator(mysqlConnection, schema).then((results) => {
            //adjust table statuses after results
            setTableStatus(schema.name, results);
        });
    }));
}).then(() => {
//-- DATABASE PREP STAGE --//
    //Remove all those damned constraints from tables that exist.
    const tablesThatExist = getStatusesAsArray().filter(stat => stat.exists).map(stat => stat.name);
    return removeForeignKeyConstraintsFromTables(mysqlConnection, tablesThatExist);

}).then(() => {
//-- FIXING STAGE --//
    return Promise.all(
        getStatusesAsArray().map((tableStatus) => {
            if(tableStatus.exists && !tableStatus.isCompliant){
            //Try to reconcile any existing tables
                return tableReconciliator(mysqlConnection, databaseConfig.getTableConfig(tableStatus.name))
                    .then((result) => {
                        //Set statuses according to results of reconilliator
                        result.exists = !result.dropped;    //it exists if it wasn't dropped. (as we know it existed before)
                        setTableStatus(tableStatus.name, result);
                    });

            }
            return true;
        })
    );

}).then(() => {
//-- TABLE CREATION STAGE --//
//Create any tables that do not exist
    const promises = getStatusesAsArray().map((tableStatus) => {
        if(tableStatus.exists) {
            return tableStatus;
        }
        return tableCreator(mysqlConnection, tableStatus.schema)
            .then((result) => {
                tableStatus.exists = result;
                tableStatus.isCompliant = result;
                return tableStatus;
            });

    });
    return Promise.all(promises);
}).then(() => {
    //-- (OPTIONAL) TRUNCATE TABLES --//
    //if we've got initialisation data, we need to make sure the tables are empty:
    // this must be done BEFORE foreignKey constraints are applied
    //TODO: maybe add CLI flag to enable database truncation without specifing initialisation data?
    if(argv.initial_data_file) {
        return Promise.all(databaseConfig.getListOfTableNames().map((tableName) => {
            console.log(`Truncating table ${tableName}, as initalisationData has been set`);
            return truncateTable(mysqlConnection, tableName);
        }));
    }
    return Promise.resolve();
}).then(() => {
//-- RE-CONSTRAINING STAGE --//
    //add constraints
    const promises = getStatusesAsArray().map((status) => {
        return addForiegnKeyConstraints(mysqlConnection, status.schema).then(() => {
            return status;
        });
    });

    return Promise.all(promises);
}).then(() => {

//Print success
    console.log('---- [Table creation results] -----');
    //TODO: come up with pretty print (put into the tableStatuses.js module)
    console.log(JSON.stringify(getStatusesAsArray().map(status => {
        delete status.schema;
        return status;
    }), null, '  '));
    console.log('-----------------------------------');

    if(argv.initial_data_file){
        console.info(`Adding data from file: ${argv.initial_data_file}`);
        return addDataFromFile(mysqlConnection, argv.initial_data_file).catch((err) => {
            console.error(`There was a problem adding data from file '${argv.initial_data_file}' into database:\n`, err);
            return Promise.reject(err);
        });
    }
    return Promise.resolve();

}).then(() => {
//Clear connection
    mysqlConnection.end();

    //Thank you, come again.
    console.log('Process complete. Thank you, come again.');
}).catch((error) => {
    console.log('[Error] An error occurred during processing: ', error);
    mysqlConnection.end();
});
