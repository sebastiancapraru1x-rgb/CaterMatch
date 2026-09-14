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
import bcrypt from 'bcryptjs';

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

// Lightweight migrations run on every start (idempotent).
const MIGRATIONS = [
  // Staff/admin allowlist — DB-backed so the admin panel can manage it.
  `CREATE TABLE IF NOT EXISTS staff_members (
     email VARCHAR(255) PRIMARY KEY,
     added_by VARCHAR(255),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   )`,
  // Vendor dollar price (replaces the $-$$$$ tier as the primary price).
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_amount NUMERIC(10, 2)`,
];

async function runMigrations(database) {
  for (const stmt of MIGRATIONS) {
    try {
      await database.query(stmt);
    } catch (err) {
      console.warn('⚠️ migration skipped:', err.message);
    }
  }
}

// Auto-seed demo data on first run (only if users table is empty).
const DEMO_USERS = [
  { email: 'vendor@demo.com', full_name: 'Taco Titan', phone: '555-0101' },
  { email: 'host@demo.com', full_name: 'Sarah Event Planner', phone: '555-0102' },
  { email: 'sebastiancapraru1x@gmail.com', full_name: 'Sebastian Capraru', phone: null },
];

const DEMO_LISTINGS = [
  {
    user_email: 'vendor@demo.com',
    listing_type: 'vendor_service',
    title: 'Taco Titan — street tacos & burritos',
    description: 'Authentic Mexican street food truck. Classic al pastor, birria, and vegetarian options. Fully licensed and insured.',
    category: 'Tacos',
    city: 'Toronto', state_province: 'Ontario', postal_code: 'M5V2T6',
    latitude: 43.6532, longitude: -79.3832, service_radius_km: 50,
    price_tier: '$$', photos: [],
    event_date: null, expected_guests: null, budget_estimate: null,
  },
  {
    user_email: 'host@demo.com',
    listing_type: 'host_gig',
    title: 'Backyard BBQ birthday party',
    description: 'Hosting ~60 guests for a summer backyard BBQ. Looking for a local BBQ truck for a 4-hour event. Food preferences: BBQ, burgers, sides.',
    category: 'BBQ',
    city: 'Etobicoke', state_province: 'Ontario', postal_code: 'M9C1A1',
    latitude: 43.6525, longitude: -79.5599, service_radius_km: 25,
    price_tier: null, photos: [],
    event_date: '2026-09-15', expected_guests: 60, budget_estimate: 900.0,
  },
];

async function autoSeed(database) {
  // 🚫 Fake/demo data NEVER seeds in production — the public marketplace
  // starts empty so real users see only real listings.
  // Control: NODE_ENV=production  → off (default for prod)
  //          SEED_DEMO_DATA=false → force off anywhere
  //          SEED_DEMO_DATA=true  → force on (local demo/testing only)
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const seedDemo = (process.env.SEED_DEMO_DATA || (isProd ? 'false' : 'true')).toLowerCase() === 'true';
  if (!seedDemo) {
    console.log('🌱 Demo seed skipped — marketplace starts empty (production or SEED_DEMO_DATA=false).');
    return;
  }
  try {
    const chk = await database.query('SELECT COUNT(*)::int AS n FROM users');
    if (chk.rows[0]?.n > 0) return; // already has data

    console.log('🌱 First run — seeding demo data...');
    const password = await bcrypt.hash('password123', 10);

    const userIds = {};
    for (const u of DEMO_USERS) {
      const ins = await database.query(
        `INSERT INTO users (email, password_hash, full_name, phone_number)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [u.email, password, u.full_name, u.phone]
      );
      userIds[u.email] = ins.rows?.[0]?.id ?? ins[0]?.id;
      console.log('  ✓ user seeded:', u.email);
    }

    for (const l of DEMO_LISTINGS) {
      await database.query(
        `INSERT INTO listings
           (user_id, listing_type, title, description, category, city, state_province, postal_code,
            latitude, longitude, service_radius_km, price_tier, event_date, expected_guests, budget_estimate, photos)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [userIds[l.user_email], l.listing_type, l.title, l.description, l.category, l.city,
          l.state_province, l.postal_code, l.latitude, l.longitude, l.service_radius_km,
          l.price_tier, l.event_date, l.expected_guests, l.budget_estimate, l.photos]
      );
      console.log('  ✓ listing seeded:', l.title);
    }
    console.log('✅ Seed complete.');
  } catch (err) {
    console.warn('⚠️ auto-seed skipped:', err.message);
  }
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
        await runMigrations(pgPool);
        await autoSeed(pgPool);
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
  await runMigrations(pglite);
  await autoSeed(pglite);

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