// =====================================================
// JWT auth helpers + middleware
// =====================================================
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

/** Creates a signed JWT for a user. */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

/** Express middleware: requires a valid `Bearer <token>`. */
export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, full_name: payload.full_name };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}