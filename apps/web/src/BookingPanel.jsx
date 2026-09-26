import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, CalendarDays } from "lucide-react";
import { bookingSchema, idSchema, money } from "@pyapy/contracts";
import { api } from "./api.js";
import { ErrorMessage, Loading } from "./ui.jsx";
import {
  detailHref,
  draftFromInput,
  draftFromSearch,
  formatStay,
  inputFromDraft,
  localParts,
} from "./booking-selection.js";

// Only one unresolved attempt per user/property in this tab; never store a session token.
function attemptStorageKey(userId, propertyId) {
  return `pyapy:booking-attempt:${userId}:${propertyId}`;
}
function readAttempt(userId, propertyId) {
  if (!userId) return null;
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(attemptStorageKey(userId, propertyId)) || "null",
    );
    if (
      saved &&
      idSchema.safeParse(saved.key).success &&
      bookingSchema.safeParse(saved.input).success &&
      saved.input.propertyId === propertyId
    )
      return saved;
  } catch {
    /* Storage may be unavailable; live retries still use the same ref. */
  }
  return null;
}
function saveAttempt(userId, propertyId, attempt) {
  try {
    const key = attemptStorageKey(userId, propertyId);
    if (attempt) sessionStorage.setItem(key, JSON.stringify(attempt));
    else sessionStorage.removeItem(key);
  } catch {
    /* No background/offline confirmation is performed. */
  }
}

function StaySummary({ input }) {
  return (
    <dl className="stay-summary">
      <div>
        <dt>Entrada</dt>
        <dd>{formatStay(input.startsAt)}</dd>
      </div>
      <div>
        <dt>Salida</dt>
        <dd>{formatStay(input.endsAt)}</dd>
      </div>
      <div>
        <dt>Personas</dt>
        <dd>{input.guests}</dd>
      </div>
    </dl>
  );
}

