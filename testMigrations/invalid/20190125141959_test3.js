//migration returns a promise
module.exports = function(pool){
    return new Promise(function(resolve, reject){
        //sql statement goes here
        let sql = 'SELECT o FROM o;';
        //values go here
        let values = [];
        pool.query(sql, values, function(err, res){
            if (err){
                reject(err);
            }
            resolve(res);
        });
    });
};