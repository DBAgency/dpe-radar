'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Radar, Download, User, Bell, LayoutGrid, ListFilter } from 'lucide-react';
import FiltersBar from '@/components/FiltersBar';
import Sidebar from '@/components/Sidebar';
import DetailPanel from '@/components/DetailPanel';
import { DPERecord, SearchFilters } from '@/types';
import { fetchDPEData, fetchDPEByBBox, geocode, BoundingBox } from '@/lib/api';

// Leaflet requires browser APIs — load client-side only (bundle-dynamic-imports)
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const RADIUS_TO_ZOOM: Record<number, number> = { 1: 14, 5: 12, 10: 11, 20: 10 };

export default function Page() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'Marseille',
    radius: 5,
    period: '30d',
    dpeClasses: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    propertyType: 'all',
  });

  const [records, setRecords] = useState<DPERecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState<[number, number]>([43.2965, 5.3698]);
  const [zoom, setZoom] = useState(12);
  const [selectedRecord, setSelectedRecord] = useState<DPERecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const isSearchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setIsSearching(true);
    isSearchingRef.current = true;
    try {
      const coords = filters.query ? await geocode(filters.query) : null;
      if (coords) {
        setCenter(coords);
        setZoom(RADIUS_TO_ZOOM[filters.radius] ?? 13);
      }
      const data = await fetchDPEData(filters, coords ?? undefined);
      setRecords(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
      // Attendre la fin de l'animation flyTo (~1.2s) avant de relâcher le verrou
      setTimeout(() => {
        setIsSearching(false);
        isSearchingRef.current = false;
      }, 1500);
    }
  }, [filters]);

  const handleBoundsChange = useCallback((bbox: BoundingBox) => {
    if (isSearchingRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (isSearchingRef.current) return;
      setLoading(true);
      try {
        const data = await fetchDPEByBBox(bbox, filters);
        setRecords(data);
      } catch (error) {
        console.error('Viewport fetch failed:', error);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [filters]);

  useEffect(() => {
    handleSearch();
  }, []);

  const stats = {
    total: records.length,
    energyGuzzlers: records.filter(r => ['F', 'G'].includes(r.fields.classe_consommation_energie)).length,
    houses: records.filter(r => r.fields.type_batiment === 'Maison').length,
    apartments: records.filter(r => r.fields.type_batiment === 'Appartement').length,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Radar className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-slate-900 tracking-tight">DPE RADAR</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">Intelligence Immobilière</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all">
            <Download className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Export</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
            <User className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <FiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onSearch={handleSearch}
      />

      {/* KPI Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nouveaux DPE</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-2xl font-black text-red-500">{stats.energyGuzzlers}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passoires (F/G)</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-2xl font-black text-blue-500">{stats.houses}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maisons</span>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-2xl font-black text-indigo-500">{stats.apartments}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appartements</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar List */}
        <div className="w-96 shrink-0 z-10 shadow-xl">
          <Sidebar
            records={records}
            loading={loading}
            onSelectRecord={(r) => {
              setSelectedRecord(r);
              if (r.fields._geopoint) setCenter(r.fields._geopoint);
            }}
            selectedRecordId={selectedRecord?.recordid}
          />
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <Map
            records={records}
            center={center}
            zoom={zoom}
            onSelectRecord={setSelectedRecord}
            selectedRecordId={selectedRecord?.recordid}
            onBoundsChange={handleBoundsChange}
            isSearching={isSearching}
          />

          {/* Map Overlay Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-400">
            <button className="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50 transition-all">
              <LayoutGrid className="w-5 h-5 text-slate-600" />
            </button>
            <button className="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50 transition-all">
              <ListFilter className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Detail Panel */}
        <DetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </main>
    </div>
  );
}
