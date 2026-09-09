// =====================================================
// Staff/admin auth middleware
// =====================================================
import { isStaffEmail } from '../services/staff.service.js';

/**
 * Requires staff membership (staff_members table).
 * Compose after authRequired so req.user is populated:
 *   router.get('/x', authRequired, staffRequired, handler)
 */
export async function staffRequired(req, res, next) {
  try {
    const ok = req.user && (await isStaffEmail(req.user.email));
    if (!ok) {
      return res.status(403).json({ error: 'Staff access required' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}