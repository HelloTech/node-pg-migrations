const migrate = require('./lib/migrate').run;
const generate = require('./lib/generate.js').generate;
const add = require('./lib/addMigrationFile').add;
const addNotifyTrigger = require('./lib/addNotifyTrigger').addNotifyTrigger;
const init = require('./lib/initialMigrations').init;

module.exports = {
    migrate,
    generate,
    add,
    addNotifyTrigger,
    init
};