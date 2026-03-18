'use client';

import { SearchFilters, DPE_COLORS } from '@/types';
import { Search, MapPin, Calendar, Layers, ChevronDown } from 'lucide-react';

interface FiltersBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export default function FiltersBar({ filters, onFilterChange, onSearch }: FiltersBarProps) {
  const dpeClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const toggleDpeClass = (classe: string) => {
    const newClasses = filters.dpeClasses.includes(classe)
      ? filters.dpeClasses.filter((c) => c !== classe)
      : [...filters.dpeClasses, classe];
    onFilterChange({ ...filters, dpeClasses: newClasses });
  };

  return (
    <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-10">
      <div className="max-w-400 mx-auto flex flex-wrap items-center gap-6">
        {/* Search Input */}
        <div className="flex-1 min-w-75 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Ville, code postal ou adresse..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all"
            value={filters.query}
            onChange={(e) => onFilterChange({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>

        {/* Radius */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rayon</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {[1, 5, 10, 20].map((r) => (
              <button
                key={r}
                onClick={() => onFilterChange({ ...filters, radius: r })}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filters.radius === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Période</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {[
              { label: '24h', value: '24h' },
              { label: '7j', value: '7d' },
              { label: '30j', value: '30d' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => onFilterChange({ ...filters, period: p.value as any })}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filters.period === p.value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* DPE Classes */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DPE</span>
          <div className="flex gap-1">
            {dpeClasses.map((c) => (
              <button
                key={c}
                onClick={() => toggleDpeClass(c)}
                className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-md transition-all border-2 ${
                  filters.dpeClasses.includes(c)
                    ? `${DPE_COLORS[c]} border-white ring-2 ring-blue-500/20 text-white`
                    : 'bg-slate-100 border-transparent text-slate-400 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</span>
          <select
            value={filters.propertyType}
            onChange={(e) => onFilterChange({ ...filters, propertyType: e.target.value as any })}
            className="bg-slate-100 border-transparent rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous</option>
            <option value="Maison">Maison</option>
            <option value="Appartement">Appartement</option>
          </select>
        </div>

        <button
          onClick={onSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          Rechercher
        </button>
      </div>
    </div>
  );
}
