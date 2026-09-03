import { Router } from 'express';
import { listTiers, createCheckoutSession } from '../controllers/boosts.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', listTiers);
router.post('/checkout', authRequired, createCheckoutSession);

// Stripe webhook — implemented in M4 (Stripe dashboard points here).
router.post('/stripe/webhook', (_req, res) =>
  res.status(501).json({ error: 'Boost activation webhook lands in the M4 milestone.' })
);

export default router;