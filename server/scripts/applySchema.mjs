import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { ensureDb, query, shutdownDb, getDriver } from '../src/config/db.js';
import { splitSqlStatements } from '../src/lib/sql.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(resolve(root, 'db/schema.sql'), 'utf8');

await ensureDb();
const driver = await getDriver();
const statements = splitSqlStatements(sql);

console.log(`Applying ${statements.length} statements from db/schema.sql (driver: ${driver})…`);
for (const stmt of statements) {
  try {
    await query(stmt);
    console.log('  ✓', stmt.replace(/\s+/g, ' ').slice(0, 90));
  } catch (err) {
    // idempotent: ignore "already exists" so reruns are safe
    if (/already exists/i.test(String(err.message))) {
      console.log('  ≈ (already exists, skipped)');
    } else {
      console.error('  ✗', err.message);
      await shutdownDb();
      process.exit(1);
    }
  }
}
await shutdownDb();
console.log('✅ Schema applied. Ready to rock 🚚🎪');