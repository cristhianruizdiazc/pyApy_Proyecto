import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import {
  X,
  Clock,
  Phone,
  Mail,
  User,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  BellRing
} from 'lucide-react';

export const WaitlistModal: React.FC = () => {
  const {
    isWaitlistModalOpen,
    setIsWaitlistModalOpen,
    activeProperty,
    filters
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+595 ');
  const [email, setEmail] = useState('');
  const [guestCount, setGuestCount] = useState(filters.guestCount || 6);
  const [date, setDate] = useState(filters.startDate);
  const [preferredShift, setPreferredShift] = useState('Diurno (10:00 a 19:00)');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isWaitlistModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      alert('Por favor complete los campos de contacto.');
      return;
    }

    await ApiClient.createSearchIntent({
      date,
      guestCount,
      contactPhone: phone,
      contactEmail: email,
      requestedFeatures: [activeProperty.name, preferredShift]
    });

    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsWaitlistModalOpen(false);
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                Lista de Espera Automática pyApy
              </h3>
              <p className="text-xs text-slate-400">
                Avisos instantáneos si se libera un horario o sector
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950">
                <p className="font-semibold leading-relaxed">
                  Te avisaremos por WhatsApp en el instante exacto en que se cancele o libere un turno para <strong>{activeProperty.name}</strong>.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Tu Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Elena Benítez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp para Avisos *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Correo Electrónico *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tu.correo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Fecha Deseada</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>Cantidad de Personas</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Turno o Franja Preferida</span>
                </label>
                <select
                  value={preferredShift}
                  onChange={(e) => setPreferredShift(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="Diurno (10:00 a 19:00)">☀️ Turno Diurno (10:00 a 19:00)</option>
                  <option value="Nocturno (20:00 a 06:00)">🌙 Turno Nocturno (20:00 a 06:00)</option>
                  <option value="Día Completo (24hs)">🏡 Día Completo / Fin de Semana</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Registrar en Lista de Espera</span>
              </button>
            </form>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                ¡Registrado en la Lista de Espera!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Tu solicitud ha sido agendada con prioridad. Te contactaremos inmediatamente al WhatsApp <strong>{phone}</strong> si se habilita un cupo.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Aceptar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
