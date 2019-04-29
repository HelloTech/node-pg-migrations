/* eslint-disable prefer-template,global-require,import/no-dynamic-require */
const fs = require('fs');
const path = require('path');

const forEachAsync = async function(arr, cb) {
    for (let x = 0; x < arr.length; x++) {
        // eslint-disable-next-line no-await-in-loop
        await cb(arr[x], x, arr);
    }
};

const genCurrentMigrationSql = function(files){
    let sql = `DROP TABLE IF EXISTS current_migrations; CREATE TEMPORARY TABLE current_migrations (
    m VARCHAR(255)
);

INSERT INTO current_migrations (m) VALUES ('${files[0]}')`;
    for(let x = 1, count = files.length; x < count; x++){
        const file = files[x];
        sql += `, ('${file}')`;
    }
    sql += '; ';
    return sql + 'SELECT current_migrations.m FROM current_migrations LEFT OUTER JOIN ht_migrations ON current_migrations.m = ht_migrations.id WHERE ht_migrations.id IS NULL ORDER BY current_migrations.m ASC;';
};

const runSqlFile = function(pool, directoryName, filename){
    return new Promise(function(resolve, reject){
        fs.readFile(`${directoryName}/${filename}`, 'utf8', function (error, sql) {
            if (error){
                reject(error);
            }
            else {
                pool.query(sql, function(err, results){
                    if(err){
                        reject(err);
                    }
                    resolve(results);
                });
            }
        });
    });
};

const addCompletedMigration = function(pool, filename){
    return new Promise(function(resolve, reject){
        pool.query(`INSERT INTO ht_migrations (id) VALUES ('${filename}')`, function(err, results){
            if(err){
                console.log(`Setting migration ${filename} as completed failed`);
                reject(err);
            }
            console.log(`Migration ${filename} has completed`);
            resolve(results);
        });
    });
};

const runMigration = async function(pool, directoryName, filename){
    console.log(`Migration ${filename} has started`);
    const {name, ext} = path.parse(filename);
    if(ext === '.sql'){
        await runSqlFile(pool, directoryName, filename);
    }
    else{
        const migrate = require(`.${directoryName}/${name}`);
        await migrate(pool);
    }
};

const runMigrations = async function(pool, directoryName, filenames){
    await forEachAsync(filenames, async function(file){
        let filename;
        try {
            filename = file.m;
            await runMigration(pool, directoryName, filename);
            await addCompletedMigration(pool, filename);
        }
        catch (e){
            console.log(`There was an error with migration: ${filename}`);
            throw e;
        }
    });
};

const getCurrentMigrations = function(pool, sql){
    return new Promise(function(resolve, reject){
        pool.query(sql, function(err, results){
            if(err){
                console.log('err: ', err);
                reject(err);
            }
            else {
                resolve(results[3].rows);
            }
        });
    });
};

const run = async function(pool, {migrationsPath = 'migrations', clear}){
    const dropQuery = clear ? 'DROP TABLE IF EXISTS ht_migrations;\n' : '';
    const query = `${dropQuery}CREATE TABLE IF NOT EXISTS ht_migrations
(
    id VARCHAR(255) null,
    constraint ht_migrations_id_pk
        primary key (id)
);`;
    await pool.query(query);
    const files = fs.readdirSync(`${migrationsPath}`);
    if (!files.length){
        console.log('done');
        return;
    }
    const sql = genCurrentMigrationSql(files);
    const filenames = await getCurrentMigrations(pool, sql);
    if (!filenames.length){
        console.log('done');
        return;
    }
    console.log('The following migrations will run: ', filenames);
    // eslint-disable-next-line consistent-return
    await runMigrations(pool, migrationsPath, filenames);
};

module.exports = {
    run,
    runMigrations,
    runMigration,
    getCurrentMigrations,
    addCompletedMigration,
    runSqlFile,
    genCurrentMigrationSql
};