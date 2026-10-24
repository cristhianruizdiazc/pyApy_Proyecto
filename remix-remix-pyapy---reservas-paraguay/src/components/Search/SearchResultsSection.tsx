import React from 'react';
import { useApp } from '../../context/AppContext';
import { PropertyCard } from '../Property/PropertyCard';
import {
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Bell,
  UtensilsCrossed,
  PhoneCall,
  ExternalLink,
  Flame
} from 'lucide-react';

export const SearchResultsSection: React.FC = () => {
  const {
    availableMatches,
    alternatives,
    unavailableMatches,
    filters,
    setIsSearchIntentModalOpen,
    sponsors,
    themeConfig
  } = useApp();

  const totalResults = availableMatches.length + alternatives.length + unavailableMatches.length;

  return (
    <div className="space-y-12">
      {/* 1. Exact Available Matches Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Disponibles para tu Salida
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Confirmación de horario libre en tiempo real para el {filters.startDate}
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
            {availableMatches.length} {availableMatches.length === 1 ? 'quinta' : 'quintas'}
          </span>
        </div>

        {availableMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableMatches.map(item => (
              <PropertyCard
                key={item.property.id}
                property={item.property}
                isAvailable={true}
                matchReasons={item.matchReasons}
              />
            ))}
          </div>
        ) : (
          <div className="bg-amber-50/70 rounded-3xl p-8 border border-amber-200/80 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-slate-900">
                No hay quintas con disponibilidad exacta para este horario
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Probá cambiando la ciudad, ajustando el turno o explorá nuestras alternativas recomendadas abajo.
              </p>
            </div>
            <button
              onClick={() => setIsSearchIntentModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              style={{ backgroundColor: themeConfig.primary }}
            >
              <Bell className="w-4 h-4" />
              <span>Avísame cuando aparezca una opción</span>
            </button>
          </div>
        )}
      </section>

      {/* Unsatisfied Demand Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Radar de Opciones pyApy</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight">
            ¿Tenés requerimientos específicos o no encontrás fecha libre?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Dejanos tu consulta (fecha, zona, cantidad de personas). Nuestro sistema contacta a anfitriones y te avisa por WhatsApp cuando se libere un turno.
          </p>
        </div>
        <button
          onClick={() => setIsSearchIntentModalOpen(true)}
          className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black tracking-wide shrink-0 shadow-md hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          <span>Registrar mi Búsqueda</span>
        </button>
      </div>

      {/* 2. Suggested Alternatives Section */}
      {alternatives.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Alternativas Recomendadas
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Alojamientos similares en zonas cercanas o con capacidad adaptable
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              {alternatives.length} opciones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alternatives.map(item => (
              <PropertyCard
                key={item.property.id}
                property={item.property}
                isAvailable={true}
                isAlternative={true}
                alternativeReason={item.alternativeReason}
                matchReasons={item.matchReasons}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Unavailable Properties Section */}
      {unavailableMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Ocupadas en la Fecha Seleccionada
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Alojadas en esta zona pero reservadas o bloqueadas para el {filters.startDate}
                </p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-rose-50 text-rose-800 rounded-full border border-rose-200">
              {unavailableMatches.length} ocupadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unavailableMatches.map(item => (
              <PropertyCard
                key={item.property.id}
                property={item.property}
                isAvailable={false}
                unavailabilityReason={item.unavailabilityReason}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Local Business Sponsors Banner (Paraguay Summer Ecosystem) */}
      {sponsors.filter(s => s.isActive).length > 0 && (
        <section className="space-y-4 pt-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-black text-slate-900">
                Servicios Recomendados para tu Estadía
              </h3>
              <p className="text-xs text-slate-500">
                Gastronomía tradicional, carnes para asado y entretenimiento con entrega en quintas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sponsors.filter(s => s.isActive).map(sp => (
              <div
                key={sp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    {sp.badge}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {sp.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {sp.desc}
                  </p>
                </div>
                {sp.contactPhone && (
                  <a
                    href={`https://wa.me/${sp.contactPhone.replace(/[^0-9]/g, '')}?text=Hola,%20los%20contacto%20desde%20la%20plataforma%20pyApy`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{sp.ctaText}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
