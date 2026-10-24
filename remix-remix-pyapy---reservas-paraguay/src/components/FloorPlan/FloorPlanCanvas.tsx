import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FloorPlanUnit, UnitStatus } from '../../types';
import { formatGuaranies } from '../../utils/i18n';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  Clock,
  Sparkles,
  Flame,
  Waves,
  Home,
  Utensils,
  Car,
  ShieldAlert,
  CheckCircle2,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';

export const FloorPlanCanvas: React.FC = () => {
  const {
    activeProperty,
    selectedUnitIds,
    toggleUnitSelection,
    inspectingUnit,
    setInspectingUnit,
    filters,
    themeConfig,
    language,
    setIsBookingModalOpen,
    groupCombinations,
    applyGroupCombination
  } = useApp();

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag / Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof SVGElement && e.target.closest('.interactive-unit')) {
      return; // Don't drag if clicking unit
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Helper to determine effective display status for each unit based on filters
  const getUnitEffectiveStatus = (unit: FloorPlanUnit): { status: UnitStatus; reason?: string } => {
    if (selectedUnitIds.includes(unit.id)) {
      return { status: 'selected' };
    }
    if (unit.status === 'out_of_service') {
      return { status: 'out_of_service', reason: unit.notes || 'En mantenimiento temporal' };
    }
    if (unit.status === 'blocked') {
      return { status: 'blocked', reason: 'Bloqueado para evento privado' };
    }
    if (unit.status === 'occupied') {
      return { status: 'occupied', reason: `Ocupada hasta las ${unit.releaseTime || '18:00'} hs` };
    }
    if (unit.status === 'warning') {
      return { status: 'warning', reason: `Próxima a liberarse a las ${unit.releaseTime || '15:00'} hs` };
    }

    // Check capacity incompatibility if solo selection exceeds unit capacity and not in a group combination
    if (filters.guestCount > unit.capacity && unit.combinableWith.length === 0) {
      return { status: 'incompatible', reason: `Capacidad máx. (${unit.capacity} pers.) inferior a los ${filters.guestCount} solicitados` };
    }

    return { status: 'available' };
  };

  // Color mapping based on exact user prompt specification
  const getStatusColorStyles = (effStatus: UnitStatus) => {
    switch (effStatus) {
      case 'selected':
        return {
          fill: '#0284c7', // Cyan/Turquoise Sky
          stroke: '#0369a1',
          textBg: 'bg-sky-600 text-white',
          badgeText: 'Seleccionado',
          badgeColor: 'bg-sky-500 text-white',
          glow: 'ring-4 ring-sky-400/60 shadow-lg shadow-sky-500/40'
        };
      case 'available':
        return {
          fill: '#10b981', // Verde
          stroke: '#059669',
          textBg: 'bg-emerald-600 text-white',
          badgeText: 'Disponible',
          badgeColor: 'bg-emerald-600 text-white',
          glow: 'hover:ring-3 hover:ring-emerald-400'
        };
      case 'occupied':
        return {
          fill: '#ef4444', // Rojo
          stroke: '#b91c1c',
          textBg: 'bg-red-600 text-white',
          badgeText: 'Ocupada',
          badgeColor: 'bg-red-600 text-white',
          glow: ''
        };
      case 'warning':
        return {
          fill: '#f59e0b', // Amarillo / Naranja
          stroke: '#d97706',
          textBg: 'bg-amber-600 text-white',
          badgeText: 'Próx. Libre',
          badgeColor: 'bg-amber-500 text-slate-950 font-bold',
          glow: ''
        };
      case 'incompatible':
        return {
          fill: '#94a3b8', // Gris
          stroke: '#64748b',
          textBg: 'bg-slate-500 text-white',
          badgeText: 'No Compatible',
          badgeColor: 'bg-slate-500 text-white',
          glow: ''
        };
      case 'out_of_service':
      case 'blocked':
      default:
        return {
          fill: '#334155', // Gris oscuro / Negro
          stroke: '#1e293b',
          textBg: 'bg-slate-800 text-slate-300',
          badgeText: 'Fuera de Servicio',
          badgeColor: 'bg-slate-800 text-slate-300',
          glow: ''
        };
    }
  };

  const getZoneIcon = (zoneType: FloorPlanUnit['zoneType']) => {
    switch (zoneType) {
      case 'piscina':
        return <Waves className="w-3.5 h-3.5" />;
      case 'quincho':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'parrilla_tatakua':
        return <Flame className="w-3.5 h-3.5" />;
      case 'bungalow':
      case 'casa_principal':
        return <Home className="w-3.5 h-3.5" />;
      case 'estacionamiento':
        return <Car className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // Calculate total price of selected units
  const totalSelectedPricePyg = useMemo(() => {
    if (!activeProperty?.units) return 0;
    const isTurn = filters.bookingType === 'turn_day' || filters.bookingType === 'turn_night';
    return activeProperty.units
      .filter(u => selectedUnitIds.includes(u.id))
      .reduce((acc, u) => acc + (isTurn && u.pricePerTurn ? u.pricePerTurn : u.pricePerDay), 0);
  }, [activeProperty, selectedUnitIds, filters.bookingType]);

  const totalSelectedCapacity = useMemo(() => {
    if (!activeProperty?.units) return 0;
    return activeProperty.units
      .filter(u => selectedUnitIds.includes(u.id))
      .reduce((acc, u) => acc + u.capacity, 0);
  }, [activeProperty, selectedUnitIds]);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-100 mb-8 transition-all">
      {/* Header Bar with Title, Selection Summary, and Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: themeConfig.primary }}
            />
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              Plano de Ubicación & Disponibilidad Espacial
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pulsá sobre cada sector para consultar disponibilidad exacta, horas de liberación y fotos.
          </p>
        </div>

        {/* Zoom & Reset Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
            title="Acercar plano"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
            title="Alejar plano"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1"
            title="Restablecer vista"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>100%</span>
          </button>
        </div>
      </div>

      {/* Group Combination Banner (if 10+ guests and options found) */}
      {filters.guestCount >= 8 && groupCombinations.length > 0 && (
        <div className="my-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Opciones de Combinación para {filters.guestCount} personas:</span>
            </div>
            <span className="text-[11px] font-bold text-amber-800">
              {groupCombinations.length} {groupCombinations.length === 1 ? 'opción válida' : 'opciones válidas'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {groupCombinations.slice(0, 3).map((combo) => {
              const isComboSelected = combo.unitIds.every(id => selectedUnitIds.includes(id));
              return (
                <button
                  key={combo.id}
                  onClick={() => applyGroupCombination(combo)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isComboSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-sm'
                      : 'bg-white text-slate-800 border-amber-200/80 hover:bg-amber-100/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>{combo.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-300">
                        Cap. {combo.totalCapacity}p
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-0.5">
                      {combo.description}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-emerald-800">
                      {formatGuaranies(combo.totalPricePerTurn)} /turno
                    </span>
                    <span className="underline font-bold">
                      {isComboSelected ? '✓ Seleccionado' : 'Elegir esta unión'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Floor Plan Interactive Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-inner cursor-grab active:cursor-grabbing select-none"
      >
        {/* Background Grass and Stone Layout Texture */}
        <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black opacity-90" />

        {/* Spatial Grid Texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* SVG Architectural Canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <svg
            viewBox="0 0 1000 850"
            className="w-[950px] h-[800px] overflow-visible"
          >
            <defs>
              {/* Pool water gradient & pattern */}
              <linearGradient id="poolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              {/* Grass pattern */}
              <pattern id="gardenPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#064e3b" opacity="0.3" />
                <circle cx="10" cy="10" r="1.5" fill="#047857" opacity="0.2" />
              </pattern>

              {/* Glowing filters */}
              <filter id="unitGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Perimeter & Property Boundary */}
            <rect
              x="20"
              y="20"
              width="960"
              height="800"
              rx="30"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="4"
              strokeDasharray="12 6"
            />

            {/* Property Label in Floor Plan */}
            <text
              x="50"
              y="60"
              fill="#94a3b8"
              fontSize="16"
              fontWeight="bold"
              letterSpacing="2"
            >
              📍 {activeProperty.name.toUpperCase()} • {activeProperty.city.toUpperCase()}
            </text>

            {/* Garden and Walking Path lines */}
            <path
              d="M 430,220 L 430,360 L 270,360 M 640,360 L 770,360 M 350,560 L 350,610 M 580,360 L 580,600"
              stroke="#475569"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="4 8"
              fill="none"
              opacity="0.4"
            />

            {/* Render Group Combination Joining Lines */}
            {selectedUnitIds.length > 1 && (
              <g className="combination-lines" opacity="0.8">
                {activeProperty.units
                  .filter(u => selectedUnitIds.includes(u.id))
                  .map((u1, i, arr) => {
                    const u2 = arr[(i + 1) % arr.length];
                    return (
                      <line
                        key={`line-${u1.id}-${u2.id}`}
                        x1={u1.x + u1.width / 2}
                        y1={u1.y + u1.height / 2}
                        x2={u2.x + u2.width / 2}
                        y2={u2.y + u2.height / 2}
                        stroke="#38bdf8"
                        strokeWidth="5"
                        strokeDasharray="8 6"
                        className="animate-pulse"
                      />
                    );
                  })}
              </g>
            )}

            {/* Render Each Unit on Real Spatial Coordinate */}
            {activeProperty.units.map((unit) => {
              const { status: effStatus, reason } = getUnitEffectiveStatus(unit);
              const colorStyles = getStatusColorStyles(effStatus);
              const isSelected = selectedUnitIds.includes(unit.id);
              const isInspecting = inspectingUnit?.id === unit.id;

              return (
                <g
                  key={unit.id}
                  className="interactive-unit cursor-pointer transition-all duration-300"
                  onClick={() => {
                    setInspectingUnit(unit);
                  }}
                  transform={`translate(${unit.x}, ${unit.y})`}
                >
                  {/* Shape Rendering */}
                  {unit.shape === 'pool' ? (
                    // Pool shape with rounded organic corners
                    <rect
                      x="0"
                      y="0"
                      width={unit.width}
                      height={unit.height}
                      rx="35"
                      fill={colorStyles.fill}
                      stroke={isSelected ? '#ffffff' : colorStyles.stroke}
                      strokeWidth={isSelected ? '5' : '3'}
                      opacity={effStatus === 'out_of_service' ? '0.5' : '0.95'}
                      filter={isSelected ? 'url(#unitGlow)' : undefined}
                    />
                  ) : unit.shape === 'circle' ? (
                    <circle
                      cx={unit.width / 2}
                      cy={unit.height / 2}
                      r={unit.width / 2}
                      fill={colorStyles.fill}
                      stroke={isSelected ? '#ffffff' : colorStyles.stroke}
                      strokeWidth={isSelected ? '5' : '3'}
                      opacity={effStatus === 'out_of_service' ? '0.5' : '0.95'}
                      filter={isSelected ? 'url(#unitGlow)' : undefined}
                    />
                  ) : (
                    // Standard rectangle or square
                    <rect
                      x="0"
                      y="0"
                      width={unit.width}
                      height={unit.height}
                      rx="18"
                      fill={colorStyles.fill}
                      stroke={isSelected ? '#ffffff' : colorStyles.stroke}
                      strokeWidth={isSelected ? '5' : '3'}
                      opacity={effStatus === 'out_of_service' ? '0.5' : '0.95'}
                      filter={isSelected ? 'url(#unitGlow)' : undefined}
                    />
                  )}

                  {/* Inner Details: Unit Number & Name */}
                  <foreignObject x="8" y="8" width={unit.width - 16} height={unit.height - 16}>
                    <div className="w-full h-full flex flex-col justify-between text-white p-2">
                      <div className="flex items-start justify-between gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[11px] font-black tracking-wider">
                          #{unit.unitNumber}
                        </span>
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md text-[11px] font-bold">
                          <Users className="w-3 h-3 text-amber-300" />
                          <span>{unit.capacity}p</span>
                        </div>
                      </div>

                      <div className="text-center my-auto">
                        <div className="flex items-center justify-center gap-1 font-black text-xs sm:text-sm drop-shadow-md leading-tight">
                          {getZoneIcon(unit.zoneType)}
                          <span className="line-clamp-2">{unit.name}</span>
                        </div>

                        {/* Status Label Pill */}
                        <div className="mt-1 flex items-center justify-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs ${colorStyles.badgeColor}`}>
                            {colorStyles.badgeText}
                          </span>
                        </div>

                        {/* Release time tag if occupied/warning */}
                        {(effStatus === 'occupied' || effStatus === 'warning') && unit.releaseTime && (
                          <div className="mt-1 flex items-center justify-center gap-1 text-[10px] bg-black/60 px-1.5 py-0.5 rounded-md text-amber-300 font-semibold">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Libre: {unit.releaseTime} hs</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/90 font-bold">
                        <span>{unit.pricePerTurn ? `${formatGuaranies(unit.pricePerTurn)}/t` : 'Sin costo'}</span>
                        <span className="underline opacity-80 hover:opacity-100">Info &gt;</span>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Mobile touch guidance notice */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold flex items-center gap-1.5 pointer-events-none border border-white/10">
          <Maximize2 className="w-3 h-3 text-amber-400" />
          <span>Arrastrá para mover • Usá +/- para zoom</span>
        </div>
      </div>

      {/* Visible Color Legend (Exact user requirement) */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
          Leyenda de Estados y Colores en Vivo:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 shrink-0" />
            <div>
              <strong className="block text-emerald-950 font-bold text-[11px]">Verde</strong>
              <span className="text-[10px] text-emerald-800">Disponible</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50 border border-red-200">
            <span className="w-3.5 h-3.5 rounded-md bg-red-600 shrink-0" />
            <div>
              <strong className="block text-red-950 font-bold text-[11px]">Rojo</strong>
              <span className="text-[10px] text-red-800">Ocupada / Con hora</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0" />
            <div>
              <strong className="block text-amber-950 font-bold text-[11px]">Amarillo</strong>
              <span className="text-[10px] text-amber-800">Próx. a liberarse</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-50 border border-sky-200">
            <span className="w-3.5 h-3.5 rounded-md bg-sky-600 shrink-0" />
            <div>
              <strong className="block text-sky-950 font-bold text-[11px]">Azul / Turquesa</strong>
              <span className="text-[10px] text-sky-800">Seleccionada</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-500 shrink-0" />
            <div>
              <strong className="block text-slate-800 font-bold text-[11px]">Gris</strong>
              <span className="text-[10px] text-slate-600">No compatible</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 text-white border border-slate-800">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-700 shrink-0" />
            <div>
              <strong className="block text-slate-200 font-bold text-[11px]">Gris Oscuro</strong>
              <span className="text-[10px] text-slate-400">Fuera de servicio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Selection Bar (If any unit is selected) */}
      {selectedUnitIds.length > 0 && (
        <div className="sticky bottom-4 z-30 mt-6 p-4 rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[11px] font-black">
                {selectedUnitIds.length} {selectedUnitIds.length === 1 ? 'sector seleccionado' : 'sectores seleccionados'}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Capacidad Total: <strong className="text-amber-300">{totalSelectedCapacity} personas</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {activeProperty.units
                .filter(u => selectedUnitIds.includes(u.id))
                .map(u => u.name)
                .join(' + ')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">
                Total Estimado
              </span>
              <strong className="text-base sm:text-lg text-emerald-400 font-black">
                {formatGuaranies(totalSelectedPricePyg)}
              </strong>
            </div>

            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
            >
              <span>Continuar a Reserva</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
