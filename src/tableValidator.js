const {checkTableExists} = require('./sql/tables');

function tableValidator(connection, tableSchema){
    //check if table exists
    return checkTableExists(connection, tableSchema.name)
        .then((tableExists) => {
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
