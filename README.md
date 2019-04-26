<h1 align="center"> Node PostgreSQL Migrations </h1>
<p align="center">
  <b >This is a node.js service for maintaining PostgreSQL migrations</b>
</p>
<br>

## Description :
node-pg-migrations is setup to help devs setup and maintain PostgreSQL migrations

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

const configs = {
    max: 5,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    timezone: 'UTC',
    user: process.env.DB_USERNAME || 'user_name',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
};

const pool = new pg.Pool(configs);
migrations.init();
migrations.run('./migrations', pool, false).then(function(){
        console.log('done');
    }).catch(function(err){
        console.log('err: ', err);
    }).finally(function(){
        pool.end();
    });
````

```bash
#bash
$ node-pg-migrations init
$ node-pg-migrations run
```

Run the example above with `--help` to see the help for the application.

## Documentation :
- [Init](#init)
- [Run](#run)
- [Generate](#generate)
- [Add](#add)
- [AddNotifyTrigger](#addnotifytrigger)

## Init

The init method runs through all functions/triggers/stored-procedures and creates insert migrations for them.

example:
```js
// index.js
const migrations = require('node-pg-migrations');
migrations.init();
```

```bash
#bash
$ node-pg-migrations init
```

## Run

The run method executes the migrations in the migrations folder.
The method takes three params:
- `directoryName`: The directory where the migrations are saved
- `pool`: A PostgreSQL pool object
- `clear`: If set to true the method will run all migration regardless of if they've been run or not

example:
```js
const migrations = require('node-pg-migrations');
const pg = require('pg');

const configs = {
    max: 5,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    timezone: 'UTC',
    user: process.env.DB_USERNAME || 'user_name',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
};

const pool = new pg.Pool(configs);
migrations.run('./migrations', pool, false).then(function(){
        console.log('done');
    }).catch(function(err){
        console.log('err: ', err);
    }).finally(function(){
        pool.end();
    });
```

```bash
#run new migrations
$ node-pg-migrations run
```

```bash
#run all migrations
$ node-pg-migrations run --clear
```

## Generate

The generate method generates new migrations based on git staged changes to functions/triggers/stored-procedures

example:
```js
// index.js
const migrations = require('node-pg-migrations');
migrations.generate();
```

```bash
#bash
$ node-pg-migrations generate
```

## Add

The add method adds a new migration file. It takes a filename as a param. If the filename has an extension of `.sql` it creates a blank sql file.
If the filename has an extension of `.js` it creates a js file with the expected js format.
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
$ node-pg-migrations add 'migration.sql'
```

## AddNotifyTrigger

The addNotifyTrigger method generates a notify function and trigger for the provided table name. It takes two params:
- `tableName`: The name of the table to which the trigger will be added.
- `triggerName`: This will default to `${tableName}_after_insert_update_delete_trigger`. But if the name is over 63 chars you will have to provide an alternate name.

example:
```js
const migrations = require('node-pg-migrations');
migrations.addNotifyTrigger('users');
```

```bash
$ node-pg-migrations addNotifyTrigger users users_insert_trigger
```