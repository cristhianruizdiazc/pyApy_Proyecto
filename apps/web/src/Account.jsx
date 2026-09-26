import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Heart, Star, X, MapPin } from "lucide-react";
import { api } from "./api.js";
import { ReservationBrowser } from "./Reservations.jsx";
import { QueryState, RecordList } from "./Workspace.jsx";
import { formatStay } from "./booking-selection.js";
import {
  useSession,
  Loading,
  ErrorMessage,
  Empty,
  PropertyCard,
  Modal,
} from "./ui.jsx";
export default function Account({ view }) {
  const { user, session } = useSession();
  if (session.isPending) return <Loading />;
  if (!user)
    return (
      <main className="page">
        <h1>Tu próxima escapada te espera.</h1>
        <Link className="primary" to="/ingresar">
          Ingresar
        </Link>
      </main>
    );
  return <AccountContent key={`${user.id}:${view}`} user={user} view={view} />;
}
function AccountContent({ user, view }) {
  const client = useQueryClient();
  const [cancel, setCancel] = useState(null);
  const [review, setReview] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [reading, setReading] = useState(null);
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
  async function postReview(e) {
    e.preventDefault();
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
    <main className="page account-page workspace-page">
      <p className="eyebrow">TU RINCÓN EN PYAPY</p>
      <h1>
        {view === "reservas"
          ? "Mis reservas"
          : view === "favoritos"
            ? "Mis lugares guardados"
            : `Hola, ${user.name}.`}
      </h1>
      <nav className="account-nav" aria-label="Mi cuenta">
        <NavLink to="/cuenta">Mi cuenta</NavLink>
        <NavLink to="/reservas">Mis reservas</NavLink>
        <NavLink to="/favoritos">Guardados</NavLink>
      </nav>
      <ErrorMessage error={!cancel && !review && error} />
      {notice && (
        <p className="success" role="status">
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
                <div className="property-grid">
                  {visible.map((p) => (
                    <PropertyCard
                      key={p.id}
                      p={p}
                      favorite
                      onFavorite={async (id) => {
                        try {
                          await api(`/favorites/${id}`, { method: "DELETE" });
                          client.invalidateQueries({ queryKey: ["favorites"] });
                        } catch (err) {
                          setError(err);
                        }
                      }}
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
            </Link>
          </div>
          <details className="account-profile">
            <summary>Datos de mi cuenta</summary>
            <p>{user.name}</p>
            <p>{user.email}</p>
          </details>
          <h2>Notificaciones</h2>
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
                unreadOnly ? "Estás al día." : "Todavía no hay notificaciones."
              }
              pageSize={8}
            >
              {(visible) =>
                visible.map((n) => (
                  <article className="notification" key={n.id}>
                    <p>{n.message}</p>
                    <small>{formatStay(n.created_at)}</small>
                    {!n.read_at && (
                      <button
                        className="icon-button"
                        title="Marcar como leida"
                        aria-label="Marcar como leida"
                        disabled={reading === n.id}
                        onClick={async () => {
                          setReading(n.id);
                          try {
                            await api(`/notifications/${n.id}/read`, {
                              method: "POST",
                              body: {},
                            });
                            client.invalidateQueries({
                              queryKey: ["notifications"],
                            });
                          } catch (err) {
                            setError(err);
                          } finally {
                            setReading(null);
                          }
                        }}
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
      {arrival && (
        <Modal title={`Llegada a ${arrival.name}`} onClose={closeArrival}>
          {arrival.loading ? (
            <Loading />
          ) : arrival.error ? (
            <ErrorMessage error={arrival.error} />
          ) : (
            <>
              <p>
                {arrival.address ||
                  "El propietario aun no registro la direccion exacta."}
              </p>
              <p>{arrival.phone || "Telefono pendiente de registrar."}</p>
              {arrival.latitude && arrival.longitude && (
                <a
                  className="secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${arrival.latitude}&mlon=${arrival.longitude}#map=17/${arrival.latitude}/${arrival.longitude}`}
                >
                  <MapPin size={17} />
                  Ver ubicacion de llegada
                </a>
              )}
            </>
          )}
        </Modal>
      )}
      {cancel && (
        <Modal title="Cancelar reserva" onClose={() => setCancel(null)}>
          <p>
            Se liberara el horario de {cancel.propertyName}. Esta accion no se
            puede deshacer.
          </p>
          <ErrorMessage error={error} />
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
        </Modal>
      )}
      {review && (
        <Modal title="Como estuvo tu escapada?" onClose={() => setReview(null)}>
          <form onSubmit={postReview}>
            <label>
              Puntuacion
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
            <ErrorMessage error={error} />
            <button className="primary" disabled={pending}>
              Publicar opinion
              <Star size={17} />
            </button>
          </form>
        </Modal>
      )}
    </main>
  );
}
