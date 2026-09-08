import { Router } from 'express';
import { listTiers, createCheckoutSession } from '../controllers/boosts.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Public tier list
router.get('/', listTiers);

// Protected: create Stripe Checkout (or dev-mode simulate)
router.post('/checkout', authRequired, createCheckoutSession);

// NOTE: The Stripe webhook (POST /api/boosts/stripe/webhook) is mounted
// directly in src/index.js BEFORE express.json() because it needs the
// RAW body for signature verification — see index.js.

export default router;