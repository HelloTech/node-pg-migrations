const fsPromises = require('fs').promises;
const pathHelper = require('path');
const git = require('simple-git/promise');

const getDropStatement = function(type, name){
    if (type === 'function'){
        return `DROP FUNCTION IF EXISTS ${name};`;
    }
    if(type === 'trigger'){
        return `DROP FUNCTION IF EXISTS ${name}_function CASCADE;`;
    }
    return `DROP PROCEDURE IF EXISTS ${name};`;
};


const createMigration = async function ({curDate, index, base, path, originalPath}, type){
    const action = index === 'A' ? 'added' : index === 'M' ? 'modified' : index === 'D' ? 'deleted' : 'renamed';
    const migrationName = `./migrations/${curDate.getFullYear()}${curDate.getMonth()}${curDate.getMonth() + 1}${curDate.getDate()}${curDate.getHours()}${curDate.getMinutes()}${curDate.getSeconds()}_${action}_${type}_${base}`;
    if (index === 'D'){
        const name = pathHelper.parse(path).name;
        await fsPromises.writeFile(migrationName, getDropStatement(type, name));
    }
    else {
        await fsPromises.copyFile(`./${path}`, migrationName);
    }
    if (index === 'R'){
        const name = pathHelper.parse(originalPath).name;
        const dropStatement = getDropStatement(type, name);
        await fsPromises.appendFile(migrationName, `\n\n${dropStatement}`);
    }
    await git().add(migrationName);
};

const filterFiles = function(methods, type, curMigrations){
    methods.forEach(function(method){
        const {index, name} = method;
        if ((index === 'A' || index === 'M' || index === 'R' || index === 'D') && !curMigrations[`${type}_${name}`]){
            createMigration(method, type).then(function(){
                console.log('done');
            }).catch(console.log);
        }
    });
};


const generate = function(){
    console.log('started');
    git('.').status().then(function(results){
        const curDate = new Date();
        const files = results.files;
        const curMigrations = {};
        const storedProcedureFiles = [];
        const functionFiles = [];
        const triggerFiles = [];
        files.forEach(function(file){
            var {path, index, working_dir} = file;
            var originalPath;
            index = index === ' ' ? working_dir : index;
            if (index === 'R'){
                [originalPath, path] = path.split(' -> ');
            }
            const {dir, base, name} = pathHelper.parse(path);
            if (dir === 'migrations'){
                const baseName = name.substring(name.indexOf('_', 15) + 1);
                curMigrations[baseName] = true;
            }
            const fileInfo = {
                file,
                path,
                curDate,
                index,
                name,
                originalPath,
                base
            };
            if (dir === 'storedProcedures'){
                storedProcedureFiles.push(fileInfo);
            }
            if (dir === 'functions'){
                functionFiles.push(fileInfo);
            }
            if (dir === 'triggers'){
                triggerFiles.push(fileInfo);
            }
        });
        filterFiles(storedProcedureFiles, 'procedure', curMigrations);
        filterFiles(functionFiles, 'function', curMigrations);
        filterFiles(triggerFiles, 'trigger', curMigrations);
        console.log('finished');
    }).catch(function(err){
        console.log(err);
    });
};

module.exports = generate;