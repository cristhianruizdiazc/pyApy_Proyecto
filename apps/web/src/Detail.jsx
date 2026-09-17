import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { money, localInterval } from "@pyapy/contracts";
import { api } from "./api.js";
import {
  useSession,
  Loading,
  ErrorMessage,
  Photo,
  PropertyCard,
} from "./ui.jsx";
const PropertyMap = lazy(() => import("./Map.jsx"));
export default function Detail() {
  const { id } = useParams();
  const { user } = useSession();
  const nav = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["property", id],
    queryFn: () => api(`/properties/${id}`),
  });
  const availability = useQuery({
    queryKey: ["availability", id],
    queryFn: () => api(`/properties/${id}/availability`),
  });
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api("/catalog"),
  });
  const similar = useQuery({
    queryKey: ["similar", id],
    queryFn: () => api("/properties"),
  });
  const [image, setImage] = useState(0);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [pending, setPending] = useState(false);
  const [intent, setIntent] = useState(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
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
  async function getQuote(e) {
    e.preventDefault();
    if (!user) return nav("/ingresar", { state: { from: `/espacios/${id}` } });
    setError(null);
    setPending(true);
    try {
      const f = new FormData(e.currentTarget);
      const input = {
        propertyId: id,
        guests: Number(f.get("guests")),
        ...localInterval(
          f.get("date"),
          f.get("start"),
          f.get("end"),
          f.get("endDate") || f.get("date"),
        ),
      };
      const result = await api("/reservations/quote", {
        method: "POST",
        body: input,
      });
      setIntent(input);
      setKey(crypto.randomUUID());
      setQuote(result);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  async function reserve() {
    setPending(true);
    setError(null);
    try {
      const result = await api("/reservations", {
        method: "POST",
        body: intent,
        key,
      });
      setConfirmed(result.reservation);
      client.invalidateQueries({ queryKey: ["availability", id] });
      client.invalidateQueries({ queryKey: ["reservations"] });
    } catch (err) {
      setError(err);
      if (err.status === 409) {
        setQuote(null);
        client.invalidateQueries({ queryKey: ["availability", id] });
      }
    } finally {
      setPending(false);
    }
  }
  if (query.isPending) return <Loading />;
  if (query.error)
    return (
      <main className="page">
        <ErrorMessage error={query.error} />
        <Link to="/">Volver</Link>
      </main>
    );
  return (
    <main className="page detail-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={17} />
        Explorar espacios
      </Link>
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
              <span className="badge">Propiedad de demostracion</span>
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
      <div className="detail-gallery">
        <Photo
          src={p.images[image]?.url}
          alt={p.images[image]?.alt || p.name}
        />
        {p.images.length > 1 && (
          <div className="thumbnails">
            {p.images.map((img, i) => (
              <button
                key={img.id}
                aria-label={`Ver foto ${i + 1}`}
                onClick={() => setImage(i)}
                className={i === image ? "active" : ""}
              >
                <img src={img.url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-columns">
        <div className="detail-info">
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
          <section>
            <h2>Un espacio para desconectar.</h2>
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
          </section>
          <section>
            <h2>Antes de ir</h2>
            <p className="description">
              {p.rules || "Sin reglas adicionales publicadas."}
            </p>
            <p>
              Cancelacion hasta {p.cancellationHours} horas antes. Se cobra por
              hora iniciada.
            </p>
            <p>
              Estadia de {p.minHours} a {p.maxHours} horas. Los horarios se
              muestran en Paraguay.
            </p>
          </section>
          <section>
            <h2>Por aca empieza la escapada</h2>
            <p>
              {p.zone}, {p.city}. Ubicacion aproximada.
            </p>
            <Suspense fallback={<Loading />}>
              <PropertyMap items={[p]} />
            </Suspense>
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
              <p className="muted">Este espacio todavia no tiene opiniones.</p>
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
        <aside className="booking-panel">
          <div className="booking-price">
            <strong>Gs. {money(p.pricePerHour)}</strong>
            <span>/ hora</span>
          </div>
          {confirmed ? (
            <div className="booking-success" role="status">
              <Check size={34} />
              <h2>Tu escapada esta confirmada.</h2>
              <p>Localizador</p>
              <strong className="locator">{confirmed.locator}</strong>
              <p>Gs. {money(confirmed.totalAmount)}</p>
              <Link className="primary" to="/reservas">
                Ver mi reserva
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <form
                onSubmit={getQuote}
                onChange={() => {
                  setQuote(null);
                  setError(null);
                }}
              >
                <label>
                  Fecha de entrada
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toLocaleDateString("en-CA")}
                  />
                </label>
                <label>
                  Fecha de salida
                  <input
                    type="date"
                    name="endDate"
                    min={new Date().toLocaleDateString("en-CA")}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Desde
                    <input
                      type="time"
                      name="start"
                      defaultValue="09:00"
                      required
                    />
                  </label>
                  <label>
                    Hasta
                    <input
                      type="time"
                      name="end"
                      defaultValue="17:00"
                      required
                    />
                  </label>
                </div>
                <label>
                  Personas
                  <input
                    type="number"
                    name="guests"
                    defaultValue="2"
                    min="1"
                    max={p.capacity}
                    required
                  />
                </label>
                <button className="primary" disabled={pending}>
                  {pending ? "Consultando..." : "Consultar disponibilidad"}
                  <ArrowRight size={18} />
                </button>
              </form>
              <ErrorMessage error={error} />
              {quote && (
                <div className="quote">
                  <div>
                    <span>{quote.hours} horas</span>
                    <strong>Gs. {money(quote.totalAmount)}</strong>
                  </div>
                  <p>Cancelacion hasta {quote.cancellationHours} h antes.</p>
                  <button
                    className="primary"
                    onClick={reserve}
                    disabled={pending}
                  >
                    {pending ? "Reservando..." : "Confirmar reserva"}
                    <Check size={18} />
                  </button>
                </div>
              )}
              <p className="muted booking-note">
                Sin comision por reserva. El pago se acuerda con el propietario.
              </p>
            </>
          )}
          <details className="occupied-dates">
            <summary>Fechas ocupadas</summary>
            <ErrorMessage error={availability.error} />
            {availability.isPending ? (
              <Loading />
            ) : availability.data?.intervals.length ? (
              availability.data.intervals.map((r, i) => (
                <p key={i}>
                  {new Date(r.starts_at).toLocaleString("es-PY", {
                    timeZone: "America/Asuncion",
                  })}{" "}
                  -{" "}
                  {new Date(r.ends_at).toLocaleString("es-PY", {
                    timeZone: "America/Asuncion",
                  })}
                </p>
              ))
            ) : (
              <p>Sin ocupaciones registradas.</p>
            )}
          </details>
        </aside>
      </div>
      <section className="similar">
        <h2>Segui explorando</h2>
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
