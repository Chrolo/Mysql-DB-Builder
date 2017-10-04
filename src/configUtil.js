/*Useful functions for figuring out stuff based on a database config*/

/**
 * Used to determine the order in which tables must be inserted, so that foriegn key constraints are met.
 * input: table section of the config (array of table configs)
*/
function figureOutTableInsertionOrder(tableConfigs){
    const order = [];
    //go through a first pass and just add any tables with no foreignKey constraints
    const constrainedTables = tableConfigs.reduce((acc, tableConfig) => {
        if(getListOfForeignTablesDependedOnByTableConfig(tableConfig).length === 0){
            order.push(tableConfig.name);
        } else {
            acc.push(tableConfig);
        }
        return acc;
    }, []);

    //Make a copy of the configs in an object to make shit easier later.
    const tableConfigAsObject = tableConfigs.reduce((acc, config) => {
        acc[config.name]= JSON.parse(JSON.stringify(config));
        return acc;
    }, {});

    //Now got through the list of remainders:
    function addContstrainedTable(tableConfig, callStack=[]){
        if(callStack.includes(tableConfig.name)){
            throw new Error(`Preventing recursion: tried to add ${tableConfig.name} when callStack was already ${callStack}`);
        } else {
            callStack = callStack.concat([tableConfig.name]);
        }
        const requiredTables = getListOfForeignTablesDependedOnByTableConfig(tableConfig);
        const missingTables = requiredTables.reduce((acc, reqTable) => {
            if(!order.includes(reqTable)){
                acc.push(reqTable);
            }
            return acc;
        }, []);

        if(missingTables.length === 0){
            //All the required tables are there, so push this on the end
            if(!order.includes(tableConfig.name)){
                //ad just make sure it's not already there due to recursion
                order.push(tableConfig.name);
            }
        } else {
            //Missing some tables, lets recurse in on them:
            missingTables.forEach((missingTableName) => {
                addContstrainedTable(tableConfigAsObject[missingTableName], callStack);
            });
            //after that, It should be okay to add this table!
            if(!order.includes(tableConfig.name)){
                //ad just make sure it's not already there due to recursion
                order.push(tableConfig.name);
            }
        }

    }
    constrainedTables.forEach((tableConfig) => {
        addContstrainedTable(tableConfig);
    });

    return order;
}

function getListOfForeignTablesDependedOnByTableConfig(tableConfig){
    return tableConfig.fields.reduce((acc, field) => {
        if(field.foreignKey){
            acc.push(field.foreignKey.table);
        }
        return acc;
    }, []);
}

module.exports = {
    figureOutTableInsertionOrder
};
