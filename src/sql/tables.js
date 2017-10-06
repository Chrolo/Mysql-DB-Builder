const {promiseQuery} = require('./utils');
const {checkIfColumnHasUniquenessConstraint} = require('./constraints');

function checkTableExists(connection, tableName){
    return promiseQuery(connection,
        `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME=? AND TABLE_SCHEMA IN (SELECT DATABASE());`,
        [tableName]
    ).then(res => !!res.length); //convert to boolean
}

function checkTableHasCollumn(connection, tableName, fieldConfig){
//build query
    let sql = `SELECT * FROM information_schema.columns WHERE TABLE_SCHEMA IN (SELECT DATABASE())`;

    return promiseQuery(connection, sql);
}

function truncateTable(connection, tableName){
    return promiseQuery(connection, `TRUNCATE ${tableName};`);
}

module.exports= {
    checkTableExists,
    checkTableHasCollumn,
    truncateTable
};
