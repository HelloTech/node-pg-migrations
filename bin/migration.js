#! /usr/bin/env node
const args = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('run', 'Run pending migrations', () => {}, (argv) => {
        const pg = require('pg');
        const configs = require('../lib/configs');
        const migrate = require('../lib/migrate');
        const pool = new pg.Pool(configs.connectionOptions);
        migrate.run('./migrations', pool, argv.clear).then(function(){
            console.log('done');
        }).catch(function(err){
            console.log('err: ', err);
        }).finally(function(){
            pool.end();
        });
    })
    .command("init", 'Initial migration generation based on added/modified/deleted functions and stored procedures', () => {}, () => {
        const init = require("../lib/initialMigrations.js");
        init();
    })
    .command("generate", 'Generate migrations based on added/modified/deleted functions and stored procedures', () => {}, () => {
        const generate = require("../lib/generateProcedureMigrationFiles.js");
        generate();
    })
    .command('add <name>', 'Add new migration', (yargs) => {
        yargs
            .positional('name', {
                describe: 'Name of the new migration'
            })
    }, (argv) => {
        const add = require("../lib/addMigrationFile");
        add(argv.name);
    })
    .command('add_notify_trigger <tableName> [triggerName]', 'Add notify trigger', (yargs) => {
        yargs
            .positional('tableName', {
                describe: 'Name of the table the trigger will be getting added to'
            })
            .positional('triggerName', {
                describe: 'Name of the trigger'
            })
    }, (argv) => {
        const addNotifyTrigger = require("../lib/addNotifyTrigger");
        addNotifyTrigger(argv.tableName, argv.triggerName);
    })
    .demandCommand(1, "Must provide a valid command")
    .alias('c', 'clear')
    .boolean('c')
    .describe('c', 'Clear migrations table before running migrations')
    .help("h")
    .alias("h", "help")
    .argv;