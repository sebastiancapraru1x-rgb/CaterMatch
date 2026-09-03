// =====================================================
// Stripe client (lazy) — boosts go live in M4
// =====================================================
import 'dotenv/config';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

/** Null until STRIPE_SECRET_KEY is set (dev safe). */
export const stripe = secretKey ? new Stripe(secretKey) : null;

/** Maps boost duration (days) to a Stripe Price ID. */
export const BOOST_PRICES = {
  3: process.env.STRIPE_PRICE_3DAY,
  7: process.env.STRIPE_PRICE_7DAY,
  14: process.env.STRIPE_PRICE_14DAY,
};

/** The three boost tiers customers can choose from. */
export const BOOST_TIERS = [
  { days: 3, label: '3-Day Boost', amount: 4.99 },
  { days: 7, label: '7-Day Boost', amount: 9.99 },
  { days: 14, label: '14-Day Boost', amount: 17.99 },
];