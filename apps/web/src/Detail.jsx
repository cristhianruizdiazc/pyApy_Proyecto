import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Check,
  CalendarDays,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { api } from "./api.js";
import BookingPanel from "./BookingPanel.jsx";
import PropertyGallery from "./PropertyGallery.jsx";
import { resultsOrigin } from "./booking-selection.js";
import "./detail.css";
import { useSession, Loading, ErrorMessage, PropertyCard } from "./ui.jsx";
const PropertyMap = lazy(() => import("./Map.jsx"));
export default function Detail() {
  const { id } = useParams();
  return <DetailPage key={id} id={id} />;
}
function DetailPage({ id }) {
  const { user } = useSession();
  const location = useLocation();
  const origin = resultsOrigin(
    new URLSearchParams(location.search).get("returnTo"),
  );
  const backLink = (
    <Link className="back-link" to={origin || "/"}>
      <ArrowLeft size={17} />
      {origin ? "Volver a resultados" : "Explorar espacios"}
    </Link>
  );
  const [showMap, setShowMap] = useState(false);
  const query = useQuery({
    queryKey: ["property", id],
    queryFn: ({ signal }) => api(`/properties/${id}`, { signal }),
  });
  const availability = useQuery({
    queryKey: ["availability", id],
    queryFn: ({ signal }) => api(`/properties/${id}/availability`, { signal }),
    enabled: Boolean(query.data),
  });
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api("/catalog"),
  });
  const similar = useQuery({
    queryKey: ["similar", id],
    queryFn: () => api("/properties"),
  });
  const p = query.data;
  const viewed = useRef(new Set());
  useEffect(() => {
    if (p?.status === "published" && !viewed.current.has(p.id)) {
      viewed.current.add(p.id);
      api("/events", {
        method: "POST",
        body: { event: "view", propertyId: p.id },
      }).catch(() => {});
    }
  }, [p?.id, p?.status]);
  if (query.isPending)
    return (
      <main className="page detail-route-loading" aria-busy="true">
        <Loading />
      </main>
    );
  if (query.error)
    return (
      <main className="page">
        <ErrorMessage error={query.error} />
        <button className="secondary" onClick={() => query.refetch()}>
          Reintentar espacio
        </button>
        {backLink}
      </main>
    );
  return (
    <main className="page detail-page">
      {backLink}
      <article className="detail-sheet" aria-label="Ficha del espacio">
        <div className="detail-topbar">
          <span className="eyebrow">Ficha del espacio</span>
          <nav className="detail-shortcuts" aria-label="En esta ficha">
            <a href="#sobre-el-espacio">El espacio</a>
            <a href="#ubicacion">Ubicación</a>
            {!p.isPublicSample && (
              <a href="#reservar">
                Elegir fecha <ArrowRight size={16} />
              </a>
            )}
          </nav>
        </div>
        <div className="detail-columns">
          <PropertyGallery property={p} />
          <div className="detail-info">
            <div className="detail-heading">
              <div>
                <p className="eyebrow">
                  {p.kind} · {p.city}
                </p>
                <h1>{p.name}</h1>
                <p className="location">
                  <MapPin size={16} />
                  {p.city}, {p.department}
                  {p.verified && (
                    <span>
                      <ShieldCheck size={16} />
                      Verificado
                    </span>
                  )}
                  {p.isDemo && (
                    <span className="badge">Propiedad de demostración</span>
                  )}
                </p>
              </div>
              {p.rating && (
                <span className="rating">
                  <Star size={18} />
                  {p.rating} · {p.reviewCount} opiniones
                </span>
              )}
            </div>
            <div className="facts">
              <span>
                <Users />
                Hasta {p.capacity} personas
              </span>
              <span>
                <Clock />
                Desde {p.minHours} horas
              </span>
              <span>
                <CalendarDays />
                {p.openHour}:00 a {p.closeHour}:00
              </span>
            </div>
            <section id="sobre-el-espacio">
              <h2>El espacio</h2>
              <p className="description">{p.description}</p>
            </section>
            <section>
              <h2>Lo que te espera</h2>
              <div className="amenities-list">
                {p.amenities.map((a) => (
                  <span key={a}>
                    <Check size={17} />
                    {catalog.data?.amenities.find((x) => x.code === a)?.label ||
                      a}
                  </span>
                ))}
              </div>
              {!p.amenities.length && (
                <p className="muted">
                  El anfitrión todavía no detalló los servicios.
                </p>
              )}
            </section>
            <section id="ubicacion">
              <h2>Por acá empieza la escapada</h2>
              <p>
                {p.zone}, {p.city}. Ubicación aproximada.
              </p>
              <button
                className="secondary detail-map-trigger"
                aria-expanded={showMap}
                aria-controls="detail-map"
                onClick={() => setShowMap((visible) => !visible)}
              >
                {showMap ? "Ocultar mapa" : "Ver mapa aproximado"}
              </button>
              {showMap && (
                <div id="detail-map">
                  <Suspense fallback={<Loading />}>
                    <PropertyMap items={[p]} />
                  </Suspense>
                </div>
              )}
            </section>
            {p.isPublicSample ? (
              <aside
                className="booking-panel"
                aria-label="Ficha de demostración"
              >
                <h2>Espacio de demostración</h2>
                <p>
                  Esta ficha está en modo demostración y no admite reservas
                  reales. Los precios y la disponibilidad están pendientes de
                  confirmación.
                </p>
                <Link to={origin || "/"}>Seguir explorando</Link>
              </aside>
            ) : (
              <BookingPanel
                key={`${id}:${user?.id || "guest"}:${location.search}`}
                property={p}
                user={user}
                search={location.search}
                availability={availability}
              />
            )}
            <section>
              <h2>Antes de ir</h2>
              <p>
                Cancelación hasta {p.cancellationHours} horas antes. Se cobra
                por hora iniciada.
              </p>
              <p>
                Estadía de {p.minHours} a {p.maxHours} horas. Los horarios se
                muestran en Paraguay.
              </p>
              <details className="property-rules">
                <summary>Reglas del espacio</summary>
                <p className="description">
                  {p.rules || "Sin reglas adicionales publicadas."}
                </p>
              </details>
            </section>
            <section>
              <h2>Opiniones de quienes estuvieron</h2>
              {p.reviews.length ? (
                p.reviews.map((r) => (
                  <article className="review" key={r.id}>
                    <span>
                      <Star size={16} />
                      {r.rating}/5
                    </span>
                    <p>{r.comment}</p>
                  </article>
                ))
              ) : (
                <p className="muted">
                  Este espacio todavía no tiene opiniones.
                </p>
              )}
              {p.socials.length > 0 && (
                <div className="socials">
                  {p.socials.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.platform}
                      <ArrowRight size={15} />
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </article>
      <section className="similar">
        <h2>Seguí explorando</h2>
        <ErrorMessage error={similar.error} />
        <div className="property-grid">
          {similar.data?.items
            .filter((x) => x.id !== id)
            .slice(0, 3)
            .map((x) => (
              <PropertyCard key={x.id} p={x} />
            ))}
        </div>
      </section>
    </main>
  );
}
