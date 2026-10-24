import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PARAGUAY_DEPARTMENTS } from '../../data/paraguayGeography';
import { ALL_AMENITIES, formatGs } from '../../services/configService';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  Banknote,
  Sparkles,
  ChevronDown,
  Filter,
  Check
} from 'lucide-react';

export const MainSearchHero: React.FC = () => {
  const {
    filters,
    updateFilter,
    toggleAmenityFilter,
    themeConfig,
    language,
    availableMatches,
    properties
  } = useApp();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const currentDept = PARAGUAY_DEPARTMENTS.find(d => d.name === filters.department) || PARAGUAY_DEPARTMENTS[0];

  const handleDepartmentChange = (deptName: string) => {
    updateFilter('department', deptName);
    updateFilter('city', 'Todas las ciudades');
  };

  const handleBookingTypeSelect = (type: typeof filters.bookingType) => {
    updateFilter('bookingType', type);
    if (type === 'turn_day') {
      updateFilter('startTime', '09:00');
      updateFilter('endTime', '18:30');
      updateFilter('endDate', filters.startDate);
    } else if (type === 'turn_night') {
      updateFilter('startTime', '20:00');
      updateFilter('endTime', '06:00');
      // Crosses midnight!
      updateFilter('endDate', filters.startDate);
    } else if (type === 'full_day') {
      updateFilter('startTime', '10:00');
      updateFilter('endTime', '10:00');
      updateFilter('endDate', filters.startDate);
    }
  };

  return (
    <div className="relative bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-100 mb-8 overflow-hidden">
      {/* Decorative background aura */}
      <div
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: themeConfig.primary }}
      />

      {/* Hero Headline */}
      <div className="max-w-3xl mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Marketplace Oficial de Alojamientos en Paraguay</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Encontrá tu próxima escapada.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium leading-relaxed">
          Decinos cuándo, dónde, cuántas personas y qué necesitás. pyApy busca en todas las quintas y encuentra las mejores opciones para vos.
        </p>
        {language === 'es_gn' && (
          <p className="text-xs font-semibold text-amber-800/80 mt-1 italic">
            "Eheka tenda porã py\'aguapyrã ne pehẽnguekuéra ndive Paraguay-pe."
          </p>
        )}
      </div>

      {/* Primary Search Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/90 relative z-10">
        {/* 1. Departamento & Ciudad */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Zona / Ciudad</span>
          </label>
          <div className="space-y-1">
            <select
              value={filters.department}
              onChange={e => handleDepartmentChange(e.target.value)}
              className="w-full text-xs font-black text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {PARAGUAY_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select
              value={filters.city}
              onChange={e => updateFilter('city', e.target.value)}
              className="w-full text-[11px] font-medium text-slate-600 bg-transparent focus:outline-hidden cursor-pointer truncate"
            >
              <option value="Todas las ciudades">Todas las ciudades</option>
              {currentDept.cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Fecha */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Fecha de Salida</span>
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={e => {
              updateFilter('startDate', e.target.value);
              updateFilter('endDate', e.target.value);
            }}
            className="w-full text-xs font-black text-slate-900 bg-transparent focus:outline-hidden cursor-pointer pt-1"
          />
          <span className="text-[10px] text-slate-400 font-medium">Disponibilidad en vivo</span>
        </div>

        {/* 3. Horario / Turno */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Horario / Turno</span>
          </label>
          <select
            value={filters.bookingType}
            onChange={e => handleBookingTypeSelect(e.target.value as any)}
            className="w-full text-xs font-black text-slate-900 bg-transparent focus:outline-hidden cursor-pointer pt-0.5"
          >
            <option value="turn_day">☀️ Diurno (09:00 - 18:30)</option>
            <option value="turn_night">🌙 Nocturno (20:00 - 06:00)</option>
            <option value="full_day">🏡 Día Completo (24 horas)</option>
            <option value="custom">⏱️ Horario Personalizado</option>
          </select>
          <p className="text-[10px] text-slate-500 font-medium truncate mt-1">
            {filters.startTime} hs → {filters.endTime} hs {filters.endTime <= filters.startTime ? '(Cruza medianoche)' : ''}
          </p>
        </div>

        {/* 4. Cantidad de Personas */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Visitantes</span>
          </label>
          <div className="flex items-center justify-between pt-0.5">
            <input
              type="number"
              min={1}
              max={150}
              value={filters.guestCount}
              onChange={e => updateFilter('guestCount', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-xs font-black text-slate-900 bg-transparent focus:outline-hidden"
            />
            <span className="text-[11px] font-bold text-slate-500">personas</span>
          </div>
          <p className="text-[10px] text-slate-400">Familia o grupo</p>
        </div>

        {/* 5. Presupuesto Máximo */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span>Presupuesto Máx.</span>
          </label>
          <select
            value={filters.maxBudget ? String(filters.maxBudget) : 'any'}
            onChange={e => updateFilter('maxBudget', e.target.value === 'any' ? undefined : Number(e.target.value))}
            className="w-full text-xs font-black text-slate-900 bg-transparent focus:outline-hidden cursor-pointer pt-0.5"
          >
            <option value="any">Cualquier precio</option>
            <option value="800000">Hasta Gs. 800.000</option>
            <option value="1200000">Hasta Gs. 1.200.000</option>
            <option value="1800000">Hasta Gs. 1.800.000</option>
            <option value="2500000">Hasta Gs. 2.500.000</option>
            <option value="3500000">Hasta Gs. 3.500.000</option>
          </select>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">
            {filters.maxBudget ? formatGs(filters.maxBudget) : 'Sin límite fijado'}
          </p>
        </div>
      </div>

      {/* Feature & Amenities Chips Filter */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Servicios:</span>
          </span>
          {ALL_AMENITIES.map(amenity => {
            const isSelected = filters.selectedAmenities.includes(amenity.name);
            return (
              <button
                key={amenity.id}
                onClick={() => toggleAmenityFilter(amenity.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                <span>{amenity.name}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Stats */}
        <div className="text-xs font-medium text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            <strong>{availableMatches.length}</strong> disponibles para tu fecha (de {properties.length} quintas evaluadas)
          </span>
        </div>
      </div>
    </div>
  );
};
