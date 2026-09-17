import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Map,
  Grid2X2,
  MapPin,
  CalendarDays,
  Users,
  Sun,
  TreePine,
  Waves,
  House,
  Flame,
  Check,
} from "lucide-react";
import { kinds, localInterval } from "@pyapy/contracts";
import { api } from "./api.js";
import Sponsors from "./Sponsors.jsx";
import {
  useSession,
  PropertyCard,
  Loading,
  ErrorMessage,
  Empty,
} from "./ui.jsx";
const PropertyMap = lazy(() => import("./Map.jsx"));
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
};
function Rail({ items, favorites, onFavorite }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth / 3;
  }, [items]);
  const scroll = (direction) =>
    ref.current.scrollBy({
      left: direction * 340,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">CERCA DE VOS, LEJOS DE LA RUTINA</span>
          <h2>Un lugar para cada plan.</h2>
        </div>
        <div className="rail-buttons">
          <button
            className="icon-button outlined"
            aria-label="Espacios anteriores"
            title="Espacios anteriores"
            onClick={() => scroll(-1)}
          >
            <ArrowLeft />
          </button>
          <button
            className="icon-button outlined"
            aria-label="Espacios siguientes"
            title="Espacios siguientes"
            onClick={() => scroll(1)}
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      <div
        className="property-rail"
        ref={ref}
        onScroll={() => {
          const el = ref.current,
            segment = el.scrollWidth / 3;
          if (el.scrollLeft < segment / 2) el.scrollLeft += segment;
          else if (el.scrollLeft > segment * 1.5) el.scrollLeft -= segment;
        }}
      >
        {[0, 1, 2].flatMap((copy) =>
          items.map((p) => (
            <div
              key={`${copy}-${p.id}`}
              className="rail-item"
              aria-hidden={copy !== 1 ? true : undefined}
              ref={(el) => {
                if (el && copy !== 1)
                  el.querySelectorAll("a,button").forEach(
                    (n) => (n.tabIndex = -1),
                  );
              }}
            >
              <PropertyCard
                p={p}
                favorite={favorites.has(p.id)}
                onFavorite={onFavorite}
              />
            </div>
          )),
        )}
      </div>
    </>
  );
}
export default function Home() {
  const [params, setParams] = useSearchParams();
  const { user } = useSession();
  const nav = useNavigate();
  const client = useQueryClient();
  const [filters, setFilters] = useState(false);
  const [map, setMap] = useState(false);
  const [selected, setSelected] = useState(null);
  const [slide, setSlide] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);
  const formRef = useRef(null);
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api("/catalog"),
  });
  const query = useQuery({
    queryKey: ["properties", params.toString()],
    queryFn: ({ signal }) => api(`/properties?${params}`, { signal }),
  });
  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => api("/favorites"),
    enabled: Boolean(user),
  });
  const saved = new Set(favorites.data?.items.map((p) => p.id) || []);
  const items = query.data?.items || [];
  const hasSearch = params.size > 0;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      if (!document.hidden) setSlide((s) => (s + 1) % 3);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  async function favorite(id) {
    if (!user) return nav("/ingresar");
    try {
      await api(`/favorites/${id}`, {
        method: saved.has(id) ? "DELETE" : "PUT",
      });
      client.invalidateQueries({ queryKey: ["favorites"] });
    } catch (err) {
      setError(err);
    }
  }
  function submit(e) {
    e.preventDefault();
    setNotice("");
    setError(null);
    const form = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["city", "guests", "budget", "kind"])
      if (form.get(key)) next.set(key, form.get(key));
    if (form.get("date")) {
      const interval = localInterval(
        form.get("date"),
        form.get("start"),
        form.get("end"),
      );
      next.set("startsAt", interval.startsAt);
      next.set("endsAt", interval.endsAt);
    }
    const amenities = form.getAll("amenities");
    if (amenities.length) next.set("amenities", amenities.join(","));
    setParams(next);
    setTimeout(
      () =>
        document
          .getElementById("results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      100,
    );
  }
  async function saveIntent() {
    if (!user) return nav("/ingresar");
    try {
      await api("/search-intents", {
        method: "POST",
        body: Object.fromEntries(params),
      });
      setNotice("Guardamos tu interes en esta busqueda.");
    } catch (err) {
      setError(err);
    }
  }
  const heroImages = ["pool", "house", "retreat"];
  return (
    <main>
      <section className="hero" aria-label="Escapadas en Paraguay">
        {heroImages.map((name, i) => (
          <img
            key={name}
            className={slide === i ? "hero-image visible" : "hero-image"}
            src={`/demo/${name}.jpg`}
            alt={
              i === slide ? "Espacio recreativo con piscina y naturaleza" : ""
            }
            aria-hidden={i !== slide}
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        ))}
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sun size={16} />
            PARAGUAY, A TU AIRE
          </div>
          <h1>
            pyApy<span>.</span>
          </h1>
          <p>
            Tu proxima escapada,
            <br />
            mas cerca de lo que pensas.
          </p>
          <a href="#results" className="hero-link">
            Encontra tu lugar
            <ArrowUpRight size={19} />
          </a>
        </div>
        <div className="hero-bottom">
          <span>
            <MapPin size={14} />
            Un respiro empieza por un lugar.
          </span>
          <div className="slide-controls">
            {heroImages.map((_, i) => (
              <button
                key={i}
                className={slide === i ? "active" : ""}
                aria-label={`Ver imagen ${i + 1}`}
                aria-pressed={slide === i}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>
        {catalog.data?.demo && (
          <span className="demo-badge">Entorno de demostracion</span>
        )}
      </section>
      <section className="search-section">
        <form className="search-form" onSubmit={submit} ref={formRef}>
          <div className="search-main">
            <label>
              <span>
                <MapPin size={16} />
                Donde
              </span>
              <select name="city" defaultValue={params.get("city") || ""}>
                <option value="">Todo Paraguay</option>
                {catalog.data?.cities.map((c) => (
                  <option key={c.id}>{c.city}</option>
                ))}
              </select>
            </label>
            <label>
              <span>
                <CalendarDays size={16} />
                Cuando
              </span>
              <input
                name="date"
                type="date"
                min={tomorrow()}
                aria-label="Fecha de la escapada"
              />
            </label>
            <label>
              <span>
                <Users size={16} />
                Con quienes
              </span>
              <input
                name="guests"
                type="number"
                min="1"
                max="1000"
                defaultValue={params.get("guests") || ""}
                placeholder="Cantidad de personas"
                aria-label="Cantidad de personas"
              />
            </label>
            <button className="primary search-button" type="submit">
              <Search size={20} />
              Buscar espacios
            </button>
          </div>
          <div className="search-options">
            <div className="category-tabs">
              {[
                { label: "Todos", icon: Sun, value: "" },
                { label: "Quintas", icon: TreePine, value: "Quinta" },
                { label: "Piscinas", icon: Waves, value: "Piscina" },
                { label: "Casas", icon: House, value: "Casa" },
                { label: "Quinchos", icon: Flame, value: "Quincho" },
              ].map(({ label, icon: Icon, value }) => (
                <button
                  key={label}
                  type="button"
                  className={
                    (params.get("kind") || "") === value ? "active" : ""
                  }
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    if (value) next.set("kind", value);
                    else next.delete("kind");
                    next.delete("page");
                    setParams(next);
                  }}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`filter-button ${filters ? "active" : ""}`}
              onClick={() => setFilters(!filters)}
              aria-expanded={filters}
            >
              <SlidersHorizontal size={17} />
              Filtros
              {params.get("amenities") && <span className="filter-dot" />}
            </button>
          </div>
          <div className={`advanced-filters ${filters ? "expanded" : ""}`}>
            <label>
              Desde
              <input name="start" type="time" defaultValue="09:00" required />
            </label>
            <label>
              Hasta
              <input name="end" type="time" defaultValue="17:00" required />
            </label>
            <label>
              Presupuesto total (Gs.)
              <input
                name="budget"
                type="number"
                min="1000"
                step="1000"
                defaultValue={params.get("budget") || ""}
                placeholder="Sin limite"
              />
            </label>
            <label>
              Tipo
              <select name="kind" defaultValue={params.get("kind") || ""}>
                <option value="">Cualquiera</option>
                {kinds.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <fieldset className="amenity-filters">
              <legend>Lo que no puede faltar</legend>
              {catalog.data?.amenities.map((a) => (
                <label key={a.code}>
                  <input
                    type="checkbox"
                    name="amenities"
                    value={a.code}
                    defaultChecked={(params.get("amenities") || "")
                      .split(",")
                      .includes(a.code)}
                  />
                  {a.label}
                </label>
              ))}
            </fieldset>
          </div>
        </form>
      </section>
      <section className="results-section page-width" id="results">
        <ErrorMessage error={query.error || catalog.error || error} />
        {query.isPending ? (
          <Loading />
        ) : !hasSearch && !map && items.length > 0 ? (
          <Rail items={items} favorites={saved} onFavorite={favorite} />
        ) : (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">ENCONTRA TU PROXIMO PLAN</span>
                <h2>
                  {query.data?.total || 0} espacios
                  {params.get("startsAt") ? " disponibles" : ""}
                </h2>
              </div>
              <div className="results-actions">
                {hasSearch && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setParams({});
                      formRef.current?.reset();
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
                <select
                  aria-label="Ordenar resultados"
                  value={params.get("sort") || "match"}
                  onChange={(e) => {
                    const next = new URLSearchParams(params);
                    next.set("sort", e.target.value);
                    setParams(next);
                  }}
                >
                  <option value="match">Mejor coincidencia</option>
                  <option value="price">Menor precio</option>
                  <option value="capacity">Menor capacidad</option>
                </select>
              </div>
            </div>
            {items.length === 0 && (
              <Empty title="Probemos otro plan.">
                <p>
                  Estas opciones pueden funcionar con otra zona, presupuesto o
                  fecha.
                </p>
                <button className="secondary" onClick={saveIntent}>
                  Guardar mi interes
                  <Check size={16} />
                </button>
                {notice && <p role="status">{notice}</p>}
              </Empty>
            )}
            <div className={map ? "results-with-map" : ""}>
              <div className="property-grid">
                {items.map((p) => (
                  <PropertyCard
                    key={p.id}
                    p={p}
                    favorite={saved.has(p.id)}
                    onFavorite={favorite}
                    onHover={setSelected}
                  />
                ))}
              </div>
              {map && (
                <Suspense fallback={<Loading />}>
                  <PropertyMap
                    items={items}
                    selected={selected}
                    onSelect={setSelected}
                  />
                </Suspense>
              )}
            </div>
            {query.data?.total > 20 && (
              <div className="pagination">
                <button
                  className="icon-button outlined"
                  aria-label="Pagina anterior"
                  disabled={Number(params.get("page") || 1) <= 1}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("page", Number(params.get("page") || 1) - 1);
                    setParams(next);
                  }}
                >
                  <ArrowLeft />
                </button>
                <span>Pagina {params.get("page") || 1}</span>
                <button
                  className="icon-button outlined"
                  aria-label="Pagina siguiente"
                  disabled={
                    Number(params.get("page") || 1) * 20 >= query.data.total
                  }
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("page", Number(params.get("page") || 1) + 1);
                    setParams(next);
                  }}
                >
                  <ArrowRight />
                </button>
              </div>
            )}
          </>
        )}
        {query.data?.alternatives.length > 0 && (
          <div className="alternatives">
            <h3>Otras opciones para tu escapada</h3>
            <div className="property-grid">
              {query.data.alternatives.map((p) => (
                <PropertyCard
                  key={p.id}
                  p={p}
                  favorite={saved.has(p.id)}
                  onFavorite={favorite}
                />
              ))}
            </div>
          </div>
        )}
        {query.data?.otherDates.length > 0 && (
          <div className="alternatives">
            <h3>Para disfrutar en otra fecha</h3>
            <div className="property-grid">
              {query.data.otherDates.map((p) => (
                <PropertyCard key={p.id} p={p} onFavorite={favorite} />
              ))}
            </div>
          </div>
        )}
        <div className="map-toggle-row">
          <button className="map-toggle" onClick={() => setMap(!map)}>
            {map ? <Grid2X2 size={17} /> : <Map size={17} />}{" "}
            {map ? "Ver espacios" : "Explorar el mapa"}
          </button>
        </div>
      </section>
      <Sponsors />
      <section className="locations-band">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EL PLAN TAMBIEN ES EL CAMINO</span>
              <h2>Un poco mas alla.</h2>
            </div>
            <span className="muted">Lugares para volver.</span>
          </div>
          <div className="locations-grid">
            {[
              ["San Bernardino", "El lago siempre es un buen plan.", "house"],
              ["Aregua", "Una pausa entre verde y calma.", "garden"],
              ["Altos", "El aire cambia, vos tambien.", "retreat"],
            ].map(([city, copy, img]) => (
              <Link
                key={city}
                to={`/?city=${encodeURIComponent(city)}`}
                className="location-tile"
              >
                <img
                  src={`/demo/${img}.jpg`}
                  alt={`Imagen ilustrativa para ${city}`}
                  loading="lazy"
                />
                <div>
                  <span>
                    <MapPin size={14} />
                    {city}
                  </span>
                  <p>{copy}</p>
                </div>
                <ArrowUpRight size={24} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
