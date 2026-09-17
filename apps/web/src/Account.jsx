import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Heart, Star, X, MapPin } from "lucide-react";
import { money } from "@pyapy/contracts";
import { api } from "./api.js";
import {
  useSession,
  Loading,
  ErrorMessage,
  Empty,
  PropertyCard,
  Modal,
} from "./ui.jsx";
export function Reservations({ items, onCancel, onReview, onArrival }) {
  return (
    <div className="reservations-list">
      {items.map((r) => (
        <article className="reservation-row" key={r.id}>
          <div className="reservation-date">
            <CalendarDays size={20} />
            <strong>
              {new Date(r.startsAt).toLocaleDateString("es-PY", {
                day: "2-digit",
                month: "short",
                timeZone: "America/Asuncion",
              })}
            </strong>
          </div>
          <div className="reservation-main">
            <Link to={`/espacios/${r.propertyId}`}>
              <h3>{r.propertyName || "Reserva"}</h3>
            </Link>
            <p>
              {new Date(r.startsAt).toLocaleString("es-PY", {
                timeZone: "America/Asuncion",
              })}{" "}
              a{" "}
              {new Date(r.endsAt).toLocaleString("es-PY", {
                timeZone: "America/Asuncion",
              })}
            </p>
            <small className="locator">{r.locator}</small>
            {r.note && <p>{r.note}</p>}
          </div>
          <div className="reservation-status">
            <span
              className={`badge ${r.status === "cancelled" ? "cancelled" : ""}`}
            >
              {r.status === "confirmed" ? "Confirmada" : "Cancelada"}
            </span>
            <strong>Gs. {money(r.totalAmount)}</strong>
            <small>
              {r.kind === "pyapy"
                ? "Generada por pyApy"
                : r.kind === "owner"
                  ? "Reserva particular"
                  : "Bloqueo"}
            </small>
          </div>
          <div className="row-actions">
            {r.status === "confirmed" && onArrival && (
              <button
                className="icon-button"
                aria-label={`Datos de llegada a ${r.propertyName}`}
                title="Datos de llegada"
                onClick={() => onArrival(r)}
              >
                <MapPin size={18} />
              </button>
            )}
            {r.status === "confirmed" &&
              Date.parse(r.startsAt) > Date.now() &&
              onCancel && (
                <button
                  className="icon-button danger"
                  title="Cancelar reserva"
                  aria-label={`Cancelar reserva en ${r.propertyName}`}
                  onClick={() => onCancel(r)}
                >
                  <X size={18} />
                </button>
              )}
            {r.status === "confirmed" &&
              Date.parse(r.endsAt) < Date.now() &&
              r.kind === "pyapy" &&
              onReview && (
                <button
                  className="icon-button"
                  title="Dejar una opinion"
                  aria-label="Dejar una opinion"
                  onClick={() => onReview(r)}
                >
                  <Star size={18} />
                </button>
              )}
          </div>
        </article>
      ))}
    </div>
  );
}
export default function Account({ view }) {
  const { user, session } = useSession();
  const client = useQueryClient();
  const [cancel, setCancel] = useState(null);
  const [review, setReview] = useState(null);
  const [arrival, setArrival] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const reservations = useQuery({
    queryKey: ["reservations", user?.id],
    queryFn: () => api("/reservations"),
    enabled: Boolean(user) && view === "reservas",
  });
  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => api("/favorites"),
    enabled: Boolean(user) && view === "favoritos",
  });
  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => api("/notifications"),
    enabled: Boolean(user) && view === "cuenta",
    refetchInterval: 30000,
  });
  if (session.isPending) return <Loading />;
  if (!user)
    return (
      <main className="page">
        <h1>Tu proxima escapada te espera.</h1>
        <Link className="primary" to="/ingresar">
          Ingresar
        </Link>
      </main>
    );
  async function cancelBooking() {
    setPending(true);
    setError(null);
    try {
      await api(`/reservations/${cancel.id}/cancel`, {
        method: "POST",
        body: {},
      });
      setCancel(null);
      client.invalidateQueries({ queryKey: ["reservations"] });
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
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="page account-page">
      <p className="eyebrow">TU RINCON EN PYAPY</p>
      <h1>
        {view === "reservas"
          ? "Mis reservas"
          : view === "favoritos"
            ? "Mis lugares guardados"
            : `Hola, ${user.name}.`}
      </h1>
      <ErrorMessage
        error={
          reservations.error ||
          favorites.error ||
          notifications.error ||
          (!cancel && !review && error)
        }
      />
      {view === "reservas" &&
        (reservations.isPending ? (
          <Loading />
        ) : reservations.data?.items.length ? (
          <Reservations
            items={reservations.data.items}
            onArrival={async (r) => {
              try {
                const data = await api(`/reservations/${r.id}/arrival`);
                setArrival({ ...data, name: r.propertyName });
              } catch (err) {
                setError(err);
              }
            }}
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
          <Empty title="Todavia no hay una fecha marcada.">
            <Link className="secondary" to="/">
              <CalendarDays size={17} />
              Buscar mi proxima escapada
            </Link>
          </Empty>
        ))}
      {view === "favoritos" &&
        (favorites.isPending ? (
          <Loading />
        ) : favorites.data?.items.length ? (
          <div className="property-grid">
            {favorites.data.items.map((p) => (
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
        ) : (
          <Empty title="Tus favoritos empiezan con un lugar.">
            <Link className="secondary" to="/">
              <Heart size={17} />
              Explorar espacios
            </Link>
          </Empty>
        ))}
      {view === "cuenta" && (
        <>
          <p>{user.email}</p>
          <h2>Notificaciones</h2>
          {notifications.isPending ? (
            <Loading />
          ) : notifications.data?.items.length ? (
            notifications.data.items.map((n) => (
              <article className="notification" key={n.id}>
                <p>{n.message}</p>
                <small>{new Date(n.created_at).toLocaleString("es-PY")}</small>
                {!n.read_at && (
                  <button
                    className="icon-button"
                    title="Marcar como leida"
                    aria-label="Marcar como leida"
                    onClick={async () => {
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
                      }
                    }}
                  >
                    <Check size={18} />
                  </button>
                )}
              </article>
            ))
          ) : (
            <Empty title="Estas al dia." />
          )}
        </>
      )}
      {arrival && (
        <Modal
          title={`Llegada a ${arrival.name}`}
          onClose={() => setArrival(null)}
        >
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
