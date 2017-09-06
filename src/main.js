// *Import all required libraries* //
const argv = require('./nodeArgsHandler.js');
const ajv = require('ajv');
const mysql = require('mysql');
const jsonFileLoader = require('./jsonFileLoader.js');
const processTableDefinition = require('./processTableDefinition.js');
const { tableCreator, addForiegnKeyConstraints } = require('./tableCreator.js');
const { addDataFromFile } = require('./dataFiller.js');
const tableValidator = require('./tableValidator.js');
const getPasswordFromStdin = require('../src/passwordstdin.js');

//GLOBAL DEFINITIONS
let tableStatuses;  // a tracker for the statuses of the different tables during processing.
let mysqlConnection;


//Processing begin:
new Promise((resolve, reject)=>{

    //Load config file
    const dbConfig = jsonFileLoader(argv.config);
    if (dbConfig === null) {
        console.error('[MySQLBuilder] config file could not be loaded.');
        exit(1);
    }
    //TODO: verify that the database schema is valid

    // get database password
    let passwordPromise = null;
    if(argv.db_pass === true){
        //flag was set, but was not a string, so get password via stdin:
        passwordPromise = getPasswordFromStdin().then((pass)=>{
            console.log('main saw password of:', pass);
            if(pass.length < 1){
                return void 0;
            }
            return pass;
        });
    } else {
        passwordPromise = Promise.resolve(argv.db_pass);
    }

    mysqlConfigPromise = passwordPromise.then((password)=>{
        //setup connection config
        const mysql = {
            host: argv.db_host || 'localhost',
            user: argv.db_user,
            password: password,
            database: argv.db_name || dbConfig.name
        };

        //verify it's all there:
        ['database', 'user', 'host'].forEach((requiredField)=>{
            if(!mysql[requiredField]){
                console.error(`Startup did not get required connection field ${requiredField}.`);
                process.exit(1);
            }
        });
        return mysql;
    });

    resolve(Promise.all([
        mysqlConfigPromise,
        dbConfig
    ]))

})
.then((config)=>{
    //Connect to the database
    const mysqlConfig = config[0];
    const dbConfig = config[1];


    console.info(`Connecting to database: '${mysqlConfig.database}'  on '${mysqlConfig.host}' using user '${mysqlConfig.user}'`);
    mysqlConnection = mysql.createConnection(mysqlConfig);

    mysqlConnection.connect();
    return new Promise( (resolve, reject) => {
    mysqlConnection.query('SELECT 1 + 1 AS solution;', (error) => {
        if (error) {
            reject(error);
        } else {
            resolve(dbConfig);
        }
        });
    });
}).then((dbConfig)=>{
    //initialise tableStatuses:
    tableStatuses = dbConfig.tables.map((schema)=>{
        return {
            name: schema.name,
            isCompliant: null,
            exists: false,
            modified: false,
            dropped: false,
            changes: [],
            schema: schema
        };
    });

    //Check status of each table against the schemas given.
    return Promise.all(tableStatuses.map((status, index)=>{
        return tableValidator(mysqlConnection, status.schema).then((results)=>{
            //adjust table statuses after results
            status.isCompliant = results.isCompliant;
            status.exists = results.exists;

            return status;
        });
    }));
}).then((statuses)=>{
    //If attempting to modify, do so


    return Promise.resolve(statuses);
}).then((statuses)=>{
    //Drop any unmodifiable tables
    const promises = statuses.map((tableStatus, index)=>{
        if(tableStatus.exists && !tableStatus.isCompliant){
            //If not compliant by this stage, it needs to be dropped
            console.info(`Dropping table '${tableStatus.name}' as it was non-compliant and could not be modifed into correct shape.`);
            return new Promise( (resolve,reject) => {
                mysqlConnection.query(`DROP TABLE ${tableStatus.name};`,(err)=>{
                    if(err){
                        reject(err);
                    } else{
                        resolve();
                    }
                });
            }).then(()=>{
                //Drop occurred successfully, mark table as not existing
                tableStatus.exists = false;
                tableStatus.isCompliant = false; //which is a non-compliant state.
                tableStatus.dropped = true;
                return tableStatus
            });

        } else {    //table doesn't exist or doesn't need changes
            return tableStatus;
        }
    })
    return Promise.all(promises);

}).then((statuses)=>{
    //Create any tables that do not exist
    const promises = statuses.map((tableStatus,index)=>{
        if(tableStatus.exists) {
            return tableStatus;
        } else {
            return tableCreator(mysqlConnection, tableStatus.schema)
                .then((result)=>{
                    tableStatus.exists = result;
                    tableStatus.isCompliant = result;
                    return tableStatus;
                });
        }
    });
    return Promise.all(promises);
}).then((statuses)=>{
    //add constraints
    const promises = statuses.map((status)=>{
        return addForiegnKeyConstraints(mysqlConnection,status.schema).then((res)=>{
            return status;
        });
    });

    return Promise.all(promises);
}).then((statuses)=>{


    //Print success
    console.log('---- [Table creation results] -----');
    console.log(JSON.stringify(statuses.map(status=>{delete status.schema; return status;}),null,'  '));
    console.log('-----------------------------------');

    if(argv.initial_data_file){
        console.info(`Adding data from file: ${argv.initial_data_file}`);
        return addDataFromFile(mysqlConnection, argv.initial_data_file).catch((err)=>{
            console.error(`There was a problem adding data from file '${argv.initial_data_file}' into database:\n`,err);
            return Promise.reject(err);
        });
    } else {
        return Promise.resolve();
    }
}).then(()=>{
    //Clear connection
    mysqlConnection.end();

    //Thank you, come again.
    console.log('Process complete. Thank you, come again.');
}).catch((error)=>{
    console.log('[Error] An error occurred during processing: ',error);

    mysqlConnection.end();
});
