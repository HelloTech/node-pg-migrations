DROP TABLE IF EXISTS node_pg_migration_test;
create table node_pg_migration_test
(
    id VARCHAR(255) null,
    constraint node_pg_migration_test_id_pk
        primary key (id)
);
INSERT INTO node_pg_migration_test (id) VALUES ('test');
