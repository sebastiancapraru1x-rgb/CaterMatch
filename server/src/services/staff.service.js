// =====================================================
// Staff service — DB-backed staff/admin allowlist.
// Managed from the Admin Panel (and seeded from
// DEV_MODE_EMAILS env on first boot for bootstrapping).
// =====================================================
import 'dotenv/config';
import { query } from '../config/db.js';

/** Normalizes an email for storage/lookup. */
export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Reads the DEV_MODE_EMAILS bootstrap list from env. */
export function getDevModeEmails() {
  return (process.env.DEV_MODE_EMAILS || '')
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

/** Seeds DEV_MODE_EMAILS into the staff_members table (bootstrap). */
export async function syncStaffFromEnv() {
  for (const email of getDevModeEmails()) {
    await addStaffMember(email, 'env');
  }
}

/** Returns true when the email is a staff/admin member. */
export async function isStaffEmail(email) {
  const rows = await query(
    'SELECT email FROM staff_members WHERE email = $1',
    [normalizeEmail(email)]
  );
  return rows.length > 0;
}

/** Lists all staff members (newest first). */
export async function listStaff() {
  return query(
    `SELECT email, added_by, created_at
     FROM staff_members
     ORDER BY created_at DESC`
  );
}

/** Adds a staff member (idempotent). Returns true if newly added. */
export async function addStaffMember(email, addedBy = null) {
  const exists = await isStaffEmail(email);
  if (exists) return false;
  await query(
    `INSERT INTO staff_members (email, added_by)
     VALUES ($1, $2)`,
    [normalizeEmail(email), addedBy]
  );
  return true;
}

/** Removes a staff member. Returns rows.length if removed. */
export async function removeStaffMember(email) {
  const res = await query(
    'DELETE FROM staff_members WHERE email = $1 RETURNING email',
    [normalizeEmail(email)]
  );
  return res.length > 0;
}

/** Number of staff members currently in the system. */
export async function countStaff() {
  const rows = await query('SELECT COUNT(*) AS n FROM staff_members');
  return Number(rows[0]?.n || 0);
}