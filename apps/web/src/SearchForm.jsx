import { useId, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Flame,
  House,
  MapPin,
  Search,
  SlidersHorizontal,
  Sun,
  TreePine,
  Users,
  Waves,
} from "lucide-react";
import {
  intervalSchema,
  kinds,
  localInterval,
  searchSchema,
  ZONE,
} from "@pyapy/contracts";

const guestOptions = [
  ["2", "En pareja"],
  ["4", "Más de 3 personas"],
  ["6", "Más de 5 personas"],
  ["11", "Más de 10 personas"],
  ["21", "Más de 20 personas"],
  ["31", "Más de 30 personas"],
];
const shifts = [
  {
    value: "full",
    label: "Día completo (24 horas)",
    start: "09:00",
    end: "09:00",
    hours: 24,
  },
  {
    value: "day",
    label: "Día (09:00–17:00)",
    start: "09:00",
    end: "17:00",
    hours: 8,
  },
  {
    value: "morning",
    label: "Mañana (09:00–13:00)",
    start: "09:00",
    end: "13:00",
    hours: 4,
  },
  {
    value: "afternoon",
    label: "Tarde (13:00–17:00)",
    start: "13:00",
    end: "17:00",
    hours: 4,
  },
];
const categories = [
  { label: "Todos", icon: Sun, value: "" },
  { label: "Quintas", icon: TreePine, value: "Quinta" },
  { label: "Piscinas", icon: Waves, value: "Piscina" },
  { label: "Casas", icon: House, value: "Casa" },
  { label: "Quinchos", icon: Flame, value: "Quincho" },
];
const kindLabel = (kind) => (kind === "Salon" ? "Salón" : kind);
const queryKeys = [
  "city",
  "guests",
  "budget",
  "kind",
  "amenities",
  "startsAt",
  "endsAt",
  "sort",
];
const localFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function localParts(value) {
  const parts = Object.fromEntries(
    localFormatter.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}${parts.second === "00" ? "" : `:${parts.second}`}`,
  };
}

function initialDraft(params) {
  const draft = {
    city: params.get("city") || "",
    guests: params.get("guests") || "",
    budget: params.get("budget") || "",
    kind: params.get("kind") || "",
    amenities: [
      ...new Set((params.get("amenities") || "").split(",").filter(Boolean)),
    ],
    date: "",
    start: "09:00",
    end: "09:00",
    endDate: "",
    dateError: "",
  };
  if (params.has("startsAt") || params.has("endsAt")) {
    try {
      const interval = intervalSchema.parse({
        startsAt: params.get("startsAt"),
        endsAt: params.get("endsAt"),
      });
      if (Date.parse(interval.endsAt) <= Date.parse(interval.startsAt))
        throw new Error("Invalid interval");
      const start = localParts(interval.startsAt);
      const end = localParts(interval.endsAt);
      Object.assign(draft, {
        date: start.date,
        start: start.time,
        end: end.time,
        // Preserve longer URL intervals until the user edits the date or hours.
        endDate: end.date,
      });
    } catch {
      draft.dateError =
        "Las fechas de la URL no son válidas. Elegí una fecha y revisá el horario, o borrá la fecha para buscar sin ella.";
    }
  }
  return draft;
}

function previewPeriod(draft, today) {
  try {
    const interval = localInterval(
      draft.date || today,
      draft.start,
      draft.end,
      draft.endDate || draft.date || today,
    );
    if (Date.parse(interval.endsAt) <= Date.parse(interval.startsAt))
      throw new Error("Invalid interval");
    return {
      interval,
      start: localParts(interval.startsAt),
      end: localParts(interval.endsAt),
      error: draft.dateError,
    };
  } catch {
    return { error: "Revisá la fecha y los horarios de inicio y fin." };
  }
}

export default function SearchForm({ catalog, params, onSearch }) {
  const [draft, setDraft] = useState(() => initialDraft(params));
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const id = useId();
  const panelId = `${id}-filters`;
  const errorId = `${id}-error`;
  const today = localParts(new Date()).date;
  const period = previewPeriod(draft, today);
  const message = error || period.error;
  const cities = catalog?.cities || [];
  const amenities = catalog?.amenities || [];
  const amenityOptions = [
    ...amenities,
    ...draft.amenities
      .filter((code) => !amenities.some((amenity) => amenity.code === code))
      .map((code) => ({ code, label: code })),
  ];
  const crossesMidnight = period.start && period.end.date !== period.start.date;
  const schedule = period.interval
    ? `Desde ${period.start.time} – Hasta ${period.end.time}${
        crossesMidnight
          ? draft.date
            ? ` (${period.end.date.split("-").reverse().join("/")})`
            : " (día siguiente)"
          : ""
      }`
    : `Desde ${draft.start} – Hasta ${draft.end}`;

  const selectedShift =
    shifts.find(
      (shift) =>
        shift.start === draft.start &&
        shift.end === draft.end &&
        period.interval &&
        (Date.parse(period.interval.endsAt) -
          Date.parse(period.interval.startsAt)) /
          3600000 ===
          shift.hours,
    )?.value || "custom";
  function updateShift(value) {
    const shift = shifts.find((shift) => shift.value === value);
    if (!shift) {
      setExpanded(true);
      return;
    }
    setDraft((current) => ({
      ...current,
      start: shift.start,
      end: shift.end,
      endDate: "",
      dateError: "",
    }));
    setError("");
  }

  function update(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(["date", "start", "end"].includes(field)
        ? { endDate: "", dateError: "" }
        : {}),
    }));
    setError("");
  }

  function search(values) {
    const selectedPeriod = previewPeriod(values, today);
    if (selectedPeriod.error) {
      setError(selectedPeriod.error);
      setExpanded(true);
      return;
    }
    if (
      values.date &&
      Date.parse(selectedPeriod.interval.startsAt) <= Date.now()
    ) {
      setError(
        "Elegí un inicio futuro. Podés buscar para hoy con una hora posterior a la actual.",
      );
      setExpanded(true);
      return;
    }

    // Retain accepted URL options (such as sort), replacing only the draft fields.
    const next = new URLSearchParams(params);
    for (const key of [...next.keys()])
      if (!queryKeys.includes(key)) next.delete(key);
    next.delete("page");
    for (const field of ["city", "guests", "budget", "kind"]) {
      if (values[field]) next.set(field, values[field]);
      else next.delete(field);
    }
    if (values.amenities.length)
      next.set("amenities", values.amenities.join(","));
    else next.delete("amenities");
    if (values.date) {
      next.set("startsAt", selectedPeriod.interval.startsAt);
      next.set("endsAt", selectedPeriod.interval.endsAt);
    } else {
      next.delete("startsAt");
      next.delete("endsAt");
    }

    const validated = searchSchema.safeParse(Object.fromEntries(next));
    if (!validated.success) {
      const field = validated.error.issues[0]?.path[0];
      const messages = {
        city: "La ciudad debe tener como máximo 100 caracteres.",
        guests: "Indicá una cantidad entera de personas entre 1 y 1000.",
        budget:
          "Indicá un presupuesto total entero entre 1.000 y 1.000.000.000 Gs.",
        kind: "Elegí uno de los tipos de espacio disponibles.",
        amenities:
          "La selección de comodidades es demasiado larga. Quitá algunas para buscar.",
        sort: "El orden de la URL no es válido. Elegí otro orden en los resultados o limpiá los filtros.",
      };
      setError(
        messages[field] || "Revisá la fecha y los horarios de la búsqueda.",
      );
      setExpanded(true);
      return;
    }
    setError("");
    onSearch(next);
  }

  return (
    <section className="search-section" aria-label="Buscar espacios">
      <form
        className="search-form"
        noValidate
        aria-describedby={message ? errorId : undefined}
        onSubmit={(event) => {
          event.preventDefault();
          search(draft);
        }}
      >
        <div className="search-main">
          <label>
            <span>
              <MapPin size={16} aria-hidden="true" />
              Zona / Ciudad
            </span>
            <select
              name="city"
              value={draft.city}
              onChange={(event) => update("city", event.target.value)}
            >
              <option value="">Todo Paraguay</option>
              {draft.city &&
                !cities.some((city) => city.city === draft.city) && (
                  <option value={draft.city}>{draft.city}</option>
                )}
              {cities.map((city) => (
                <option key={city.id} value={city.city}>
                  {city.city}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              Fecha de salida
            </span>
            <input
              name="date"
              type="date"
              min={today}
              value={draft.date}
              aria-label="Fecha de la escapada"
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
          <div className="search-shift">
            <label>
              <span>
                <Clock3 size={17} aria-hidden="true" />
                Horario / Turno
              </span>
              <select
                name="shift"
                aria-label="Horario / Turno"
                value={selectedShift}
                onChange={(event) => updateShift(event.target.value)}
              >
                {shifts.map((shift) => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
                <option value="custom">
                  {selectedShift === "custom"
                    ? "Personalizado: " + draft.start + "–" + draft.end
                    : "Personalizar horario"}
                </option>
              </select>
            </label>
            <button
              type="button"
              className={"filter-button" + (expanded ? " active" : "")}
              aria-label={expanded ? "Menos filtros" : "Más filtros"}
              title="Personalizar búsqueda"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpanded((current) => !current)}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
          <div className="guest-search-field">
            <span>
              <Users size={16} aria-hidden="true" />
              Personas
            </span>
            <select
              aria-label="Tamaño del grupo"
              value={draft.guests}
              onChange={(event) => update("guests", event.target.value)}
            >
              <option value="">Cantidad de personas</option>
              {draft.guests &&
                !guestOptions.some(([value]) => value === draft.guests) && (
                  <option value={draft.guests}>{draft.guests} personas</option>
                )}
              {guestOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <label>
            <span>
              <SlidersHorizontal size={17} aria-hidden="true" />
              Presupuesto máx.
            </span>
            <select
              aria-label="Presupuesto máximo total"
              value={
                ["", "300000", "500000", "1000000"].includes(draft.budget)
                  ? draft.budget
                  : "custom"
              }
              onChange={(event) => {
                if (event.target.value === "custom") setExpanded(true);
                else update("budget", event.target.value);
              }}
            >
              <option value="">Cualquier precio</option>
              <option value="300000">Hasta Gs. 300.000</option>
              <option value="500000">Hasta Gs. 500.000</option>
              <option value="1000000">Hasta Gs. 1.000.000</option>
              <option value="custom">
                {draft.budget &&
                !["300000", "500000", "1000000"].includes(draft.budget)
                  ? "Gs. " + Number(draft.budget).toLocaleString("es-PY")
                  : "Otro presupuesto"}
              </option>
            </select>
          </label>
          <button className="primary search-button" type="submit">
            <Search size={20} aria-hidden="true" />
            <span aria-hidden="true">Buscar</span>
            <span className="sr-only">Buscar espacios</span>
          </button>
        </div>
        {message && (
          <p className="search-error" id={errorId} role="alert">
            {message}
          </p>
        )}
        <div
          id={panelId}
          className={`advanced-filters${expanded ? " expanded" : ""}`}
          hidden={!expanded}
        >
          <p className="search-schedule">
            <Clock3 size={15} /> Horario de búsqueda:{" "}
            <strong>{schedule}</strong>
          </p>
          <div className="search-options">
            <div className="category-tabs" role="group" aria-label="Categorías">
              {categories.map(({ label, icon: Icon, value }) => (
                <button
                  key={label}
                  type="button"
                  className={draft.kind === value ? "active" : ""}
                  aria-pressed={draft.kind === value}
                  onClick={() => {
                    const nextDraft = { ...draft, kind: value };
                    setDraft(nextDraft);
                    search(nextDraft);
                  }}
                >
                  <Icon size={19} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label>
            Cantidad exacta de personas{" "}
            <input
              name="guests"
              type="number"
              min="1"
              max="1000"
              step="1"
              value={draft.guests}
              placeholder="Cantidad de personas"
              aria-label="Cantidad de personas"
              onChange={(event) => update("guests", event.target.value)}
            />
          </label>
          <label>
            Desde
            <input
              name="start"
              type="time"
              step="1"
              required
              value={draft.start}
              onChange={(event) =>
                update("start", event.target.value || "09:00")
              }
            />
          </label>
          <label>
            Hasta
            <input
              name="end"
              type="time"
              step="1"
              required
              value={draft.end}
              onChange={(event) => update("end", event.target.value || "17:00")}
            />
          </label>
          <label>
            Presupuesto total (Gs.)
            <input
              name="budget"
              type="number"
              min="1000"
              max="1000000000"
              step="1"
              value={draft.budget}
              placeholder="Sin límite"
              onChange={(event) => update("budget", event.target.value)}
            />
          </label>
          <label>
            Tipo
            <select
              name="kind"
              value={draft.kind}
              onChange={(event) => update("kind", event.target.value)}
            >
              <option value="">Todos</option>
              {draft.kind && !kinds.includes(draft.kind) && (
                <option value={draft.kind}>{draft.kind} (no válido)</option>
              )}
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {kindLabel(kind)}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="amenity-filters">
            <legend>Lo que no puede faltar</legend>
            {amenityOptions.map((amenity) => (
              <label key={amenity.code}>
                <input
                  type="checkbox"
                  name="amenities"
                  value={amenity.code}
                  checked={draft.amenities.includes(amenity.code)}
                  onChange={(event) =>
                    update(
                      "amenities",
                      event.target.checked
                        ? [...draft.amenities, amenity.code]
                        : draft.amenities.filter(
                            (code) => code !== amenity.code,
                          ),
                    )
                  }
                />
                {amenity.label}
              </label>
            ))}
            {!catalog && <small role="status">Cargando comodidades…</small>}
          </fieldset>
        </div>
      </form>
    </section>
  );
}
