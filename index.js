const migrate = require('./lib/migrate');
const generate = require('./lib/generateProcedureMigrationFiles.js');
const add = require('./lib/addMigrationFile');
const addNotifyTrigger = require('./lib/addNotifyTrigger');
const init = require('./lib/initialMigrations');

module.exports = {
    migrate,
    generate,
    add,
    addNotifyTrigger,
    init
};