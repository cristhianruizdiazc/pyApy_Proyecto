import React, { useState, useEffect } from 'react';
import { Property, PropertyTurn } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatGs } from '../../services/configService';
import { ApiClient } from '../../services/apiClient';
import {
  X,
  ShieldCheck,
  Crown,
  Heart,
  MapPin,
  Users,
  Calendar,
  Clock,
  Star,
  Check,
  CheckCircle2,
  AlertTriangle,
  Instagram,
  Facebook,
  Share2,
  ExternalLink,
  Sparkles,
  Layers,
  Phone,
  Mail,
  Lock
} from 'lucide-react';

export const PropertyDetailModal: React.FC = () => {
  const {
    selectedPropertyForDetail,
    setSelectedPropertyForDetail,
    setSelectedPropertyForBooking,
    setIsBookingModalOpen,
    setIsFloorPlanModalOpen,
    setActivePropertyId,
    isFavorite,
    toggleFavorite,
    themeConfig,
    filters,
    language
  } = useApp();

  const property = selectedPropertyForDetail;
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [selectedTurnId, setSelectedTurnId] = useState<string>(
    property?.allowedTurns[0]?.id || ''
  );
  const [bookingDate, setBookingDate] = useState<string>(filters.startDate);
  const [availabilityCheck, setAvailabilityCheck] = useState<{ isAvailable: boolean; conflictReason?: string }>({
    isAvailable: true
  });
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  if (!property) return null;

  const favorited = isFavorite(property.id);

  const selectedTurn: PropertyTurn | undefined =
    property.allowedTurns.find(t => t.id === selectedTurnId) || property.allowedTurns[0];

  // Authoritative live availability check on the selected turn & date querying Backend/Firestore
  useEffect(() => {
    if (!property?.id || !selectedTurn) return;
    let isCancelled = false;
    setIsCheckingAvailability(true);

    ApiClient.checkAvailability(property.id, {
      startDate: bookingDate,
      startTime: selectedTurn.startTime,
      endTime: selectedTurn.endTime,
      endDate: bookingDate
    })
      .then(res => {
        if (!isCancelled && res.data) {
          let conflictReason: string | undefined;
          if (!res.data.available) {
            if (res.data.conflicts.reservation) {
              conflictReason = 'Horario no disponible: ya cuenta con una reserva confirmada.';
            } else if (res.data.conflicts.ownerBooking) {
              conflictReason = 'Horario no disponible: ocupado por reserva directa del anfitrión.';
            } else if (res.data.conflicts.maintenanceBlock) {
              conflictReason = 'Horario no disponible: bloqueado por mantenimiento o uso privado.';
            } else {
              conflictReason = 'Horario no disponible para esta fecha y turno.';
            }
          }
          setAvailabilityCheck({
            isAvailable: res.data.available,
            conflictReason
          });
        }
      })
      .catch(err => {
        console.error('Error verificando disponibilidad autoritativa:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsCheckingAvailability(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [property?.id, bookingDate, selectedTurn?.id, selectedTurn?.startTime, selectedTurn?.endTime]);

  const handleStartBooking = () => {
    setSelectedPropertyForBooking(property);
    setIsBookingModalOpen(true);
    setSelectedPropertyForDetail(null);
  };

  const handleOpenFloorPlan = () => {
    setActivePropertyId(property.id);
    setIsFloorPlanModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Top Floating Controls */}
        <div className="relative">
          {/* Gallery View */}
          <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-slate-900 overflow-hidden">
            <img
              src={property.gallery[activePhotoIdx] || property.heroPhoto}
              alt={property.name}
              className="w-full h-full object-cover transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

            {/* Close & Share buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                onClick={() => toggleFavorite(property.id)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-red-500 transition-all shadow-md cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                onClick={() => setSelectedPropertyForDetail(null)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-slate-950 transition-all shadow-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges on Gallery */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 items-center z-20">
              {property.isVerified ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>Verificado pyApy (Anti-Estafas)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-bold">
                  <span>En Proceso de Auditoría</span>
                </div>
              )}

              {property.subscriptionPlan === 'vip' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-lg">
                  <Crown className="w-4 h-4" />
                  <span>Quinta VIP Destacada</span>
                </div>
              )}
            </div>

            {/* Bottom title info over photo */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-20 text-white">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{property.city}, Departamento de {property.department}</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
                  {property.name}
                </h1>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold">
                <Users className="w-4 h-4 text-amber-300" />
                <span>Hasta {property.capacity} personas</span>
              </div>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {property.gallery.length > 1 && (
            <div className="flex gap-2 p-2 bg-slate-900/90 overflow-x-auto">
              {property.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activePhotoIdx === idx ? 'border-amber-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Approximate Reference Notice */}
          <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/70 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-0.5">
              <p className="font-bold">Ubicación y Referencia Pública:</p>
              <p className="text-blue-800 leading-relaxed font-medium">
                {property.approximateReference}
              </p>
              <p className="text-[10px] text-blue-600 italic">
                🔒 Por seguridad y privacidad del propietario, la dirección catastral exacta y enlace de GPS se entregan de forma protegida tras confirmar la reserva.
              </p>
            </div>
          </div>

          {/* Two-column layout: Info vs Booking Widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Col (2 cols): Details, Guaraní desc, Amenities, Social Links */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Sobre el Alojamiento
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {property.description}
                </p>
                {property.descriptionGn && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-950 italic">
                    <span className="font-bold not-italic text-[11px] block text-amber-800 mb-0.5">Guaraníme:</span>
                    "{property.descriptionGn}"
                  </div>
                )}
              </div>

              {/* Host Profile & Verification Guarantee */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Anfitrión Registrado
                  </span>
                  <p className="text-sm font-black text-slate-900">{property.hostName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{property.hostPhone}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Identidad Verificada</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Sello Oficial pyApy</p>
                </div>
              </div>

              {/* Official Social Media Links */}
              {property.socialLinks && Object.values(property.socialLinks).some(Boolean) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Redes Sociales Oficiales de la Quinta
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {property.socialLinks.instagram && (
                      <a
                        href={property.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Instagram Oficial</span>
                        <ExternalLink className="w-3 h-3 text-pink-400" />
                      </a>
                    )}
                    {property.socialLinks.facebook && (
                      <a
                        href={property.socialLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                        <span>Facebook</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="space-y-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Comodidades & Servicios
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {property.amenities.map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              {property.rules && property.rules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Normas de Convivencia
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {property.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Secondary Floor Plan Button */}
              {property.units && property.units.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleOpenFloorPlan}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Ver Croquis Interactivo de Dependencias ({property.units.length} zonas)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Col (1 col): Live Booking & Turn Selector */}
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Comprobar Disponibilidad
                  </span>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Fecha deseada:</span>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-slate-200 text-xs font-black text-slate-900"
                    />
                  </div>
                </div>

                {/* Turn selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Elegir Turno u Horario:</span>
                  </label>
                  <div className="space-y-2">
                    {property.allowedTurns.map(turn => {
                      const isTurnSelected = selectedTurnId === turn.id;
                      return (
                        <div
                          key={turn.id}
                          onClick={() => setSelectedTurnId(turn.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            isTurnSelected
                              ? 'bg-white border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                              : 'bg-white/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">
                              {turn.name}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {formatGs(turn.pricePyg)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{turn.startTime} hs a {turn.endTime} hs</span>
                            {turn.crossesMidnight && (
                              <span className="text-[10px] text-indigo-600 font-bold ml-1">
                                (Cruza medianoche)
                              </span>
                            )}
                          </div>
                          {turn.description && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">
                              {turn.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Availability Banner */}
                {availabilityCheck.isAvailable ? (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Disponible para la fecha y horario seleccionados!</span>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-xs font-bold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p>Ocupada en este horario</p>
                      <p className="text-[11px] font-normal text-rose-700">
                        {availabilityCheck.conflictReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Total & Action */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Estadía:</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatGs(selectedTurn?.pricePyg || property.pricePerTurn)}
                  </span>
                </div>

                <button
                  disabled={!availabilityCheck.isAvailable}
                  onClick={handleStartBooking}
                  className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                    availabilityCheck.isAvailable
                      ? 'text-white hover:shadow-lg cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                  style={{
                    backgroundColor: availabilityCheck.isAvailable ? themeConfig.primary : undefined
                  }}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {availabilityCheck.isAvailable ? 'Completar Reserva Directa' : 'Horario No Disponible'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
