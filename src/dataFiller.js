const fillerFuncs = require('./dataFillerFunctions.js');
const jsonFileLoader = require('./jsonFileLoader');
const databaseConfig = require('./databaseConfig');
const {figureOutTableInsertionOrder} = require('./configUtil');

function addDataFromFile(connection, fileName){
    const data = jsonFileLoader(fileName);
    //verify against schema for data
    //TODO

    //Get the global insert order
    const insertOrder = figureOutTableInsertionOrder(databaseConfig.getTablesAsArray());
    const tablesWithDataToInsert = Object.keys(data);
    //filter to the order we need:
    const tablesToUpload = insertOrder.filter((tableName) => tablesWithDataToInsert.includes(tableName));

    //d-d-d-daisy chaining!
    return tablesToUpload.reduce((promiseChain, tableName) => {
        return promiseChain.then(() => {
            return fillerFuncs.insertBatchedRows(connection, tableName, data[tableName]);
        });
    }, Promise.resolve());
}

module.exports = {
    addDataFromFile
};
