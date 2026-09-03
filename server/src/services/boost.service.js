// =====================================================
// Boost service — M4 hearts live here (M0 placeholder)
// Activation + expiry logic used by Stripe webhook later.
// =====================================================
import { withTransaction } from '../config/db.js';

/**
 * Marks a listing boosted for `days` days (hours from now).
 * `client` is a pg client (inside a transaction) or the pool.
 */
export async function activateBoost(client, { listingId, days }) {
  const result = await client.query(
    `UPDATE listings
     SET is_boosted = TRUE,
         boost_expires_at = COALESCE(boost_expires_at, NOW()) + make_interval(days => $1),
         updated_at = NOW()
     WHERE id = $2 AND status = 'active'
     RETURNING id`,
    [days, listingId]
  );
  return result.rows[0]?.id ?? null;
}

/**
 * Deactivates every boost whose window has passed.
 * Returns the number of listings downgraded.
 */
export async function expireBoosts() {
  const result = await withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE listings
       SET is_boosted = FALSE, updated_at = NOW()
       WHERE is_boosted = TRUE AND boost_expires_at <= NOW()
       RETURNING id`
    );
    return res.rowCount;
  });
  return result;
}

/** Records a completed Stripe boost purchase. */
export async function recordBoostTransaction(client, { listingId, userId, stripePaymentId, amountPaid, days }) {
  const result = await client.query(
    `INSERT INTO boost_transactions
       (listing_id, user_id, stripe_payment_id, amount_paid, boost_duration_days)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [listingId, userId, stripePaymentId, amountPaid, days]
  );
  return result.rows[0].id;
}