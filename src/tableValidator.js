const {checkTableExists, checkTableHasCollumnMatchingConfig} = require('./sql/tables');

function tableValidator(connection, tableSchema){
    //check if table exists
    return checkTableExists(connection, tableSchema.name)
        .then((tableExists) => {
            let isCompliant = false; //notCompliant unless proven otherwise.
            if(tableExists){
                //Validate if it meets the spec
                //TODO
                return Promise.all(
                    tableSchema.fields.map(fieldConfig =>
                        checkTableHasCollumnMatchingConfig(connection, tableSchema.name, fieldConfig)
                    )
                ).then(results => results.reduce((acc, res) => acc&&res), true).then((compliance) => {
                    return {
                        exists: true,
                        isCompliant: compliance
                    }
                });
            }
            return Promise.resolve({
                exists: false,
                isCompliant: false//non-existence is non-compliance;
            });
        });
}

module.exports = tableValidator;
