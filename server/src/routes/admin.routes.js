import { Router } from 'express';
import {
  me,
  stats,
  users,
  staff,
  addStaff,
  removeStaff,
  transactions,
  stripeStatus,
} from '../controllers/admin.controller.js';
import { authRequired } from '../middleware/auth.js';
import { staffRequired } from '../middleware/staff.js';

const router = Router();

// Public (auth-only): check current user's staff status (used by frontend on login).
// No staffRequired here — this IS the staff check.
router.get('/me', authRequired, me);

// Everything else requires staff membership.
router.use(staffRequired);

router.get('/stats', stats);
router.get('/users', users);
router.get('/staff', staff);
router.get('/transactions', transactions);
router.get('/stripe-status', stripeStatus);

export default router;
