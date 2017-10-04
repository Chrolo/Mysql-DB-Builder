const {promiseQuery} = require('./utils');

function getAllForeignKeysConstraintsForTable(connection, tableName) {
    return promiseQuery(
        connection,
        'SELECT * FROM information_schema.key_column_usage WHERE TABLE_SCHEMA IN (SELECT DATABASE()) AND (TABLE_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL);',
        [tableName]
    );
}

function removeForeignKeyConstraintFromTable(connection, tableName, fkConstraintId){
    return promiseQuery(connection, `ALTER TABLE ${tableName} DROP FOREIGN KEY ${fkConstraintId};`);
}

function removeAllForeignKeyConstraintsFromTable(connection, tableName){
    return getAllForeignKeysConstraintsForTable(connection, tableName)
        .then((constraints) => {
            return Promise.all(
                constraints.map((constraint) => {
                    return removeForeignKeyConstraintFromTable(connection, tableName, constraint.CONSTRAINT_NAME);
                })
            );
        });
}

function removeForeignKeyConstraintsFromTables(connection, tableNames = []){
    return Promise.all(
        tableNames.map(tableName => removeAllForeignKeyConstraintsFromTable(connection, tableName))
    );
}

function createForeignKeyConstraintStrings(tableConfig) {
    return tableConfig.fields.reduce((acc, field) => {
        if(field.foreignKey){
            acc.push(
                `ALTER TABLE ${tableConfig.name} ADD FOREIGN KEY (${field.name}) REFERENCES ${field.foreignKey.table}(${field.foreignKey.column});`
            );
        }
        return acc;
    }, []);
}

function addForiegnKeyConstraints(mysqlConnection, tableConfig){
    return Promise.all(
        createForeignKeyConstraintStrings(tableConfig).map(sqlQuery => promiseQuery(mysqlConnection, sqlQuery))
    );
}

module.exports = {
    addForiegnKeyConstraints,
    getAllForeignKeysConstraintsForTable,
    removeAllForeignKeyConstraintsFromTable,
    removeForeignKeyConstraintFromTable,
    removeForeignKeyConstraintsFromTables
};
