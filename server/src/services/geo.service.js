// =====================================================
// Geo helpers — radius search support (M1)
// Pure JS Haversine, mirrors the SQL haversine_km() function.
// =====================================================

/**
 * Haversine distance between two coordinates in kilometres.
 * Mirrors the SQL `haversine_km()` function in db/schema.sql.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius, km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Parses ?lat=&lng=&radius= from a query.
 * Returns { lat, lng, radius } when all three are valid, else null.
 */
export function parseRadiusFilter(query) {
  const latN = Number(query?.lat);
  const lngN = Number(query?.lng);
  const radiusN = Number(query?.radius);

  const ok =
    Number.isFinite(latN) &&
    Number.isFinite(lngN) &&
    Number.isFinite(radiusN) &&
    radiusN > 0;

  return ok ? { lat: latN, lng: lngN, radius: radiusN } : null;
}