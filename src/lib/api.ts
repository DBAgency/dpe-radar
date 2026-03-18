import axios from 'axios';
import { DPERecord, SearchFilters } from '@/types';
import { subDays, format } from 'date-fns';

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Module-level cache — persists for the entire browser session
const dpeCache = new Map<string, { data: DPERecord[]; ts: number }>();
const geocodeCache = new Map<string, [number, number]>();
const SESSION_TTL = 60 * 60 * 1000; // 1h

// Round bbox coords to 3 decimal places (~110m precision) to avoid cache-miss
// on micro-panning in Leaflet
function normalizeBBox(bbox: BoundingBox): string {
  return [bbox.west, bbox.south, bbox.east, bbox.north]
    .map(n => n.toFixed(3))
    .join(',');
}

function buildQS(filters: SearchFilters, includeQuery = false): string {
  const days = filters.period === '24h' ? 1 : filters.period === '7d' ? 7 : 30;
  const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  let qs = `date_derniere_modification_dpe:[${fromDate} TO *]`;

  if (filters.dpeClasses.length > 0) {
    qs += ` AND etiquette_dpe:(${filters.dpeClasses.join(' OR ')})`;
  }

  if (filters.propertyType !== 'all') {
    qs += ` AND type_batiment:${filters.propertyType.toLowerCase()}`;
  }

  if (includeQuery && filters.query) {
    qs += ` AND (nom_commune_brut:"${filters.query}" OR code_postal_brut:"${filters.query}")`;
  }

  return qs;
}

export async function fetchDPEData(
  filters: SearchFilters,
  coords?: [number, number]
): Promise<DPERecord[]> {
  const qs = buildQS(filters, !coords);

  const coordKey = coords
    ? `${coords[0].toFixed(3)}:${coords[1].toFixed(3)}:${filters.radius}`
    : 'nocoords';
  const key = `dist:${coordKey}|qs:${qs}`;

  const cached = dpeCache.get(key);
  if (cached && Date.now() - cached.ts < SESSION_TTL) {
    return cached.data;
  }

  const params: Record<string, string> = { qs, size: '500' };

  if (coords) {
    params.geo_distance = `${coords[1]}:${coords[0]}:${filters.radius * 1000}`;
  }

  const response = await axios.get('/api/dpe', { params });
  const result: DPERecord[] = response.data.records;
  dpeCache.set(key, { data: result, ts: Date.now() });
  return result;
}

export async function fetchDPEByBBox(
  bbox: BoundingBox,
  filters: SearchFilters
): Promise<DPERecord[]> {
  const qs = buildQS(filters);
  const key = `bbox:${normalizeBBox(bbox)}|qs:${qs}`;

  const cached = dpeCache.get(key);
  if (cached && Date.now() - cached.ts < SESSION_TTL) {
    return cached.data;
  }

  const bboxString = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const response = await axios.get('/api/dpe', {
    params: { qs, size: '500', bbox: bboxString },
  });
  const result: DPERecord[] = response.data.records;
  dpeCache.set(key, { data: result, ts: Date.now() });
  return result;
}

export async function geocode(query: string): Promise<[number, number] | null> {
  const normalizedQuery = query.trim().toLowerCase();

  if (geocodeCache.has(normalizedQuery)) {
    return geocodeCache.get(normalizedQuery)!;
  }

  try {
    const response = await axios.get('/api/geocode', { params: { q: query } });
    if (response.data.features?.length > 0) {
      const [lng, lat] = response.data.features[0].geometry.coordinates;
      const coords: [number, number] = [lat, lng];
      geocodeCache.set(normalizedQuery, coords);
      return coords;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
