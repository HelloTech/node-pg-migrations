#! /usr/bin/env node
const pg = require('pg');
const configs = require('../lib/configs');
const migrate = require('../lib/migrate');
const generate = require("../lib/generateProcedureMigrationFiles.js");
const init = require("../lib/initialMigrations.js");
const add = require("../lib/addMigrationFile");
const addNotifyTrigger = require("../lib/addNotifyTrigger");

const execRun = function(argv){
    const pool = new pg.Pool(configs.connectionOptions);
    migrate.run(argv.directoryName, pool, argv.clear).then(function(){
        console.log('done');
    }).catch(function(err){
        console.log('err: ', err);
    }).finally(function(){
        pool.end();
    });
};

const execAdd = function(argv) {
    add(argv.name);
};

const execAddNotifyTrigger = function(argv){
    addNotifyTrigger(argv.tableName, argv.triggerName);
};


const args = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('run [directoryName]', 'Run pending migrations', (yargs) => {
        yargs
            .positional('directoryName', {
                describe: 'The migrations directory',
                default: './migrations'
            })
    }, execRun)
    .command("init", 'Initial migration generation based on added/modified/deleted functions and stored procedures', () => {}, init)
    .command("generate", 'Generate migrations based on added/modified/deleted functions and stored procedures', () => {}, generate)
    .command('add <name>', 'Add new migration', (yargs) => {
        yargs
            .positional('name', {
                describe: 'Name of the new migration'
            })
    }, execAdd)
    .command('add_notify_trigger <tableName> [triggerName]', 'Add notify trigger', (yargs) => {
        yargs
            .positional('tableName', {
                describe: 'Name of the table the trigger will be getting added to'
            })
            .positional('triggerName', {
                describe: 'Name of the trigger'
            })
    }, execAddNotifyTrigger)
    .demandCommand(1, "Must provide a valid command")
    .alias('c', 'clear')
    .boolean('c')
    .describe('c', 'Clear migrations table before running migrations')
    .help("h")
    .alias("h", "help")
    .argv;