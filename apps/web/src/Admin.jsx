import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ShieldCheck,
  Pause,
  Play,
  Pencil,
  Plus,
  Save,
  X,
} from "lucide-react";
import { money } from "@pyapy/contracts";
import { api } from "./api.js";
import { useSession, Loading, ErrorMessage, Empty, Modal } from "./ui.jsx";
import { QueryState, RecordList, WorkspaceTabs } from "./Workspace.jsx";
import { formatStay } from "./booking-selection.js";
const sections = [
  ["overview", "Resumen"],
  ["users", "Usuarios"],
  ["properties", "Espacios"],
  ["reviews", "Reseñas"],
  ["plans", "Planes"],
  ["subscriptions", "Suscripciones"],
  ["sponsors", "Sponsors"],
  ["weights", "Matching"],
  ["audit", "Auditoría"],
];
export default function Admin() {
  const { user, session } = useSession();
  if (session.isPending) return <Loading />;
  if (user?.role !== "admin")
    return (
      <main className="page">
        <h1>Acceso administrativo</h1>
        <p>Esta sección requiere una cuenta autorizada.</p>
        <Link to="/">Volver a explorar</Link>
      </main>
    );
  return <AdminWorkspace key={user.id} user={user} />;
}
function AdminWorkspace({ user }) {
  const [params, setParams] = useSearchParams();
  const tab = sections.some(([key]) => key === params.get("section"))
    ? params.get("section")
    : "overview";
  return (
    <main className="page admin-page workspace-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">GESTIÓN DE PYAPY</p>
          <h1>Administración</h1>
          <p className="muted">La información justa para gestionar cada día.</p>
        </div>
        <span className="badge">
          <ShieldCheck size={16} />
          Administrador
        </span>
      </div>
      <WorkspaceTabs
        items={sections}
        value={tab}
        onChange={(section) => setParams({ section })}
        label="Administración"
      >
        <AdminSection key={tab} tab={tab} user={user} />
      </WorkspaceTabs>
    </main>
  );
}
function AdminSection({ tab, user }) {
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const sending = useRef(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", user.id, tab],
    queryFn: ({ signal }) => api(`/admin/${tab}`, { signal }),
    enabled: user?.role === "admin",
  });
  async function mutate(path, body, method = "PATCH") {
    if (sending.current) return false;
    sending.current = true;
    setPending(true);
    setError(null);
    setNotice("");
    try {
      await api(path, { method, body });
      client.invalidateQueries({ queryKey: ["admin"] });
      setEdit(null);
      setNotice("Cambios guardados.");
      for (const key of [
        "catalog",
        "properties",
        "property",
        "owner-properties",
        "subscription",
        "sponsors",
      ])
        client.invalidateQueries({ queryKey: [key] });
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  const items = query.data?.items || [];
  return (
    <>
      <ErrorMessage error={!edit && error} />
      {notice && (
        <p className="success" role="status">
          {notice}
        </p>
      )}
      <QueryState query={query} retryLabel="Reintentar sección">
        {tab === "overview" ? (
          <>
            <div className="metrics-strip">
              {[
                ["Usuarios", query.data?.users],
                ["Espacios", query.data?.properties],
                ["Reservas", query.data?.total],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="overview-grid">
              <section className="workspace-card">
                <h2>Importe reservado</h2>
                <strong className="overview-amount">
                  Gs. {money(query.data?.revenue || 0)}
                </strong>
                <p>
                  Reservas pyApy confirmadas. Este importe no representa cobros.
                </p>
              </section>
              <section className="workspace-card">
                <h2>Notificaciones internas</h2>
                <p>
                  {query.data?.jobs.pending} pendientes ·{" "}
                  {query.data?.jobs.failed} fallidas
                </p>
                {query.data?.jobs.failed > 0 && (
                  <p className="error">
                    Hay avisos que requieren revisión operativa.
                  </p>
                )}
              </section>
            </div>
            <h2>Demanda registrada</h2>
            {query.data?.demand.length ? (
              <div
                className="data-table"
                role="region"
                aria-label="Demanda registrada"
                tabIndex={0}
              >
                <table>
                  <caption className="visually-hidden">
                    Búsquedas guardadas por ciudad
                  </caption>
                  <thead>
                    <tr>
                      <th>Ciudad</th>
                      <th>Busquedas guardadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.demand.map((d) => (
                      <tr key={d.city || "all"}>
                        <td>{d.city || "Sin preferencia"}</td>
                        <td>{d.searches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Sin solicitudes de busqueda guardadas." />
            )}
          </>
        ) : tab === "weights" ? (
          <form
            className="narrow"
            key={query.dataUpdatedAt}
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(
                [...new FormData(e.currentTarget)].map(([k, v]) => [
                  k,
                  Number(v),
                ]),
              );
              mutate("/admin/weights", data, "PUT");
            }}
          >
            <h2>Pesos de compatibilidad</h2>
            {items.map((i) => (
              <label key={i.criterion}>
                {
                  {
                    availability: "Disponibilidad",
                    city: "Ciudad",
                    capacity: "Capacidad",
                    budget: "Presupuesto",
                    amenities: "Servicios",
                  }[i.criterion]
                }{" "}
                (%)
                <input
                  name={i.criterion}
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={i.weight}
                  required
                />
              </label>
            ))}
            <p>Los valores deben sumar 100.</p>
            <button className="primary" disabled={pending}>
              <Save size={17} />
              Guardar pesos
            </button>
          </form>
        ) : (
          <>
            {tab === "sponsors" && (
              <button
                className="primary"
                onClick={() => setEdit({ type: "sponsor" })}
              >
                <Plus size={17} />
                Nueva campana
              </button>
            )}
            {items.length ? (
              <RecordList
                items={items}
                searchText={(i) =>
                  Object.values(i)
                    .filter(
                      (v) => typeof v === "string" || typeof v === "number",
                    )
                    .join(" ")
                }
                getStatus={(i) =>
                  i.status ||
                  (typeof i.active === "boolean"
                    ? i.active
                      ? "active"
                      : "inactive"
                    : i.visible
                      ? "visible"
                      : "hidden")
                }
                filters={
                  tab === "properties"
                    ? [
                        ["published", "Publicados"],
                        ["draft", "Borradores"],
                        ["suspended", "Suspendidos"],
                      ]
                    : tab === "subscriptions"
                      ? [
                          ["pending", "Pendientes"],
                          ["active", "Activas"],
                          ["expired", "Vencidas"],
                        ]
                      : tab === "reviews"
                        ? [
                            ["visible", "Públicas"],
                            ["hidden", "Ocultas"],
                          ]
                        : ["users", "plans", "sponsors"].includes(tab)
                          ? [
                              ["active", "Activos"],
                              ["inactive", "Inactivos"],
                            ]
                          : []
                }
                pageSize={15}
              >
                {(visible) => (
                  <div
                    className="data-table"
                    role="region"
                    aria-label={`Tabla de ${sections.find(([key]) => key === tab)[1]}`}
                    tabIndex={0}
                  >
                    <table>
                      <caption className="visually-hidden">
                        {sections.find(([key]) => key === tab)[1]} · registros
                        cargados
                      </caption>
                      <thead>
                        <tr>
                          {(tab === "users"
                            ? ["Cuenta", "Rol", "Estado", "Acciones"]
                            : tab === "properties"
                              ? [
                                  "Espacio",
                                  "Estado",
                                  "Verificacion",
                                  "Acciones",
                                ]
                              : tab === "reviews"
                                ? [
                                    "Opinion",
                                    "Puntuacion",
                                    "Visibilidad",
                                    "Acciones",
                                  ]
                                : tab === "plans"
                                  ? [
                                      "Plan",
                                      "Mensualidad",
                                      "Estado",
                                      "Acciones",
                                    ]
                                  : tab === "subscriptions"
                                    ? [
                                        "Propietario",
                                        "Plan",
                                        "Estado",
                                        "Vencimiento",
                                        "Acciones",
                                      ]
                                    : tab === "sponsors"
                                      ? [
                                          "Sponsor",
                                          "Campana",
                                          "Periodo",
                                          "Estado",
                                          "Acciones",
                                        ]
                                      : ["Fecha", "Operación", "Detalle"]
                          ).map((h) => (
                            <th key={h} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((i) => (
                          <tr key={i.id || i.owner_id}>
                            {tab === "users" ? (
                              <>
                                <td>
                                  <strong>{i.name}</strong>
                                  <small className="cell-secondary">
                                    {i.email}
                                  </small>
                                </td>
                                <td>
                                  {{
                                    client: "Cliente",
                                    owner: "Propietario",
                                    admin: "Administrador",
                                  }[i.role] || i.role}
                                </td>
                                <td>{i.active ? "Activo" : "Inactivo"}</td>
                                <td>
                                  <button
                                    className="icon-button"
                                    disabled={i.id === user.id || pending}
                                    title={
                                      i.active
                                        ? "Desactivar usuario"
                                        : "Activar usuario"
                                    }
                                    aria-label={
                                      i.active
                                        ? "Desactivar usuario"
                                        : "Activar usuario"
                                    }
                                    onClick={() =>
                                      mutate(`/admin/users/${i.id}`, {
                                        active: !i.active,
                                      })
                                    }
                                  >
                                    {i.active ? (
                                      <Pause size={18} />
                                    ) : (
                                      <Play size={18} />
                                    )}
                                  </button>
                                </td>
                              </>
                            ) : tab === "properties" ? (
                              <>
                                <td>
                                  <Link to={`/espacios/${i.id}`}>{i.name}</Link>
                                  <small className="cell-secondary">
                                    {i.city}
                                  </small>
                                </td>
                                <td>
                                  {
                                    {
                                      published: "Publicado",
                                      draft: "Borrador",
                                      suspended: "Suspendido",
                                    }[i.status]
                                  }
                                </td>
                                <td>
                                  {i.verified ? "Verificado" : "Pendiente"}
                                </td>
                                <td>
                                  <div className="row-actions">
                                    <button
                                      className="icon-button"
                                      title="Cambiar verificacion"
                                      aria-label={`Cambiar verificacion de ${i.name}`}
                                      disabled={pending}
                                      onClick={() =>
                                        mutate(`/admin/properties/${i.id}`, {
                                          verified: !i.verified,
                                          status: i.status,
                                        })
                                      }
                                    >
                                      <ShieldCheck size={18} />
                                    </button>
                                    <button
                                      className="icon-button"
                                      title={
                                        i.status === "suspended"
                                          ? "Publicar"
                                          : "Suspender"
                                      }
                                      aria-label={
                                        i.status === "suspended"
                                          ? "Publicar"
                                          : "Suspender"
                                      }
                                      disabled={pending}
                                      onClick={() =>
                                        mutate(`/admin/properties/${i.id}`, {
                                          verified: i.verified,
                                          status:
                                            i.status === "suspended"
                                              ? "published"
                                              : "suspended",
                                        })
                                      }
                                    >
                                      {i.status === "suspended" ? (
                                        <Play size={18} />
                                      ) : (
                                        <Pause size={18} />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : tab === "reviews" ? (
                              <>
                                <td>{i.comment}</td>
                                <td>{i.rating}/5</td>
                                <td>{i.visible ? "Publica" : "Oculta"}</td>
                                <td>
                                  <button
                                    className="icon-button"
                                    disabled={pending}
                                    title="Cambiar visibilidad"
                                    aria-label="Cambiar visibilidad"
                                    onClick={() =>
                                      mutate(`/admin/reviews/${i.id}`, {
                                        visible: !i.visible,
                                      })
                                    }
                                  >
                                    {i.visible ? (
                                      <Pause size={18} />
                                    ) : (
                                      <Play size={18} />
                                    )}
                                  </button>
                                </td>
                              </>
                            ) : tab === "plans" ? (
                              <>
                                <td>{i.name}</td>
                                <td>Gs. {money(i.monthly_price)}</td>
                                <td>{i.active ? "Activo" : "Inactivo"}</td>
                                <td>
                                  <button
                                    className="icon-button"
                                    title="Editar plan"
                                    aria-label={`Editar plan ${i.name}`}
                                    onClick={() =>
                                      setEdit({ type: "plan", ...i })
                                    }
                                  >
                                    <Pencil size={18} />
                                  </button>
                                </td>
                              </>
                            ) : tab === "subscriptions" ? (
                              <>
                                <td>{i.name}</td>
                                <td>{i.plan}</td>
                                <td>
                                  {{
                                    active: "Activa",
                                    pending: "Pendiente",
                                    expired: "Vencida",
                                  }[i.status] || i.status}
                                </td>
                                <td>
                                  {i.ends_at
                                    ? new Date(i.ends_at).toLocaleDateString(
                                        "es-PY",
                                      )
                                    : "Sin activar"}
                                </td>
                                <td>
                                  <button
                                    className="icon-button"
                                    title="Gestionar suscripcion"
                                    aria-label="Gestionar suscripcion"
                                    onClick={() =>
                                      setEdit({ type: "subscription", ...i })
                                    }
                                  >
                                    <Pencil size={18} />
                                  </button>
                                </td>
                              </>
                            ) : tab === "sponsors" ? (
                              <>
                                <td>{i.name}</td>
                                <td>{i.title}</td>
                                <td>
                                  {new Date(i.starts_at).toLocaleDateString(
                                    "es-PY",
                                  )}{" "}
                                  -{" "}
                                  {new Date(i.ends_at).toLocaleDateString(
                                    "es-PY",
                                  )}
                                </td>
                                <td>{i.active ? "Activa" : "Pausada"}</td>
                                <td>
                                  <button
                                    className="icon-button"
                                    title="Cambiar estado de campana"
                                    aria-label="Cambiar estado de campana"
                                    disabled={pending}
                                    onClick={() =>
                                      mutate(`/admin/sponsors/${i.id}`, {
                                        active: !i.active,
                                      })
                                    }
                                  >
                                    {i.active ? (
                                      <Pause size={18} />
                                    ) : (
                                      <Play size={18} />
                                    )}
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{formatStay(i.created_at)}</td>
                                <td>{i.action}</td>
                                <td>
                                  <details className="audit-details">
                                    <summary>Identificadores</summary>
                                    <p>
                                      Actor:{" "}
                                      <code>{i.actor_id || "Sistema"}</code>
                                    </p>
                                    <p>
                                      Recurso:{" "}
                                      <code>{i.resource_id || "--"}</code>
                                    </p>
                                  </details>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </RecordList>
            ) : (
              <Empty title="Sin registros en esta seccion." />
            )}
          </>
        )}
      </QueryState>
      {edit && (
        <Modal
          title={
            edit.type === "plan"
              ? "Editar plan"
              : edit.type === "subscription"
                ? "Gestionar suscripcion"
                : "Nueva campana"
          }
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (edit.type === "plan")
                mutate(`/admin/plans/${edit.id}`, {
                  monthlyPrice: Number(f.price),
                  active: f.active === "on",
                });
              else if (edit.type === "subscription")
                mutate(`/admin/subscriptions/${edit.owner_id}`, {
                  status: f.status,
                  endsAt: new Date(f.end).toISOString(),
                });
              else
                mutate(
                  "/admin/sponsors",
                  {
                    name: f.name,
                    url: f.url,
                    title: f.title,
                    startsAt: new Date(f.start).toISOString(),
                    endsAt: new Date(f.end).toISOString(),
                  },
                  "POST",
                );
            }}
          >
            {edit.type === "plan" ? (
              <>
                <label>
                  Mensualidad (Gs.)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="100000000"
                    defaultValue={edit.monthly_price}
                    required
                  />
                </label>
                <label className="checkbox">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={edit.active}
                  />
                  Activo
                </label>
              </>
            ) : edit.type === "subscription" ? (
              <>
                <label>
                  Estado
                  <select name="status">
                    <option value="active">Activar tras confirmar pago</option>
                    <option value="expired">Marcar vencida</option>
                  </select>
                </label>
                <label>
                  Vencimiento
                  <input name="end" type="date" required />
                </label>
              </>
            ) : (
              <>
                <label>
                  Sponsor
                  <input name="name" minLength={2} maxLength={100} required />
                </label>
                <label>
                  Enlace HTTPS
                  <input name="url" type="url" required />
                </label>
                <label>
                  Titulo de campana
                  <input name="title" minLength={3} maxLength={150} required />
                </label>
                <div className="form-row">
                  <label>
                    Desde
                    <input name="start" type="date" required />
                  </label>
                  <label>
                    Hasta
                    <input name="end" type="date" required />
                  </label>
                </div>
              </>
            )}
            <ErrorMessage error={error} />
            <button className="primary" disabled={pending}>
              <Check size={17} />
              Guardar
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
