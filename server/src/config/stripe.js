// =====================================================
// Stripe client — real payments when keys are set;
// falls back to dev-mode "simulate" otherwise. (M4)
// =====================================================
import 'dotenv/config';
import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

/** Null until STRIPE_SECRET_KEY is set (dev-safe; checkout simulates). */
export const stripe = secretKey ? new Stripe(secretKey) : null;

/** The three boost tiers customers can choose from. */
export const BOOST_TIERS = [
  { days: 3, label: '3-Day Boost', amount: 4.99 },
  { days: 7, label: '7-Day Boost', amount: 9.99 },
  { days: 14, label: '14-Day Boost', amount: 17.99 },
];