export default function BookingPanel({
  property: p,
  user,
  search,
  availability,
}) {
  const client = useQueryClient();
  const nav = useNavigate();
  const [initial] = useState(() => {
    const saved = readAttempt(user?.id, p.id);
    return { ...draftFromSearch(search, p.capacity), saved };
  });
  const [draft, setDraft] = useState(() =>
    initial.saved ? draftFromInput(initial.saved.input) : initial.draft,
  );
  const [error, setError] = useState(
    initial.warning ? new Error(initial.warning) : null,
  );
  const [quote, setQuote] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unresolved, setUnresolved] = useState(Boolean(initial.saved));
  const [attempt, setAttempt] = useState(initial.saved);
  const revision = useRef(0);
  const request = useRef(null);
  const active = useRef(false);
  const sending = useRef(false);
  const quoteRef = useRef(null);
  const attemptRef = useRef(initial.saved);
  const summaryRef = useRef(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      revision.current += 1;
      request.current?.abort();
    };
  }, []);

  function invalidateQuote() {
    revision.current += 1;
    request.current?.abort();
    quoteRef.current = null;
    setQuote(null);
    setQuoting(false);
  }
  function change(field, value) {
    if (sending.current || attemptRef.current) return;
    invalidateQuote();
    setError(null);
    setDraft((current) => ({ ...current, [field]: value }));
  }
  async function getQuote(event) {
    event.preventDefault();
    if (sending.current || attemptRef.current) return;
    invalidateQuote();
    setError(null);
    let input;
    try {
      input = inputFromDraft(draft, p.id);
    } catch (err) {
      setError(err);
      return;
    }
    if (!user) {
      const selected = new URLSearchParams({
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        guests: String(input.guests),
      });
      return nav("/ingresar", { state: { from: detailHref(p.id, selected) } });
    }
    const version = revision.current;
    const controller = new AbortController();
    request.current = controller;
    setQuoting(true);
    try {
      const result = await api("/reservations/quote", {
        method: "POST",
        body: input,
        signal: controller.signal,
      });
      if (!active.current || version !== revision.current) return;
      if (
        !result ||
        result.currency !== "PYG" ||
        !Number.isFinite(result.totalAmount) ||
        result.totalAmount < 0 ||
        !Number.isFinite(result.hours) ||
        result.hours <= 0 ||
        !Number.isFinite(result.cancellationHours) ||
        result.cancellationHours < 0
      )
        throw new Error(
          "No pudimos leer la cotización. Volvé a consultar disponibilidad.",
        );
      const next = { input, result, key: crypto.randomUUID() };
      quoteRef.current = next;
      setQuote(next);
    } catch (err) {
      if (active.current && version === revision.current) {
        setError(
          err.name === "AbortError"
            ? new Error(
                "La consulta tardó demasiado. Volvé a consultar disponibilidad.",
              )
            : err,
        );
        if (err.status === 409)
          client.invalidateQueries({ queryKey: ["availability", p.id] });
      }
    } finally {
      if (active.current && version === revision.current) setQuoting(false);
    }
  }
  async function reserve() {
    if (!user || sending.current) return;
    const wasUnresolved = Boolean(attemptRef.current);
    const candidate = attemptRef.current || quoteRef.current;
    if (!candidate) return;
    const operation = { input: candidate.input, key: candidate.key };
    sending.current = true;
    attemptRef.current = operation;
    saveAttempt(user.id, p.id, operation);
    setAttempt(operation);
    setSaving(true);
    setError(null);
    try {
      // Do not abort a write on navigation: it may already be committed by PostgreSQL.
      const result = await api("/reservations", {
        method: "POST",
        body: operation.input,
        key: operation.key,
      });
      const reservation = result.reservation;
      if (
        !reservation ||
        !idSchema.safeParse(reservation.id).success ||
        reservation.propertyId !== operation.input.propertyId ||
        reservation.guests !== operation.input.guests ||
        Date.parse(reservation.startsAt) !==
          Date.parse(operation.input.startsAt) ||
        Date.parse(reservation.endsAt) !== Date.parse(operation.input.endsAt) ||
        !["confirmed", "cancelled"].includes(reservation.status) ||
        typeof reservation.locator !== "string" ||
        !reservation.locator ||
        !Number.isFinite(reservation.totalAmount) ||
        reservation.totalAmount < 0
      )
        throw new Error("No pudimos leer la confirmación del servidor.");
      saveAttempt(user.id, p.id, null);
      attemptRef.current = null;
      client.invalidateQueries({ queryKey: ["availability", p.id] });
      client.invalidateQueries({ queryKey: ["reservations", user.id] });
      client.invalidateQueries({ queryKey: ["properties"] });
      if (!active.current) return;
      setConfirmed(reservation);
      setUnresolved(false);
      setAttempt(null);
    } catch (err) {
      // Network/5xx may follow a commit; a retry must retain the exact body and UUID.
      const definitive =
        err.status >= 400 &&
        err.status < 500 &&
        (!wasUnresolved ||
          err.code === "BOOKING_CONFLICT" ||
          err.code === "IDEMPOTENCY_CONFLICT");
      if (definitive) {
        attemptRef.current = null;
        saveAttempt(user.id, p.id, null);
      }
      if (!active.current) return;
      if (definitive) {
        invalidateQuote();
        setAttempt(null);
        setUnresolved(false);
      } else setUnresolved(true);
      setError(
        err.code === "BOOKING_CONFLICT"
          ? new Error(
              "Ese horario acaba de ocuparse. Elegí otro horario y consultá de nuevo.",
            )
          : err.code === "IDEMPOTENCY_CONFLICT"
            ? new Error(
                "La solicitud no coincide con el intento anterior. Revisá Mis reservas antes de volver a consultar.",
              )
            : definitive
              ? err
              : new Error(
                  "No pudimos comprobar el resultado. Reintentá la misma confirmación o consultá Mis reservas.",
                ),
      );
      if (err.status === 409)
        client.invalidateQueries({ queryKey: ["availability", p.id] });
    } finally {
      sending.current = false;
      if (active.current) setSaving(false);
    }
  }
  useEffect(() => {
    if (quote || confirmed) summaryRef.current?.focus({ preventScroll: true });
  }, [quote, confirmed]);

  return (
    <aside className="booking-panel" id="reservar" aria-label="Tu reserva">
      <span className="eyebrow">TU PRÓXIMO BUEN PLAN</span>
      <h2>Elegí tu momento.</h2>
      <div className="booking-price">
        <strong>Gs. {money(p.pricePerHour)}</strong>
        <span>/ hora</span>
      </div>
      {confirmed ? (
        <div
          className="booking-success"
          role="status"
          ref={summaryRef}
          tabIndex={-1}
        >
          <Check size={34} />
          <h2>
            {confirmed.status === "confirmed"
              ? "Tu escapada está confirmada."
              : "Esta reserva ya fue cancelada."}
          </h2>
          <p>{p.name}</p>
          <StaySummary input={confirmed} />
          <p>Localizador</p>
          <strong className="locator">{confirmed.locator}</strong>
          <p className="confirmed-total">
            Total: Gs. {money(confirmed.totalAmount)}
          </p>
          <Link className="primary" to="/reservas">
            Ver mi reserva <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={getQuote}>
            <fieldset
              disabled={saving || unresolved}
              className="booking-fields"
            >
              <legend className="sr-only">Fecha, horario y personas</legend>
              <label>
                Fecha de entrada
                <input
                  type="date"
                  name="date"
                  required
                  min={localParts().date}
                  value={draft.date}
                  onChange={(e) => change("date", e.target.value)}
                />
              </label>
              <label>
                Fecha de salida{" "}
                <span className="field-hint">
                  Opcional, para estadías de varios días
                </span>
                <input
                  aria-label="Fecha de salida"
                  type="date"
                  name="endDate"
                  min={draft.date || localParts().date}
                  value={draft.endDate}
                  onChange={(e) => change("endDate", e.target.value)}
                />
              </label>
              <div className="form-row">
                <label>
                  Desde
                  <input
                    type="time"
                    name="start"
                    step={draft.start.split(":").length > 2 ? "1" : "60"}
                    value={draft.start}
                    onChange={(e) => change("start", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="time"
                    name="end"
                    step={draft.end.split(":").length > 2 ? "1" : "60"}
                    value={draft.end}
                    onChange={(e) => change("end", e.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                Personas
                <input
                  type="number"
                  name="guests"
                  value={draft.guests}
                  onChange={(e) => change("guests", e.target.value)}
                  min="1"
                  max={p.capacity}
                  required
                />
              </label>
              <p className="booking-time-note">
                Hora de Paraguay. Si el fin es anterior o igual al inicio y no
                elegís otra fecha de salida, termina al día siguiente.
              </p>
              <button className="primary" disabled={quoting}>
                {quoting ? "Consultando..." : "Consultar disponibilidad"}
                <ArrowRight size={18} />
              </button>
            </fieldset>
          </form>
          <ErrorMessage error={error} />
          {unresolved && (
            <div className="booking-unresolved" role="status">
              <h3>Comprobemos tu reserva</h3>
              <p>
                La solicitud sigue pendiente de comprobar. Conservamos sus datos
                para evitar duplicarla.
              </p>
              <StaySummary input={attempt.input} />
              <button className="primary" disabled={saving} onClick={reserve}>
                {saving ? "Comprobando..." : "Reintentar confirmación"}
              </button>
              <Link to="/reservas">Ver mis reservas</Link>
            </div>
          )}
          {quote && !unresolved && (
            <section
              className="quote"
              ref={summaryRef}
              tabIndex={-1}
              aria-label="Resumen de tu reserva"
            >
              <h3>Tu plan en {p.name}</h3>
              <StaySummary input={quote.input} />
              <div className="quote-total">
                <span>{quote.result.hours} horas · total cotizado</span>
                <strong>Gs. {money(quote.result.totalAmount)}</strong>
              </div>
              <p>
                Se cobra por hora iniciada. Cancelación hasta{" "}
                {quote.result.cancellationHours} h antes.
              </p>
              <p>La disponibilidad y el precio se revalidan al confirmar.</p>
              <button className="primary" onClick={reserve} disabled={saving}>
                {saving ? "Reservando..." : "Confirmar reserva"}
                <Check size={18} />
              </button>
            </section>
          )}
          <p className="muted booking-note">
            Sin comisión por reserva. El pago se acuerda con el propietario.
          </p>
        </>
      )}
      <details className="occupied-dates">
        <summary>
          <CalendarDays size={16} /> Fechas ocupadas
        </summary>
        {availability.isError ? (
          <>
            <ErrorMessage error={availability.error} />
            <button
              className="text-button"
              onClick={() => availability.refetch()}
            >
              Reintentar fechas ocupadas
            </button>
          </>
        ) : availability.isPending ? (
          <Loading />
        ) : (
          <>
            <p>
              Registros informativos. Consultá tu horario para comprobar
              disponibilidad.
            </p>
            {availability.data?.intervals.length ? (
              <div className="occupied-list">
                {availability.data.intervals.map((r, i) => (
                  <p key={i}>
                    {formatStay(r.starts_at)} — {formatStay(r.ends_at)}
                  </p>
                ))}
              </div>
            ) : (
              <p>Sin ocupaciones registradas en el período consultado.</p>
            )}
          </>
        )}
      </details>
    </aside>
  );
}
