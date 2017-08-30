// *Import all required libraries* //
const argv = require('./nodeArgsHandler.js');
const ajv = require('ajv');
const mysql = require('mysql');
const jsonFileLoader = require('./jsonFileLoader.js');
const processTableDefinition = require('./processTableDefinition.js');
const { tableCreator, addForiegnKeyConstraints } = require('./tableCreator.js');
const { addDataFromFile } = require('./dataFiller.js');
const tableValidator = require('./tableValidator.js');

//Process the command line arugments:

//get password via stdin:
//TODO

//Load config file
const dbConfig = jsonFileLoader(argv.config);
if (dbConfig === null) {
    console.error('[MySQLBuilder] config file could not be loaded.');
    exit(1);
}

//setup connection config
const mysqlConnectionConfig = {
    host: argv.db_host || 'localhost',
    user: argv.db_user,
    password: argv.db_pass,
    database: argv.db_name || dbConfig.name
};

//verify it's all there:
['database', 'user', 'host'].forEach((requiredField)=>{
    if(!mysqlConnectionConfig[requiredField]){
        console.error(`Startup did not get required connection field ${requiredField}.`);
        process.exit(1);
    }
});


console.info(`Connecting to database: '${mysqlConnectionConfig.database}'  on '${mysqlConnectionConfig.host}' using user '${mysqlConnectionConfig.user}'`);
var connection = mysql.createConnection(mysqlConnectionConfig);

connection.connect();

//Verify table configs fits schemas
//TODO


// a tracker for the statuses of the different tables during processing.
let tableStatuses;

new Promise( (resolve, reject) => {
    //Check the connection
    connection.query('SELECT 1 + 1 AS solution;', (error) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
}).then(()=>{
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
        return tableValidator(connection, status.schema).then((results)=>{
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
                connection.query(`DROP TABLE ${tableStatus.name};`,(err)=>{
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
            return tableCreator(connection, tableStatus.schema)
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
        return addForiegnKeyConstraints(connection,status.schema).then((res)=>{
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
        return addDataFromFile(connection, argv.initial_data_file).catch((err)=>{
            console.error(`There was a problem adding data from file '${argv.initial_data_file}' into database:\n`,err);
            return Promise.reject(err);
        });
    } else {
        return Promise.resolve();
    }
}).then(()=>{
    //Clear connection
    connection.end();

    //Thank you, come again.
    console.log('Process complete. Thank you, come again.');
}).catch((error)=>{
    console.log('[Error] An error occurred during processing: ',error);

    connection.end();
});
