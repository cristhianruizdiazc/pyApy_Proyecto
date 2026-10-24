import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import {
  X,
  ShieldCheck,
  Building2,
  User,
  KeyRound,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    properties,
    themeConfig
  } = useApp();

  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  // Host form
  const [selectedPropId, setSelectedPropId] = useState(properties[0]?.id || '');
  const [hostEmail, setHostEmail] = useState('');
  const [hostSecret, setHostSecret] = useState('');
  const [hostError, setHostError] = useState('');

  // Customer form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custError, setCustError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsLoading(true);
    const res = await AuthService.loginAsAdmin(adminPin.trim());
    setIsLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
      setAdminPin('');
    } else {
      setAdminError(res.error || 'Código incorrecto o no autorizado.');
    }
  };

  const handleHostLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setHostError('');
    if (!hostSecret.trim()) {
      setHostError('Por favor ingresá la contraseña o clave del anfitrión.');
      return;
    }
    const prop = properties.find(p => p.id === selectedPropId) || properties[0];
    if (prop) {
      setIsLoading(true);
      const res = await AuthService.loginAsHost(hostEmail || prop.hostEmail, prop.id, hostSecret.trim());
      setIsLoading(false);
      if (res.success) {
        setIsAuthModalOpen(false);
        setHostSecret('');
      } else {
        setHostError(res.error || 'Credenciales de anfitrión incorrectas.');
      }
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustError('');
    if (!custName.trim() || !custPhone.trim()) {
      setCustError('Por favor ingresá tu nombre y número de WhatsApp.');
      return;
    }
    setIsLoading(true);
    const res = await AuthService.loginAsCustomer(custName.trim(), custPhone.trim(), custEmail.trim());
    setIsLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setCustError(res.error || 'No se pudo iniciar sesión.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm"
              style={{ backgroundColor: themeConfig.primary }}
            >
              py
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Acceso a Portales pyApy
              </h3>
              <p className="text-xs text-slate-500">
                Seleccioná tu tipo de cuenta
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setAuthModalMode('customer')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authModalMode === 'customer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Huésped</span>
          </button>
          <button
            onClick={() => setAuthModalMode('host')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authModalMode === 'host'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Anfitrión</span>
          </button>
          <button
            onClick={() => setAuthModalMode('admin')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              authModalMode === 'admin'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin</span>
          </button>
        </div>

        {/* Customer Mode */}
        {authModalMode === 'customer' && (
          <form onSubmit={handleCustomerLogin} className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Iniciá sesión como huésped para guardar quintas favoritas y recibir alertas de escapadas en tu WhatsApp.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre y Apellido</label>
              <input
                type="text"
                required
                value={custName}
                onChange={e => setCustName(e.target.value)}
                placeholder="Ej. Juan Carlos López"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp (Paraguay)</label>
              <input
                type="tel"
                required
                value={custPhone}
                onChange={e => setCustPhone(e.target.value)}
                placeholder="Ej. +595 981 123 456"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email (Opcional)</label>
              <input
                type="email"
                value={custEmail}
                onChange={e => setCustEmail(e.target.value)}
                placeholder="juan@gmail.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            {custError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{custError}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold transition-all mt-2 cursor-pointer shadow-sm"
            >
              {isLoading ? 'Verificando sesión...' : 'Continuar como Huésped'}
            </button>
          </form>
        )}

        {/* Host Mode */}
        {authModalMode === 'host' && (
          <form onSubmit={handleHostLogin} className="space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Accedé a tu panel de propietario con tus credenciales seguras para ver reservas generadas por pyApy y gestionar tu quinta.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Seleccionar Tu Quinta o Cabaña</label>
              <select
                value={selectedPropId}
                onChange={e => setSelectedPropId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium cursor-pointer"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city}) - Anfitrión: {p.hostName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email de Contacto del Anfitrión</label>
              <input
                type="email"
                value={hostEmail}
                onChange={e => setHostEmail(e.target.value)}
                placeholder="contacto@quinta.com.py"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contraseña de Anfitrión</label>
              <input
                type="password"
                required
                value={hostSecret}
                onChange={e => setHostSecret(e.target.value)}
                placeholder="Ingresá contraseña del anfitrión"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            {hostError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{hostError}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all mt-2 cursor-pointer shadow-sm"
            >
              {isLoading ? 'Autenticando...' : 'Ingresar al Panel de Propietario'}
            </button>
          </form>
        )}

        {/* Admin Mode */}
        {authModalMode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[11px] leading-relaxed">
                Acceso restringido al Panel de Auditoría, Verificaciones y Demanda de pyApy Paraguay.
              </p>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clave Secreta de Servidor (Admin Secret)</label>
              <input
                type="password"
                required
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="Ingresá la clave de acceso administrativo"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-mono text-sm"
              />
            </div>
            {adminError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{adminError}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 font-bold transition-all mt-2 cursor-pointer shadow-sm"
            >
              {isLoading ? 'Verificando con servidor...' : 'Verificar & Abrir Admin Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
