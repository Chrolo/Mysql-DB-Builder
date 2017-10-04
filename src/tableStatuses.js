const statuses = {};

const initialData = {
    isCompliant: null,
    exists: false,
    modified: false,
    dropped: false,
    changes: [],
    schema: {}
};

function getStatusFields(){
    return ['isCompliant', 'exists', 'modified', 'dropped'];
}

function intialiseStatusForTable(tableConfig){
    statuses[tableConfig.name] = deepCopy(initialData);
    statuses[tableConfig.name].schema = deepCopy(tableConfig);
}

function deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}

function getStatuses(){
    return deepCopy(statuses);
}

function getStatusesAsArray(){
    const statusesCopy = getStatuses();
    return Object.keys(statusesCopy).map((tableName) => {
        return Object.assign(statusesCopy[tableName], {name: tableName});
    });
}

function getKnownTables(){
    return Object.keys(statuses);
}

function setTableStatus(tableName, tableStatusObj){
    getStatusFields().forEach((status) => {
        if(typeof tableStatusObj[status] !== 'undefined'){
            statuses[tableName][status] = tableStatusObj[status];
        }
    });

    if(tableStatusObj.changes instanceof Array){
        statuses[tableName].changes.concat(tableStatusObj.changes);
    }
}

module.exports ={
    getKnownTables,
    getStatuses,
    getStatusesAsArray,
    getStatusFields,
    intialiseStatusForTable,
    setTableStatus
};
