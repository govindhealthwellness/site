const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

// Create MySQL connection pool with optimized settings for Vercel serverless
function createPool() {
    if (pool) return pool;

    const config = {
        host: process.env.DB_HOST || 'luvbees-govindhealthwellness.d.aivencloud.com',
        port: parseInt(process.env.DB_PORT || '12252', 10),
        user: process.env.DB_USER || 'avnadmin',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'defaultdb',
        ssl: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        },
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 20000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        charset: 'utf8mb4'
    };

    console.log('[DB] Creating MySQL pool with config:', {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        hasPassword: !!config.password,
        ssl: 'enabled'
    });

    if (!config.password) {
        console.error('[DB] ERROR: DB_PASSWORD is not set in environment variables!');
        throw new Error('DB_PASSWORD environment variable is required');
    }

    pool = mysql.createPool(config);
    return pool;
}

// Get connection pool (creates if doesn't exist)
async function getPool() {
    if (!pool) {
        createPool();
    }
    return pool;
}

// Test connection with detailed error reporting
async function testConnection() {
    try {
        const testPool = await getPool();
        console.log('[DB] Testing MySQL connection...');
        const connection = await testPool.getConnection();
        console.log('[DB] ✓ MySQL connection successful!');
        connection.release();
        return true;
    } catch (error) {
        console.error('[DB] ✗ MySQL connection failed!');
        console.error('[DB] Error code:', error.code);
        console.error('[DB] Error message:', error.message);
        console.error('[DB] Error stack:', error.stack);
        console.error('[DB] SQL State:', error.sqlState);
        console.error('[DB] Errno:', error.errno);
        throw error;
    }
}

// Query wrapper with error handling
async function query(sql, params = []) {
    const queryPool = await getPool();

    try {
        console.log('[DB] Executing query:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
        const result = await queryPool.query(sql, params);
        return result;
    } catch (error) {
        console.error('[DB] Query error:', error.message);
        console.error('[DB] Failed query:', sql);
        console.error('[DB] Query params:', params);
        throw error;
    }
}

module.exports = {
    query,
    testConnection,
    getPool
};
