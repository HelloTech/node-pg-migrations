const pg = require('pg');
const migrate = require('./migrate');

const sql = `
DROP TABLE IF EXISTS ht_migrations;
create table ht_migrations
(
    id VARCHAR(255) null,
    constraint ht_migrations_id_pk
        primary key (id)
);`;

let pool;
beforeAll(()=>{
    pool = new pg.Pool();
    return pool.query(sql);
});

afterAll(() => {
    pool.end();
});

const insertString = `DROP TABLE IF EXISTS current_migrations; CREATE TEMPORARY TABLE current_migrations (
    m VARCHAR(255)
);

INSERT INTO current_migrations (m) VALUES ('20190125140146_test.sql'), ('20190125140146_test1.sql'), ('20190125141959_test2.js'), ('20190125141959_test3.js'); SELECT current_migrations.m FROM current_migrations LEFT OUTER JOIN ht_migrations ON current_migrations.m = ht_migrations.id WHERE ht_migrations.id IS NULL ORDER BY current_migrations.m ASC;`;

describe('Migration runner', ()=>{
    beforeEach(async () => {
        await pool.query("TRUNCATE TABLE ht_migrations; INSERT INTO ht_migrations (id) VALUES ('20190125141959_test3.js')");
    });

    test('expect current migrations string to be properly formatted', () => {
        const migrationSql = migrate.genCurrentMigrationSql(['20190125140146_test.sql', '20190125140146_test1.sql', '20190125141959_test2.js', '20190125141959_test3.js']);
        expect(migrationSql).toBe(insertString);
    });

    test('expect test migrations to come back in order only with new migrations', async () => {
        const migrations = await migrate.getCurrentMigrations(pool, insertString);
        expect(migrations[0].m).toBe('20190125140146_test.sql');
        expect(migrations[1].m).toBe('20190125140146_test1.sql');
        expect(migrations[2].m).toBe('20190125141959_test2.js');
        expect(migrations[3]).toBeUndefined();
    });

    test('expect run migration to execute correctly for a sql migration', async () => {
        await migrate.runMigration(pool, './testMigrations/valid', '20190125140146_test.sql');
        const results = await pool.query('SELECT * FROM node_pg_migration_test;');
        expect(results.rows[0].id).toBe('test');
    });

    test('expect run migration to handle invalid sql migration', async () => {
        await expect(migrate.runMigration(pool, './testMigrations/invalid', '20190125140146_test1.sql')).rejects.toThrow();
    });

    test('expect run migration to execute correctly for a js migration', async () => {
        await migrate.runMigration(pool, './testMigrations/valid', '20190125141959_test2.js');
        const results = await pool.query('SELECT * FROM node_pg_migration_test;');
        expect(results.rows[1].id).toBe('test2');
    });

    test('expect run migration to handle invalid js migration', async () => {
        await expect(migrate.runMigration(pool, './testMigrations/invalid', '20190125141959_test3.js')).rejects.toThrow();
    });

    test('expect run migration to add migration to ht_migrations', async () => {
        await migrate.addCompletedMigration(pool, '20190125140146_test.sql');
        const results = await pool.query('SELECT * FROM ht_migrations ORDER BY id ASC;');
        expect(results.rows[0].id).toBe('20190125140146_test.sql');
    });

    test('expect run migration to run all three valid migrations in order', async () => {
        await pool.query('TRUNCATE TABLE orders');
        await migrate.run(pool, {migrationsPath: './testMigrations/valid'});
        const migrations = await pool.query('SELECT * FROM ht_migrations ORDER BY id ASC;');
        const orders = await pool.query('SELECT * FROM node_pg_migration_test ORDER BY id ASC;');
        const expectedMigrations = [
            {id: '20190125140146_test.sql'},
            {id: '20190125140146_test1.sql'},
            {id: '20190125141959_test2.js'},
            {id: '20190125141959_test3.js'}
        ];
        const expectedOrders = [
            {id: 'test'},
            {id: 'test1'},
            {id: 'test2'}
        ];
        expect(migrations.rows).toEqual(expectedMigrations);
        expect(orders.rows).toEqual(expectedOrders);
    });

    test('expect run migration to stop running at invalid migration', async () => {
        await pool.query('DROP TABLE orders');
        await expect(migrate.run(pool, {migrationsPath: './testMigrations/invalid'})).rejects.toThrow();
        const migrations = await pool.query('SELECT * FROM ht_migrations ORDER BY id ASC;');
        const orders = await pool.query('SELECT * FROM node_pg_migration_test ORDER BY id ASC;');
        const expectedMigrations = [
            {id: '20190125140146_test.sql'},
            {id: '20190125141959_test3.js'}
        ];
        const expectedOrders = [
            {id: 'test'}
        ];
        expect(migrations.rows).toEqual(expectedMigrations);
        expect(orders.rows).toEqual(expectedOrders);
    });
});