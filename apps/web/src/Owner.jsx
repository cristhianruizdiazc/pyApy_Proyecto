import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Save,
  Upload,
  Trash2,
  Check,
  X,
  House,
  Eye,
  Heart,
  Wallet,
} from "lucide-react";
import { kinds, money, localInterval } from "@pyapy/contracts";
import { api } from "./api.js";
import {
  useSession,
  Loading,
  ErrorMessage,
  Empty,
  Modal,
  Photo,
} from "./ui.jsx";
import { Reservations, ReservationBrowser } from "./Reservations.jsx";
import { QueryState, RecordList, WorkspaceTabs } from "./Workspace.jsx";
import { localParts } from "./booking-selection.js";
const ownerSections = [
  ["properties", "Espacios"],
  ["calendar", "Calendario"],
  ["bookings", "Reservas"],
  ["plans", "Mi plan"],
];
function PropertyForm({ property, catalog, onSave, onClose }) {
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f);
    body.amenities = f.getAll("amenities");
    for (const key of [
      "capacity",
      "pricePerHour",
      "minHours",
      "maxHours",
      "openHour",
      "closeHour",
      "cancellationHours",
      "latitude",
      "longitude",
    ])
      body[key] = Number(body[key]);
    try {
      const result = await api(
        property ? `/properties/${property.id}` : "/properties",
        { method: property ? "PUT" : "POST", body },
      );
      onSave(result);
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={property ? "Editar espacio" : "Nuevo espacio"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="property-form">
        <fieldset className="form-section">
          <legend>Sobre tu espacio</legend>
          <label>
            Nombre
            <input
              name="name"
              defaultValue={property?.name}
              required
              minLength={3}
              maxLength={100}
            />
          </label>
          <label>
            Descripcion
            <textarea
              name="description"
              defaultValue={property?.description}
              required
              minLength={30}
              maxLength={5000}
            />
          </label>
          <div className="form-row">
            <label>
              Ciudad
              <select name="cityId" defaultValue={property?.cityId} required>
                {catalog.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Zona
              <input
                name="zone"
                defaultValue={property?.zone}
                required
                minLength={2}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Tipo
              <select name="kind" defaultValue={property?.kind || "Quinta"}>
                {kinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Capacidad
              <input
                name="capacity"
                type="number"
                defaultValue={property?.capacity || 10}
                required
                min="1"
                max="1000"
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="form-section">
          <legend>Tarifa y horarios</legend>
          <div className="form-row">
            <label>
              Tarifa por hora (Gs.)
              <input
                name="pricePerHour"
                type="number"
                defaultValue={property?.pricePerHour || 50000}
                required
                min="1000"
                max="100000000"
              />
            </label>
            <label>
              Cancelacion anticipada (h)
              <input
                name="cancellationHours"
                type="number"
                defaultValue={property?.cancellationHours ?? 24}
                min="0"
                max="720"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Minimo de horas
              <input
                name="minHours"
                type="number"
                defaultValue={property?.minHours || 4}
                min="1"
                max="168"
                required
              />
            </label>
            <label>
              Maximo de horas
              <input
                name="maxHours"
                type="number"
                defaultValue={property?.maxHours || 24}
                min="1"
                max="720"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Hora de apertura
              <input
                name="openHour"
                type="number"
                defaultValue={property?.openHour ?? 0}
                min="0"
                max="23"
                required
              />
            </label>
            <label>
              Hora de cierre
              <input
                name="closeHour"
                type="number"
                defaultValue={property?.closeHour ?? 24}
                min="1"
                max="24"
                required
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="form-section">
          <legend>Ubicación y servicios</legend>
          <div className="form-row">
            <label>
              Latitud aproximada
              <input
                name="latitude"
                type="number"
                step="0.001"
                min="-28"
                max="-19"
                defaultValue={property?.latitude || -25.308}
                required
              />
            </label>
            <label>
              Longitud aproximada
              <input
                name="longitude"
                type="number"
                step="0.001"
                min="-63"
                max="-54"
                defaultValue={property?.longitude || -57.296}
                required
              />
            </label>
          </div>
          <fieldset className="amenity-filters">
            <legend>Servicios</legend>
            {catalog.amenities.map((a) => (
              <label key={a.code}>
                <input
                  name="amenities"
                  type="checkbox"
                  value={a.code}
                  defaultChecked={property?.amenities.includes(a.code)}
                />
                {a.label}
              </label>
            ))}
          </fieldset>
          <label>
            Reglas
            <textarea
              name="rules"
              defaultValue={property?.rules}
              maxLength={2000}
            />
          </label>
          <label>
            Publicacion
            <select name="status" defaultValue={property?.status || "draft"}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </label>
        </fieldset>
        <ErrorMessage error={error} />
        <button className="primary" disabled={pending}>
          <Save size={17} />
          {pending ? "Guardando..." : "Guardar espacio"}
        </button>
      </form>
    </Modal>
  );
}
function MediaForm({ property, onClose, onUpdate }) {
  const { user } = useSession();
  const [section, setSection] = useState("photos");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["property", property.id],
    queryFn: ({ signal }) => api(`/properties/${property.id}`, { signal }),
  });
  const privateData = useQuery({
    queryKey: ["private", property.id, user.id],
    queryFn: ({ signal }) =>
      api(`/owner/properties/${property.id}/private`, { signal }),
    enabled: section === "private",
  });
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      await api(`/properties/${property.id}/images`, { method: "POST", body });
      client.invalidateQueries({ queryKey: ["property", property.id] });
      onUpdate();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
      e.target.value = "";
    }
  }
  async function savePrivate(e) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      await api(`/owner/properties/${property.id}/private`, {
        method: "PUT",
        body: {
          ...f,
          latitude: f.latitude ? Number(f.latitude) : null,
          longitude: f.longitude ? Number(f.longitude) : null,
        },
      });
      client.invalidateQueries({ queryKey: ["private", property.id] });
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal title={`Imagenes y contacto: ${property.name}`} onClose={onClose}>
      <WorkspaceTabs
        items={[
          ["photos", "Fotos"],
          ["private", "Datos de llegada"],
          ["socials", "Redes"],
        ]}
        value={section}
        onChange={(next) => {
          setSection(next);
          setError(null);
        }}
        label="Editar imágenes y contacto"
      >
        <ErrorMessage error={error} />
        {section === "photos" && (
          <QueryState query={q} retryLabel="Reintentar fotos">
            <div className="media-grid">
              {q.data?.images.map((i) => (
                <div key={i.id}>
                  <Photo src={i.url} alt={i.alt} />
                  <button
                    className="icon-button danger"
                    aria-label="Eliminar imagen"
                    title="Eliminar imagen"
                    disabled={pending}
                    onClick={async () => {
                      setPending(true);
                      try {
                        await api(`/properties/${property.id}/images/${i.id}`, {
                          method: "DELETE",
                        });
                        client.invalidateQueries({
                          queryKey: ["property", property.id],
                        });
                        onUpdate();
                      } catch (err) {
                        setError(err);
                      } finally {
                        setPending(false);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <label className="upload-label">
              <Upload size={18} />
              Agregar foto (hasta 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={upload}
                disabled={pending}
              />
            </label>
          </QueryState>
        )}
        {section === "private" && (
          <QueryState
            query={privateData}
            retryLabel="Reintentar datos privados"
          >
            <form key={privateData.dataUpdatedAt} onSubmit={savePrivate}>
              <h3>Datos privados del espacio</h3>
              <label>
                Direccion exacta
                <input
                  name="address"
                  defaultValue={privateData.data?.address}
                  maxLength={300}
                />
              </label>
              <label>
                Telefono privado
                <input
                  name="phone"
                  defaultValue={privateData.data?.phone}
                  maxLength={40}
                />
              </label>
              <div className="form-row">
                <label>
                  Latitud exacta
                  <input
                    name="latitude"
                    type="number"
                    step="0.0000001"
                    min="-28"
                    max="-19"
                    defaultValue={privateData.data?.latitude}
                  />
                </label>
                <label>
                  Longitud exacta
                  <input
                    name="longitude"
                    type="number"
                    step="0.0000001"
                    min="-63"
                    max="-54"
                    defaultValue={privateData.data?.longitude}
                  />
                </label>
              </div>
              <button className="primary" disabled={pending}>
                <Save size={17} />
                Guardar contacto privado
              </button>
            </form>
          </QueryState>
        )}
        {section === "socials" && (
          <QueryState query={q} retryLabel="Reintentar redes">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPending(true);
                try {
                  await api(`/owner/properties/${property.id}/socials`, {
                    method: "PUT",
                    body: Object.fromEntries(new FormData(e.currentTarget)),
                  });
                  onClose();
                } catch (err) {
                  setError(err);
                } finally {
                  setPending(false);
                }
              }}
            >
              <h3>Red oficial</h3>
              {q.data?.socials?.length > 0 && (
                <ul className="social-links">
                  {q.data.socials.map((s) => (
                    <li key={s.platform}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div className="form-row">
                <label>
                  Red
                  <select name="platform">
                    <option>instagram</option>
                    <option>facebook</option>
                    <option>tiktok</option>
                    <option>youtube</option>
                  </select>
                </label>
                <label>
                  Enlace HTTPS
                  <input
                    name="url"
                    type="url"
                    required
                    placeholder="https://www.instagram.com/..."
                  />
                </label>
              </div>
              <button className="secondary" disabled={pending}>
                <Save size={16} />
                Guardar enlace
              </button>
            </form>
          </QueryState>
        )}
      </WorkspaceTabs>
    </Modal>
  );
}
function Calendar({ items, properties, onAdded }) {
  const [month, setMonth] = useState(() => {
    const [year, month] = localParts().date.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => localParts().date);
  const [date, setDate] = useState(null);
  const [propertyId, setPropertyId] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const filtered = items.filter(
    (r) =>
      r.status === "confirmed" && (!propertyId || r.propertyId === propertyId),
  );
  const daySpan = localInterval(selectedDay, "00:00", "00:00");
  const dayEvents = filtered.filter(
    (r) =>
      Date.parse(r.startsAt) < Date.parse(daySpan.endsAt) &&
      Date.parse(r.endsAt) > Date.parse(daySpan.startsAt),
  );
  function moveMonth(direction) {
    const next = new Date(month.getFullYear(), month.getMonth() + direction, 1);
    setMonth(next);
    setSelectedDay(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
    );
  }
  async function add(e) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const f = new FormData(e.currentTarget);
      await api("/owner/occupancies", {
        method: "POST",
        key,
        body: {
          propertyId: f.get("propertyId"),
          kind: f.get("kind"),
          note: f.get("note"),
          guests: Number(f.get("guests")),
          ...localInterval(
            date,
            f.get("start"),
            f.get("end"),
            f.get("endDate") || date,
          ),
        },
      });
      setDate(null);
      onAdded();
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="calendar-toolbar">
        <div className="rail-buttons">
          <button
            className="icon-button"
            aria-label="Mes anterior"
            onClick={() => moveMonth(-1)}
          >
            <ArrowLeft />
          </button>
          <h2>
            {month.toLocaleDateString("es-PY", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            className="icon-button"
            aria-label="Mes siguiente"
            onClick={() => moveMonth(1)}
          >
            <ArrowRight />
          </button>
        </div>
        <select
          aria-label="Filtrar calendario por espacio"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="">Todos mis espacios</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="calendar-grid">
        {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((d) => (
          <div className="weekday" key={d}>
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`empty-${i}`} className="day empty-day" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const span = localInterval(d, "00:00", "00:00");
          const events = filtered.filter(
            (r) =>
              Date.parse(r.startsAt) < Date.parse(span.endsAt) &&
              Date.parse(r.endsAt) > Date.parse(span.startsAt),
          );
          return (
            <button
              className={`day${d === selectedDay ? " selected" : ""}`}
              key={d}
              onClick={() => {
                setSelectedDay(d);
              }}
              aria-pressed={d === selectedDay}
              aria-label={`Ver agenda del ${d}, ${events.length} ocupaciones`}
            >
              <strong>{i + 1}</strong>
              {events.length > 0 && (
                <span className="calendar-event-count" aria-hidden="true">
                  {events.length}
                </span>
              )}
              {events.slice(0, 3).map((r) => (
                <span className={`calendar-event ${r.kind}`} key={r.id}>
                  {r.kind === "block"
                    ? "Bloqueo"
                    : r.kind === "pyapy"
                      ? "pyApy"
                      : "Particular"}{" "}
                  · {r.propertyName}
                </span>
              ))}
              {events.length > 3 && <small>+{events.length - 3}</small>}
            </button>
          );
        })}
      </div>
      <section className="day-agenda" aria-label="Agenda del día">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AGENDA DEL DÍA</span>
            <h3>{selectedDay.split("-").reverse().join("/")}</h3>
          </div>
          <button
            className="secondary"
            onClick={() => {
              setDate(selectedDay);
              setKey(crypto.randomUUID());
              setError(null);
            }}
          >
            <Plus size={17} />
            Registrar ocupación
          </button>
        </div>
        {dayEvents.length ? (
          <Reservations items={dayEvents} />
        ) : (
          <p className="muted">Sin ocupaciones cargadas para este día.</p>
        )}
        <p className="muted">
          Calendario de las reservas cargadas (hasta 500). El servidor comprueba
          conflictos al registrar.
        </p>
      </section>
      {date && (
        <Modal
          title={`Registrar ocupacion: ${date}`}
          onClose={() => setDate(null)}
        >
          <form onSubmit={add}>
            <fieldset className="form-section" disabled={pending}>
              <legend>Reserva particular o bloqueo</legend>
              <label>
                Espacio
                <select
                  name="propertyId"
                  defaultValue={propertyId || properties[0]?.id}
                  required
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo
                <select name="kind">
                  <option value="owner">Reserva particular</option>
                  <option value="block">
                    Bloqueo / mantenimiento / uso personal
                  </option>
                </select>
              </label>
              <label>
                Fecha de salida
                <input
                  type="date"
                  name="endDate"
                  min={date}
                  defaultValue={date}
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
                  <input type="time" name="end" defaultValue="17:00" required />
                </label>
              </div>
              <label>
                Personas
                <input
                  name="guests"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue="1"
                  required
                />
              </label>
              <label>
                Nota privada
                <textarea name="note" maxLength={500} />
              </label>
              <ErrorMessage error={error} />
              <button className="primary" disabled={pending}>
                <CalendarDays size={17} />
                {pending ? "Guardando..." : "Registrar ocupacion"}
              </button>
            </fieldset>
          </form>
        </Modal>
      )}
    </>
  );
}
export default function Owner() {
  const { user } = useSession();
  return <OwnerWorkspace key={user?.id || "guest"} />;
}
function OwnerWorkspace() {
  const { user, session } = useSession();
  const client = useQueryClient();
  const enabled = Boolean(user && ["owner", "admin"].includes(user.role));
  const [params, setParams] = useSearchParams();
  const tab = ownerSections.some(([key]) => key === params.get("section"))
    ? params.get("section")
    : "properties";
  const setTab = (section) => {
    setParams({ section });
    setError(null);
    setNotice("");
  };
  const [edit, setEdit] = useState(null);
  const [creating, setCreating] = useState(false);
  const [media, setMedia] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const props = useQuery({
    queryKey: ["owner-properties", user?.id],
    queryFn: ({ signal }) => api("/owner/properties", { signal }),
    enabled: enabled && ["properties", "calendar"].includes(tab),
  });
  const bookings = useQuery({
    queryKey: ["owner-bookings", user?.id],
    queryFn: ({ signal }) => api("/owner/reservations", { signal }),
    enabled: enabled && ["bookings", "calendar"].includes(tab),
  });
  const metrics = useQuery({
    queryKey: ["owner-metrics", user?.id],
    queryFn: ({ signal }) => api("/owner/metrics", { signal }),
    enabled: enabled && tab === "properties",
  });
  const subscription = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: ({ signal }) => api("/owner/subscription", { signal }),
    enabled: enabled && tab === "plans",
  });
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api("/catalog"),
  });
  function refresh() {
    for (const key of [
      "owner-properties",
      "owner-bookings",
      "owner-metrics",
      "properties",
      "subscription",
      "reservations",
      "availability",
    ])
      client.invalidateQueries({ queryKey: [key] });
  }
  if (session.isPending) return <Loading />;
  if (!user)
    return (
      <main className="page">
        <h1>Tu espacio puede ser el proximo gran plan.</h1>
        <Link className="primary" to="/ingresar">
          Ingresar para publicar
        </Link>
      </main>
    );
  if (!enabled)
    return (
      <main className="page narrow">
        <h1>Sumate como propietario.</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            try {
              await api("/owner-profile", {
                method: "POST",
                body: {
                  commercialName: new FormData(e.currentTarget).get("name"),
                },
              });
              client.invalidateQueries({ queryKey: ["session"] });
            } catch (err) {
              setError(err);
            } finally {
              setPending(false);
            }
          }}
        >
          <label>
            Nombre comercial
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <ErrorMessage error={error} />
          <button className="primary" disabled={pending}>
            Crear perfil de propietario
            <ArrowRight size={17} />
          </button>
        </form>
      </main>
    );
  return (
    <main className="page owner-page workspace-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">PANEL DEL PROPIETARIO</p>
          <h1>Mi espacio</h1>
          <p className="muted">
            Tus lugares y tus próximos encuentros, en orden.
          </p>
        </div>
        <button
          className="primary"
          disabled={!catalog.data}
          onClick={() => {
            setCreating(true);
            setEdit(null);
          }}
        >
          <Plus size={18} />
          Nuevo espacio
        </button>
      </div>
      {tab === "properties" && (
        <QueryState query={metrics} retryLabel="Reintentar resumen">
          <div className="metrics-strip">
            {[
              [House, "Espacios", metrics.data?.properties],
              [CalendarDays, "Reservas pyApy", metrics.data?.bookings],
              [
                Wallet,
                "Importe reservado",
                metrics.data ? `Gs. ${money(metrics.data.revenue)}` : null,
              ],
            ].map(([Icon, label, value]) => (
              <div key={label}>
                <span>
                  <Icon size={17} />
                  {label}
                </span>
                <strong>{value ?? "--"}</strong>
              </div>
            ))}
          </div>
          <details className="activity-detail">
            <summary>Ver actividad de mis espacios</summary>
            <p>
              <Eye size={16} /> {metrics.data?.views} visitas ·{" "}
              <Heart size={16} /> {metrics.data?.favorites} guardados
            </p>
            <p className="muted">
              El importe reservado corresponde a reservas pyApy confirmadas; no
              representa cobros.
            </p>
          </details>
        </QueryState>
      )}
      <WorkspaceTabs
        items={ownerSections}
        value={tab}
        onChange={setTab}
        label="Panel del propietario"
      >
        <ErrorMessage error={!cancel && (error || catalog.error)} />
        {notice && (
          <p className="success" role="status">
            {notice}
          </p>
        )}
        {tab === "properties" && (
          <QueryState query={props} retryLabel="Reintentar espacios">
            {props.data?.items.length ? (
              <RecordList
                items={props.data.items}
                searchText={(p) => `${p.name} ${p.city}`}
                label="Buscar mi espacio"
                filters={[
                  ["published", "Publicados"],
                  ["draft", "Borradores"],
                  ["suspended", "Suspendidos"],
                ]}
                getStatus={(p) => p.status}
              >
                {(visible) => (
                  <div className="owner-property-list">
                    {visible.map((p) => (
                      <article className="owner-property-row" key={p.id}>
                        <Photo src={p.images[0]?.url} alt={p.name} />
                        <div>
                          <Link to={`/espacios/${p.id}`}>
                            <h2>{p.name}</h2>
                          </Link>
                          <p>
                            {p.city} · {p.capacity} personas
                          </p>
                          <span className="badge">
                            {p.status === "published"
                              ? "Publicado"
                              : p.status === "draft"
                                ? "Borrador"
                                : "Suspendido"}
                          </span>
                        </div>
                        <strong>
                          Gs. {money(p.pricePerHour)}
                          <small> / h</small>
                        </strong>
                        <div className="row-actions">
                          <button
                            className="icon-button outlined"
                            title="Editar espacio"
                            aria-label={`Editar ${p.name}`}
                            onClick={() => setEdit(p)}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="icon-button outlined"
                            title="Imagenes y contacto"
                            aria-label={`Imagenes y contacto de ${p.name}`}
                            onClick={() => setMedia(p)}
                          >
                            <Upload size={18} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </RecordList>
            ) : (
              <Empty title="Tu primer espacio empieza aca.">
                <button className="primary" onClick={() => setCreating(true)}>
                  <Plus size={17} />
                  Publicar un espacio
                </button>
              </Empty>
            )}
          </QueryState>
        )}
        {tab === "calendar" && (
          <QueryState query={props} retryLabel="Reintentar espacios">
            <QueryState query={bookings} retryLabel="Reintentar calendario">
              {props.data?.items.length ? (
                <Calendar
                  items={bookings.data?.items || []}
                  properties={props.data.items}
                  onAdded={refresh}
                />
              ) : (
                <Empty title="Primero registra un espacio." />
              )}
            </QueryState>
          </QueryState>
        )}
        {tab === "bookings" && (
          <QueryState query={bookings} retryLabel="Reintentar reservas">
            {bookings.data?.items.length ? (
              <ReservationBrowser
                items={bookings.data.items}
                onCancel={(r) => {
                  setCancel(r);
                  setError(null);
                }}
              />
            ) : (
              <Empty title="No hay reservas registradas." />
            )}
          </QueryState>
        )}
        {tab === "plans" && (
          <QueryState query={catalog} retryLabel="Reintentar planes">
            <QueryState
              query={subscription}
              retryLabel="Reintentar suscripción"
            >
              <h2>
                {subscription.data?.subscription
                  ? `${subscription.data.subscription.name} · ${subscription.data.subscription.status === "active" ? "Activo" : subscription.data.subscription.status === "pending" ? "Pendiente de confirmacion" : "Vencido"}`
                  : "Elegi tu plan"}
              </h2>
              <div className="plans-grid">
                {catalog.data?.plans.map((p) => (
                  <article className="plan" key={p.id}>
                    <h2>{p.name}</h2>
                    <p>
                      <strong>Gs. {money(p.monthly_price)}</strong> / mes
                    </p>
                    <p>Sin comision por reserva.</p>
                    <button
                      className="secondary"
                      disabled={pending}
                      onClick={async () => {
                        setPending(true);
                        try {
                          await api("/owner/subscription", {
                            method: "POST",
                            body: { planId: p.id },
                          });
                          refresh();
                          setNotice(
                            "Solicitud registrada. La activacion y el pago se coordinan con administracion.",
                          );
                        } catch (err) {
                          setError(err);
                        } finally {
                          setPending(false);
                        }
                      }}
                    >
                      Solicitar plan
                      <ArrowRight size={17} />
                    </button>
                  </article>
                ))}
              </div>
            </QueryState>
          </QueryState>
        )}
      </WorkspaceTabs>
      {(creating || edit) && catalog.data && (
        <PropertyForm
          property={edit}
          catalog={catalog.data}
          onClose={() => {
            setCreating(false);
            setEdit(null);
          }}
          onSave={() => {
            setCreating(false);
            setEdit(null);
            refresh();
          }}
        />
      )}
      {media && (
        <MediaForm
          property={media}
          onClose={() => setMedia(null)}
          onUpdate={refresh}
        />
      )}{" "}
      {cancel && (
        <Modal title="Cancelar ocupacion" onClose={() => setCancel(null)}>
          <p>{cancel.propertyName}: se liberara el intervalo reservado.</p>
          <ErrorMessage error={error} />
          <button
            className="primary destructive"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await api(`/reservations/${cancel.id}/cancel`, {
                  method: "POST",
                  body: {},
                });
                setCancel(null);
                refresh();
              } catch (err) {
                setError(err);
              } finally {
                setPending(false);
              }
            }}
          >
            <X size={17} />
            Confirmar cancelacion
          </button>
        </Modal>
      )}
    </main>
  );
}
