import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { formatGs } from '../../services/configService';
import { Reservation, PropertyTurn } from '../../types';
import {
  X,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Phone,
  MessageCircle,
  Share2,
  Sparkles
} from 'lucide-react';

export const BookingModal: React.FC = () => {
  const {
    isBookingModalOpen,
    setIsBookingModalOpen,
    selectedPropertyForBooking,
    filters,
    themeConfig,
    userSession
  } = useApp();

  const property = selectedPropertyForBooking;

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);
  const [ownerNotificationMsg, setOwnerNotificationMsg] = useState<string>('');
  const [copiedLocator, setCopiedLocator] = useState(false);
  const [bookingError, setBookingError] = useState<string>('');

  // Form Fields
  const [selectedTurnId, setSelectedTurnId] = useState<string>(
    property?.allowedTurns[0]?.id || ''
  );
  const [startDate, setStartDate] = useState<string>(filters.startDate);
  const [guestCount, setGuestCount] = useState<number>(filters.guestCount);
  const [clientName, setClientName] = useState<string>(userSession.name !== 'Visitante Invitado' ? userSession.name : '');
  const [clientDoc, setClientDoc] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>(userSession.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(userSession.email || '');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  if (!isBookingModalOpen || !property) return null;

  const selectedTurn: PropertyTurn =
    property.allowedTurns.find(t => t.id === selectedTurnId) || property.allowedTurns[0];

  const totalAmount = selectedTurn ? selectedTurn.pricePyg : property.pricePerTurn;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!clientName.trim() || !clientDoc.trim() || !clientPhone.trim()) {
      setBookingError('Por favor completá tu nombre, cédula/documento y número de WhatsApp.');
      return;
    }

    const crossesMidnight = selectedTurn.crossesMidnight ?? (selectedTurn.endTime <= selectedTurn.startTime);

    setIsSubmitting(true);
    try {
      // 1. Authoritative Backend Atomic Reservation Call
      const apiRes = await ApiClient.createReservation({
        propertyId: property.id,
        turnId: selectedTurn.id,
        startDate,
        startTime: selectedTurn.startTime,
        endTime: selectedTurn.endTime,
        guestCount,
        clientName: clientName.trim(),
        clientDoc: clientDoc.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        specialRequests: specialRequests.trim(),
        idempotencyKey: `idem_${property.id}_${startDate}_${selectedTurn.id}_${clientPhone.trim().replace(/[^0-9]/g, '')}`
      });

      if (apiRes.data?.success && apiRes.data.reservation) {
        setCreatedReservation(apiRes.data.reservation);
        setOwnerNotificationMsg(apiRes.data.ownerNotificationMessage || '');
        setStep('success');
        setIsSubmitting(false);
        return;
      }

      setBookingError(apiRes.error || 'No se pudo confirmar la reserva en el servidor autoritativo de pyApy.');
    } catch (err: any) {
      setBookingError(err.message || 'Error de conexión con el servidor autoritativo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLocator = () => {
    if (createdReservation) {
      navigator.clipboard.writeText(createdReservation.locator);
      setCopiedLocator(true);
      setTimeout(() => setCopiedLocator(false), 2500);
    }
  };

  const handleClose = () => {
    setIsBookingModalOpen(false);
    setStep('form');
    setCreatedReservation(null);
    setBookingError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm"
              style={{ backgroundColor: themeConfig.primary }}
            >
              py
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {step === 'form' ? 'Reserva Segura en pyApy' : '¡Reserva Confirmada Exitosamente!'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {property.name} ({property.city})
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

        {/* STEP 1: FORM */}
        {step === 'form' && (
          <form onSubmit={handleConfirmBooking} className="mt-5 space-y-5">
            {/* Selected Turn & Date Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Detalles de tu Salida
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  Sin comisión oculta
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-slate-200 font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Turno / Horario</label>
                  <select
                    value={selectedTurnId}
                    onChange={e => setSelectedTurnId(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-slate-200 font-black text-slate-900"
                  >
                    {property.allowedTurns.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.startTime} - {t.endTime} hs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                <span className="text-slate-600 font-medium">
                  Huéspedes máximos permitidos: {property.capacity} personas
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Asistirán:</span>
                  <input
                    type="number"
                    min={1}
                    max={property.capacity}
                    value={guestCount}
                    onChange={e => setGuestCount(Math.min(property.capacity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-14 p-1 text-center bg-white rounded-lg border border-slate-200 font-black text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Client Credentials Form */}
            <div className="space-y-3 text-xs">
              <span className="text-xs font-bold text-slate-900 block">
                Datos del Titular de la Reserva:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ej. Martín Bogado"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cédula de Identidad o Pasaporte *</label>
                  <input
                    type="text"
                    required
                    value={clientDoc}
                    onChange={e => setClientDoc(e.target.value)}
                    placeholder="Ej. 4.120.334"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp (Paraguay) *</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="Ej. +595 981 123 456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email de Contacto</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="martin@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Requerimientos Especiales (Opcional)
                </label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Ej. Llegan a las 10:00 hs, solicitan leña para tatakuá o hielo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Error banner */}
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Price & Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total a Pagar
                </span>
                <span className="text-xl font-black text-slate-900">
                  {formatGs(totalAmount)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Origen certificado: pyApy
                </span>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl text-xs font-black text-white shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
                style={{ backgroundColor: themeConfig.primary }}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Confirmar Reserva Ahora</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SUCCESS & NOTIFICATION DISPLAY */}
        {step === 'success' && createdReservation && (
          <div className="mt-5 space-y-5 animate-in fade-in">
            {/* Success icon & locator */}
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Código Localizador Oficial
                </span>
                <div className="inline-flex items-center gap-2 px-4 py-2 mt-1 bg-white rounded-xl border border-emerald-300 shadow-2xs">
                  <span className="text-lg font-black text-slate-900 tracking-wider font-mono">
                    {createdReservation.locator}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLocator}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                    title="Copiar código"
                  >
                    {copiedLocator ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-emerald-900 font-medium max-w-md mx-auto leading-relaxed">
                Guardá este código para consultar o gestionar tu reserva en cualquier momento desde el botón "Consultar Reserva" en pyApy.
              </p>
            </div>

            {/* Notification to Owner message simulation */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Notificación pyApy enviada al Anfitrión</span>
                </span>
                <span className="text-[10px] text-slate-400">WhatsApp Oficial</span>
              </div>
              <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {ownerNotificationMsg}
              </pre>
              <p className="text-[10px] text-slate-400 italic">
                * Esta reserva quedó registrada con origen oficial "pyApy" en el calendario del anfitrión.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={`https://wa.me/?text=¡Hola!%20Reservé%20la%20quinta%20${encodeURIComponent(createdReservation.propertyName)}%20en%20pyApy%20para%20el%20${createdReservation.startDate}.%20Código%20de%20reserva:%20${createdReservation.locator}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir con el Grupo de Amigos / Familia</span>
              </a>
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Finalizar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
