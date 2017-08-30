/**
@returns bool whether the table had to be dropped or not.
*/
function tableReconciliator(connection, tableSchema){
    let tableWasDropped = false;
    let changes = [];

    //TODO
    console.warn('[tableChecker] Not yet implemented. Always drops tables.');
    return new Promise((resolve, reject)=>{
        connection.query(`DROP TABLE ${tableSchema.name};`,(err, result)=>{
            if(err){
                reject(err);
            } else {
                tableWasDropped = true;
                resolve(tableWasDropped,changes)
            }
        });
    });
}

module.exports = tableReconciliator;
