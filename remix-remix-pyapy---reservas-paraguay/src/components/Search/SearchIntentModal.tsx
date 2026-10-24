import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiClient } from '../../services/apiClient';
import { ALL_AMENITIES } from '../../services/configService';
import {
  X,
  Bell,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Banknote,
  Phone,
  Sparkles
} from 'lucide-react';

export const SearchIntentModal: React.FC = () => {
  const {
    isSearchIntentModalOpen,
    setIsSearchIntentModalOpen,
    filters,
    themeConfig
  } = useApp();

  const [date, setDate] = useState(filters.startDate);
  const [department, setDepartment] = useState(filters.department);
  const [city, setCity] = useState(filters.city);
  const [guestCount, setGuestCount] = useState(filters.guestCount);
  const [maxBudget, setMaxBudget] = useState(filters.maxBudget ? String(filters.maxBudget) : '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isSearchIntentModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPhone.trim()) {
      alert('Por favor ingresá tu número de WhatsApp para notificarte.');
      return;
    }

    try {
      const res = await ApiClient.createSearchIntent({
        date,
        guestCount,
        department,
        city: city === 'Todas las ciudades' ? undefined : city,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        requestedFeatures: filters.selectedAmenities,
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim()
      });

      if (res.error) {
        alert(res.error);
        return;
      }
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Error al registrar búsqueda');
    }
  };

  const handleClose = () => {
    setIsSearchIntentModalOpen(false);
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Avísame si se Libera una Opción
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Radar de demanda insatisfecha pyApy
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

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed font-medium">
              Si una quinta cancela, habilita un nuevo turno o se registra un nuevo alojamiento en tu zona con tus requerimientos, te avisaremos al instante.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha deseada</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Personas</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={guestCount}
                  onChange={e => setGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ciudad preferida</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ej. Sanber, Altos, Piribebuy"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp de Contacto (Paraguay) *</label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="Ej. +595 981 123 456"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email (Opcional)</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="escapada@gmail.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold transition-all mt-2 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Guardar mi Solicitud en pyApy</span>
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-900">
              ¡Búsqueda Registrada con Éxito!
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tu solicitud fue agregada al radar de demanda de pyApy. Notificaremos a los anfitriones de {department} y te contactaremos por WhatsApp ({contactPhone}) ni bien se libere una opción.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer mt-2"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
