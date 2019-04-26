const fs = require('fs');
const path = require('path');

const createMigration = function({curDate, base, filePath}, type){
    const st = 'added';
    console.log('curDate: ', curDate);
    const migrationName = `./migrations/${curDate.getFullYear()}${curDate.getMonth()}${curDate.getMonth() + 1}${curDate.getDate()}${curDate.getHours()}${curDate.getMinutes()}${curDate.getSeconds()}_${st}_${type}_${base}`;
    fs.copyFileSync(`./${filePath}`, migrationName);
};

const createMigrations = function(type){
    const files = fs.readdirSync(`./${type}s`);
    if (!files.length){
        console.log('done');
        return;
    }
    files.forEach(function(file){
        console.log('file: ', file);
        const {base} = path.parse(file);
        const method = {
            curDate: new Date(),
            base,
            path: `./${type}s/${file}`
        };
        console.log('method: ', method);
        createMigration(method, type);
    });
};

const init = function(){
    createMigrations('function');
    createMigrations('storedProcedure');
    createMigrations('trigger');
};

module.exports = init;