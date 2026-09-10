// =====================================================
// Admin panel — staff-only endpoints
// Stats, users, staff management, boost transactions.
// =====================================================
import { query } from '../config/db.js';
import { stripe } from '../config/stripe.js';
import {
  listStaff,
  addStaffMember,
  removeStaffMember,
  countStaff,
  isStaffEmail,
} from '../services/staff.service.js';

/** GET /api/admin/me — who am I (staff status + profile). */
export async function me(req, res, next) {
  try {
    const rows = await query(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const staff = await isStaffEmail(req.user.email);
    return res.json({
      is_staff: staff,
      user: rows[0] || { id: req.user.id, email: req.user.email, full_name: req.user.full_name },
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/stats — headline numbers. */
export async function stats(_req, res, next) {
  try {
    const [users, listings, boostedListings, transactions, revenue] = await Promise.all([
      query('SELECT COUNT(*) AS n FROM users'),
      query(`SELECT COUNT(*) AS n FROM listings WHERE status = 'active'`),
      query('SELECT COUNT(*) AS n FROM listings WHERE is_boosted = TRUE'),
      query('SELECT COUNT(*) AS n FROM boost_transactions'),
      query('SELECT COALESCE(SUM(amount_paid), 0) AS total FROM boost_transactions'),
    ]);
    return res.json({
      users: Number(users[0]?.n || 0),
      active_listings: Number(listings[0]?.n || 0),
      boosted_listings: Number(boostedListings[0]?.n || 0),
      boost_transactions: Number(transactions[0]?.n || 0),
      boost_revenue: Number(revenue[0]?.total || 0),
      staff_members: await countStaff(),
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/users — every registered account. */
export async function users(_req, res, next) {
  try {
    const rows = await query(
      `SELECT id, email, full_name, phone_number, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    return res.json({ users: rows });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/staff — the allowlist. */
export async function staff(_req, res, next) {
  try {
    return res.json({ staff: await listStaff() });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/admin/staff  body: { email } — add someone. */
export async function addStaff(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    const added = await addStaffMember(email, req.user.email);
    if (!added) {
      return res.status(200).json({ ok: true, note: 'already a staff member' });
    }
    return res.status(201).json({ ok: true, note: 'added' });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/admin/staff/:email — remove someone. */
export async function removeStaff(req, res, next) {
  try {
    const target = decodeURIComponent(req.params.email);
    if (target.toLowerCase() === String(req.user.email).toLowerCase()) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }
    const count = await countStaff();
    if (count <= 1) {
      return res.status(400).json({ error: 'At least one staff member must remain' });
    }
    const removed = await removeStaffMember(target);
    if (!removed) {
      return res.status(404).json({ error: 'Not a staff member' });
    }
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/transactions — boost revenue ledger. */
export async function transactions(_req, res, next) {
  try {
    const rows = await query(
      `SELECT bt.id, bt.stripe_payment_id, bt.amount_paid, bt.boost_duration_days,
              bt.created_at,
              u.email AS user_email,
              l.title AS listing_title
       FROM boost_transactions bt
       LEFT JOIN users u ON u.id = bt.user_id
       LEFT JOIN listings l ON l.id = bt.listing_id
       ORDER BY bt.created_at DESC
       LIMIT 100`
    );
    return res.json({ transactions: rows });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/admin/stripe-status — full health, staff-only. */
export async function stripeStatus(_req, res, next) {
  try {
    if (!stripe) {
      return res.json({
        enabled: false,
        mode: 'dev-simulated',
        message: 'No STRIPE_SECRET_KEY set — boosts are simulated.',
      });
    }
    const acct = await stripe.balance.retrieve();
    return res.json({
      enabled: true,
      mode: acct.livemode ? 'live' : 'test',
      message: acct.livemode ? 'Stripe LIVE mode' : 'Stripe TEST mode — no real charges.',
    });
  } catch (err) {
    return next(err);
  }
}