// =====================================================
// Database adapter — works everywhere, free forever:
//
//   * EMBEDDED (default local) — PGlite: real PostgreSQL
//     compiled to WebAssembly. No install, no Docker, no
//     admin. Persists to server/.pglite (a folder).
//   * POSTGRES (production/remote) — a real Postgres via
//     DATABASE_URL (Supabase free tier, Neon, self-hosted).
//
// Everything above uses query()/withTransaction(), so the
// whole API works identically on either engine.
// =====================================================
import 'dotenv/config';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSqlStatements } from '../lib/sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_SQL = readFileSync(resolve(__dirname, '../../db/schema.sql'), 'utf8');

let driver = null; // 'embedded' | 'postgres'
let pgPool = null;
let pglite = null;
let initPromise = null;

/** Ensures the database is connected/initialized once. */
export function ensureDb() {
  if (!initPromise) initPromise = doInit().catch((err) => {
    initPromise = null; // allow future retries
    throw err;
  });
  return initPromise;
}

async function doInit() {
  const requested = (process.env.DB_DRIVER || 'auto').toLowerCase();

  // 1) Try a real PostgreSQL connection first (unless forced embedded).
  if (requested !== 'embedded') {
    const connString = process.env.DATABASE_URL;
    if (connString) {
      try {
        pgPool = new pg.Pool({
          connectionString: connString,
          connectionTimeoutMillis: 2500,
        });
        await pgPool.query('SELECT 1');
        driver = 'postgres';
        console.log('🗄️  Database driver: PostgreSQL (DATABASE_URL)');
        return;
      } catch (err) {
        console.warn(`⚠️  Could not reach PostgreSQL (${err.message}).`);
        pgPool = null;
        if (requested === 'postgres') throw err;
      }
    } else if (requested === 'postgres') {
      throw new Error('DB_DRIVER=postgres but DATABASE_URL is not set');
    }
  }

  // 2) Embedded PGlite fallback — zero-install, persists to a folder.
  pglite = new PGlite(resolve(__dirname, '../../.pglite'));
  await pglite.waitReady;

  // Auto-bootstrap the schema on first run.
  const chk = await pglite.query(`SELECT to_regclass('listings') AS t`);
  if (!chk.rows[0]?.t) {
    for (const stmt of splitSqlStatements(SCHEMA_SQL)) {
      await pglite.query(stmt);
    }
    console.log('🗄️  Embedded database initialised with schema.sql');
  }

  driver = 'embedded';
  console.log('🗄️  Database driver: embedded PostgreSQL (PGlite, zero-install)');
}

/** Normalizes a PGlite result to look like node-postgres. */
function asPgResult(r) {
  return {
    rows: r.rows ?? [],
    rowCount: r.affectedRows ?? r.rows?.length ?? 0,
  };
}

/** Runs a query. Params use $1, $2… placeholders. */
export async function query(text, params) {
  await ensureDb();
  if (driver === 'embedded') {
    return asPgResult(await pglite.query(text, params)).rows;
  }
  const res = await pgPool.query(text, params);
  return res.rows;
}

/** Runs work inside one transaction. `fn(client)` gets client.query(). */
export async function withTransaction(fn) {
  await ensureDb();
  if (driver === 'embedded') {
    return pglite.transaction(async (tx) => {
      const client = {
        query: async (text, params) => asPgResult(await tx.query(text, params)),
      };
      return fn(client);
    });
  }
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Returns true when the database is reachable. */
export async function checkDb() {
  try {
    await ensureDb();
    return true;
  } catch {
    return false;
  }
}

/** Returns the active driver name: 'embedded' | 'postgres'. */
export async function getDriver() {
  await ensureDb();
  return driver;
}

/** Gracefully closes the active database. */
export async function shutdownDb() {
  if (pgPool) {
    await pgPool.end().catch(() => {});
    pgPool = null;
  }
  if (pglite) {
    await pglite.close().catch(() => {});
    pglite = null;
  }
  initPromise = null;
  driver = null;
}