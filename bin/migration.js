#! /usr/bin/env node
const pg = require('pg');
const yargs = require('yargs');
const migrate = require('../lib/migrate');
const generate = require('../lib/generate.js');
const init = require('../lib/initialMigrations.js');
const add = require('../lib/addMigrationFile');
const addNotifyTrigger = require('../lib/addNotifyTrigger');

const emptyBuilder = () => {};

const execRun = function(argv){
    const pool = new pg.Pool();
    migrate.run(pool, argv).then(function(){
        console.log('done');
    }).catch(function(err){
        console.log('err: ', err);
    }).finally(function(){
        pool.end();
    });
};

// noinspection BadExpressionStatementJS
yargs
    .usage('Usage: $0 <command> [options]')
    .command('run', 'Run pending migrations', emptyBuilder, execRun)
    .command('init', 'Initial migration generation based on added/modified/deleted functions and stored procedures', emptyBuilder, init)
    .command('generate', 'Generate migrations based on added/modified/deleted functions and stored procedures', emptyBuilder, generate)
    .command('add <fileName>', 'Add new migration', (yargs) => {
        yargs
            .positional('fileName', {describe: 'Name of the new migration'});
    }, add)
    .command('add_notify_trigger <tableName> [triggerName]', 'Add notify trigger', (yargs) => {
        yargs
            .positional('tableName', {describe: 'Name of the table the trigger will be getting added to'})
            .positional('triggerName', {describe: 'Name of the trigger'});
    }, addNotifyTrigger)
    .demandCommand(1, 'Must provide a valid command')
    .options({
        p: {
            alias: 'proceduresPath',
            default: 'procedures',
            describe: 'Procedures directory path'
        },
        f: {
            alias: 'functionsPath',
            default: 'functions',
            describe: 'Functions directory path'
        },
        t: {
            alias: 'triggersPath',
            default: 'triggers',
            describe: 'Triggers directory path'
        },
        m: {
            alias: 'migrationsPath',
            default: 'migrations',
            describe: 'Migrations directory path'
        },
        c: {
            alias: 'clear',
            boolean: true,
            describe: 'Clear migrations table before running'
        }
    })
    .help('h')
    .alias('h', 'help')
    .argv;