const fs = require('fs');
const path = require('path');

const createMigration = function({curDate, base, filePath}, type, migrationPath){
    const st = 'added';
    const migrationName = `./${migrationPath}/${curDate.getFullYear()}${curDate.getMonth()}${curDate.getMonth() + 1}${curDate.getDate()}${curDate.getHours()}${curDate.getMinutes()}${curDate.getSeconds()}_${st}_${type}_${base}`;
    fs.copyFileSync(`./${filePath}`, migrationName);
};

const createMigrations = function(type, typePath, migrationPath){
    const files = fs.readdirSync(`./${typePath}`);
    if (!files.length){
        console.log('done');
        return;
    }
    files.forEach(function(file){
        const {base} = path.parse(file);
        const method = {
            curDate: new Date(),
            base,
            filePath: `./${typePath}/${file}`
        };
        createMigration(method, type, migrationPath);
    });
};

const init = function({proceduresPath = 'procedures', functionsPath = 'functions', triggersPath = 'triggers', migrationsPath = 'migrations'}){
    createMigrations('function', functionsPath, migrationsPath);
    createMigrations('procedure', proceduresPath, migrationsPath);
    createMigrations('trigger', triggersPath, migrationsPath);
};

module.exports = init;