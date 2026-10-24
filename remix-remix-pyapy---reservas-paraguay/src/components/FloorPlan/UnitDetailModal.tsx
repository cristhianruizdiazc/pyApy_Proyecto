import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatGuaranies, formatUsd } from '../../utils/i18n';
import {
  X,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  Waves,
  Home
} from 'lucide-react';

export const UnitDetailModal: React.FC = () => {
  const {
    inspectingUnit,
    setInspectingUnit,
    selectedUnitIds,
    toggleUnitSelection,
    filters,
    language,
    themeConfig,
    setIsBookingModalOpen
  } = useApp();

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!inspectingUnit) return null;

  const isSelected = selectedUnitIds.includes(inspectingUnit.id);
  const isOutOfService = inspectingUnit.status === 'out_of_service' || inspectingUnit.status === 'blocked';
  const isOccupied = inspectingUnit.status === 'occupied';
  const isWarning = inspectingUnit.status === 'warning';

  const isTurn = filters.bookingType === 'turn_day' || filters.bookingType === 'turn_night';
  const calculatedPricePyg = isTurn && inspectingUnit.pricePerTurn
    ? inspectingUnit.pricePerTurn
    : inspectingUnit.pricePerDay;

  const calculatedPriceUsd = Math.round(calculatedPricePyg / 7500);

  const photos = inspectingUnit.photos && inspectingUnit.photos.length > 0
    ? inspectingUnit.photos
    : [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'
      ];

  const handleSelectToggle = () => {
    if (isOutOfService) return;
    toggleUnitSelection(inspectingUnit.id);
    setInspectingUnit(null);
  };

  const handleDirectReserve = () => {
    if (!isSelected) {
      toggleUnitSelection(inspectingUnit.id);
    }
    setInspectingUnit(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header Photo Bar */}
        <div className="relative aspect-16/9 sm:aspect-21/9 bg-slate-900 overflow-hidden shrink-0">
          <img
            src={photos[activePhotoIdx]}
            alt={inspectingUnit.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Close button */}
          <button
            onClick={() => setInspectingUnit(null)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Unit Number Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-black border border-white/10">
              Sector #{inspectingUnit.unitNumber}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black text-white shadow-md ${
                inspectingUnit.status === 'available'
                  ? 'bg-emerald-600'
                  : inspectingUnit.status === 'occupied'
                  ? 'bg-red-600'
                  : inspectingUnit.status === 'warning'
                  ? 'bg-amber-600'
                  : 'bg-slate-800'
              }`}
            >
              {inspectingUnit.status === 'available' && '✓ Disponible'}
              {inspectingUnit.status === 'occupied' && '🔴 Ocupada'}
              {inspectingUnit.status === 'warning' && '🟡 Próxima a liberarse'}
              {inspectingUnit.status === 'out_of_service' && '⛔ Fuera de servicio'}
              {inspectingUnit.status === 'blocked' && '🔒 Bloqueada'}
            </span>
          </div>

          {/* Bottom Title Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-4 text-white">
            <h3 className="text-lg sm:text-2xl font-black drop-shadow-md">
              {inspectingUnit.name}
            </h3>
            {language === 'es_gn' && inspectingUnit.nameGn && (
              <p className="text-xs text-amber-300 font-semibold italic">
                🇵🇾 {inspectingUnit.nameGn}
              </p>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Key Specs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacidad Máx.</span>
              <strong className="text-slate-900 text-xs sm:text-sm flex items-center gap-1 font-black">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>{inspectingUnit.capacity} personas</span>
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Preparación / Limpieza</span>
              <strong className="text-slate-900 text-xs sm:text-sm flex items-center gap-1 font-black">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{inspectingUnit.cleaningBufferMinutes} min buffer</span>
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarifa por Turno</span>
              <strong className="text-emerald-700 text-xs sm:text-sm font-black">
                {inspectingUnit.pricePerTurn ? formatGuaranies(inspectingUnit.pricePerTurn) : 'Incluido'}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarifa Día Completo</span>
              <strong className="text-emerald-700 text-xs sm:text-sm font-black">
                {formatGuaranies(inspectingUnit.pricePerDay)}
              </strong>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              Detalles del Espacio
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {inspectingUnit.description}
            </p>
          </div>

          {/* Features List */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Características & Equipamiento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {inspectingUnit.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Alert box (if occupied, warning, or out of service) */}
          {isOccupied && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-950 font-bold">Sector actualmente ocupado</strong>
                <p className="text-red-800 mt-0.5">
                  Hora programada de liberación: <strong>{inspectingUnit.releaseTime || '18:30'} hs</strong>.
                  Próxima reserva agendada: {inspectingUnit.nextReservation || 'Hoy 19:00 hs'}.
                </p>
              </div>
            </div>
          )}

          {isWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-bold">Próximo a quedar libre</strong>
                <p className="text-amber-800 mt-0.5">
                  Se estima su desocupación y limpieza a las <strong>{inspectingUnit.releaseTime || '15:00'} hs</strong>. Podés reservarlo para el turno siguiente.
                </p>
              </div>
            </div>
          )}

          {isOutOfService && (
            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Espacio no disponible temporalmente</strong>
                <p className="text-slate-600 mt-0.5">
                  Motivo: {inspectingUnit.notes || 'Mantenimiento preventivo programado.'}
                </p>
              </div>
            </div>
          )}

          {/* Combinability info */}
          {inspectingUnit.combinableWith.length > 0 && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs text-sky-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>
                  Combinable físicamente con <strong>{inspectingUnit.combinableWith.length} sectores contiguos</strong> para grupos mayores.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Precio para tu selección ({filters.bookingType === 'turn_day' ? 'Turno Diurno' : 'Día Completo'}):
            </span>
            <div className="flex items-baseline gap-1.5">
              <strong className="text-lg sm:text-xl font-black text-slate-900">
                {formatGuaranies(calculatedPricePyg)}
              </strong>
              <span className="text-xs text-slate-400">
                (~{formatUsd(calculatedPriceUsd)} USD)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInspectingUnit(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
            >
              Cerrar
            </button>

            {!isOutOfService && (
              <button
                onClick={handleSelectToggle}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${
                  isSelected
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                <span>{isSelected ? 'Quitar del Plano' : 'Seleccionar este Lugar'}</span>
              </button>
            )}

            {!isOutOfService && !isOccupied && (
              <button
                onClick={handleDirectReserve}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md flex items-center gap-1.5"
              >
                <span>Reservar Directo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
