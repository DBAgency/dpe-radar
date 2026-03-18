export interface DPERecord {
  recordid: string;
  fields: {
    date_derniere_modification_dpe: string;
    classe_consommation_energie: string;
    classe_estimation_ges: string;
    type_batiment: string;
    surface_habitable_logement: number;
    nom_commune_brute: string;
    code_postal_brute: string;
    adresse_brute: string;
    _geopoint?: [number, number];
    consommation_energie: number;
    estimation_ges: number;
    annee_construction?: number;
    type_energie_chauffage?: string;
    numero_dpe: string;
  };
}

export interface SearchFilters {
  query: string;
  radius: number;
  period: '24h' | '7d' | '30d';
  dpeClasses: string[];
  propertyType: 'all' | 'Maison' | 'Appartement';
}

export const DPE_COLORS: Record<string, string> = {
  A: 'bg-[#009640]',
  B: 'bg-[#52b12a]',
  C: 'bg-[#c7d301]',
  D: 'bg-[#fef200]',
  E: 'bg-[#f6b300]',
  F: 'bg-[#e97500]',
  G: 'bg-[#e30613]',
};

export const DPE_TEXT_COLORS: Record<string, string> = {
  A: 'text-white',
  B: 'text-white',
  C: 'text-slate-900',
  D: 'text-slate-900',
  E: 'text-white',
  F: 'text-white',
  G: 'text-white',
};
