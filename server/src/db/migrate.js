import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { getPgConfig } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env') });

const migrationsDir = path.resolve(root, 'db/migrations');

async function migrate() {
  const client = new pg.Client(getPgConfig());
  await client.connect();

  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS citext');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE id = $1',
        [file],
      );
      if (rows.length) {
        console.log(`skip  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      // Strip the duplicate schema_migrations create from migration files
      const body = sql.replace(
        /CREATE TABLE IF NOT EXISTS schema_migrations[\s\S]*?;\s*/i,
        '',
      );

      console.log(`apply ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(body);
        await client.query(
          'INSERT INTO schema_migrations (id) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('Migrations complete.');
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
