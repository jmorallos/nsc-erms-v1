/**
 * Creates the application database if it does not exist.
 * Uses DB_* from .env (connects to the postgres maintenance DB first).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = Number(process.env.DB_PORT || 5432);
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD ?? '';
const dbName = process.env.DB_NAME;

if (!user || !dbName) {
  console.error('DB_USER and DB_NAME are required in .env');
  process.exit(1);
}

const admin = new pg.Client({
  host,
  port,
  user,
  password,
  database: 'postgres',
});

await admin.connect();

try {
  const { rows } = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName],
  );
  if (rows.length) {
    console.log(`Database "${dbName}" already exists.`);
  } else {
    // Database names cannot be parameterized; validate identifier.
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
      throw new Error(`Unsafe database name: ${dbName}`);
    }
    await admin.query(`CREATE DATABASE ${dbName} OWNER ${user}`);
    console.log(`Created database "${dbName}".`);
  }
} finally {
  await admin.end();
}
