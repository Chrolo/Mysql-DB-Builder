const ajv = require('ajv');
function verifyImportData(data, config){
    //TODO: implement
    console.error('[DataFiller::verifyImportData] Function not implemented');
}

/**
This function creates a batch of prepared strings and the data for them.
@returns object {string: "the string for the sql params", values: [array of values used in string]}
*/
function createBatchedValues(rows, fields){

    const values = [];
    const stringSections = [];
    const stringSection = `(${fields.map(() => '?').join()})`;

    rows.forEach((row) => {
        fields.forEach(field => {
            values.push(row[field]);
        });
        stringSections.push(stringSection);
    });

    return {
        values,
        string: stringSections.join()
    };
}

function getAllFieldKeysFromData(rows){
    return rows.reduce((acc, row) => {
        Object.keys(row).forEach((key) => {
            if(!acc.includes(key)) {
                acc.push(key);
            }
        });

        return acc;
    }, []);
}

function insertBatchedRows(connection, tableName, rows){
    //figure out the fields used
    const fields = getAllFieldKeysFromData(rows);
    // get the data section
    const data = createBatchedValues(rows, fields);

    const sql = `INSERT INTO ${tableName} (${fields.join()}) VALUES ${data.string};`;

    return new Promise((resolve, reject) => {
        connection.query(
            sql,
            data.values,
            (err, res) => {
                if(err){
                    reject(err);
                } else {
                    resolve(res);
                }

            });
    });
}

module.exports={
    insertBatchedRows,
    verifyImportData
};
