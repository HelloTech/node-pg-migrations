/* eslint-disable consistent-return */
const fsPromises = require('fs').promises;
const path = require('path');

const createMigration = function({curDate, base, filePath}, type, migrationPath){
    const st = 'added';
    const migrationName = `./${migrationPath}/${curDate.getFullYear()}${curDate.getMonth()}${curDate.getMonth() + 1}${curDate.getDate()}${curDate.getHours()}${curDate.getMinutes()}${curDate.getSeconds()}_${st}_${type}_${base}`;
    return fsPromises.copyFile(`./${filePath}`, migrationName);
};

const createMigrations = async function(type, typePath, migrationPath){
    const files = await fsPromises.readdir(`./${typePath}`);
    if (!files.length){
        console.log('done');
        return;
    }
    const promises = [];
    files.forEach(function(file){
        const {base} = path.parse(file);
        const method = {
            curDate: new Date(),
            base,
            filePath: `./${typePath}/${file}`
        };
        promises.push(createMigration(method, type, migrationPath));
    });
    return Promise.all(promises);
};

const init = async function({proceduresPath = 'procedures', functionsPath = 'functions', triggersPath = 'triggers', migrationsPath = 'migrations'}){
    try{
        await createMigrations('function', functionsPath, migrationsPath);
        await createMigrations('procedure', proceduresPath, migrationsPath);
        await createMigrations('trigger', triggersPath, migrationsPath);
    }
    catch(error){
        console.log('error: ', error);
        throw new Error(error);
    }
};

module.exports = init;