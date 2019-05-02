const fs = require('fs');
const path = require('path');

// migration returns a promise
const jsMigrationBase = `// migration returns a promise
module.exports = function(pool){
    // query goes here
    const sql = '';
    // values go here
    const values = [];
    return pool.query(sql, values);
};`;

const addMigration = function({fileName, migrationsPath = 'migrations'}){
    const curDate = new Date();
    const name = `./${migrationsPath}/${curDate.getFullYear()}${curDate.getMonth()}${curDate.getMonth() + 1}${curDate.getDate()}${curDate.getHours()}${curDate.getMinutes()}${curDate.getSeconds()}_${fileName}`;
    return new Promise(function(resolve, reject){
        fs.open(name, 'wx', (error, fd) => {
            if(error){
                if (error.code === 'EEXIST') {
                    console.log(`Error: File ${name} already exists`);
                }
                console.log('error: ', error);
                reject(error);
                return;
            }
            const ext = path.extname(String(fileName));
            if(ext === '.js'){
                fs.writeFileSync(name, jsMigrationBase);
            }
            fs.closeSync(fd);
            console.log(`File ${name} was created`);
            resolve(`File ${name} was created`);
        });
    });
};

module.exports = {
    addMigration,
    add: addMigration
};