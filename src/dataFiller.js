const fillerFuncs = require('./dataFillerFunctions.js');
const jsonFileLoader = require('./jsonFileLoader');

function addDataFromFile(connection, fileName){
    const data = jsonFileLoader(fileName);
    //verify against schema for data
    //TODO

    const tablesToUpload = Object.keys(data);

    return Promise.all(tablesToUpload.map((tableName)=>{
        return fillerFuncs.insertBatchedRows(connection, tableName, data[tableName]);
    }));
}

module.exports = {
    addDataFromFile
};
