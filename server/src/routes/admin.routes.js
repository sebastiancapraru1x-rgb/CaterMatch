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

// Auth-only: the frontend already gates the Dev tab to staff only.
router.use(authRequired);

router.get('/me', me);
router.get('/stats', stats);
router.get('/users', users);
router.get('/staff', staff);
router.get('/transactions', transactions);
router.get('/stripe-status', stripeStatus);

export default router;
