// =====================================================
// Auth controller — register / login / me (M0)
// =====================================================
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { signToken } from '../middleware/auth.js';

/** POST /api/auth/register */
export async function register(req, res, next) {
  try {
    const { email, password, full_name, phone_number } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'email, password and full_name are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const rows = await query(
      `INSERT INTO users (email, password_hash, full_name, phone_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, phone_number, avatar_url, created_at`,
      [normalizedEmail, passwordHash, full_name.trim(), phone_number?.trim() || null]
    );

    const user = rows[0];
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const rows = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [String(email).trim().toLowerCase()]
    );
    const user = rows[0];

    const ok = user && (await bcrypt.compare(String(password), user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };
    return res.json({ token: signToken(user), user: safeUser });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/auth/me (protected) */
export async function me(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, email, full_name, phone_number, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
}