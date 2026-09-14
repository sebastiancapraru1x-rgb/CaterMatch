// =====================================================
// Listings — FULL implementation (M1)
// Dual type: vendor_service | host_gig · radius search
// =====================================================
import { query, withTransaction } from '../config/db.js';
import { parseRadiusFilter } from '../services/geo.service.js';

const ALLOWED_RADII = [10, 25, 50, 100];
const LISTING_FIELDS = `
  l.id, l.user_id, l.listing_type, l.title, l.description, l.category,
  l.city, l.state_province, l.postal_code,
  l.latitude, l.longitude, l.service_radius_km,
  l.event_date, l.expected_guests, l.budget_estimate,
  l.price_tier, l.price_amount, l.photos,
  l.is_boosted, l.boost_expires_at, l.status, l.created_at, l.updated_at,
  u.full_name AS owner_name, u.avatar_url AS owner_avatar`;

/** GET /api/listings?type=&category=&radius=&lat=&lng=&search=&mine=true */
export async function listListings(req, res, next) {
  try {
    const { type, category, search, mine } = req.query;
    const filters = [];
    const params = [];

    if (type === 'vendor_service' || type === 'host_gig') {
      params.push(type);
      filters.push(`l.listing_type = $${params.length}`);
    }

    if (category && category !== 'all') {
      params.push(category);
      filters.push(`l.category = $${params.length}`);
    }

    if (mine === 'true' && req.user) {
      params.push(req.user.id);
      filters.push(`l.user_id = $${params.length}`);
    }

    const geo = parseRadiusFilter(req.query);
    if (geo) {
      params.push(geo.lat, geo.lng, geo.radius);
      const i = params.length;
      // $i = target radius; $(i-2), $(i-1) = target lat, lng
      filters.push(
        `(6371 * 2 * asin(sqrt(
           power(sin(radians(l.latitude - $${i - 2}) / 2), 2) +
           cos(radians($${i - 2})) * cos(radians(l.latitude)) *
           power(sin(radians(l.longitude - $${i - 1}) / 2), 2)
         ))) <= $${i}`
      );
    }

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`);
    }

    filters.push(`l.status = 'active'`);

    const whereSql = `WHERE ${filters.join(' AND ')}`;
    const distanceSelect = geo
      ? `,
       (6371 * 2 * asin(sqrt(
          power(sin(radians(l.latitude - $${params.length - 2}) / 2), 2) +
          cos(radians($${params.length - 2})) * cos(radians(l.latitude)) *
          power(sin(radians(l.longitude - $${params.length - 1}) / 2), 2)
        ))) AS distance_km`
      : '';

    const rows = await query(
      `SELECT ${LISTING_FIELDS} ${distanceSelect}
       FROM listings l
       JOIN users u ON u.id = l.user_id
       ${whereSql}
       ORDER BY (l.is_boosted AND l.boost_expires_at > NOW()) DESC, l.created_at DESC
       LIMIT 100`,
      params
    );

    return res.json({ listings: rows });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/listings/:id */
export async function getListing(req, res, next) {
  try {
    const rows = await query(
      `SELECT ${LISTING_FIELDS}
       FROM listings l
       JOIN users u ON u.id = l.user_id
       WHERE l.id = $1 AND l.status = 'active'`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    return res.json({ listing: rows[0] });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/listings */
export async function createListing(req, res, next) {
  try {
    const {
      listing_type, title, description, category,
      city, state_province, postal_code,
      latitude, longitude, service_radius_km,
      event_date, expected_guests, budget_estimate,
      price_tier, price_amount, photos,
    } = req.body;

    if (!['vendor_service', 'host_gig'].includes(listing_type)) {
      return res.status(400).json({ error: 'listing_type must be vendor_service or host_gig' });
    }
    if (!title || !description || !category || !city || !state_province) {
      return res.status(400).json({ error: 'title, description, category, city, state_province are required' });
    }
    const latN = Number(latitude);
    const lngN = Number(longitude);
    if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    const radius = Number.isFinite(Number(service_radius_km)) && Number(service_radius_km) > 0
      ? Number(service_radius_km)
      : 50;

    const allowedTiers = ['$', '$$', '$$$', '$$$$'];
    const tier = allowedTiers.includes(price_tier) ? price_tier : null;

    // Dollar price (vendor "starting at" amount) — primary price field.
    const priceNum = Number(price_amount);
    const amount = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : null;

    const rows = await query(
      `INSERT INTO listings
         (user_id, listing_type, title, description, category,
          city, state_province, postal_code, latitude, longitude, service_radius_km,
          event_date, expected_guests, budget_estimate, price_tier, price_amount, photos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        req.user.id, listing_type, title.trim(), description.trim(), category,
        city.trim(), state_province.trim(), postal_code || null,
        latN, lngN, radius,
        event_date || null, expected_guests || null, budget_estimate || null,
        tier, amount, Array.isArray(photos) ? photos : [],
      ]
    );

    const [listing] = await query(
      `SELECT ${LISTING_FIELDS} FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = $1`,
      [rows[0].id]
    );
    return res.status(201).json({ listing });
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/listings/:id — owner only, partial update */
export async function updateListing(req, res, next) {
  try {
    const allowed = new Set([
      'title', 'description', 'category', 'city', 'state_province', 'postal_code',
      'latitude', 'longitude', 'service_radius_km',
      'event_date', 'expected_guests', 'budget_estimate', 'price_tier', 'price_amount', 'photos',
    ]);

    const sets = [];
    const params = [req.params.id, req.user.id];
    for (const [key, value] of Object.entries(req.body)) {
      if (!allowed.has(key)) continue;
      params.push(value);
      sets.push(`${key} = $${params.length}`);
    }
    if (!sets.length) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }

    sets.push(`updated_at = NOW()`);
    const rows = await query(
      `UPDATE listings SET ${sets.join(', ')}
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING id`,
      params
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Listing not found or not owned by you' });
    }

    const [listing] = await query(
      `SELECT ${LISTING_FIELDS} FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = $1`,
      [rows[0].id]
    );
    return res.json({ listing });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/listings/:id — soft delete, owner only */
export async function removeListing(req, res, next) {
  try {
    const rows = await query(
      `UPDATE listings SET status = 'inactive', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Listing not found or not owned by you' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export { withTransaction, ALLOWED_RADII };