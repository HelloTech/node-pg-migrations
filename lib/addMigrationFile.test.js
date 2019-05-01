const fs = require('fs');
const path = require('path');
const addMigrationFile = require('./addMigrationFile').add;

const curDate = Date.now();
const testDir = `${curDate}test`;
const testPath = `./${testDir}/`;

function clearFiles(directory){
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
        fs.unlinkSync(path.join(directory, file));
    });
}

beforeAll(() => {
    if(!fs.existsSync(testPath)){
        fs.mkdirSync(testPath);
    } else {
        throw new Error(`Cannot create directory: ${testDir}`);
    }
});

afterAll(() => {
    clearFiles(testPath);
    fs.rmdirSync(testPath);
});

describe('addMigrationFile({fileName, migrationsPath})', () => {
    let argument;
    beforeEach(() => {
        argument = {
            fileName: `${Date.now()}file`,
            migrationsPath: testDir
        };
    });

    test('expects to return a promise/promise-like object', async () => {
        const x = addMigrationFile(argument);
        expect(x.then).toBeTruthy();
        await x;
    });

    test('expects to reject then throw if `argument.migrationsPath` does not already exist in file system', async () => {
        argument.migrationsPath = Date.now();
        const x = addMigrationFile(argument);
        expect(x).rejects.toThrow();
    });

    test('expects to destructure a single object for its argument', () => {
        const x = addMigrationFile(argument.fileName, argument.migrationsPath);
        expect(x).rejects.toThrow();
    });

    test('expects to create file in `./($argument.migrationsPath)/`', async () => {
        await addMigrationFile(argument);
        const files = fs.readdirSync(testPath);
        console.log(files);
        const result = files.filter((file) => {
            return file.includes(argument.fileName);
        });
        expect(result[0]).not.toBeUndefined();
    });

    test('expects to append jsMigrationBase string to end of created file if file ext ends in .js`', async () => {
        await addMigrationFile(argument);
        const files = fs.readdirSync(testPath);
        const result = files.filter((file) => {
            return file.includes(argument.fileName);
        });
        expect(result[0]).not.toBeUndefined();
    });

    test('expects `argument.migrationsPath` to default to the value `migrations` if a value does not exist', async () => {
        let created = false;
        if(!fs.existsSync('./migrations/')){
            fs.mkdirSync('./migrations/');
            created = true;
        }
        argument.migrationsPath = undefined;
        await addMigrationFile(argument);
        const files = fs.readdirSync('./migrations/');
        const result = files.filter((file) => {
            return file.includes(argument.fileName);
        });
        expect(result[0]).not.toBeUndefined();
        if(result[0]){
            fs.unlinkSync(`./migrations/${result[0]}`);
            if(created){
                fs.rmdirSync('./migrations/');
            }
        }
    });

    test('expects created file to be empty if file extension does NOT end in `.js`', async () => {
        await addMigrationFile(argument);
        const files = fs.readdirSync(testPath);
        const result = files.filter((file) => {
            return file.includes(argument.fileName);
        });
        const content = fs.readFileSync(path.join(testPath, result[0]));
        expect(content.length).toEqual(0);
    });

    test('expects to append `jsMigrationBase` string to end of created file if file extension ends in `.js`', async () => {
        argument.fileName += '.js';
        await addMigrationFile(argument);
        const files = fs.readdirSync(testPath);
        const result = files.filter((file) => {
            return file.includes(argument.fileName);
        });
        const content = fs.readFileSync(path.join(testPath, result[0]));
        const hasBase = (content.includes('module.exports = function(pool){'));
        expect(hasBase).toBeTruthy();
    });
});