import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Heart,
  Star,
  X,
  MapPin,
  UserRound,
  ArrowRight,
  Bell,
} from "lucide-react";
import { returnState } from "./auth-return.js";
import { api } from "./api.js";
import { ReservationBrowser } from "./Reservations.jsx";
import { QueryState, RecordList } from "./Workspace.jsx";
import { formatStay } from "./booking-selection.js";
import { useSession, Loading, ErrorMessage, Empty, Modal } from "./ui.jsx";
import SearchPropertyCard from "./SearchPropertyCard.jsx";
import "./account.css";

function AccountError({ error }) {
  const location = useLocation();
  return (
    <>
      <ErrorMessage error={error} />
      {error?.status === 401 && (
        <Link
          className="secondary"
          to="/ingresar"
          state={returnState(location)}
        >
          Volver a ingresar
        </Link>
      )}
    </>
  );
}
export default function Account({ view }) {
  const location = useLocation();
  const { user, session } = useSession();
  if (session.isPending)
    return (
      <main className="page account-page" aria-busy="true">
        <Loading />
      </main>
    );
  if (!user)
    return (
      <main className="page account-page">
        <section className="account-access">
          <UserRound size={32} aria-hidden="true" />
          <p className="eyebrow">TU RINCÓN EN PYAPY</p>
          <h1>
            {session.isError
              ? "No pudimos comprobar tu sesión."
              : "Tu próxima escapada te espera."}
          </h1>
          {session.isError ? (
            <>
              <p>Reintentá para continuar en tu cuenta.</p>
              <button className="primary" onClick={() => session.refetch()}>
                Reintentar sesión
              </button>
            </>
          ) : (
            <>
              <p>Ingresá para ver tus lugares guardados, reservas y avisos.</p>
              <Link
                className="primary"
                to="/ingresar"
                state={returnState(location)}
              >
                Ingresar <ArrowRight size={17} />
              </Link>
            </>
          )}
          <Link className="text-button" to="/">
            Explorar espacios
          </Link>
        </section>
      </main>
    );
  return <AccountContent key={`${user.id}:${view}`} user={user} view={view} />;
}
function AccountContent({ user, view }) {
  const client = useQueryClient();
  const location = useLocation();
  const nav = useNavigate();
  const [cancel, setCancel] = useState(null);
  const [review, setReview] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [reading, setReading] = useState(null);
  const [removing, setRemoving] = useState(null);
  const favoriteRequest = useRef(false);
  const notificationRequest = useRef(false);
  const noticeRef = useRef(null);
  useEffect(() => {
    if (notice) noticeRef.current?.focus({ preventScroll: true });
  }, [notice]);
  const arrivalRequest = useRef(null);
  const arrivalVersion = useRef(0);
  useEffect(
    () => () => {
      arrivalVersion.current += 1;
      arrivalRequest.current?.abort();
    },
    [],
  );
  function closeArrival() {
    arrivalVersion.current += 1;
    arrivalRequest.current?.abort();
    setArrival(null);
  }
  async function loadArrival(r) {
    arrivalRequest.current?.abort();
    const version = ++arrivalVersion.current;
    const controller = new AbortController();
    arrivalRequest.current = controller;
    setArrival({ name: r.propertyName, loading: true });
    try {
      const data = await api(`/reservations/${r.id}/arrival`, {
        signal: controller.signal,
      });
      if (version === arrivalVersion.current)
        setArrival({ ...data, name: r.propertyName });
    } catch (err) {
      if (version === arrivalVersion.current)
        setArrival({ name: r.propertyName, error: err });
    }
  }
  const reservations = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: ({ signal }) => api("/reservations", { signal }),
    enabled: Boolean(user) && view === "reservas",
  });
  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: ({ signal }) => api("/favorites", { signal }),
    enabled: Boolean(user) && view === "favoritos",
  });
  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: ({ signal }) => api("/notifications", { signal }),
    enabled: Boolean(user) && view === "cuenta",
    refetchInterval: 30000,
  });
  async function cancelBooking() {
    setNotice("");
    setPending(true);
    setError(null);
    try {
      await api(`/reservations/${cancel.id}/cancel`, {
        method: "POST",
        body: {},
      });
      setCancel(null);
      setNotice("Reserva cancelada. El horario quedó liberado.");
      client.invalidateQueries({ queryKey: ["reservations"] });
      client.invalidateQueries({
        queryKey: ["availability", cancel.propertyId],
      });
      client.invalidateQueries({ queryKey: ["properties"] });
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  async function removeFavorite(id) {
    if (favoriteRequest.current) return;
    setNotice("");
    favoriteRequest.current = true;
    setRemoving(id);
    setError(null);
    try {
      await api(`/favorites/${id}`, { method: "DELETE" });
      await client.invalidateQueries({ queryKey: ["favorites"] });
      setNotice("Espacio quitado de favoritos.");
    } catch (err) {
      if (err.status === 401) {
        client.setQueryData(["session"], { user: null });
        nav("/ingresar", {
          state: returnState(location, { type: "favorite", id, remove: true }),
        });
      } else setError(err);
    } finally {
      favoriteRequest.current = false;
      setRemoving(null);
    }
  }
  async function markRead(id) {
    if (notificationRequest.current) return;
    setNotice("");
    notificationRequest.current = true;
    setError(null);
    setReading(id);
    try {
      await api(`/notifications/${id}/read`, { method: "POST", body: {} });
      await client.invalidateQueries({ queryKey: ["notifications"] });
      setNotice("Notificación marcada como leída.");
    } catch (err) {
      setError(err);
    } finally {
      notificationRequest.current = false;
      setReading(null);
    }
  }
  async function postReview(e) {
    e.preventDefault();
    setNotice("");
    setPending(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      await api("/reviews", {
        method: "POST",
        body: {
          reservationId: review.id,
          rating: Number(f.get("rating")),
          comment: f.get("comment"),
        },
      });
      setReview(null);
      setNotice(
        "Tu opinión fue publicada. ¡Gracias por compartir tu experiencia!",
      );
      client.invalidateQueries({ queryKey: ["property", review.propertyId] });
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="page account-page">
      <header className="account-heading">
        <p className="eyebrow">TU RINCÓN EN PYAPY</p>
        <h1>
          {view === "reservas"
            ? "Mis reservas"
            : view === "favoritos"
              ? "Mis lugares guardados"
              : `Hola, ${user.name}.`}
        </h1>
        <p className="account-intro">
          {view === "reservas"
            ? "Tus próximos planes y las escapadas que ya disfrutaste."
            : view === "favoritos"
              ? "Esos lugares a los que te gustaría volver. O conocer por primera vez."
              : "Tus planes, tus lugares y tus avisos, en un mismo lugar."}
        </p>
      </header>
      <nav className="account-nav" aria-label="Mi cuenta">
        <NavLink to="/cuenta">
          <UserRound size={17} />
          Mi cuenta
        </NavLink>
        <NavLink to="/reservas">
          <CalendarDays size={17} />
          Mis reservas
        </NavLink>
        <NavLink to="/favoritos">
          <Heart size={17} />
          Guardados
        </NavLink>
      </nav>
      <div className="account-content">
        <AccountError error={!cancel && !review && error} />
        {notice && (
          <p
            className="success account-notice"
            role="status"
            ref={noticeRef}
            tabIndex={-1}
          >
            {notice}
          </p>
        )}
        {view === "reservas" && (
          <QueryState query={reservations} retryLabel="Reintentar reservas">
            {reservations.data?.items.length ? (
              <ReservationBrowser
                items={reservations.data.items}
                onArrival={loadArrival}
                onCancel={(r) => {
                  setError(null);
                  setCancel(r);
                }}
                onReview={(r) => {
                  setError(null);
                  setReview(r);
                }}
              />
            ) : (
              <Empty title="Todavía no hay una fecha marcada.">
                <Link className="secondary" to="/">
                  <CalendarDays size={17} />
                  Buscar mi próxima escapada
                </Link>
              </Empty>
            )}
          </QueryState>
        )}
        {view === "favoritos" && (
          <QueryState query={favorites} retryLabel="Reintentar favoritos">
            {favorites.data?.items.length ? (
              <RecordList
                items={favorites.data.items}
                searchText={(p) => `${p.name} ${p.city}`}
                label="Buscar lugar guardado"
              >
                {(visible) => (
                  <div className="property-grid" aria-busy={Boolean(removing)}>
                    {visible.map((p) => (
                      <SearchPropertyCard
                        key={p.id}
                        p={p}
                        favorite
                        headingLevel={2}
                        showEstimate={false}
                        favoritePending={Boolean(removing)}
                        onFavorite={removeFavorite}
                      />
                    ))}
                  </div>
                )}
              </RecordList>
            ) : (
              <Empty title="Tus favoritos empiezan con un lugar.">
                <Link className="secondary" to="/">
                  <Heart size={17} />
                  Explorar espacios
                </Link>
              </Empty>
            )}
          </QueryState>
        )}
        {view === "cuenta" && (
          <>
            <div className="account-welcome">
              <div>
                <h2>Tu próximo plan empieza acá.</h2>
                <p>
                  Guardá tus lugares, organizá tus escapadas y encontrá tus
                  avisos.
                </p>
              </div>
              <Link className="secondary" to="/">
                Explorar espacios
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="account-quicklinks">
              <Link to="/reservas">
                <CalendarDays size={24} />
                <span>
                  <strong>Mis reservas</strong>
                  <small>Fechas, detalles y datos de llegada</small>
                </span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/favoritos">
                <Heart size={24} />
                <span>
                  <strong>Mis lugares guardados</strong>
                  <small>Encontrá tu próximo buen plan</small>
                </span>
                <ArrowRight size={18} />
              </Link>
            </div>
            <details className="account-profile">
              <summary>Datos de mi cuenta</summary>
              <dl>
                <div>
                  <dt>Nombre</dt>
                  <dd>{user.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
              </dl>
            </details>
            <div className="account-section-heading">
              <Bell size={22} />
              <h2>Notificaciones</h2>
            </div>
            <div
              className="view-switch"
              role="group"
              aria-label="Filtrar notificaciones"
            >
              <button
                aria-pressed={unreadOnly}
                onClick={() => setUnreadOnly(true)}
              >
                Sin leer
              </button>
              <button
                aria-pressed={!unreadOnly}
                onClick={() => setUnreadOnly(false)}
              >
                Todas
              </button>
            </div>
            <QueryState
              query={notifications}
              retryLabel="Reintentar notificaciones"
            >
              <RecordList
                items={(notifications.data?.items || []).filter(
                  (n) => !unreadOnly || !n.read_at,
                )}
                searchText={(n) => n.message}
                label="Buscar notificación"
                emptyTitle={
                  unreadOnly
                    ? "Estás al día."
                    : "Todavía no hay notificaciones."
                }
                pageSize={8}
              >
                {(visible) =>
                  visible.map((n) => (
                    <article
                      className={`notification${n.read_at ? " is-read" : ""}`}
                      key={n.id}
                    >
                      <span className="notification-state">
                        {n.read_at ? "Leída" : "Sin leer"}
                      </span>
                      <p id={`notification-message-${n.id}`}>{n.message}</p>
                      <time dateTime={n.created_at}>
                        {formatStay(n.created_at)}
                      </time>
                      {!n.read_at && (
                        <button
                          className="icon-button"
                          title="Marcar como leída"
                          aria-label="Marcar como leída"
                          aria-describedby={`notification-message-${n.id}`}
                          disabled={Boolean(reading)}
                          aria-busy={reading === n.id}
                          onClick={() => markRead(n.id)}
                        >
                          <Check size={18} />
                        </button>
                      )}
                    </article>
                  ))
                }
              </RecordList>
            </QueryState>
          </>
        )}
      </div>
      {arrival && (
        <Modal title={`Llegada a ${arrival.name}`} onClose={closeArrival}>
          <div className="account-dialog">
            {arrival.loading ? (
              <Loading />
            ) : arrival.error ? (
              <AccountError error={arrival.error} />
            ) : (
              <>
                <p>
                  {arrival.address ||
                    "El propietario aún no registró la dirección exacta."}
                </p>
                <p>{arrival.phone || "Teléfono pendiente de registrar."}</p>
                {arrival.latitude && arrival.longitude && (
                  <a
                    className="secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${arrival.latitude}&mlon=${arrival.longitude}#map=17/${arrival.latitude}/${arrival.longitude}`}
                  >
                    <MapPin size={17} />
                    Ver ubicación de llegada
                  </a>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
      {cancel && (
        <Modal title="Cancelar reserva" onClose={() => setCancel(null)}>
          <div className="account-dialog">
            <p>
              Se liberará el horario de {cancel.propertyName}. Esta acción no se
              puede deshacer.
            </p>
            <AccountError error={error} />
            <div className="dialog-actions">
              <button
                className="secondary"
                disabled={pending}
                onClick={() => setCancel(null)}
              >
                Conservar reserva
              </button>
              <button
                className="primary destructive"
                disabled={pending}
                onClick={cancelBooking}
              >
                <X size={17} />
                Cancelar reserva
              </button>
            </div>
          </div>
        </Modal>
      )}
      {review && (
        <Modal
          title="¿Cómo estuvo tu escapada?"
          onClose={() => setReview(null)}
        >
          <form className="account-dialog" onSubmit={postReview}>
            <label>
              Puntuación
              <select name="rating" defaultValue="5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} estrellas
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tu experiencia
              <textarea
                name="comment"
                minLength={10}
                maxLength={1500}
                required
              />
            </label>
            <AccountError error={error} />
            <button className="primary" disabled={pending}>
              Publicar opinión
              <Star size={17} />
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}
