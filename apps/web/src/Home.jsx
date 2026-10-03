import { lazy, Suspense, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Map,
  Grid2X2,
  Check,
  TreePine,
  Waves,
  CookingPot,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { api } from "./api.js";
import Sponsors from "./Sponsors.jsx";
import SearchForm from "./SearchForm.jsx";
import {
  useSession,
  PropertyCard,
  Loading,
  ErrorMessage,
  Empty,
} from "./ui.jsx";
const PropertyMap = lazy(() => import("./Map.jsx"));
function Rail({ items, favorites, onFavorite, onExplore }) {
  const ref = useRef(null);
  const scroll = (direction) =>
    ref.current?.scrollBy({
      left: direction * ref.current.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  return (
    <div className="featured-properties">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PROPIEDADES DESTACADAS</span>
          <h2>Las mejores quintas te esperan</h2>
        </div>
        <button className="view-all" onClick={onExplore}>
          Ver todas las propiedades <ArrowRight size={15} />
        </button>
      </div>
      <div
        className="property-rail"
        role="region"
        aria-label="Espacios para tu próximo plan"
        tabIndex={0}
        ref={ref}
        onKeyDown={(event) => {
          if (
            event.target === event.currentTarget &&
            ["ArrowLeft", "ArrowRight"].includes(event.key)
          ) {
            event.preventDefault();
            scroll(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {items.map((p) => (
          <div className="rail-item" key={p.id}>
            <PropertyCard
              p={p}
              compact
              favorite={favorites.has(p.id)}
              onFavorite={onFavorite}
            />
          </div>
        ))}
      </div>
      <div className="rail-buttons">
        <button
          className="icon-button outlined"
          aria-label="Espacios anteriores"
          onClick={() => scroll(-1)}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="icon-button outlined"
          aria-label="Espacios siguientes"
          onClick={() => scroll(1)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
function Benefits() {
  const features = [
    [TreePine, "Naturaleza", "Respirá aire puro"],
    [Waves, "Piscinas", "Disfrutá el verano"],
    [CookingPot, "Parrillas", "Compartí en familia"],
    [ShieldCheck, "Reservas seguras", "Tu tranquilidad primero"],
    [Heart, "Apoyo local", "Anfitriones paraguayos"],
  ];
  return (
    <section
      className="home-benefits page-width"
      id="como-funciona"
      aria-label="Cómo funciona pyApy"
    >
      {features.map(([Icon, title, copy]) => (
        <div key={title}>
          <Icon size={34} strokeWidth={1.35} />
          <div>
            <strong>{title}</strong>
            <span>{copy}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
export default function Home() {
  const [params, setParams] = useSearchParams();
  const { user } = useSession();
  const nav = useNavigate();
  const client = useQueryClient();
  const [map, setMap] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
  const searchRef = useRef(null);
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
  const featuredImageOrder = ["pool", "house", "cabin", "palms"];
  const featuredItems = [...items].sort((a, b) => {
    const rank = (property) => {
      if (!property.isDemo) return featuredImageOrder.length;
      const index = featuredImageOrder.findIndex(
        (name) => property.images[0]?.url === `/demo/${name}.jpg`,
      );
      return index < 0 ? featuredImageOrder.length : index;
    };
    return rank(a) - rank(b);
  });
  const hasSearch = params.size > 0;
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
  function search(next) {
    setNotice("");
    setError(null);
    setParams(next);
    resultsRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  async function saveIntent() {
    if (!user) return nav("/ingresar");
    try {
      await api("/search-intents", {
        method: "POST",
        body: Object.fromEntries(params),
      });
      setNotice("Guardamos tu interés en esta búsqueda.");
    } catch (err) {
      setError(err);
    }
  }
  return (
    <main className="marketplace-home reference-home">
      <section className="hero" aria-label="Escapadas en Paraguay">
        <img
          className="hero-image visible"
          src="/brand/escapada-atardecer.png"
          alt="Piscina y quincho frente al lago al atardecer, imagen ilustrativa"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Waves size={18} strokeWidth={1.4} /> DESCUBRÍ PARAGUAY
          </div>
          <h1>
            Tu próxima escapada,
            <br />
            <em>más cerca</em>
            <br />
            de lo que pensás.
          </h1>
          <p>
            Quintas, casas y bungalows en los mejores destinos
            <br className="desktop-break" /> del Paraguay. Naturaleza, descanso
            y experiencias
            <br className="desktop-break" /> únicas, todo en un solo lugar.
          </p>
        </div>
      </section>
      <div id="buscar" ref={searchRef}>
        <SearchForm
          key={params.toString()}
          catalog={catalog.data}
          params={params}
          onSearch={search}
        />
        <div className="page-width">
          <ErrorMessage error={catalog.error} />
        </div>
      </div>
      <Benefits />
      <section
        className="results-section page-width"
        id="results"
        ref={resultsRef}
        aria-busy={query.isFetching}
      >
        <ErrorMessage error={error} />
        {query.isError ? (
          <div className="search-failure">
            <ErrorMessage error={query.error} />
            <p>
              No pudimos consultar los espacios. Volvé a intentarlo para ver los
              resultados.
            </p>
            <button className="secondary" onClick={() => query.refetch()}>
              Reintentar búsqueda
            </button>
            {hasSearch && (
              <button className="text-button" onClick={() => setParams({})}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : query.isPending ? (
          <Loading />
        ) : !hasSearch && !map && items.length > 0 ? (
          <Rail
            items={featuredItems}
            favorites={saved}
            onFavorite={favorite}
            onExplore={() => search(new URLSearchParams({ sort: "match" }))}
          />
        ) : (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">ENCONTRÁ TU PRÓXIMO PLAN</span>
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
                      setNotice("");
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
                    next.delete("page");
                    setParams(next);
                  }}
                >
                  <option value="match">Mejor coincidencia</option>
                  <option value="price">Menor precio</option>
                  <option value="capacity">Menor capacidad</option>
                </select>
              </div>
            </div>
            {query.data?.searchLimited && (
              <p className="muted">
                Mostramos una selección de espacios. Afiná los filtros para
                encontrar tu plan.
              </p>
            )}
            {items.length === 0 && (
              <Empty title="Probemos otro plan.">
                <p>
                  No hay coincidencias exactas. Probá otra zona, presupuesto o
                  fecha, o guardá tu búsqueda.
                </p>
                <button className="secondary" onClick={saveIntent}>
                  Guardar mi interés
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
                    compact
                    favorite={saved.has(p.id)}
                    onFavorite={favorite}
                    onHover={setSelected}
                    selected={map && selected === p.id}
                  />
                ))}
              </div>
              {map && (
                <Suspense fallback={<Loading />}>
                  <PropertyMap
                    items={items}
                    selected={selected}
                    onSelect={(id) => {
                      setSelected(id);
                      resultsRef.current
                        ?.querySelector(
                          `[data-property-id="${CSS.escape(id)}"]`,
                        )
                        ?.scrollIntoView({
                          block: "nearest",
                          behavior: "instant",
                        });
                    }}
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
        {!query.isError && query.data?.alternatives.length > 0 && (
          <div className="alternatives">
            <h3>Otras opciones para tu escapada</h3>
            <p className="muted">
              Pueden variar la zona, el presupuesto o los servicios que
              elegiste.
            </p>
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
        {!query.isError && query.data?.otherDates.length > 0 && (
          <div className="alternatives">
            <h3>Para disfrutar en otra fecha</h3>
            <p className="muted">
              Estos espacios están ocupados en tu horario. Consultá una nueva
              fecha.
            </p>
            <div className="property-grid">
              {query.data.otherDates.map((p) => (
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
        <div className="map-toggle-row">
          <button
            className="map-toggle"
            aria-pressed={map}
            onClick={() => setMap(!map)}
          >
            {map ? <Grid2X2 size={17} /> : <Map size={17} />}{" "}
            {map ? "Ver espacios" : "Explorar el mapa"}
          </button>
        </div>
      </section>
      <Sponsors />
    </main>
  );
}
