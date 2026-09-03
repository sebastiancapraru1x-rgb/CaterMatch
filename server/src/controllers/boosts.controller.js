// =====================================================
// Boosts controller — tiers public, checkout in M4
// =====================================================
import { BOOST_TIERS, stripe, BOOST_PRICES } from '../config/stripe.js';

/** GET /api/boosts — public tier list for UI display. */
export async function listTiers(_req, res) {
  return res.json({ tiers: BOOST_TIERS });
}

/** POST /api/boosts/checkout — create a Stripe Checkout session. */
export async function createCheckoutSession(req, res, next) {
  try {
    const { listing_id, days } = req.body;
    const tier = BOOST_TIERS.find((t) => t.days === Number(days));
    if (!tier) {
      return res.status(400).json({ error: 'days must be one of: 3, 7, 14' });
    }
    if (!stripe) {
      return res.status(501).json({
        error: 'Stripe is not configured yet (M4 milestone). For now the server has no STRIPE_SECRET_KEY set.',
      });
    }

    const priceId = BOOST_PRICES[tier.days];
    if (!priceId) {
      return res.status(500).json({ error: `No Stripe Price ID configured for the ${days}-day boost` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { listing_id, user_id: req.user.id, days: String(days) },
      success_url: `${process.env.CLIENT_ORIGIN}/boost/success`,
      cancel_url: `${process.env.CLIENT_ORIGIN}/boost/cancel`,
    });

    return res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    return next(err);
  }
}