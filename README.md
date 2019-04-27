<h1 align="center"> Node PostgreSQL Migrations (NPG)</h1>
<p align="center">
  <b >This is a node.js service for maintaining PostgreSQL migrations</b>
</p>
<br>

[![npm version](https://badge.fury.io/js/node-pg-migrations.svg)](https://badge.fury.io/js/node-pg-migrations)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description :
NPG is setup to help devs setup and maintain PostgreSQL migrations

It gives you:

* Auto generated migrations based on insert/update/delete of functions/triggers/stored-procedures
* Support for manually added migrations in both js and sql

## Installation

Stable version:
```bash
npm i node-pg-migrations --save
```

## Usage :

### Simple Example

````javascript
// index.js
const migrations = require('node-pg-migrations');
const pg = require('pg');

const pool = new pg.Pool();
migrations.init();
migrations.run(pool).then(function(){
        console.log('done');
    }).catch(function(err){
        console.log('err: ', err);
    }).finally(function(){
        pool.end();
    });
````

```bash
#bash
$ npg init
$ npg run
```

Run the example above with `--help` to see the help for the application.

## Documentation :
- [Env](#env)
- [Bash](#bash)
- [Init](#init)
- [Run](#run)
- [Generate](#generate)
- [Add](#add)
- [AddNotifyTrigger](#addnotifytrigger)

## Env

This package uses the same env variables as the node-postgres program
```bash
PGHOST='localhost'
PGUSER=process.env.USER
PGDATABASE=process.env.USER
PGPASSWORD=null
PGPORT=5432
```

## Bash

```bash
Usage: npg <command> [options]

Commands:
  npg run                                   Run pending migrations
  npg init                                  Initial migration generation based
                                            on added/modified/deleted functions
                                            and stored procedures
  npg generate                              Generate migrations based on
                                            added/modified/deleted functions and
                                            stored procedures
  npg add <fileName>                        Add new migration
  npg add_notify_trigger <tableName>        Add notify trigger
  [triggerName]

Options:
  --version             Show version number                            [boolean]
  -p, --proceduresPath  Procedures directory path        [default: "procedures"]
  -f, --functionsPath   Functions directory path          [default: "functions"]
  -t, --triggersPath    Triggers directory path            [default: "triggers"]
  -m, --migrationsPath  Migrations directory path        [default: "migrations"]
  -c, --clear           Clear migrations table before running          [boolean]
  -h, --help            Show help                                      [boolean]
```



## Init

The init method runs through all functions/triggers/stored-procedures and creates insert migrations for them.
- `options`(optional):
    - `proceduresPath`: Procedures directory path relative to project root, default 'procedures'
    - `functionsPath`: 'Functions directory path relative to project root, default 'functions'
    - `triggersPath`:  'Triggers directory path relative to project root, default 'triggers'
    - `migrationsPath`: Migrations directory path relative to project root, default 'migrations'

example:
```js
// index.js
const migrations = require('node-pg-migrations');
migrations.init();
```

```bash
#bash
$ npg init
```

## Run

The run method executes the migrations in the migrations folder.
The method takes two params:
- `pool`: A PostgreSQL pool object
- `options(optional)`:
    - `migrationsPath`: Migrations directory path relative to project root, default 'migrations'
    - `clear`: If set to true the method will run all migration regardless of if they've been run or not

example:
```js
const migrations = require('node-pg-migrations');
const pg = require('pg');

const pool = new pg.Pool();
migrations.run(pool, {migrationsPath: 'migrations', clear: false}).then(function(){
        console.log('done');
    }).catch(function(err){
        console.log('err: ', err);
    }).finally(function(){
        pool.end();
    });
```

```bash
#run new migrations
$ npg run
$ npg run './migrations'
```

```bash
#run all migrations
$ npg run --clear
```

## Generate

The generate method generates new migrations based on git staged changes to functions/triggers/stored-procedures. It takes the param.
- `options`(optional):
    - `proceduresPath`: Procedures directory path relative to project root, default 'procedures'
    - `functionsPath`: 'Functions directory path relative to project root, default 'functions'
    - `triggersPath`:  'Triggers directory path relative to project root, default 'triggers'
    - `migrationsPath`: Migrations directory path relative to project root, default 'migrations'

example:
```js
const migrations = require('node-pg-migrations');
migrations.generate();
```

You can set up generate to run on every git commit by using the pre-commit service

package.json example
```json
{
    "name": "node-pg-migrations",
    "version": "0.0.0",
    "scripts": {
        "generate": "node-pg-migrations generate"
    },
    "bin": {
        "node-pg-migrations": "bin/migration.js"
    },
    "pre-commit": [
        "generate"
    ]
}
```

```bash
$ npg generate
```

## Add

The add method adds a new migration file. It takes the param.
- `options`:
    - `filename`: If the filename has an extension of `.sql` it creates a blank sql file. If the filename has an extension of `.js` it creates a js file with the expected js format.
    - `migrationsPath`(optional): Migrations directory path relative to project root, default 'migrations'
```js
module.exports = function(pool){
    const sql = '';
    const values = [];
    return pool.query(sql, values);
};
```

example:
```js
const migrations = require('node-pg-migrations');
migrations.add('migration.sql');
migrations.add('newMigration.js');
```

```bash
$ npg add 'migration.sql'
```

## AddNotifyTrigger

The addNotifyTrigger method generates a notify function and trigger for the provided table name. It takes two params:
It takes the param.
- `options`:
    - `tableName`: The name of the table to which the trigger will be added.
    - `triggerName`(optional): This will default to `${tableName}_after_insert_update_delete_trigger`. But if the name is over 63 chars you will have to provide an alternate name.
    - `triggersPath`(optional): 'Triggers directory path relative to project root, default 'triggers'

example:
```js
const migrations = require('node-pg-migrations');
migrations.addNotifyTrigger('users');
```

```bash
$ npg addNotifyTrigger users users_insert_trigger
```