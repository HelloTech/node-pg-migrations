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

    fs.open(name, 'wx', (err, fd) => {
        if(err){
            if (err.code === 'EEXIST') {
                console.error(`Error: File ${name} already exists`);
            }
            console.error(err);
            return;
        }
        const ext = path.extname(fileName);
        if(ext === '.js'){
            fs.writeFileSync(name, jsMigrationBase);
        }
        fs.closeSync(fd);
        console.log(`File ${name} was created`);
    });
};

module.exports = addMigration;