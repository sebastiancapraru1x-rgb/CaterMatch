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

function readUserFromHeader(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    return { id: payload.id, email: payload.email, full_name: payload.full_name };
  } catch {
    return null;
  }
}

/** Express middleware: requires a valid `Bearer <token>`. */
export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = readUserFromHeader(header);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.user = user;
  next();
}

/**
 * Express middleware: populates req.user IF a valid token is provided,
 * but never blocks anonymous requests. Used on public browse endpoints
 * so `?mine=true` (viewing your own listings) works when logged in.
 */
export function authOptional(req, _res, next) {
  req.user = readUserFromHeader(req.headers.authorization);
  next();
}