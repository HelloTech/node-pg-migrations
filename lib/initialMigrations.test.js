// If modifying tests, be mindful of when they access a shared directory versus a unique test directory..
// Could cause async problems if not aware...
const fs = require('fs');
const path = require('path');
const initialMigrations = require('./initialMigrations');

const curDate = Date.now();
const testDir = `${curDate}test`;
const testPath = `./${testDir}`;


function clearFiles(directory){
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
        fs.unlinkSync(path.join(directory, file));
    });
}

beforeAll(() => {
    if(!fs.existsSync(testPath)){
        fs.mkdirSync(testPath);
        fs.mkdirSync(`${testPath}/migrations`);
        fs.mkdirSync(`${testPath}/sql`);
    } else {
        throw new Error(`Cannot create directory: ${testDir}`);
    }
});

afterAll(() => {
    clearFiles(`${testPath}/migrations`);
    fs.rmdirSync(`${testPath}/migrations`);
    clearFiles(`${testPath}/sql`);
    fs.rmdirSync(`${testPath}/sql`);
    clearFiles(testPath);
    fs.rmdirSync(testPath);
});

describe('initialMigrations', () => {
    let fileName;
    beforeEach(() => {
        fileName = `${Date.now()}file.sql`;
        const fd = fs.openSync(`${testPath}/sql/${fileName}`, 'wx');
        fs.appendFileSync(fd, '# data to append', 'utf8');
        fs.closeSync(fd);
    });

    afterEach(() => {
        clearFiles(`${testPath}/migrations`);
        clearFiles(`${testPath}/sql`);
    });

    describe('.createMigration({curDate, base, filePath}, type, migrationPath)', () => {
        let argObj;
        let type;
        let migrationPath;
        let createMigration;
        beforeEach(() => {
            argObj = {
                curDate: new Date(),
                base: fileName,
                filePath: `${testPath}/sql/${fileName}`
            };
            type = 'sql';
            migrationPath = `${testPath}/migrations`;
            createMigration = initialMigrations.createMigration;
        });

        test('expects to return a promise/promise-like object', async () => {
            const x = createMigration(argObj, type, migrationPath);
            expect(x.then).toBeTruthy();
            await x;
        });

        test('expects to destructure an object for its first argument', async () => {
            const x = () => createMigration(argObj.fileName, argObj.migrationsPath);
            expect(x).toThrow();
        });

        test('expects `curDate` value of first argument to be an instanceof Date ( `new Date()` )', async () => {
            argObj.curDate = Date.now();
            const x = () => createMigration(argObj, type, migrationPath);
            expect(x).toThrow();
        });

        test('expects to create file in `migrationPath` directory', async () => {
            await createMigration(argObj, type, migrationPath);
            const result = fs.readdirSync(migrationPath);
            expect(result[0]).not.toBeUndefined();
        });

        test('expects created file in `migrationPath` directory to be named correctly', async () => {
            await createMigration(argObj, type, migrationPath);
            const [result] = fs.readdirSync(migrationPath);
            const namedCorrectly = (result.includes('_added') && result.includes('_sql') && result.includes(argObj.base));
            expect(namedCorrectly).toBeTruthy();
        });

        test('expects NOT to destroy original file in `argObj.filePath` directory', async () => {
            await createMigration(argObj, type, migrationPath);
            const result = fs.readdirSync(`${testPath}/sql`);
            expect(result[0]).toBe(fileName);
        });

        test('expects NOT to modify original file in `argObj.filePath` directory', async () => {
            await createMigration(argObj, type, migrationPath);
            const original = fs.readFileSync(`${testPath}/sql/${fileName}`, 'utf8');
            expect(original).toEqual('# data to append');
        });

        test('expects created file in `migrationPath` to be a copy of file in `argObj.filePath` directory', async () => {
            await createMigration(argObj, type, migrationPath);
            const [result] = fs.readdirSync(`${testPath}/migrations`);
            const copy = fs.readFileSync(`${testPath}/migrations/${result}`);
            const original = fs.readFileSync(`${testPath}/sql/${fileName}`);
            expect(copy).toEqual(original);
        });
    });


    describe('.createMigrations(type, typePath, migrationPath)', () => {
        let type;
        let typePath;
        let migrationPath;
        let createMigrations;
        beforeEach(() => {
            type = 'sql';
            typePath = `${testPath}/sql`;
            migrationPath = `${testPath}/migrations`;
            createMigrations = initialMigrations.createMigrations;
        });

        test('expects to return a promise/promise-like object', async () => {
            const x = createMigrations(type, typePath, migrationPath);
            expect(x.then).toBeTruthy();
            await x;
        });

        test('expects to return `undefined` if no files exist in `typePath` directory', async () => {
            clearFiles(typePath);
            const x = await createMigrations(type, typePath, migrationPath);
            expect(x).toBeUndefined();
        });

        test('expects to invoke `initialMigrations.createMigration` with correct arguments for EACH file in `typePath', async () => {
            const fileName2 = `${fileName}.new`;
            const fd = fs.openSync(`${testPath}/sql/${fileName2}`, 'wx');
            fs.appendFileSync(fd, '# data to append', 'utf8');
            fs.closeSync(fd);
            await createMigrations(type, typePath, migrationPath);
            const result = fs.readdirSync(migrationPath);
            expect(result.length).toBe(2);
        });
    });


    describe('.init({proceduresPath, functionsPath, triggersPath, migrationsPath})', () => {
        let argObj;
        let init;
        beforeEach(() => {
            argObj = {
                proceduresPath: `${testPath}/sql`,
                functionsPath: `${testPath}/sql`,
                triggersPath: `${testPath}/sql`,
                migrationsPath: `${testPath}/migrations`
            };
            init = initialMigrations.init;
        });

        test('expects to return a promise/promise-like object', async () => {
            const x = init(argObj);
            expect(x.then).toBeTruthy();
            await x;
        });

        test('expects `argObj.proceduresPath` to default to the value `procedures` if falsy', async () => {
            // Pre setup
            let created = false;
            if(!fs.existsSync('./procedures')){
                fs.mkdirSync('./procedures');
                created = true;
            }
            fs.copyFileSync(`${testPath}/sql/${fileName}`, `./procedures/${fileName}.new`);

            // Test
            argObj.proceduresPath = undefined;
            await init(argObj);
            let result = fs.readdirSync(argObj.migrationsPath);
            result = result.filter((file) => {
                return file.includes('_added_procedure') && file.includes(`${fileName}.new`);
            });
            expect(result[0]).not.toBeUndefined();

            // Pre clean up
            fs.unlinkSync(`./procedures/${fileName}.new`);
            if(created){
                fs.rmdirSync('./procedures');
            }
        });

        test('expects `argObj.functionsPath` to default to the value `functions` if falsy', async () => {
            // Pre setup
            let created = false;
            if(!fs.existsSync('./functions')){
                fs.mkdirSync('./functions');
                created = true;
            }
            fs.copyFileSync(`${testPath}/sql/${fileName}`, `./functions/${fileName}.new`);

            // Test
            argObj.functionsPath = undefined;
            await init(argObj);
            let result = fs.readdirSync(argObj.migrationsPath);
            result = result.filter((file) => {
                return file.includes('_added_function') && file.includes(`${fileName}.new`);
            });
            expect(result[0]).not.toBeUndefined();

            // Pre clean up
            fs.unlinkSync(`./functions/${fileName}.new`);
            if(created){
                fs.rmdirSync('./functions');
            }
        });

        test('expects `argObj.triggersPath` to default to the value `triggers` if falsy', async () => {
            // Pre setup
            let created = false;
            if(!fs.existsSync('./triggers')){
                fs.mkdirSync('./triggers');
                created = true;
            }
            fs.copyFileSync(`${testPath}/sql/${fileName}`, `./triggers/${fileName}.new`);

            // Test
            argObj.triggersPath = undefined;
            await init(argObj);
            let result = fs.readdirSync(argObj.migrationsPath);
            result = result.filter((file) => {
                return file.includes('_added_trigger') && file.includes(`${fileName}.new`);
            });
            expect(result[0]).not.toBeUndefined();

            // Pre clean up
            fs.unlinkSync(`./triggers/${fileName}.new`);
            if(created){
                fs.rmdirSync('./triggers');
            }
        });


        test('expects `argObj.migrationsPath` to default to the value `migrations` if falsy', async () => {
            // Pre setup
            let created = false;
            if(!fs.existsSync('./migrations')){
                fs.mkdirSync('./migrations');
                created = true;
            }

            // Test
            argObj.migrationsPath = undefined;
            await init(argObj);
            let result = fs.readdirSync('./migrations');
            result = result.filter((file) => {
                return file.includes(fileName);
            });
            expect(result[0]).not.toBeUndefined();

            // Pre clean up
            result.forEach((file) => {
                fs.unlinkSync(`./migrations/${file}`);
            });
            if(created){
                fs.rmdirSync('./migrations');
            }
        });

        test('expects to invoke `initialMigrations.createMigrations` three times, once for each property in argObj (excluding migrationsPath)', async () => {
            await init(argObj);
            let result = fs.readdirSync(argObj.migrationsPath);
            result = result.filter((file) => {
                return file.includes('_added_function') || file.includes('_added_procedure') || file.includes('_added_trigger');
            });
            expect(result.length).toBe(3);
        });
    });
});