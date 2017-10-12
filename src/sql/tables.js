const {promiseQuery} = require('./utils');
const {checkIfColumnHasUniquenessConstraint} = require('./constraints');
const {checkIfColumnCanBeNull, checkIfColumnExists, verifyColumnType} = require('./columns');

function checkTableExists(connection, tableName){
    return promiseQuery(connection,
        `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME=? AND TABLE_SCHEMA IN (SELECT DATABASE());`,
        [tableName]
    ).then(res => !!res.length); //convert to boolean
}

function checkTableHasCollumnMatchingConfig(connection, tableName, fieldConfig){
    //check if collumn exists:
    return checkIfColumnExists(connection, tableName, fieldConfig.name)
        .then((exists) => {
            if(exists){
                //Check out the column properties:
                const promiseObject = {
                    type: verifyColumnType(connection, tableName, fieldConfig.name, fieldConfig.type),
                    unique: (fieldConfig.unique === true ? checkIfColumnHasUniquenessConstraint(connection, tableName, fieldConfig.name): true),
                    notNull: (fieldConfig.notNull === true ? checkIfColumnCanBeNull(connection, tableName, fieldConfig.name).then(res => !res) : true)
                };

                return Promise.all(
                    Object.keys(promiseObject).map(key => promiseObject[key])
                ).then(results => {
                    return results.reduce((acc, result, index) => {
                        if(!result){
                            console.warn(`${tableName}.${fieldConfig.name} failed the ${Object.keys(promiseObject)[index]} verification`)
                        }
                        return acc&&result;
                    }, true);
                });
            }
            return false;
        });
}

function truncateTable(connection, tableName){
    return promiseQuery(connection, `TRUNCATE ${tableName};`);
}

module.exports= {
    checkTableExists,
    checkTableHasCollumnMatchingConfig,
    truncateTable
};
