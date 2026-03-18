import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines';

function normalizeRecord(raw: Record<string, unknown>) {
  const rawGeo = raw._geopoint as string | undefined;
  const geopoint: [number, number] | undefined = rawGeo
    ? (rawGeo.split(',').map(Number) as [number, number])
    : undefined;

  // Capitalize first letter to match old interface (e.g. "maison" → "Maison")
  const typeBatiment = raw.type_batiment as string | undefined;
  const typeBatimentCapitalized = typeBatiment
    ? typeBatiment.charAt(0).toUpperCase() + typeBatiment.slice(1)
    : undefined;

  return {
    recordid: raw._id as string,
    fields: {
      date_derniere_modification_dpe: raw.date_derniere_modification_dpe,
      // New API: etiquette_dpe / etiquette_ges (was classe_consommation_energie / classe_estimation_ges)
      classe_consommation_energie: raw.etiquette_dpe,
      classe_estimation_ges: raw.etiquette_ges,
      type_batiment: typeBatimentCapitalized,
      surface_habitable_logement: raw.surface_habitable_logement,
      // New API: _brut (without trailing 'e')
      nom_commune_brute: raw.nom_commune_brut,
      code_postal_brute: raw.code_postal_brut != null ? String(raw.code_postal_brut) : undefined,
      adresse_brute: raw.adresse_brut,
      _geopoint: geopoint,
      // New API: conso_5_usages_par_m2_ep / emission_ges_5_usages_par_m2
      consommation_energie: raw.conso_5_usages_par_m2_ep,
      estimation_ges: raw.emission_ges_5_usages_par_m2,
      annee_construction: raw.annee_construction,
      // New API: type_energie_principale_chauffage
      type_energie_chauffage: raw.type_energie_principale_chauffage,
      numero_dpe: raw.numero_dpe,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.get('qs') ?? '';
  const size = searchParams.get('size') ?? '100';
  const geoDistance = searchParams.get('geo_distance');
  const bbox = searchParams.get('bbox');

  const url = new URL(API_BASE);
  url.searchParams.set('qs', qs);
  url.searchParams.set('size', size);
  url.searchParams.set('sort', '-date_derniere_modification_dpe');
  if (geoDistance) {
    url.searchParams.set('geo_distance', geoDistance);
  }
  if (bbox) {
    url.searchParams.set('bbox', bbox);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.error('ADEME API error:', res.status, await res.text());
      return NextResponse.json({ records: [] }, { status: 502 });
    }

    const data = await res.json();
    const records = (data.results as Record<string, unknown>[]).map(normalizeRecord);
    return NextResponse.json({ records });
  } catch (error) {
    console.error('ADEME API Error:', error);
    return NextResponse.json({ records: [] }, { status: 500 });
  }
}
