import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import * as schema from './schema';

export * from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/forensecure';

export const pool = new Pool({
  connectionString,
  // Fail fast so a missing database stops boot instead of leaving the API hung.
  connectionTimeoutMillis: 5000
});

export const db = drizzle(pool, { schema });

/**
 * Opens the pool and brings the schema up to date. Throws if Postgres is
 * unreachable; persisted data is required for the API to start.
 */
export const connectDB = async () => {
  const client = await pool.connect();
  client.release();
  await migrate(db, { migrationsFolder: path.join(__dirname, '..', '..', 'drizzle') });
  console.log('Postgres connected and migrations applied.');
};

/** UUID columns reject malformed input at the driver, which would surface as a
 *  500. Route params are user-controlled, so screen them and 404 instead. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const asUuid = (value: unknown): string | null =>
  typeof value === 'string' && UUID_RE.test(value) ? value : null;
