import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { getPgConfig } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new pg.Pool(getPgConfig());

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function checkConnection() {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}

export { pool };
