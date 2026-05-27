const EARTH_RADIUS_METERS = 6371008.8;
const COMPASS_POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

export function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

export function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

export function distanceMeters(from, to) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export function bearingBetween(from, to) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) {
    return "--";
  }

  if (meters < 950) {
    return `${Math.round(meters)} m`;
  }

  if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters / 1000)} km`;
}

export function compassPoint(degrees) {
  const index = Math.round(normalizeDegrees(degrees) / 22.5) % COMPASS_POINTS.length;
  return COMPASS_POINTS[index];
}

export function headingFromOrientation(event) {
  if (typeof event.webkitCompassHeading === "number") {
    return normalizeDegrees(event.webkitCompassHeading);
  }

  if (typeof event.alpha === "number") {
    return normalizeDegrees(360 - event.alpha);
  }

  return null;
}

export function nearestStores(position, stores, limit = 5) {
  return stores
    .map((store) => ({
      ...store,
      distance: distanceMeters(position, { lat: store.lat, lng: store.lng }),
      bearing: bearingBetween(position, { lat: store.lat, lng: store.lng })
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}
