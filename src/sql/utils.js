function promiseQuery(connection, ...args){
    return new Promise((resolve, reject) => {
        connection.query(...args, (err, res, fields) => {
            if(err){
                reject(err);
            } else {
                resolve(res, fields);
            }
        });
    });
}

module.exports = {
    promiseQuery
};
