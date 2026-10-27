/**
 * Thin client for the Mapbox web APIs used by the location picker.
 *
 * Configure with Vite env vars (see .env.example):
 *   VITE_MAPBOX_TOKEN      public token (pk.*), URL-restricted to DART domains
 *   VITE_MAPBOX_PERMANENT  "true" once the account is licensed for permanent geocoding.
 *                          Required by Mapbox terms when geocoding results are stored.
 */

export const MAPBOX_TOKEN: string | undefined = import.meta.env.VITE_MAPBOX_TOKEN || undefined;
const PERMANENT = import.meta.env.VITE_MAPBOX_PERMANENT === 'true';

export const isMapboxConfigured = () => Boolean(MAPBOX_TOKEN);

export const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
/** DART Main Street / downtown Dallas. */
export const DALLAS_CENTER: [number, number] = [-96.797, 32.7792];
/**
 * Approximate DART service area: [west, south, east, north] around the 13 member cities
 * (Irving to Rowlett, Glenn Heights to Plano). Swap for the official boundary polygon
 * from DART GIS when available; `SERVICE_AREA_RING` and `isInServiceArea` derive from this.
 */
export const DART_SERVICE_BBOX: [number, number, number, number] = [-97.06, 32.52, -96.45, 33.11];
/** How far past the service area the user may pan, in degrees. */
const VIEW_PADDING = 0.06;

export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [DART_SERVICE_BBOX[0] - VIEW_PADDING, DART_SERVICE_BBOX[1] - VIEW_PADDING],
  [DART_SERVICE_BBOX[2] + VIEW_PADDING, DART_SERVICE_BBOX[3] + VIEW_PADDING],
];

const [W, S, E, N] = DART_SERVICE_BBOX;
export const SERVICE_AREA_RING: [number, number][] = [[W, S], [E, S], [E, N], [W, N], [W, S]];

/** GeoJSON that dims everything outside the service area (world polygon with a service-area hole). */
export const OUTSIDE_SERVICE_AREA_MASK = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]],
      [...SERVICE_AREA_RING].reverse(),
    ],
  },
};

export function isInServiceArea(point: { lng: number; lat: number }) {
  return point.lng >= W && point.lng <= E && point.lat >= S && point.lat <= N;
}

export interface LngLat {
  lng: number;
  lat: number;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  secondary: string;
  center: LngLat;
}

export interface ResolvedAddress {
  street?: string;
  city?: string;
  zip?: string;
  fullAddress?: string;
}

export interface NearbyStreet {
  name: string;
  distanceMeters: number;
}

function withCommon(params: Record<string, string>) {
  const search = new URLSearchParams({ ...params, access_token: MAPBOX_TOKEN ?? '' });
  if (PERMANENT) search.set('permanent', 'true');
  return search.toString();
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Mapbox request failed (${res.status})`);
  return res.json() as Promise<T>;
}

interface GeocodeFeature {
  id: string;
  geometry: { coordinates: [number, number] };
  properties: {
    mapbox_id?: string;
    feature_type?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      address?: { street_name?: string; name?: string };
      street?: { name?: string };
      postcode?: { name?: string };
      place?: { name?: string };
      locality?: { name?: string };
    };
  };
}

export async function searchPlaces(query: string, proximity?: LngLat, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];
  const prox = proximity ?? { lng: DALLAS_CENTER[0], lat: DALLAS_CENTER[1] };
  const qs = withCommon({
    q: query,
    autocomplete: 'true',
    country: 'us',
    bbox: DART_SERVICE_BBOX.join(','),
    proximity: `${prox.lng},${prox.lat}`,
    types: 'address,street,neighborhood,locality,place',
    limit: '6',
  });
  const json = await getJson<{ features: GeocodeFeature[] }>(`https://api.mapbox.com/search/geocode/v6/forward?${qs}`, signal);
  return json.features.map((f) => ({
    id: f.properties.mapbox_id || f.id,
    label: f.properties.name || f.properties.full_address || 'Unnamed place',
    secondary: f.properties.place_formatted || '',
    center: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
  }));
}

export async function reverseGeocode(point: LngLat, signal?: AbortSignal): Promise<ResolvedAddress> {
  if (!MAPBOX_TOKEN) return {};
  const qs = withCommon({
    longitude: String(point.lng),
    latitude: String(point.lat),
    types: 'address,street',
  });
  const json = await getJson<{ features: GeocodeFeature[] }>(`https://api.mapbox.com/search/geocode/v6/reverse?${qs}`, signal);
  const f = json.features[0];
  if (!f) return {};
  const ctx = f.properties.context ?? {};
  return {
    street: ctx.address?.street_name || ctx.street?.name || (f.properties.feature_type === 'street' ? f.properties.name : undefined),
    city: ctx.place?.name || ctx.locality?.name,
    zip: ctx.postcode?.name,
    fullAddress: f.properties.full_address,
  };
}

const ROAD_CLASSES = new Set([
  'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'street', 'street_limited', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
]);

const SUFFIXES: Record<string, string> = {
  street: 'st', avenue: 'ave', boulevard: 'blvd', road: 'rd', drive: 'dr', lane: 'ln', parkway: 'pkwy',
  freeway: 'fwy', highway: 'hwy', expressway: 'expy', court: 'ct', place: 'pl', circle: 'cir', trail: 'trl',
  north: 'n', south: 's', east: 'e', west: 'w',
};

export function normalizeStreetName(name: string) {
  return name
    .toLowerCase()
    .replace(/[.,]/g, '')
    .split(/\s+/)
    .map((w) => SUFFIXES[w] ?? w)
    .join(' ')
    .trim();
}

/**
 * Named roads near the pin, closest first, excluding the street the pin is on.
 * Used to suggest the cross street; Mapbox has no direct "nearest intersection" lookup.
 */
export async function findNearbyStreets(point: LngLat, excludeStreet?: string, signal?: AbortSignal): Promise<NearbyStreet[]> {
  if (!MAPBOX_TOKEN) return [];
  const qs = new URLSearchParams({
    radius: '120',
    limit: '30',
    layers: 'road',
    geometry: 'linestring',
    dedupe: 'true',
    access_token: MAPBOX_TOKEN,
  });
  const json = await getJson<{ features: Array<{ properties: { name?: string; class?: string; tilequery?: { distance?: number } } }> }>(
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${point.lng},${point.lat}.json?${qs}`,
    signal,
  );
  const exclude = excludeStreet ? normalizeStreetName(excludeStreet) : undefined;
  const best = new Map<string, NearbyStreet>();
  for (const f of json.features) {
    const name = f.properties.name?.trim();
    if (!name || !ROAD_CLASSES.has(f.properties.class ?? '')) continue;
    const key = normalizeStreetName(name);
    if (key === exclude) continue;
    const distanceMeters = f.properties.tilequery?.distance ?? Number.POSITIVE_INFINITY;
    const existing = best.get(key);
    if (!existing || distanceMeters < existing.distanceMeters) best.set(key, { name, distanceMeters });
  }
  return Array.from(best.values()).sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 4);
}

export function staticMapUrl(point: LngLat, width: number, height: number, zoom = 15.5) {
  if (!MAPBOX_TOKEN) return undefined;
  const lng = point.lng.toFixed(6);
  const lat = point.lat.toFixed(6);
  const w = Math.min(Math.round(width), 1280);
  const h = Math.min(Math.round(height), 1280);
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+00205b(${lng},${lat})/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${MAPBOX_TOKEN}`;
}

export function formatCoordinates(point: LngLat) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}
