import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { FloorPlanUnit } from '../../types';
import {
  X,
  Plus,
  Save,
  Trash2,
  Move,
  Users,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  Home,
  Utensils,
  Flame,
  Waves,
  Car,
  Image as ImageIcon
} from 'lucide-react';
import { formatGuaranies } from '../../utils/i18n';

export const FloorPlanEditor: React.FC = () => {
  const {
    isFloorPlanEditorOpen,
    setIsFloorPlanEditorOpen,
    activeProperty,
    reloadProperties,
    userRole,
    userName
  } = useApp();

  const [units, setUnits] = useState<FloorPlanUnit[]>(() => JSON.parse(JSON.stringify(activeProperty.units)));
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isFloorPlanEditorOpen) return null;

  const currentUnit = units[selectedUnitIndex] || units[0];

  const handleUpdateCurrentUnit = (field: keyof FloorPlanUnit, value: any) => {
    setUnits(prev => {
      const copy = [...prev];
      copy[selectedUnitIndex] = {
        ...copy[selectedUnitIndex],
        [field]: value
      };
      return copy;
    });
  };

  const handleAddNewUnit = () => {
    const nextNum = units.length + 1;
    const newUnit: FloorPlanUnit = {
      id: `u-custom-${Date.now()}`,
      propertyId: activeProperty.id,
      unitNumber: `${nextNum}`,
      name: `Nuevo Sector #${nextNum}`,
      zoneType: 'quincho',
      shape: 'rectangle',
      x: 200,
      y: 200,
      width: 200,
      height: 140,
      capacity: 8,
      status: 'available',
      pricePerDay: 700000,
      pricePerTurn: 450000,
      cleaningBufferMinutes: 30,
      features: ['Iluminación', 'Mesa y sillas', 'Parrilla'],
      description: 'Nuevo espacio agregado con el editor sin código.',
      photos: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'],
      combinableWith: []
    };

    setUnits(prev => [...prev, newUnit]);
    setSelectedUnitIndex(units.length);
  };

  const handleDeleteCurrentUnit = () => {
    if (units.length <= 1) {
      alert('Debe existir al menos un sector en el plano.');
      return;
    }
    setUnits(prev => prev.filter((_, idx) => idx !== selectedUnitIndex));
    setSelectedUnitIndex(0);
  };

  const handleSaveFloorPlan = async () => {
    try {
      const res = await ApiClient.createProperty({ ...activeProperty, units });
      if (res.error) {
        alert(res.error);
        return;
      }
      await reloadProperties();
      setSaveMessage('¡Plano guardado y publicado en vivo para los clientes!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al guardar plano');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[96vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Editor Visual del Plano sin Código
              </h3>
              <p className="text-xs text-slate-400">
                Añadí, reubicá y configurá sectores de <strong>{activeProperty.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveFloorPlan}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>

            <button
              onClick={() => setIsFloorPlanEditorOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save message notice */}
        {saveMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-2 text-xs font-bold text-center">
            {saveMessage}
          </div>
        )}

        {/* Workspace Body: Left Preview, Right Properties Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Visual Interactive Canvas Preview */}
          <div className="lg:col-span-7 p-4 bg-slate-950 border-r border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">
                Vista Previa Interactiva (Arrastrá o seleccioná para editar):
              </span>
              <button
                onClick={handleAddNewUnit}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir Sector</span>
              </button>
            </div>

            {/* SVG Visual Canvas with select box */}
            <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 1000 850" className="w-full h-full">
                <rect x="20" y="20" width="960" height="800" rx="30" fill="#0b1329" stroke="#334155" strokeWidth="4" />

                {units.map((unit, idx) => {
                  const isCur = idx === selectedUnitIndex;
                  return (
                    <g
                      key={unit.id}
                      onClick={() => setSelectedUnitIndex(idx)}
                      className="cursor-pointer"
                      transform={`translate(${unit.x}, ${unit.y})`}
                    >
                      <rect
                        x="0"
                        y="0"
                        width={unit.width}
                        height={unit.height}
                        rx={unit.shape === 'pool' ? 35 : unit.shape === 'circle' ? unit.width / 2 : 18}
                        fill={isCur ? '#0284c7' : '#10b981'}
                        stroke={isCur ? '#ffffff' : '#059669'}
                        strokeWidth={isCur ? 4 : 2}
                        opacity="0.9"
                      />
                      <text
                        x={unit.width / 2}
                        y={unit.height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        #{unit.unitNumber} {unit.name.slice(0, 14)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Properties Editor Panel */}
          {currentUnit && (
            <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-900 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Sector Seleccionado</span>
                  <h4 className="text-base font-black text-slate-100">
                    #{currentUnit.unitNumber} - {currentUnit.name}
                  </h4>
                </div>
                <button
                  onClick={handleDeleteCurrentUnit}
                  className="p-2 rounded-xl bg-red-950 text-red-400 hover:bg-red-900 border border-red-800"
                  title="Eliminar sector"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Spatial Coordinates & Dimensions Sliders */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <span className="font-extrabold text-slate-300 block">Posición & Dimensiones en el Plano</span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block">Posición X ({currentUnit.x}px)</label>
                    <input
                      type="range"
                      min="20"
                      max="750"
                      value={currentUnit.x}
                      onChange={(e) => handleUpdateCurrentUnit('x', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block">Posición Y ({currentUnit.y}px)</label>
                    <input
                      type="range"
                      min="20"
                      max="650"
                      value={currentUnit.y}
                      onChange={(e) => handleUpdateCurrentUnit('y', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block">Ancho ({currentUnit.width}px)</label>
                    <input
                      type="range"
                      min="100"
                      max="450"
                      value={currentUnit.width}
                      onChange={(e) => handleUpdateCurrentUnit('width', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block">Alto ({currentUnit.height}px)</label>
                    <input
                      type="range"
                      min="80"
                      max="350"
                      value={currentUnit.height}
                      onChange={(e) => handleUpdateCurrentUnit('height', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* General Parameters */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block">Nombre del Sector</label>
                  <input
                    type="text"
                    value={currentUnit.name}
                    onChange={(e) => handleUpdateCurrentUnit('name', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block">Tipo de Zona</label>
                    <select
                      value={currentUnit.zoneType}
                      onChange={(e) => handleUpdateCurrentUnit('zoneType', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="quincho">Quincho</option>
                      <option value="piscina">Piscina</option>
                      <option value="casa_principal">Casa Principal</option>
                      <option value="bungalow">Bungalow</option>
                      <option value="parrilla_tatakua">Parrilla / Tatakuá</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block">Forma Geométrica</label>
                    <select
                      value={currentUnit.shape}
                      onChange={(e) => handleUpdateCurrentUnit('shape', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    >
                      <option value="rectangle">Rectangular</option>
                      <option value="pool">Piscina Curva</option>
                      <option value="circle">Circular / Gazebo</option>
                      <option value="l_shape">En L / Quincho</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block">Capacidad (Personas)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={currentUnit.capacity}
                      onChange={(e) => handleUpdateCurrentUnit('capacity', parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block">Buffer Limpieza (min)</label>
                    <input
                      type="number"
                      value={currentUnit.cleaningBufferMinutes}
                      onChange={(e) => handleUpdateCurrentUnit('cleaningBufferMinutes', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block">Tarifa por Turno (₲)</label>
                    <input
                      type="number"
                      value={currentUnit.pricePerTurn || 0}
                      onChange={(e) => handleUpdateCurrentUnit('pricePerTurn', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block">Tarifa Día Completo (₲)</label>
                    <input
                      type="number"
                      value={currentUnit.pricePerDay}
                      onChange={(e) => handleUpdateCurrentUnit('pricePerDay', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
