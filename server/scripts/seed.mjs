// =====================================================
// Seed demo data (dev only) — two users + two listings.
// Uses the active DB driver (embedded PGlite or Postgres).
//   npm run db:seed
// =====================================================
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query, ensureDb, shutdownDb } from '../src/config/db.js';

const password = await bcrypt.hash('password123', 10);

const users = [
  { email: 'vendor@demo.com', full_name: 'Taco Titan', phone: '555-0101' },
  { email: 'host@demo.com', full_name: 'Sarah Event Planner', phone: '555-0102' },
  { email: 'sebastiancapraru1x@gmail.com', full_name: 'Sebastian Capraru', phone: null },
];

await ensureDb();
const userIds = {};

for (const u of users) {
  const existing = await query('SELECT id FROM users WHERE email = $1', [u.email]);
  if (existing.length) {
    userIds[u.email] = existing[0].id;
    console.log('≈ user exists:', u.email);
    continue;
  }
  const ins = await query(
    `INSERT INTO users (email, password_hash, full_name, phone_number)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [u.email, password, u.full_name, u.phone]
  );
  userIds[u.email] = ins[0].id;
  console.log('✓ user seeded:', u.email);
}

const vendorId = userIds['vendor@demo.com'];
const hostId = userIds['host@demo.com'];

const listings = [
  {
    user_id: vendorId,
    listing_type: 'vendor_service',
    title: 'Taco Titan — street tacos & burritos',
    description: 'Authentic Mexican street food truck. Classic al pastor, birria, and vegetarian options. Fully licensed and insured.',
    category: 'Tacos',
    city: 'Toronto', state_province: 'Ontario', postal_code: 'M5V2T6',
    latitude: 43.6532, longitude: -79.3832, service_radius_km: 50,
    price_tier: '$$', photos: [],
    event_date: null, expected_guests: null, budget_estimate: null,
  },
  {
    user_id: hostId,
    listing_type: 'host_gig',
    title: 'Backyard BBQ birthday party',
    description: 'Hosting ~60 guests for a summer backyard BBQ. Looking for a local BBQ truck for a 4-hour event. Food preferences: BBQ, burgers, sides.',
    category: 'BBQ',
    city: 'Etobicoke', state_province: 'Ontario', postal_code: 'M9C1A1',
    latitude: 43.6525, longitude: -79.5599, service_radius_km: 25,
    price_tier: null, photos: [],
    event_date: '2026-09-15', expected_guests: 60, budget_estimate: 900.0,
  },
];

for (const l of listings) {
  const existing = await query('SELECT id FROM listings WHERE title = $1', [l.title]);
  if (existing.length) {
    console.log('≈ listing exists:', l.title);
    continue;
  }
  await query(
    `INSERT INTO listings
       (user_id, listing_type, title, description, category, city, state_province, postal_code,
        latitude, longitude, service_radius_km, price_tier, event_date, expected_guests, budget_estimate, photos)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [l.user_id, l.listing_type, l.title, l.description, l.category, l.city,
      l.state_province, l.postal_code, l.latitude, l.longitude, l.service_radius_km,
      l.price_tier, l.event_date, l.expected_guests, l.budget_estimate, l.photos]
  );
  console.log('✓ listing seeded:', l.title);
}

await shutdownDb();
console.log('\n✅ Seed complete.');
console.log('👤  Demo logins: vendor@demo.com / password123  ·  host@demo.com / password123');