// migration returns a promise
module.exports = function(pool){
    return new Promise(function(resolve, reject){
        // sql statement goes here
        const sql = "INSERT INTO node_pg_migration_test (id) VALUES ('test2');";
        // values go here
        pool.query(sql, function(err, res){
            if (err){
                reject(err);
            }
            console.log('fired');
            resolve(res);
        });
    });
};