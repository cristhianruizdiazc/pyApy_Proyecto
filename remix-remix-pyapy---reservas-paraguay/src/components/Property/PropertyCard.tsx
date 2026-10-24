import React from 'react';
import { Property } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatGs } from '../../services/configService';
import {
  ShieldCheck,
  Crown,
  Heart,
  MapPin,
  Users,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Instagram,
  Facebook
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  isAvailable?: boolean;
  unavailabilityReason?: string;
  matchReasons?: string[];
  alternativeReason?: string;
  isAlternative?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isAvailable = true,
  unavailabilityReason,
  matchReasons = [],
  alternativeReason,
  isAlternative = false
}) => {
  const {
    setSelectedPropertyForDetail,
    setSelectedPropertyForBooking,
    setIsBookingModalOpen,
    isFavorite,
    toggleFavorite,
    themeConfig,
    filters
  } = useApp();

  const favorited = isFavorite(property.id);

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPropertyForBooking(property);
    setIsBookingModalOpen(true);
  };

  const handleOpenDetail = () => {
    setSelectedPropertyForDetail(property);
  };

  return (
    <div
      onClick={handleOpenDetail}
      className={`group bg-white rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col cursor-pointer shadow-sm hover:shadow-xl ${
        isAvailable
          ? 'border-slate-200/90 hover:border-slate-300'
          : 'border-slate-200 bg-slate-50/70 opacity-90'
      }`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={property.heroPhoto}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20" />

        {/* Badges container */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10">
          {property.isVerified ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-md backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>Verificado pyApy</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-200 text-[11px] font-semibold backdrop-blur-xs">
              <span>Auditoría en Curso</span>
            </div>
          )}

          {property.subscriptionPlan === 'vip' && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-md">
              <Crown className="w-3.5 h-3.5 text-slate-950" />
              <span>VIP Destacada</span>
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-700 hover:text-red-500 transition-all shadow-md cursor-pointer z-10"
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Capacity badge on photo */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-bold">
          <Users className="w-3.5 h-3.5 text-amber-300" />
          <span>Hasta {property.capacity} personas</span>
        </div>

        {/* Rating or New badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-black shadow-xs">
          {property.reviewsCount > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{property.rating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500 font-normal">({property.reviewsCount})</span>
            </>
          ) : (
            <span className="text-[11px] text-indigo-700 font-bold">Nueva en pyApy</span>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          {/* Location Line */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-600 font-bold">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {property.city}, {property.department}
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
              {property.neighborhood}
            </span>
          </div>

          {/* Property Name */}
          <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-amber-700 transition-colors">
            {property.name}
          </h3>

          {/* Approximate Reference */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {property.approximateReference}
          </p>

          {/* Match reason pill */}
          {matchReasons.length > 0 && isAvailable && (
            <div className="flex flex-wrap gap-1 pt-1">
              {matchReasons.slice(0, 2).map((reason, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Alternative explanation */}
          {isAlternative && alternativeReason && (
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 text-[11px] font-medium leading-tight">
              💡 <strong>Sugerencia pyApy:</strong> {alternativeReason}
            </div>
          )}

          {/* Unavailability reason */}
          {!isAvailable && unavailabilityReason && (
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-bold leading-tight">
              🚫 {unavailabilityReason}
            </div>
          )}

          {/* Amenities Chips */}
          <div className="flex flex-wrap gap-1 pt-2">
            {property.amenities.slice(0, 4).map((amenity, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 4 && (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
                +{property.amenities.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {filters.bookingType === 'full_day' ? 'Día Completo (24hs)' : 'Turno Diurno'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-slate-900">
                {formatGs(filters.bookingType === 'full_day' ? property.pricePerDay : property.pricePerTurn)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {filters.bookingType === 'full_day' ? `Turno: ${formatGs(property.pricePerTurn)}` : `Día: ${formatGs(property.pricePerDay)}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail();
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Ver Fotos
            </button>
            {isAvailable ? (
              <button
                onClick={handleBookNow}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:shadow-md transition-all cursor-pointer font-black"
                style={{ backgroundColor: themeConfig.primary }}
              >
                Reservar
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDetail();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Ver Fechas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
