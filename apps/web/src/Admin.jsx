import { useState } from "react";
import { Link } from "react-router-dom";
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
const sections = [
  ["overview", "Resumen"],
  ["users", "Usuarios"],
  ["properties", "Espacios"],
  ["reviews", "Resenas"],
  ["plans", "Planes"],
  ["subscriptions", "Suscripciones"],
  ["sponsors", "Sponsors"],
  ["weights", "Matching"],
  ["audit", "Auditoria"],
];
export default function Admin() {
  const { user, session } = useSession();
  const [tab, setTab] = useState("overview");
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", tab],
    queryFn: () => api(`/admin/${tab}`),
    enabled: user?.role === "admin",
  });
  async function mutate(path, body, method = "PATCH") {
    setPending(true);
    setError(null);
    try {
      await api(path, { method, body });
      client.invalidateQueries({ queryKey: ["admin"] });
      setEdit(null);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setPending(false);
    }
  }
  if (session.isPending) return <Loading />;
  if (user?.role !== "admin")
    return (
      <main className="page">
        <h1>Acceso administrativo</h1>
        <p>Esta seccion requiere una cuenta autorizada.</p>
        <Link to="/">Volver a explorar</Link>
      </main>
    );
  const items = query.data?.items || [];
  return (
    <main className="page admin-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">ADMINISTRACION</p>
          <h1>pyApy</h1>
        </div>
        <span className="badge">
          <ShieldCheck size={16} />
          Administrador
        </span>
      </div>
      <div className="tabs" role="tablist">
        {sections.map(([key, label]) => (
          <button
            role="tab"
            aria-selected={tab === key}
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => {
              setTab(key);
              setError(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorMessage error={!edit && (error || query.error)} />
      {query.isPending ? (
        <Loading />
      ) : tab === "overview" ? (
        <>
          <div className="metrics-strip">
            {[
              ["Usuarios", query.data?.users],
              ["Espacios", query.data?.properties],
              ["Reservas", query.data?.total],
              ["Importe reservado", `Gs. ${money(query.data?.revenue || 0)}`],
              ["Avisos pendientes", query.data?.jobs.pending],
              ["Avisos fallidos", query.data?.jobs.failed],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <h2>Demanda registrada</h2>
          {query.data?.demand.length ? (
            <div className="data-table">
              <table>
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
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    {(tab === "users"
                      ? ["Nombre", "Email", "Rol", "Estado", "Acciones"]
                      : tab === "properties"
                        ? [
                            "Espacio",
                            "Ciudad",
                            "Estado",
                            "Verificacion",
                            "Acciones",
                          ]
                        : tab === "reviews"
                          ? ["Opinion", "Puntuacion", "Visibilidad", "Acciones"]
                          : tab === "plans"
                            ? ["Plan", "Mensualidad", "Estado", "Acciones"]
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
                                : ["Fecha", "Actor", "Operacion", "Recurso"]
                    ).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id || i.owner_id}>
                      {tab === "users" ? (
                        <>
                          <td>{i.name}</td>
                          <td>{i.email}</td>
                          <td>{i.role}</td>
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
                          </td>
                          <td>{i.city}</td>
                          <td>{i.status}</td>
                          <td>{i.verified ? "Verificado" : "Pendiente"}</td>
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
                              onClick={() => setEdit({ type: "plan", ...i })}
                            >
                              <Pencil size={18} />
                            </button>
                          </td>
                        </>
                      ) : tab === "subscriptions" ? (
                        <>
                          <td>{i.name}</td>
                          <td>{i.plan}</td>
                          <td>{i.status}</td>
                          <td>
                            {i.ends_at
                              ? new Date(i.ends_at).toLocaleDateString("es-PY")
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
                            {new Date(i.starts_at).toLocaleDateString("es-PY")}{" "}
                            - {new Date(i.ends_at).toLocaleDateString("es-PY")}
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
                          <td>
                            {new Date(i.created_at).toLocaleString("es-PY")}
                          </td>
                          <td className="code-cell">
                            {i.actor_id || "Sistema"}
                          </td>
                          <td>{i.action}</td>
                          <td className="code-cell">{i.resource_id || "--"}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Sin registros en esta seccion." />
          )}
        </>
      )}
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
    </main>
  );
}
