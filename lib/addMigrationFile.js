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
    if(!fileName){
        throw new Error('A file name must be provided');
    }
    const ext = path.extname(fileName);
    if(ext !== '.js' && ext !== '.sql'){
        throw new Error('Filename must contain the extension .sql or .js');
    }
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