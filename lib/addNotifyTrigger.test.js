const fs = require('fs');
const path = require('path');
const addNotifyTrigger = require('./addNotifyTrigger').addNotifyTrigger;

const curDate = Date.now();
const testDir = `${curDate}test`;
const testPath = `./${testDir}/`;

function clearFiles(pathTo){
    const files = fs.readdirSync(pathTo);
    files.forEach((file) => {
        fs.unlinkSync(path.join(pathTo, file));
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

describe('addNotifyTrigger({tableName, triggerName, triggersPath})', () => {
    let argument;
    beforeEach(() => {
        const testDate = Date.now();
        argument = {
            tableName: `${testDate}table`,
            triggerName: `${testDate}trigger`,
            triggersPath: testDir
        };
    });

    test('expects to throw if `argument.tableName` is too long and `argument.triggerName` does not exist', () => {
        argument.triggerName = undefined;
        for(let i = 0; i < 100; i++){
            argument.tableName += 'a';
        }
        const x = () => addNotifyTrigger(argument);
        expect(x).toThrow();
    });

    test('expects to throw if `argument.triggerName` is too long', () => {
        for(let i = 0; i < 100; i++){
            argument.triggerName += 'a';
        }
        const x = () => addNotifyTrigger(argument);
        expect(x).toThrow();
    });

    test('expects to default to `argument.triggerName` instead `argument.tableName` if `argument.triggerName` exists', async () => {
        for(let i = 0; i < 100; i++){
            argument.tableName += 'a';
        }
        const x = addNotifyTrigger(argument);
        await expect(x).resolves.not.toThrow();
    });

    test('expects to return a promise/promise-like object', async () => {
        const x = addNotifyTrigger(argument);
        expect(x.then).toBeTruthy();
        await x;
    });

    test('expects to reject then throw if `argument.triggersPath` does not already exist in file system', async () => {
        argument.triggersPath = Date.now();
        const x = addNotifyTrigger(argument);
        await expect(x).rejects.toThrow();
    });

    xtest('expects to destructure a single object for its argument', async () => {
        const x = addNotifyTrigger(argument.tableName, argument.triggerName, argument.triggersPath);
        await expect(x).rejects.toThrow();
    });

    test('expects to create file in `./($argument.triggersPath)/`', async () => {
        await addNotifyTrigger(argument);
        const files = fs.readdirSync(testPath);
        const result = files.includes(`${argument.triggerName}.sql`);
        expect(result).toBeTruthy();
    });

    test('expects `argument.triggersPath` to default to the value `triggers` if a value does not exist', async () => {
        let created = false;
        if(!fs.existsSync('./triggers/')){
            fs.mkdirSync('./triggers/');
            created = true;
        }
        argument.triggersPath = undefined;
        await addNotifyTrigger(argument);
        const files = fs.readdirSync('./triggers/');
        const result = files.includes(`${argument.triggerName}.sql`);
        expect(result).toBeTruthy();
        if(result){
            fs.unlinkSync(`./triggers/${argument.triggerName}.sql`);
            if(created){
                fs.rmdirSync('./triggers/');
            }
        }
    });
});