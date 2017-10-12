const {promiseQuery} = require('./utils');

function checkIfColumnExists(connection, tableName, columnName){
    return promiseQuery(connection,
        `SELECT '1' FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA IN (SELECT DATABASE()) AND TABLE_NAME=? AND COLUMN_NAME=?;`,
        [tableName, columnName]
    ).then(results => !!results.length);   //return boolean
}

function verifyColumnType(connection, tableName, columnName, type){
    return promiseQuery(connection,
        `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA IN (SELECT DATABASE()) AND TABLE_NAME=? AND COLUMN_NAME=?;`,
        [tableName, columnName]
    ).then(results => {
        if(results.length!== 1){
            console.warn(`[verifyColumnType] got ${results.length} results for '${columnName}' in table '${tableName}'.`);
            return false;
        }
        //Split into dataType and size:
        const regexResult = type.match(/(\w+)(?:\((\d+)\))?/);
        if(regexResult===null){
            throw new TypeError(`SQL type ${type} did not match regex /(\\w+)(?:\\((\\d+)\\))?/`);
        }
        const dataType = regexResult[1];
        const dataLength= regexResult[2];
        if(typeof dataLength!== 'undefined'){
            return results[0].DATA_TYPE === dataType.toLowerCase() && results[0].CHARACTER_MAXIMUM_LENGTH === Number(dataLength);
        }
        return results[0].DATA_TYPE === dataType.toLowerCase();
    });
}

function checkIfColumnCanBeNull(connection, tableName, columnName){
    return promiseQuery(
        connection,
        `SELECT '1' FROM information_schema.columns WHERE TABLE_SCHEMA IN (SELECT DATABASE()) AND TABLE_NAME=? AND COLUMN_NAME=? AND IS_NULLABLE='YES';`,
        [tableName, columnName, columnName]
    ).then(results => !!results.length);   //return boolean
}

module.exports= {
    checkIfColumnCanBeNull,
    checkIfColumnExists,
    verifyColumnType
};
