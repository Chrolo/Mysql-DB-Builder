function tableValidator(connection, tableSchema){
    //check if table exists
    return new Promise( (resolve,reject)=>{
        connection.query(
            `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME=? AND TABLE_SCHEMA IN (SELECT DATABASE());`,
            tableSchema.name,(err,res)=>{
            if(err){
                reject(err);
            } else {
                //check if table is there.
                resolve(!!res.length);
            }
        })
    }).then((tableExists)=>{
        let isCompliant = false; //notCompliant unless proven otherwise.

        if(tableExists){
            //Validate if it meets the spec
            //TODO
            isCompliant= false;
        }

        return {
            exists: tableExists,
            isCompliant
        };
    });
}




module.exports = tableValidator;
