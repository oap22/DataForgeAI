/**
 * DataForgeAI Database Connection Module
 * Manages PostgreSQL connection pool and provides query helpers
 */

import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const poolConfig: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'dataforge',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,

    // Connection pool settings
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),

    // SSL configuration (required for Google Cloud SQL)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

    // Connection timeouts
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
};

// Create connection pool
const pool = new Pool(poolConfig);

// Log pool errors
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

/**
 * Execute a query with parameters
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
    }

    return result;
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
    const client = await pool.connect();
    return client;
}

/**
 * Execute queries within a transaction
 */
export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Generate a new UUID
 */
export function generateUUID(): string {
    return uuidv4();
}

/**
 * Check database connection health
 */
export async function healthCheck(): Promise<boolean> {
    try {
        const result = await query('SELECT 1 as health');
        return result.rows[0]?.health === 1;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
    };
}

/**
 * Gracefully close the connection pool
 */
export async function closePool(): Promise<void> {
    await pool.end();
    console.log('Database pool closed');
}

// Handle process termination
process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
});

export default {
    query,
    getClient,
    transaction,
    generateUUID,
    healthCheck,
    getPoolStats,
    closePool,
};
