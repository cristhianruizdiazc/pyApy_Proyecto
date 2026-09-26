import { useId, useRef, useState } from "react";
import { ArrowDown, Search } from "lucide-react";
import { Empty, ErrorMessage, Loading } from "./ui.jsx";
import "./workspace.css";

export function QueryState({ query, children, retryLabel = "Reintentar" }) {
  if (query.isError)
    return (
      <div className="workspace-error">
        <ErrorMessage error={query.error} />
        <button className="secondary" onClick={() => query.refetch()}>
          {retryLabel}
        </button>
      </div>
    );
  if (query.isPending) return <Loading />;
  return children;
}

export function WorkspaceTabs({ items, value, onChange, label, children }) {
  const id = useId();
  const buttons = useRef([]);
  return (
    <>
      <div className="tabs workspace-tabs" role="tablist" aria-label={label}>
        {items.map(([key, text], index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}`}
            aria-controls={`${id}-panel`}
            aria-selected={value === key}
            tabIndex={value === key ? 0 : -1}
            className={value === key ? "active" : ""}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            onClick={() => onChange(key)}
            onKeyDown={(event) => {
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? items.length - 1
                    : event.key === "ArrowRight"
                      ? (index + 1) % items.length
                      : event.key === "ArrowLeft"
                        ? (index + items.length - 1) % items.length
                        : null;
              if (next === null) return;
              event.preventDefault();
              buttons.current[next]?.focus();
              buttons.current[next]?.scrollIntoView({
                block: "nearest",
                inline: "nearest",
              });
              onChange(items[next][0]);
            }}
          >
            {text}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${value}`}
        tabIndex={0}
        className="workspace-panel"
      >
        {children}
      </section>
    </>
  );
}

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es");
export function RecordList({
  items,
  searchText,
  label = "Buscar en registros cargados",
  filters = [],
  getStatus,
  children,
  emptyTitle = "No hay registros cargados.",
  pageSize = 12,
}) {
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const filtered = items.filter(
    (item) =>
      (!status || getStatus?.(item) === status) &&
      normalize(searchText(item)).includes(normalize(term)),
  );
  if (!items.length) return <Empty title={emptyTitle} />;
  return (
    <div className="record-browser">
      <div className="record-toolbar">
        <label className="record-search">
          <span>
            <Search size={16} />
            {label}
          </span>
          <input
            type="search"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setLimit(pageSize);
            }}
            placeholder="Escribí para filtrar"
          />
        </label>
        {filters.length > 0 && (
          <label>
            Estado
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setLimit(pageSize);
              }}
            >
              <option value="">Todos</option>
              {filters.map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {filtered.length ? (
        children(filtered.slice(0, limit))
      ) : (
        <Empty title="No hay coincidencias con estos filtros.">
          <button
            className="text-button"
            onClick={() => {
              setTerm("");
              setStatus("");
              setLimit(pageSize);
            }}
          >
            Limpiar búsqueda
          </button>
        </Empty>
      )}
      <div className="record-footer">
        <p role="status">
          {Math.min(limit, filtered.length)} de {filtered.length} coincidencias
          · {items.length} registros cargados
        </p>
        {limit < filtered.length && (
          <button
            className="secondary"
            onClick={() => setLimit((value) => value + pageSize)}
          >
            Mostrar más <ArrowDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
