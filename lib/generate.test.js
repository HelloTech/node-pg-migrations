// If modifying tests, be mindful of when they access a shared directory versus a unique test directory..
// Could cause async problems if not aware...
const fs = require('fs');
const path = require('path');
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
});