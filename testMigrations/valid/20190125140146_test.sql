DROP TABLE IF EXISTS orders;
create table orders
(
    id VARCHAR(255) null,
    constraint orders_id_pk
        primary key (id)
);
INSERT INTO orders (id) VALUES ('test');
