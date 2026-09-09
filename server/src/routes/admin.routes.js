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

// All admin routes require auth + staff membership.
router.use(authRequired, staffRequired);

router.get('/me', me);
router.get('/stats', stats);
router.get('/users', users);
router.get('/staff', staff);
router.post('/staff', addStaff);
router.delete('/staff/:email', removeStaff);
router.get('/transactions', transactions);
router.get('/stripe-status', stripeStatus);

export default router;
