// =====================================================
// Boosts controller — tiers, checkout, webhook (M4)
// Stripe Checkout + signature-verified webhook. Includes a
// dev-mode "simulate payment" that works with no Stripe keys
// (see createCheckoutSession). Production uses real Stripe.
// =====================================================
import { BOOST_TIERS, stripe } from '../config/stripe.js';
import { withTransaction, query } from '../config/db.js';
import { activateBoost, recordBoostTransaction } from '../services/boost.service.js';

const ALLOWED_DURATIONS = [3, 7, 14];

/** GET /api/boosts — public tier list for UI display. */
export function listTiers(_req, res) {
  return res.json({ tiers: BOOST_TIERS });
}

/** Verifies the caller owns the listing (or returns an error response). */
async function ensureListingOwner(res, listingId, userId) {
  const rows = await query(
    `SELECT id FROM listings WHERE id = $1 AND user_id = $2 AND status = 'active'`,
    [listingId, userId]
  );
  if (!rows.length) {
    res.status(404).json({ error: 'Listing not found, or you do not own it.' });
    return false;
  }
  return true;
}

/** POST /api/boosts/checkout  body: { listing_id, days } */
export async function createCheckoutSession(req, res, next) {
  try {
    const { listing_id, days } = req.body;
    const duration = Number(days);
    const tier = BOOST_TIERS.find((t) => t.days === duration);

    if (!tier) {
      return res.status(400).json({ error: `days must be one of: ${ALLOWED_DURATIONS.join(', ')}` });
    }
    if (!listing_id) {
      return res.status(400).json({ error: 'listing_id is required' });
    }
    const isOwner = await ensureListingOwner(res, listing_id, req.user.id);
    if (!isOwner) return;

    // ---- DEV MODE: simulate payment (requires no Stripe keys) ----
    if (!stripe) {
      const amountPaid = tier.amount;
      await withTransaction(async (client) => {
        await activateBoost(client, { listingId: listing_id, days: duration });
        await recordBoostTransaction(client, {
          listingId: listing_id,
          userId: req.user.id,
          stripePaymentId: `dev_sim_${Date.now()}`,
          amountPaid,
          days: duration,
        });
      });
      return res.json({
        dev_activated: true,
        message: `DEV MODE: simulated a $${amountPaid} payment. Listing is now boosted for ${duration} days.`,
      });
    }

    // ---- REAL STRIPE CHECKOUT (production-ready) ----
    const amountCents = Math.round(tier.amount * 100);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${tier.label} — CaterMatch Listing Boost`,
              description: `Pin your listing to the top of CaterMatch search results for ${duration} days.`,
            },
          },
        },
      ],
      metadata: {
        listing_id,
        user_id: req.user.id,
        days: String(duration),
      },
      success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/boost?listing_id=${listing_id}&success=1`,
      cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/boost?listing_id=${listing_id}&canceled=1`,
    });

    return res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/boosts/stripe/webhook
 * Stripe sends signed events here. Requires express.raw() body
 * (mounted in index.js BEFORE express.json) so we can verify.
 */
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    // No real Stripe configured — dev mode active, ignore webhooks gracefully.
    return res.status(200).json({ received: true, note: 'webhook ignored (dev mode)' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { listing_id, user_id, days } = session.metadata || {};

    if (listing_id && user_id && days) {
      try {
        await withTransaction(async (client) => {
          await activateBoost(client, { listingId: listing_id, days: Number(days) });
          await recordBoostTransaction(client, {
            listingId: listing_id,
            userId: user_id,
            stripePaymentId: session.payment_intent || session.id,
            amountPaid: (session.amount_total ?? 0) / 100,
            days: Number(days),
          });
        });
        console.log(`⭐ Boost activated via Stripe for listing ${listing_id} (${days}d)`);
      } catch (err) {
        console.error('⚠️ Boost activation failed:', err.message);
        return res.status(500).json({ error: 'Failed to activate boost' });
      }
    }
  }

  return res.json({ received: true });
}