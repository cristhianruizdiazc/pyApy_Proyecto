import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { formatGs } from '../../services/configService';
import { Reservation } from '../../types';
import {
  X,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Ban
} from 'lucide-react';

export const LookupReservationModal: React.FC = () => {
  const {
    isLookupModalOpen,
    setIsLookupModalOpen,
    themeConfig,
    userRole,
    userName
  } = useApp();

  const [locatorInput, setLocatorInput] = useState('');
  const [verifInput, setVerifInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [foundReservation, setFoundReservation] = useState<Reservation | null>(null);

  // Cancellation sub-flow
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  if (!isLookupModalOpen) return null;

  const [isSearching, setIsSearching] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setShowCancelPrompt(false);
    setCancelSuccess(false);

    if (!locatorInput.trim() || !verifInput.trim()) {
      setSearchError('Ingresá el código localizador y tu teléfono o cédula para verificar tu identidad.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await ApiClient.lookupReservation(locatorInput.trim(), verifInput.trim());
      if (res.data?.reservation) {
        setFoundReservation(res.data.reservation);
        setIsSearching(false);
        return;
      }
      setFoundReservation(null);
      setSearchError(res.error || 'No se encontró la reserva con los datos proporcionados.');
    } catch (err: any) {
      setFoundReservation(null);
      setSearchError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundReservation) return;
    if (!cancelReason.trim()) {
      alert('Por favor ingresá el motivo de la cancelación.');
      return;
    }

    setIsCancelling(true);
    try {
      const apiRes = await ApiClient.cancelReservation(foundReservation.id, cancelReason.trim(), verifInput.trim());
      if (apiRes.data?.success && apiRes.data.updatedReservation) {
        setFoundReservation({ ...apiRes.data.updatedReservation });
        setShowCancelPrompt(false);
        setCancelSuccess(true);
        setIsCancelling(false);
        return;
      }

      alert(apiRes.error || 'No se pudo cancelar la reserva.');
    } catch (err: any) {
      alert(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    setIsLookupModalOpen(false);
    setLocatorInput('');
    setVerifInput('');
    setSearchError('');
    setFoundReservation(null);
    setShowCancelPrompt(false);
    setCancelSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm"
              style={{ backgroundColor: themeConfig.primary }}
            >
              py
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Consultar & Gestionar Reserva
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Acceso seguro mediante Localizador Oficial
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Código Localizador de Reserva *
            </label>
            <input
              type="text"
              required
              value={locatorInput}
              onChange={e => setLocatorInput(e.target.value.toUpperCase())}
              placeholder="Ej. PY-2026-QK894"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-mono font-black text-sm uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Verificación de Identidad (Teléfono WhatsApp o Cédula) *
            </label>
            <input
              type="text"
              required
              value={verifInput}
              onChange={e => setVerifInput(e.target.value)}
              placeholder="Ej. 0981... o 3.421..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
            />
          </div>

          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{searchError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Buscar Reserva</span>
          </button>
        </form>

        {/* Found Reservation Display */}
        {foundReservation && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Localizador
                </span>
                <span className="text-base font-black font-mono text-slate-900">
                  {foundReservation.locator}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    foundReservation.reservationStatus === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : foundReservation.reservationStatus === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : foundReservation.reservationStatus === 'completed'
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {foundReservation.reservationStatus === 'confirmed' ? 'Confirmada' : foundReservation.reservationStatus}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Origen: {foundReservation.origin}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-bold text-slate-900 text-sm">{foundReservation.propertyName}</p>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fecha: <strong>{foundReservation.startDate}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Horario: <strong>{foundReservation.startTime} a {foundReservation.endTime} hs</strong> ({foundReservation.turnName})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Titular: <strong>{foundReservation.clientName}</strong> ({foundReservation.guestCount} personas)</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-baseline">
                <span className="text-slate-500 font-medium">Monto Total:</span>
                <span className="text-sm font-black text-slate-900">
                  {formatGs(foundReservation.totalAmountPyg)}
                </span>
              </div>
            </div>

            {/* Cancellation Status or Cancel Button */}
            {foundReservation.reservationStatus === 'cancelled' ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                <p className="font-bold">Esta reserva fue cancelada</p>
                <p>Motivo: {foundReservation.cancellationReason}</p>
                <p className="text-[10px] text-rose-600 mt-1">Por: {foundReservation.cancelledBy}</p>
              </div>
            ) : !showCancelPrompt ? (
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancelar esta reserva</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCancelReservation} className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                <span className="font-bold text-rose-900 text-xs block">
                  ¿Confirmás que deseás cancelar esta reserva?
                </span>
                <textarea
                  required
                  rows={2}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Por favor detallá el motivo de la cancelación..."
                  className="w-full p-2 bg-white rounded-lg border border-rose-200 text-xs focus:outline-hidden text-slate-900"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirmar Cancelación
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
              </form>
            )}

            {cancelSuccess && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs">
                ✓ Reserva cancelada y registrada en auditoría. El horario quedó liberado en el calendario.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
