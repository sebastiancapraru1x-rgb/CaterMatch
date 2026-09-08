import { Router } from 'express';
import {
  listTiers,
  createCheckoutSession,
  stripeStatus,
} from '../controllers/boosts.controller.js';
import { authRequired, authOptional } from '../middleware/auth.js';

const router = Router();

// Public tier list
router.get('/', listTiers);

// Stripe health: full detail for staff (DEV_MODE_EMAILS), minimal for others.
router.get('/stripe-status', authOptional, stripeStatus);

// Protected: create Stripe Checkout (or staff/dev-mode simulate)
router.post('/checkout', authRequired, createCheckoutSession);

// NOTE: The Stripe webhook (POST /api/boosts/stripe/webhook) is mounted
// directly in src/index.js BEFORE express.json() because it needs the
// RAW body for signature verification — see index.js.

export default router;