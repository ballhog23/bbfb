import { Pool } from 'pg';
import { config } from '../config.js';

const pool = new Pool({
    connectionString: config.db.url,
    max: config.db.max,
    idleTimeoutMillis: config.db.idleTimeoutMillis,
    connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    maxLifetimeSeconds: config.db.maxLifetimeSeconds
});

export const query = async (text: string, params: string[] = []) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start
    console.log('executed query', { text, duration: `${duration}ms`, rows: result.rowCount })
    return result
}