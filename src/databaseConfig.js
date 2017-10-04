const jsonFileLoader = require('./jsonFileLoader.js');
let config = {};

function deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}

function loadConfigFromFile(fileName){
    config = jsonFileLoader(fileName);
}

function getConfig(){
    //Give them a copy so they can't fuck it up
    return deepCopy(config);
}

function getTableConfig(tableName) {
    return deepCopy(config.tables[tableName]);
}

function getTablesAsArray(){
    return deepCopy(Object.keys(config.tables).map((tableName) => {
        return Object.assign({}, config.tables[tableName], {name: tableName});
    }));
}

function getListOfTableNames(){
    return config.tables.reduce((acc, tableConfig) => {
        acc.push(tableConfig.name);
        return acc;
    }, []);
}

module.exports = {
    getConfig,
    getTableConfig,
    getTablesAsArray,
    getListOfTableNames,
    loadConfigFromFile
};
