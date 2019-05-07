// If modifying tests, be mindful of when they access a shared directory versus a unique test directory..
// Could cause async problems if not aware...
const fs = require('fs');
const path = require('path');
const git = require('simple-git/promise');
const generate = require('./generate');

const curDate = Date.now();
const testDir = `${curDate}test`;
const testPath = `./${testDir}`;


function clearFiles(directory){
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
        fs.unlinkSync(path.join(directory, file));
    });
}

// Mock git so it doesnt really commit anything
jest.mock('simple-git/promise');
const mockAdd = jest.fn(async (migrationName) => {
    return {[`${migrationName}`]: true};
});
git.mockImplementation(() => {
    return { add: mockAdd };
});


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

describe('generate', () => {
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

    describe('.getDropStatement(type, name)', () => {
        let type;
        let name;
        let getDropStatement;
        beforeEach(() => {
            name = `${Date.now()}test`;
            getDropStatement = generate.getDropStatement;
        });

        test('expects to return a string', () => {
            type = 'function';
            const x = getDropStatement(type, name);
            expect(typeof x === 'string').toBeTruthy();
        });

        test('expects returned string to include name', ()=> {
            type = 'function';
            const x = getDropStatement(type, name);
            const hasName = x.includes(name);
            expect(hasName).toBeTruthy();
        });

        test('expects to return correct string if `type` argument contains the value `function`', ()=> {
            type = 'function';
            const x = getDropStatement(type, name);
            expect(x).toBe(`DROP FUNCTION IF EXISTS ${name};`);
        });

        test('expects to return correct string if `type` argument contains the value `trigger`', ()=> {
            type = 'trigger';
            const x = getDropStatement(type, name);
            expect(x).toBe(`DROP FUNCTION IF EXISTS ${name}_function CASCADE;`);
        });

        test('expects to return correct string if `type` argument is NOT `trigger` or `function`', ()=> {
            type = 'procedure';
            let x = getDropStatement(type, name);
            expect(x).toBe(`DROP PROCEDURE IF EXISTS ${name};`);

            type = undefined;
            x = getDropStatement(type, name);
            expect(x).toBe(`DROP PROCEDURE IF EXISTS ${name};`);
        });
    });


    describe('.createMigration({curDate, index, base, path, originalPath}, type, migrationsPath)', () => {
        let argObj;
        let type;
        let migrationsPath;
        let createMigration;
        beforeEach(() => {
            argObj = {
                curDate: new Date(),
                index: 'A', // const action = index === 'A' ? 'added' : index === 'M' ? 'modified' : index === 'D' ? 'deleted' : 'renamed'; // R === 'renamed'
                base: `${fileName}`,
                originalPath: `${testPath}/sql/old_file_name.sql`,
                path: `${testPath}/sql/${fileName}`
            };
            type = 'function';
            migrationsPath = `${testPath}/migrations`;
            createMigration = generate.createMigration;
        });

        test('expects to return a promise/promise-like object', async () => {
            const x = createMigration(argObj, type, migrationsPath);
            expect(x.then).toBeTruthy();
            await x;
        });

        test('expects to throw if `argObj.curDate` is NOT a `Date` object', async () => {
            argObj.curDate = undefined;
            const x = createMigration(argObj, type, migrationsPath);
            expect(x).rejects.toThrow();
        });

        test('expects to create a new file in `migrationsPath` directory', async () => {
            const prevResult = fs.readdirSync(`${testPath}/migrations`);
            await createMigration(argObj, type, migrationsPath);
            const result = fs.readdirSync(`${testPath}/migrations`);
            expect(prevResult.length).toBeLessThan(result.length);
        });

        test('expects new file to be named similar to original file at `argObj.path`', async () => {
            await createMigration(argObj, type, migrationsPath);
            let result = fs.readdirSync(`${testPath}/migrations`);
            result = result.filter((file) => {
                return file.includes(fileName);
            });
            expect(result[0]).not.toBeUndefined();
        });

        test('expects new file to contain content from original file at `argObj.path`', async () => {
            await createMigration(argObj, type, migrationsPath);
            const [createdFile] = fs.readdirSync(`${testPath}/migrations`);
            const newContent = fs.readFileSync(`${testPath}/migrations/${createdFile}`);
            const oldContent = fs.readFileSync(`${testPath}/sql/${fileName}`);
            expect(newContent.includes(oldContent)).toBeTruthy();
        });

        test('expects to handle renamed files (argObj.index === \'R\')', async () => {
            argObj.index = 'R';
            await createMigration(argObj, type, migrationsPath);
            const [createdFile] = fs.readdirSync(`${testPath}/migrations`);
            const content = fs.readFileSync(`${testPath}/migrations/${createdFile}`);
            const handledRename = content.includes(`DROP FUNCTION IF EXISTS ${path.parse(argObj.originalPath).name};`);
            expect(handledRename).toBeTruthy();
        });

        test('expects to invoke `git()`', async () => {
            await createMigration(argObj, type, migrationsPath);
            expect(git).toHaveBeenCalled();
        });

        test('expects to invoke `git().add(pathToMigration)` with correct `pathToMigration`', async () => {
            await createMigration(argObj, type, migrationsPath);
            const pathToMigration = mockAdd.mock.calls[mockAdd.mock.calls.length - 1][0];
            const isCorrect = pathToMigration.includes(fileName) && pathToMigration.includes(`${testPath}/migrations`);
            expect(mockAdd).toHaveBeenCalled();
            expect(isCorrect).toBeTruthy();
        });
    });


    describe('.filterFiles(methods, type, curMigrations, migrationsPath)', () => {
        let methods;
        let type;
        let curMigrations;
        let migrationsPath;
        let filterFiles;
        beforeEach(() => {
            methods = [{
                curDate: new Date(),
                index: 'A', // const action = index === 'A' ? 'added' : index === 'M' ? 'modified' : index === 'D' ? 'deleted' : 'renamed'; // R === 'renamed'
                base: `${fileName}`,
                originalPath: `${testPath}/sql/old_file_name.sql`,
                path: `${testPath}/sql/${fileName}`,
                name: fileName.split('.')[0]
            }];
            curMigrations = {};
            type = 'function';
            migrationsPath = `${testPath}/migrations`;
            filterFiles = generate.filterFiles;
        });

        test('expects to return a promise/promise-like object', async () => {
            const x = filterFiles(methods, type, curMigrations, migrationsPath);
            expect(x.then).toBeTruthy();
            await x;
        });

        test('expects to throw if `methods` argument is NOT an array', async () => {
            methods = methods[0];
            const x = () => filterFiles(methods, type, curMigrations, migrationsPath);
            expect(x).toThrow();
        });

        test('expects to return pending `Promise.all`', async () => {
            const mockPromiseAll = jest.spyOn(Promise, 'all').mockImplementation(() => ({ok: true}));
            const x = await filterFiles(methods, type, curMigrations, migrationsPath);
            expect(x).toEqual({ok: true});
            mockPromiseAll.mockRestore();
        });

        test('expects to invoke `Promise.all` with a promise for each object in `methods` array', async () => {
            const mockPromiseAll = jest.spyOn(Promise, 'all').mockImplementation(() => ({ok: true}));

            // Create a new file
            const fileName2 = `${Date.now()}file.new`;
            const fd = fs.openSync(`${testPath}/sql/${fileName2}`, 'wx');
            fs.appendFileSync(fd, '# data to append 2', 'utf8');
            fs.closeSync(fd);
            methods[2] = {
                curDate: new Date(),
                index: 'A',
                base: `${fileName2}`,
                originalPath: `${testPath}/sql/old_file_name.sql`,
                path: `${testPath}/sql/${fileName2}`,
                name: fileName2.split('.')[0]
            };

            await filterFiles(methods, type, curMigrations, migrationsPath);
            const promiseAllArgument = mockPromiseAll.mock.calls[0][0]; // [0][0] === First Call to Promise.all(), First Argument
            expect(Array.isArray(promiseAllArgument)).toBeTruthy();
            expect(promiseAllArgument.length).toBe(2);
            mockPromiseAll.mockRestore();
        });
    });
});