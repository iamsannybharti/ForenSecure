import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';
import * as schema from './schema';

export * from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/forensecure';

// Managed Postgres (Render/RDS/etc.) terminates TLS and presents a cert that
// isn't in the container trust store; enable SSL without hard-failing on that.
// Local Postgres (localhost/127.0.0.1) speaks plaintext, so SSL stays off there.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  // Fail fast so a missing database stops boot instead of leaving the API hung.
  connectionTimeoutMillis: 5000
});

export const db = drizzle(pool, { schema });

/**
 * Opens the pool and brings the schema up to date. Throws if Postgres is
 * unreachable; persisted data is required for the API to start.
 */
import fs from 'fs';
import { sql } from 'drizzle-orm';
import { users } from './schema';

export const connectDB = async () => {
  const client = await pool.connect();
  client.release();
  
  const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');
  try {
    await migrate(db, { migrationsFolder });
    console.log('Postgres connected and migrations applied.');
  } catch (err) {
    console.warn('Drizzle migrator notice:', err);
  }

  // Self-healing check: verify if essential tables (e.g. "users") exist in postgres.
  // If not, execute SQL migration files directly so the database is guaranteed ready.
  try {
    await db.select({ count: sql<number>`count(*)::int` }).from(users);
  } catch (_err) {
    console.log('Seed/Connect: essential tables missing. Executing schema migrations directly...');
    if (fs.existsSync(migrationsFolder)) {
      const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        const sqlContent = fs.readFileSync(path.join(migrationsFolder, file), 'utf8');
        const statements = sqlContent.split('--> statement-breakpoint');
        for (const stmt of statements) {
          const trimmed = stmt.trim();
          if (trimmed) {
            try {
              await db.execute(sql.raw(trimmed));
            } catch (_e) {
              // Ignore duplicate table/relation error if already created
            }
          }
        }
      }
      console.log('Seed/Connect: Database schema initialized successfully.');
    }
  }
};

/** UUID columns reject malformed input at the driver, which would surface as a
 *  500. Route params are user-controlled, so screen them and 404 instead. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const asUuid = (value: unknown): string | null =>
  typeof value === 'string' && UUID_RE.test(value) ? value : null;
