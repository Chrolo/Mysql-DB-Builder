const {promiseQuery} = require('./sql/utils');

function createTableSqlString(tableConfig){
    const fieldsString = tableConfig.fields.map(fieldDef => {
        let str = `${fieldDef.name} ${fieldDef.type}`;

        //Add field constraints
        str += fieldDef.notNull ? ' NOT NULL' : '';
        str += fieldDef.autoIncrement ? ' AUTO_INCREMENT' : '';
        str += fieldDef.unique ? ' UNIQUE' : '';

        return str;
    }).join();

    return `CREATE TABLE ${tableConfig.name} (${fieldsString}, PRIMARY KEY(${tableConfig.primaryKey}));`;
}

function tableCreator (mysqlConnection, tableConfig) {
    return new Promise((resolve, reject) => {
        mysqlConnection.query(createTableSqlString(tableConfig), (error, results, fields) => {
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
    createTableSqlString
};
