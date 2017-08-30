const mysql = require('mysql');

function createTableSqlString(tableConfig){
    const fieldsString = tableConfig.fields.map( fieldDef => {
        let str = `${fieldDef.name} ${fieldDef.type}`;

        //Add field constraints
        str += fieldDef.notNull ? ' NOT NULL' : '';
        str += fieldDef.autoIncrement ? ' AUTO_INCREMENT' : '';
        str += fieldDef.unique ? ' UNIQUE' : '';

        return str;
    }).join();

    return `CREATE TABLE ${tableConfig.name} (${fieldsString}, PRIMARY KEY(${tableConfig.primaryKey}));`;
}

function createForeignKeyConstraintStrings(tableConfig) {
    return tableConfig.fields.reduce((acc, field)=>{
        if(field.foreignKey){
             acc.push(
                 `ALTER TABLE ${tableConfig.name} ADD FOREIGN KEY (${field.name}) REFERENCES ${field.foreignKey.table}(${field.foreignKey.column});`
             );
        }
        return acc;
    },[]);
}

function addForiegnKeyConstraints(mysqlConnection, tableConfig){
    //TODO: Re-enable foreignKey constraint once you can also delete them easily
    return Promise.resolve([true]);

    return Promise.all(
        createForeignKeyConstraintStrings(tableConfig).map((sqlQuery)=>{
            console.info('[AddForiegnKeyConstraints] sql query is:', sqlQuery);
            return new Promise((resolve, reject)=>{
                mysqlConnection.query(sqlQuery, (error, results)=>{
                    if(error){
                        reject({
                                message: `Failed to add a foreignKey constraint to '${tableConfig.name}'`,
                                error
                        });
                    } else {
                        resolve(true);
                    }
                });
            });
        })
    );
}

function tableCreator (mysqlConnection, tableConfig) {
    return new Promise((resolve, reject)=>{
        mysqlConnection.query(createTableSqlString(tableConfig), (error, results, fields)=>{
            if(error){
                reject({
                        message: `Failed to create table: '${tableConfig.name}'`,
                        error
                });
            } else {
                resolve(true);
            }
        });
    });
}


module.exports = {
    tableCreator,
    createTableSqlString,
    addForiegnKeyConstraints
};
