const { tableCreator, createTableSqlString } = require('./tableCreator.js');
const tableReconciliator = require('./tableReconciliator.js');

const statuses =[
    'Un-changed',
    'Modified',
    'Dropped and Rebuilt'
];

function processTableDefinition(connection, tableSchema, initialData){
    let response = {
        status: statuses[0],
        collumnsDropped: 0,
        collumnsAdded: 0
    };


    return tableReconciliator(connection, tableSchema).then((tableWasDropped, changes)=>{
        if(tableWasDropped) {
            response.status = statuses[2];
            return tableCreator(connection, tableSchema);
        } else {
            if(changes){    //edit response to reflect changes made
                response.status = statuses[1];
                //TODO add full changes
            }
            Promise.resolve(true);
        }
    }).then((creatorResults)=>{
        
        //log results
        return Promise.resolve(response);
    });
}

module.exports = processTableDefinition
