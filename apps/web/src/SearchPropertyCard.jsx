import { useId } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Heart, MapPin, Star, Users } from "lucide-react";
import { money } from "@pyapy/contracts";
import { api } from "./api.js";
import { detailHref, formatStay } from "./booking-selection.js";
import { Photo } from "./ui.jsx";

const services = {
  pool: "Piscina",
  grill: "Parrilla",
  wifi: "Wi-Fi",
  parking: "Estacionamiento",
  pets: "Acepta mascotas",
  air: "Aire acondicionado",
  kitchen: "Cocina",
  accessible: "Acceso adaptado",
};

export function SearchEstimate({ p }) {
  return (
    <div className="search-estimate">
      {Number.isFinite(p.estimatedTotal) && (
        <p>
          Total estimado: G. {money(p.estimatedTotal)} por {p.estimatedHours} h.
        </p>
      )}
      <p>
        {p.availabilityChecked
          ? p.available
            ? "Verificado online; se revalida al reservar."
            : "Sin disponibilidad en el intervalo elegido."
          : "Estimado sobre la duración mínima; disponibilidad sin verificar."}
      </p>
    </div>
  );
}

export default function SearchPropertyCard({
  p,
  favorite = false,
  favoritePending = false,
  selected = false,
  onFavorite,
  onHover,
  showEstimate = true,
  headingLevel = 3,
}) {
  const location = useLocation();
  const titleId = useId();
  const Heading = `h${headingLevel}`;
  const href = detailHref(
    p.id,
    location.pathname === "/" || location.pathname.startsWith("/espacios/")
      ? location.search
      : "",
    p,
    location.pathname === "/"
      ? `${location.pathname}${location.search}${location.hash}`
      : null,
  );
  return (
    <article
      className={`property-card search-property-card${selected ? " is-selected" : ""}`}
      data-property-id={p.id}
      aria-labelledby={titleId}
      onPointerMove={(event) => {
        // Scrolling a card under a stationary pointer must not override a
        // marker selected by keyboard or touch.
        if (
          event.pointerType !== "touch" &&
          (event.movementX || event.movementY)
        )
          onHover?.(p.id);
      }}
      onFocus={() => onHover?.(p.id)}
      onClick={(event) => {
        if (p.stage && event.target.closest("a"))
          api("/events", {
            method: "POST",
            body: {
              event: "search_select",
              propertyId: p.id,
              searchStage: p.stage,
            },
          }).catch(() => {});
      }}
    >
      <Link
        className="card-image"
        to={href}
        aria-label={`${p.isDemo ? "Demo · " : ""}${p.kind}: ver fotos y detalle de ${p.name}`}
      >
        <Photo
          src={p.images?.[0]?.url}
          alt={p.images?.[0]?.alt || p.name}
          loading="lazy"
        />
        <span className="card-kind">
          {p.isDemo && "Demo · "}
          {p.kind}
        </span>
      </Link>
      {onFavorite && (
        <button
          type="button"
          className={`favorite icon-button${favorite ? " saved" : ""}`}
          aria-label={favorite ? "Quitar de favoritos" : "Guardar favorito"}
          aria-describedby={titleId}
          aria-pressed={favorite}
          disabled={favoritePending}
          aria-busy={favoritePending}
          onClick={() => onFavorite(p.id)}
        >
          <Heart
            size={19}
            fill={favorite ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      )}
      <div className="search-card-body">
        <p className="card-zone">
          <MapPin size={14} aria-hidden="true" />
          {[p.city, p.zone || p.department].filter(Boolean).join(", ")}
        </p>
        <Heading id={titleId}>
          <Link className="card-title" to={href}>
            {p.name}
          </Link>
        </Heading>
        {p.rating > 0 && (
          <p className="search-card-rating">
            <Star size={14} fill="currentColor" aria-hidden="true" />
            {p.rating}
            {p.reviewCount > 0 && ` (${p.reviewCount} reseñas)`}
          </p>
        )}
        <p className="card-capacity">
          <Users size={15} aria-hidden="true" />
          Hasta {p.capacity} personas
          {p.minHours ? ` · Mín. ${p.minHours} h` : ""}
        </p>
        {p.amenities?.length > 0 && (
          <ul className="card-services" aria-label="Servicios">
            {p.amenities.map((code) => (
              <li key={code}>{services[code] || code}</li>
            ))}
          </ul>
        )}
        <span
          className={`card-availability${p.availabilityChecked && p.available ? " is-verified" : ""}`}
        >
          {p.isPublicSample
            ? "Muestra · no admite reservas"
            : p.availabilityChecked
              ? p.available
                ? "Disponible para tu horario"
                : "Otra fecha"
              : "Disponibilidad sin verificar"}
        </span>
        {p.stage && p.stage !== "exact" && (
          <div className="alternative-details">
            {p.stage === "location" && Number.isFinite(p.distanceKm) && (
              <p>
                A {p.distanceKm.toFixed(1)} km del punto de referencia de{" "}
                {p.distanceReference?.city} (distancia geográfica aproximada).
              </p>
            )}
            {p.budgetExcess > 0 && (
              <p>
                G. {money(p.budgetExcess)} sobre tu presupuesto (
                {p.budgetExcessPercent.toFixed(1)} %).
              </p>
            )}
            {p.missingOptionalAmenities?.length > 0 && (
              <p>
                No incluye servicios opcionales:{" "}
                {p.missingOptionalAmenities
                  .map((code) => services[code] || code)
                  .join(", ")}
                .
              </p>
            )}
            {p.proposedInterval && (
              <p>
                Disponible del {formatStay(p.proposedInterval.startsAt)} al{" "}
                {formatStay(p.proposedInterval.endsAt)}. Al abrir se
                seleccionará este intervalo.
              </p>
            )}
          </div>
        )}
        {showEstimate && <SearchEstimate p={p} />}
        <div className="card-bottom">
          <span>
            <strong>Gs. {money(p.pricePerHour)}</strong>
            <small> / hora</small>
          </span>
          <Link
            className="card-open"
            to={href}
            aria-label={`Ver espacio: ${p.name}`}
          >
            Ver espacio <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
