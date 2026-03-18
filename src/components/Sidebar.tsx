'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DPERecord, DPE_COLORS, DPE_TEXT_COLORS } from '@/types';
import { Home, Building2, MapPin, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  records: DPERecord[];
  loading: boolean;
  onSelectRecord: (record: DPERecord) => void;
  selectedRecordId?: string;
}

export default function Sidebar({ records, loading, onSelectRecord, selectedRecordId }: SidebarProps) {
  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200">
      <div className="p-4 border-bottom border-slate-100 bg-slate-50/50">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Dernières opportunités
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {records.length} résultats trouvés dans votre zone
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Chargement des données...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">Aucun DPE trouvé avec ces filtres.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={record.recordid}
                onClick={() => onSelectRecord(record)}
                className={`p-4 cursor-pointer transition-all hover:bg-slate-50 group relative ${
                  selectedRecordId === record.recordid ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {record.fields.type_batiment === 'Maison' ? (
                      <Home className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-medium text-slate-500">
                      {record.fields.type_batiment}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(parseISO(record.fields.date_derniere_modification_dpe), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                  {record.fields.adresse_brute}
                </h3>
                
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  {record.fields.nom_commune_brute} ({record.fields.code_postal_brute})
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-black ${DPE_COLORS[record.fields.classe_consommation_energie]} ${DPE_TEXT_COLORS[record.fields.classe_consommation_energie]}`}>
                      DPE {record.fields.classe_consommation_energie}
                    </div>
                    <div className="text-xs text-slate-400">
                      {record.fields.surface_habitable_logement} m²
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
