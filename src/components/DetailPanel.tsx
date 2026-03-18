'use client';

import { DPERecord, DPE_COLORS, DPE_TEXT_COLORS } from '@/types';
import { X, MapPin, Calendar, Home, Building2, Zap, Wind, Maximize, FileText, Share2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DetailPanelProps {
  record: DPERecord | null;
  onClose: () => void;
}

export default function DetailPanel({ record, onClose }: DetailPanelProps) {
  if (!record) return null;

  const f = record.fields;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-1000 overflow-y-auto border-l border-slate-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900">Détails du DPE</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Main Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  {f.adresse_brute}
                </h3>
                <p className="text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {f.nom_commune_brute} ({f.code_postal_brute})
                </p>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg ${DPE_COLORS[f.classe_consommation_energie]} ${DPE_TEXT_COLORS[f.classe_consommation_energie]}`}>
                {f.classe_consommation_energie}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 bg-slate-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type de bien</p>
                <div className="flex items-center gap-2 text-slate-700">
                  {f.type_batiment === 'Maison' ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  <span className="font-semibold">{f.type_batiment}</span>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Surface</p>
                <div className="flex items-center gap-2 text-slate-700">
                  <Maximize className="w-4 h-4" />
                  <span className="font-semibold">{f.surface_habitable_logement} m²</span>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Section */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance Énergétique</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-bold">Consommation</span>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {Math.round(f.consommation_energie)}
                  <span className="text-xs font-medium text-slate-400 ml-1">kWh/m²/an</span>
                </p>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-600">
                  <Wind className="w-4 h-4" />
                  <span className="text-sm font-bold">GES</span>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {Math.round(f.estimation_ges)}
                  <span className="text-xs font-medium text-slate-400 ml-1">kgCO2/m²/an</span>
                </p>
              </div>
            </div>
          </section>

          {/* Technical Details */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informations Techniques</h4>
            <div className="bg-slate-50 rounded-2xl overflow-hidden divide-y divide-slate-200/50">
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Année de construction</span>
                <span className="text-sm font-semibold text-slate-900">{f.annee_construction || 'Non renseigné'}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Énergie chauffage</span>
                <span className="text-sm font-semibold text-slate-900">{f.type_energie_chauffage || 'Non renseigné'}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Numéro DPE</span>
                <span className="font-mono text-xs text-slate-900">{f.numero_dpe}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">Dernière modification</span>
                <span className="text-sm font-semibold text-slate-900">
                  {new Date(f.date_derniere_modification_dpe).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
              <Share2 className="w-4 h-4" />
              Exporter
            </button>
            <button className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95">
              <Star className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
