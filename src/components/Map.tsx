'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';
import { DPERecord, DPE_COLORS } from '@/types';
import { BoundingBox } from '@/lib/api';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: (icon as { src: string }).src ?? (icon as unknown as string),
  shadowUrl: (iconShadow as { src: string }).src ?? (iconShadow as unknown as string),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MIN_ZOOM = 10;

interface MapProps {
  records: DPERecord[];
  center: [number, number];
  zoom?: number;
  onSelectRecord: (record: DPERecord) => void;
  selectedRecordId?: string;
  onBoundsChange?: (bbox: BoundingBox) => void;
  isSearching?: boolean;
}

const createCustomIcon = (classe: string, isSelected: boolean) => {
  const color = DPE_COLORS[classe] || 'bg-slate-400';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 rounded-full ${color} border-2 ${isSelected ? 'border-white scale-125 ring-4 ring-blue-500/30' : 'border-white'} shadow-lg flex items-center justify-center text-white font-bold text-xs transition-all duration-200">${classe}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  const fontSize = count < 100 ? 13 : 11;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:rgba(30,41,59,0.85);border:2px solid rgba(255,255,255,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${fontSize}px;box-shadow:0 2px 8px rgba(0,0,0,0.35);backdrop-filter:blur(4px);">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapController({
  center,
  zoom,
  onBoundsChange,
  isSearchingRef,
}: {
  center: [number, number];
  zoom: number;
  onBoundsChange?: (bbox: BoundingBox) => void;
  isSearchingRef: { current: boolean };
}) {
  const map = useMapEvents({
    moveend() {
      if (isSearchingRef.current) return;
      if (!onBoundsChange || map.getZoom() < MIN_ZOOM) return;
      const b = map.getBounds();
      onBoundsChange({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    },
  });

  const prevCenter = useRef<[number, number]>(center);
  const prevZoom = useRef<number>(zoom);

  useEffect(() => {
    const [prevLat, prevLng] = prevCenter.current;
    const [lat, lng] = center;
    const centerChanged = prevLat !== lat || prevLng !== lng;
    const zoomChanged = prevZoom.current !== zoom;
    if (centerChanged || zoomChanged) {
      // When only center changes (record selected from sidebar), keep the map's
      // current zoom instead of snapping back to the search zoom level
      const targetZoom = zoomChanged ? zoom : map.getZoom();
      map.flyTo(center, targetZoom, { duration: 1.2 });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, map]);

  return null;
}

function ZoomMessage() {
  const map = useMapEvents({ zoomend() {} });
  if (map.getZoom() >= MIN_ZOOM) return null;
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-500 pointer-events-none">
      <div className="bg-slate-900/80 text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-sm shadow-lg">
        Zoomez pour voir les DPE
      </div>
    </div>
  );
}

export default function Map({
  records,
  center,
  zoom = 13,
  onSelectRecord,
  selectedRecordId,
  onBoundsChange,
  isSearching = false,
}: MapProps) {
  const isSearchingRef = useRef(isSearching);
  isSearchingRef.current = isSearching;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <MapController
          center={center}
          zoom={zoom}
          onBoundsChange={onBoundsChange}
          isSearchingRef={isSearchingRef}
        />
        <ZoomMessage />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
        >
          {records.map((record) => {
            const pos = record.fields._geopoint;
            if (!pos) return null;
            return (
              <Marker
                key={record.recordid}
                position={pos}
                icon={createCustomIcon(
                  record.fields.classe_consommation_energie,
                  record.recordid === selectedRecordId
                )}
                eventHandlers={{ click: () => onSelectRecord(record) }}
              >
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-sm">{record.fields.adresse_brute}</p>
                    <p className="text-xs text-slate-500">{record.fields.nom_commune_brute}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${DPE_COLORS[record.fields.classe_consommation_energie]} text-white`}>
                        DPE: {record.fields.classe_consommation_energie}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
