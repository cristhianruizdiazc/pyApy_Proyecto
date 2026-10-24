import React, { useState } from 'react';
import { Sparkles, ExternalLink, ShieldAlert, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SPONSORS = [
  {
    tag: 'ESPACIO PUBLICITARIO DESTACADO',
    title: '🍖 "Asado Don Ramón" - Servicio de Asado & Tatakuá a Domicilio',
    desc: 'Parrillada completa de costillar premium, sopa paraguaya, chipa guazú y mandioca caliente directo en tu quinta.',
    action: 'Pedir Presupuesto WhatsApp',
    badge: 'Sponsor Sanber & Cordillera',
    contact: '+595 981 990 120'
  },
  {
    tag: 'ESPACIO PUBLICITARIO DESTACADO',
    title: '🌿 Yerba Mate "Kurupí" & Termos Forrados en Cuero',
    desc: 'Kit de tereré con hielo y yuyos frescos (mburucuyá, menta\'i, santa lucía) para tu estadía de verano.',
    action: 'Ver Puntos de Venta',
    badge: 'Tereré Rupa Oficial',
    contact: '+595 971 445 800'
  },
  {
    tag: 'ESPACIO PUBLICITARIO DESTACADO',
    title: '🏰 "Diversión Sanber" - Alquiler de Inflables Acuáticos & Gazebos',
    desc: 'Toboganes gigantes para piscinas, camas elásticas, gazebos y sonido profesional para eventos familiares.',
    action: 'Consultar Disponibilidad',
    badge: 'Entrega en Quintas',
    contact: '+595 983 221 440'
  }
];

export const AdBanner: React.FC = () => {
  const { themeConfig } = useApp();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  const ad = SPONSORS[currentAdIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-950 p-4 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Glow accent */}
        <div
          className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: themeConfig.primary }}
        />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {ad.tag}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              • {ad.badge}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            {ad.title}
          </h4>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {ad.desc}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => {
              alert(`Contacto directo con el anunciante:\nWhatsApp: ${ad.contact}\n\nGracias por apoyar a los emprendimientos locales de Paraguay.`);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{ad.action}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Ad carousel switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            {SPONSORS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentAdIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentAdIndex ? 'bg-amber-400 w-4' : 'bg-slate-600 hover:bg-slate-500'
                }`}
                title={`Anuncio ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
