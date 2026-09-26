import { CalendarDays, MapPin, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import { money } from "@pyapy/contracts";
import { formatStay } from "./booking-selection.js";
import { RecordList } from "./Workspace.jsx";

function group(r) {
  return r.status === "cancelled"
    ? "cancelled"
    : Date.parse(r.endsAt) <= Date.now()
      ? "past"
      : "upcoming";
}
export function ReservationBrowser({ items, ...actions }) {
  const sorted = [...items].sort((a, b) => {
    const rank = { upcoming: 0, past: 1, cancelled: 2 };
    return (
      rank[group(a)] - rank[group(b)] ||
      (group(a) === "upcoming"
        ? Date.parse(a.startsAt) - Date.parse(b.startsAt)
        : Date.parse(b.startsAt) - Date.parse(a.startsAt))
    );
  });
  return (
    <RecordList
      items={sorted}
      label="Buscar reserva"
      searchText={(r) => `${r.propertyName} ${r.locator} ${r.note || ""}`}
      getStatus={group}
      filters={[
        ["upcoming", "Próximas y en curso"],
        ["past", "Finalizadas"],
        ["cancelled", "Canceladas"],
      ]}
    >
      {(visible) => <Reservations items={visible} {...actions} />}
    </RecordList>
  );
}
export function Reservations({
  items,
  onCancel,
  onReview,
  onArrival,
  arrivalPending,
}) {
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
              <h2>{r.propertyName || "Reserva"}</h2>
            </Link>
            <p>
              {formatStay(r.startsAt)} — {formatStay(r.endsAt)}
            </p>
            <details className="reservation-details">
              <summary>Ver detalles</summary>
              <dl>
                <div>
                  <dt>Localizador</dt>
                  <dd className="locator">{r.locator}</dd>
                </div>
                <div>
                  <dt>Personas</dt>
                  <dd>{r.guests}</dd>
                </div>
                {r.kind === "pyapy" && (
                  <div>
                    <dt>Cancelación</dt>
                    <dd>Hasta {r.cancellationHours} h antes</dd>
                  </div>
                )}
              </dl>
              {r.note && <p>{r.note}</p>}
            </details>
          </div>
          <div className="reservation-status">
            <span
              className={`badge ${r.status === "cancelled" ? "cancelled" : ""}`}
            >
              {r.status === "cancelled"
                ? "Cancelada"
                : group(r) === "past"
                  ? "Finalizada"
                  : "Confirmada"}
            </span>
            <strong>
              {r.kind === "block"
                ? "Sin importe"
                : `Gs. ${money(r.totalAmount)}`}
            </strong>
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
                className="secondary compact"
                aria-label={`Datos de llegada a ${r.propertyName}`}
                disabled={arrivalPending === r.id}
                onClick={() => onArrival(r)}
              >
                <MapPin size={17} />
                {arrivalPending === r.id ? "Cargando…" : "Llegada"}
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
                  className="secondary compact"
                  aria-label={`Opinar sobre ${r.propertyName}`}
                  onClick={() => onReview(r)}
                >
                  <Star size={17} />
                  Opinar
                </button>
              )}
          </div>
        </article>
      ))}
    </div>
  );
}
