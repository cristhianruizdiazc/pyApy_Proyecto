import React from 'react';
import { useApp } from '../../context/AppContext';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { UnitDetailModal } from './UnitDetailModal';
import {
  X,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatGs } from '../../services/configService';

export const FloorPlanModal: React.FC = () => {
  const {
    isFloorPlanModalOpen,
    setIsFloorPlanModalOpen,
    activeProperty,
    selectedUnits,
    selectedUnitIds,
    setSelectedUnitIds,
    setSelectedPropertyForBooking,
    setIsBookingModalOpen
  } = useApp();

  const [inspectUnit, setInspectUnit] = React.useState<any>(null);

  if (!isFloorPlanModalOpen || !activeProperty) return null;

  const totalSelectedCapacity = selectedUnits.reduce((sum, u) => sum + u.capacity, 0);
  const totalSelectedPriceTurn = selectedUnits.reduce((sum, u) => sum + (u.pricePerTurn || u.pricePerDay * 0.65), 0);

  const handleBookSelected = () => {
    setSelectedPropertyForBooking(activeProperty);
    setIsBookingModalOpen(true);
    setIsFloorPlanModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">{activeProperty.name}</h3>
              <p className="text-xs text-slate-400">
                Croquis Interactivo de Dependencias ({activeProperty.city}, {activeProperty.department})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFloorPlanModalOpen(false)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Floor Plan Area */}
        <div className="flex-1 min-h-[420px] bg-slate-100 relative">
          <FloorPlanCanvas onInspectUnit={unit => setInspectUnit(unit)} />
        </div>

        {/* Bottom Selection Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-600">
              Seleccionados: <strong>{selectedUnitIds.length}</strong> sectores
            </span>
            {selectedUnitIds.length > 0 && (
              <div className="flex items-center gap-2 text-slate-700">
                <span>Capacidad combinada: <strong>{totalSelectedCapacity} personas</strong></span>
                <span>• Subtotal: <strong>{formatGs(totalSelectedPriceTurn)}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedUnitIds.length > 0 && (
              <button
                onClick={() => setSelectedUnitIds([])}
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Limpiar Selección
              </button>
            )}
            <button
              onClick={handleBookSelected}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all cursor-pointer shadow-sm"
            >
              Reservar este Alojamiento
            </button>
          </div>
        </div>
      </div>

      {inspectUnit && (
        <UnitDetailModal unit={inspectUnit} onClose={() => setInspectUnit(null)} />
      )}
    </div>
  );
};
