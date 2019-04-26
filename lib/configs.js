const dbName = process.env.DB_NAME || 'hellotech_development';
const connectionOptions = {
    max: 5,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    timezone: 'UTC',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true,
};

module.exports = {
    dbName,
    connectionOptions,
};