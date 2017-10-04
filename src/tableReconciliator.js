const {promiseQuery} = require('./sql/utils');

/**
@returns bool whether the table had to be dropped or not.
*/
function tableReconciliator(connection, tableSchema){
    let tableWasDropped = false;
    const isCompliant = false;
    const changes = [];

    //TODO
    console.warn(`[tableChecker] Not yet implemented. Always drops tables. Dropping: ${tableSchema.name}`);
    return promiseQuery(connection, `DROP TABLE ${tableSchema.name};`).then(() => {
        tableWasDropped = true;
    }).then(() => {
        //Return the results
        return {
            dropped: tableWasDropped,
            isCompliant: isCompliant,
            changes: changes
        };
    });
}

module.exports = tableReconciliator;
