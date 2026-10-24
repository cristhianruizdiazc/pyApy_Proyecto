import React from 'react';
import { useApp } from '../context/AppContext';
import { X, MapPin, Navigation, ExternalLink, Compass, ShieldCheck } from 'lucide-react';

export const GoogleMapsModal: React.FC = () => {
  const {
    isGoogleMapsModalOpen,
    setIsGoogleMapsModalOpen,
    activeProperty
  } = useApp();

  if (!isGoogleMapsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Ubicación Real en Paraguay - Google Maps
              </h3>
              <p className="text-xs text-slate-400">
                {activeProperty.name} • {activeProperty.city}, {activeProperty.department}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGoogleMapsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container & Info */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
            {/* Embedded Google Maps / OpenStreetMap */}
            <iframe
              title="Google Maps Location"
              src={`https://maps.google.com/maps?q=${activeProperty.lat},${activeProperty.lng}&z=14&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
            />

            {/* Custom overlay badge */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Coordenadas Verificadas pyApy</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Dirección Completa:</span>
              <strong className="text-slate-900">{activeProperty.address}, {activeProperty.city}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departamento:</span>
              <span className="text-slate-900 font-semibold">{activeProperty.department}, Paraguay</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Coordenadas GPS:</span>
              <span className="font-mono text-slate-700">{activeProperty.lat}, {activeProperty.lng}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeProperty.lat},${activeProperty.lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Cómo Llegar con Google Maps / Waze</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsGoogleMapsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
