//migration returns a promise
module.exports = function(pool){
    return new Promise(function(resolve, reject){
        //sql statement goes here
        let sql = "INSERT INTO orders (id) VALUES ('test3');";
        //values go here
        pool.query(sql, function(err, res){
            if (err){
                reject(err);
            }
            resolve(res);
        });
    });
};