const {promiseQuery} = require('./utils');

function checkTableExists(connection, tableName){
    return promiseQuery(connection,
        `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME=? AND TABLE_SCHEMA IN (SELECT DATABASE());`,
        [tableName]
    ).then(res => !!res.length); //convert to boolean
}

module.exports= {
    checkTableExists
};
