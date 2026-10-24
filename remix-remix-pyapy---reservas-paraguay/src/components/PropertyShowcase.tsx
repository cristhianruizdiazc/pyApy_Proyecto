import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  Flame,
  Waves,
  Wifi,
  Car,
  Tv,
  Utensils,
  Share2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { formatGuaranies } from '../utils/i18n';

export const PropertyShowcase: React.FC = () => {
  const {
    activeProperty,
    themeConfig,
    language,
    setIsGoogleMapsModalOpen
  } = useApp();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  if (!activeProperty || !activeProperty.units) {
    return null;
  }

  const photos = activeProperty.gallery && activeProperty.gallery.length > 0
    ? activeProperty.gallery
    : [activeProperty.heroPhoto];

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 mb-6 transition-all">
      {/* Photo Gallery & Hero Visual */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-2 p-2 sm:p-3 bg-slate-900">
        {/* Main Hero Photo */}
        <div className="lg:col-span-8 relative aspect-16/10 rounded-2xl overflow-hidden group">
          <img
            src={photos[activePhotoIndex] || activeProperty.heroPhoto}
            alt={activeProperty.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />

          {/* Badges Over Photo */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            {activeProperty.isVerified ? (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/95 backdrop-blur-md text-white text-xs font-black shadow-lg border border-emerald-400/40 hover:bg-emerald-500 transition-all cursor-pointer"
                title="Ver certificado de inspección pyApy"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Verificado pyApy</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/90 text-white text-xs font-bold shadow-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pendiente Verificación</span>
              </span>
            )}

            {activeProperty.isVip && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/95 text-slate-950 text-xs font-black shadow-lg border border-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quinta VIP Destacada</span>
              </span>
            )}
          </div>

          {/* Bottom gradient info overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 sm:p-6 text-white">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activeProperty.neighborhood}, {activeProperty.city} ({activeProperty.department}, Paraguay)</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                  {activeProperty.name}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-extrabold text-sm">{activeProperty.rating}</span>
                  <span className="text-xs text-slate-300">({activeProperty.reviewsCount} reseñas)</span>
                </div>

                <button
                  onClick={() => setIsGoogleMapsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span className="hidden sm:inline">Ver en Mapa</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail sidebar for desktop */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-2">
          {photos.slice(0, 4).map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhotoIndex(idx)}
              className={`relative aspect-16/10 lg:aspect-auto lg:h-[105px] rounded-xl overflow-hidden transition-all border-2 ${
                activePhotoIndex === idx
                  ? 'border-amber-400 ring-2 ring-amber-400/50 scale-98'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={p}
                alt={`${activeProperty.name} foto ${idx + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Property Details Bar */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: description & amenities */}
        <div className="lg:col-span-8 space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Descripción del Alojamiento
            </h3>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              {activeProperty.description}
            </p>
            {language === 'es_gn' && activeProperty.descriptionGn && (
              <p className="text-emerald-800 text-xs sm:text-sm bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-2xl mt-2.5 italic">
                🇵🇾 <strong>Guaraníme:</strong> {activeProperty.descriptionGn}
              </p>
            )}
          </div>

          {/* Key Amenities */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Comodidades & Instalaciones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeProperty.amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 text-xs font-semibold"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="line-clamp-1">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Reglas de Convivencia y Cuidados del Lugar:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
              {activeProperty.rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column: Host card & quick contact */}
        <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Anfitrión Responsable
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                {activeProperty.hostName}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              {activeProperty.hostName.charAt(0)}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Check-in / Check-out:</span>
              </span>
              <strong className="text-slate-900">
                {activeProperty.checkInTime} - {activeProperty.checkOutTime} hs
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Principal:</span>
              </span>
              <a
                href={`https://wa.me/${activeProperty.hostPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                {activeProperty.hostPhone}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {activeProperty.hostPhoneSecondary && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Teléfono Secundario:</span>
                <span className="font-medium text-slate-700">{activeProperty.hostPhoneSecondary}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Oficial:</span>
              </span>
              <span className="font-medium text-slate-700 truncate max-w-[150px]">{activeProperty.hostEmail}</span>
            </div>
          </div>

          {/* Verification Badge Details Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Garantía Anti-Estafas pyApy</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Propietario y título verificados presencialmente por el equipo de pyApy Paraguay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Certificate Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Certificado de Verificación pyApy
                </h3>
                <p className="text-xs text-slate-500">
                  Alojamiento Comprobado y Seguro
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs border border-slate-200 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Propiedad:</span>
                <strong className="text-slate-900">{activeProperty.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Propietario:</span>
                <strong className="text-slate-900">{activeProperty.hostName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">C.I. Propietario:</span>
                <strong className="text-slate-900">{activeProperty.ownerCi}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ubicación Inspeccionada:</span>
                <span className="text-slate-900 font-medium">{activeProperty.address}, {activeProperty.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Validación:</span>
                <strong className="text-emerald-700">{activeProperty.verificationDate || '15/01/2026'}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Este alojamiento ha pasado todos los filtros de seguridad documental y técnica. Sus reservas cuentan con garantía de depósito y prevención de dobles reservas.
            </p>

            <button
              onClick={() => setShowVerificationModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
