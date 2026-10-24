import React from 'react';
import { useApp } from '../context/AppContext';
import { PARAGUAY_DEPARTMENTS } from '../data/paraguayGeography';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Building2,
  Sparkles,
  ChevronDown,
  Info,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { formatGuaranies } from '../utils/i18n';

export const SearchFilters: React.FC = () => {
  const {
    filters,
    updateFilter,
    properties,
    activeProperty,
    setActivePropertyId,
    themeConfig,
    language
  } = useApp();

  const currentDept = PARAGUAY_DEPARTMENTS.find(d => d.name === filters.department) || PARAGUAY_DEPARTMENTS[0];

  const handleDepartmentChange = (deptName: string) => {
    updateFilter('department', deptName);
    const dept = PARAGUAY_DEPARTMENTS.find(d => d.name === deptName);
    if (dept && dept.cities.length > 0) {
      updateFilter('city', dept.cities[0]);
      // Also pick first property matching this department if available
      const matchingProp = properties.find(p => p.department.toLowerCase() === deptName.toLowerCase());
      if (matchingProp) {
        setActivePropertyId(matchingProp.id);
      }
    }
  };

  const handleCityChange = (cityName: string) => {
    updateFilter('city', cityName);
    const matchingProp = properties.find(p => p.city.toLowerCase() === cityName.toLowerCase());
    if (matchingProp) {
      setActivePropertyId(matchingProp.id);
    }
  };

  const handleBookingTypeChange = (type: typeof filters.bookingType) => {
    updateFilter('bookingType', type);
    if (type === 'turn_day') {
      updateFilter('startTime', '10:00');
      updateFilter('endTime', '19:00');
    } else if (type === 'turn_night') {
      updateFilter('startTime', '20:00');
      updateFilter('endTime', '06:00');
    } else if (type === 'full_day') {
      updateFilter('startTime', '10:00');
      updateFilter('endTime', '10:00');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-100 mb-6 transition-all">
      {/* Top Banner / Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: themeConfig.primary }} />
            <span>Buscar Disponibilidad en Paraguay</span>
            {language === 'es_gn' && (
              <span className="text-xs font-semibold text-slate-400">
                (Eheka tenda Paraguay-pe)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Definí departamento, ciudad, horario exacto (de: ... hasta: ...) y cantidad de visitantes.
          </p>
        </div>

        {/* Property Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <Building2 className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-xs font-bold text-slate-600 hidden sm:inline">Quinta Activa:</span>
          <select
            value={activeProperty.id}
            onChange={(e) => setActivePropertyId(e.target.value)}
            className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-hidden cursor-pointer pr-2"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city} - {p.department}) {p.isVerified ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Departamento */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Departamento</span>
          </label>
          <div className="relative">
            <select
              value={filters.department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
            >
              {PARAGUAY_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>
                  Dpto. {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 2. Ciudad */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-500" />
            <span>Ciudad</span>
          </label>
          <div className="relative">
            <select
              value={filters.city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
            >
              {currentDept.cities.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 3. Modalidad / Turno */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Modalidad de Reserva</span>
          </label>
          <div className="relative">
            <select
              value={filters.bookingType}
              onChange={(e) => handleBookingTypeChange(e.target.value as any)}
              className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
            >
              <option value="turn_day">☀️ Turno Diurno (10:00 a 19:00)</option>
              <option value="turn_night">🌙 Turno Nocturno (20:00 a 06:00)</option>
              <option value="full_day">🏡 Día Completo (24 Horas)</option>
              <option value="custom_range">⏱️ Rango Horario Exacto</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 4. Fecha y Horas (De... Hasta...) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-500" />
            <span>Fecha & Horario</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                updateFilter('startDate', e.target.value);
                updateFilter('endDate', e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
            {filters.bookingType === 'custom_range' && (
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={filters.startTime}
                  onChange={(e) => updateFilter('startTime', e.target.value)}
                  className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-2 text-[11px] font-bold text-slate-800"
                />
                <span className="text-slate-400 text-xs font-bold">-</span>
                <input
                  type="time"
                  value={filters.endTime}
                  onChange={(e) => updateFilter('endTime', e.target.value)}
                  className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-2 text-[11px] font-bold text-slate-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. Visitantes / Ocupantes */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-500" />
            <span>Visitantes / Comensales</span>
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 justify-between">
            <button
              onClick={() => updateFilter('guestCount', Math.max(1, filters.guestCount - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-all shadow-2xs"
            >
              -
            </button>
            <span className="font-extrabold text-xs text-slate-900 px-2">
              {filters.guestCount} {filters.guestCount === 1 ? 'persona' : 'personas'}
            </span>
            <button
              onClick={() => updateFilter('guestCount', filters.guestCount + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-all shadow-2xs"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Info indicator bar */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Buscando para: {filters.guestCount} personas</span>
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-medium text-slate-700">
            Horario: <strong className="text-slate-900">{filters.startTime} a {filters.endTime} hs</strong>
          </span>
        </div>

        {filters.guestCount >= 10 && (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Motor de Grupos Activo: Combinación automática multizona disponible</span>
          </div>
        )}
      </div>
    </div>
  );
};
