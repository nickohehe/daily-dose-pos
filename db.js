import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

// Create a new pool using environment variables
// expects PGUSER, PGHOST, PGDATABASE, PGPASSWORD, PGPORT in .env
const pool = new Pool();

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect(); // For transactions

// Helper to check connection
export const checkConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Database connected successfully:', res.rows[0]);
        return true;
    } catch (err) {
        console.error('Database connection failed:', err);
        return false;
    }
};
