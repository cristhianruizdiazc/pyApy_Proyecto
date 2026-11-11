import { lazy, Suspense, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
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
import { returnState } from "./auth-return.js";
import { api } from "./api.js";
import Sponsors from "./Sponsors.jsx";
import SearchForm from "./SearchForm.jsx";
import PropertyCard from "./SearchPropertyCard.jsx";
import useResultsScroll from "./useResultsScroll.js";
import { useSession, Loading, ErrorMessage, Empty } from "./ui.jsx";
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
    [ShieldCheck, "Reservá con confianza", "Disponibilidad antes de confirmar"],
    [Heart, "Apoyo local", "Anfitriones paraguayos"],
  ];
  return (
    <section className="home-benefits" aria-labelledby="benefits-title">
      <h2 className="sr-only" id="benefits-title">
        Por qué elegir pyApy
      </h2>
      <ul className="benefits-list layout-container">
        {features.map(([Icon, title, copy]) => (
          <li key={title}>
            <span className="benefit-icon">
              <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
function Hosts({ user }) {
  return (
    <section
      className="home-hosts"
      id="anfitriones"
      aria-labelledby="hosts-title"
    >
      <div className="hosts-media">
        <img
          src="/brand/anfitriones.webp"
          alt="Jardín arbolado con alojamientos al atardecer, imagen ilustrativa"
          width="1200"
          height="800"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="hosts-panel">
        <p className="eyebrow">Para anfitriones</p>
        <h2 id="hosts-title">
          Tus espacios pueden ser el próximo plan de alguien.
        </h2>
        <p>
          Sumá tu espacio a pyApy y hacelo visible para quienes buscan una
          escapada en Paraguay.
        </p>
        <ul>
          {[
            "Creá tu perfil y publicá tu espacio.",
            "Definí precios por hora, horarios y condiciones.",
            "Gestioná reservas y bloqueos desde tu calendario.",
          ].map((text) => (
            <li key={text}>
              <Check size={18} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        <Link
          className="hosts-cta"
          to={user ? "/propietario" : "/ingresar"}
          state={{ from: "/propietario" }}
        >
          Publicá tus espacios <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
function Steps() {
  const steps = [
    [
      "Buscá y filtrá",
      "Elegí ciudad, fecha, horario y cantidad de personas. Ajustá el presupuesto y los servicios para encontrar tu espacio.",
    ],
    [
      "Conocé el lugar",
      "Mirá las fotos, los servicios, la capacidad y las reglas. Compará opciones y revisá su precio por hora.",
    ],
    [
      "Consultá y reservá",
      "Ingresá y consultá disponibilidad y precio para tu horario. Revisá el total y confirmá tu reserva.",
    ],
  ];
  return (
    <section
      className="home-steps"
      id="como-funciona"
      aria-labelledby="steps-title"
    >
      <div className="layout-container">
        <p className="eyebrow">Así de simple</p>
        <h2 id="steps-title">Tu próxima escapada, en tres pasos.</h2>
        <ol className="steps-grid">
          {steps.map(([title, copy], index) => (
            <li key={title}>
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
        <Link className="steps-help" to="/ayuda#ayuda">
          Ver preguntas frecuentes <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
export default function Home() {
  const [params, setParams] = useSearchParams();
  const { user } = useSession();
  const nav = useNavigate();
  const location = useLocation();
  function login(action) {
    client.setQueryData(["session"], { user: null });
    nav("/ingresar", { state: returnState(location, action) });
  }
  const client = useQueryClient();
  const [map, setMap] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
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
  useResultsScroll(!query.isPending);
  const saved = new Set(favorites.data?.items.map((p) => p.id) || []);
  const items = query.data?.items || [];
  const alternativeCount =
    (query.data?.alternatives?.length || 0) +
    (query.data?.otherDates?.length || 0);
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
    if (!user) return login({ type: "favorite", id });
    try {
      await api(`/favorites/${id}`, {
        method: saved.has(id) ? "DELETE" : "PUT",
      });
      client.invalidateQueries({ queryKey: ["favorites"] });
    } catch (err) {
      if (err.status === 401)
        return login({ type: "favorite", id, remove: saved.has(id) });
      setError(err);
    }
  }
  function search(next) {
    setNotice("");
    setError(null);
    setParams(next);
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  async function saveIntent() {
    if (!user) return login({ type: "interest" });
    try {
      await api("/search-intents", {
        method: "POST",
        body: Object.fromEntries(params),
      });
      setNotice("Guardamos tu interés en esta búsqueda.");
    } catch (err) {
      if (err.status === 401) return login({ type: "interest" });
      setError(err);
    }
  }
  return (
    <main className="marketplace-home reference-home">
      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <img
          className="hero-image visible"
          src="/brand/escapada-2172.webp"
          srcSet="/brand/escapada-960.webp 960w, /brand/escapada-1600.webp 1600w, /brand/escapada-2172.webp 2172w"
          sizes="(max-width: 780px) 2172px, 100vw"
          width="2172"
          height="724"
          alt="Piscina y quincho frente al lago al atardecer, imagen ilustrativa"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-inner layout-container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <Waves size={18} strokeWidth={1.4} /> DESCUBRÍ PARAGUAY
            </div>
            <h1 id="hero-title">
              Tu próxima escapada, <em>más cerca</em> de lo que pensás.
            </h1>
            <p>
              Quintas, casas y espacios recreativos en los mejores destinos del
              Paraguay: naturaleza, descanso y experiencias únicas, todo en un
              solo lugar.
            </p>
            {catalog.data?.cities.length > 0 && (
              <p className="hero-places" aria-label="Destinos del catálogo">
                {catalog.data.cities.slice(0, 5).map((city) => (
                  <span key={city.id}>{city.city}</span>
                ))}
              </p>
            )}
          </div>
          <div id="buscar">
            <SearchForm
              key={params.toString()}
              catalog={catalog.data}
              params={params}
              onSearch={search}
            />
            <div className="catalog-feedback">
              <ErrorMessage error={catalog.error} />
            </div>
          </div>
        </div>
      </section>
      <Benefits />
      <section
        className="results-section page-width"
        id="results"
        ref={resultsRef}
        tabIndex={-1}
        aria-label="Resultados de búsqueda"
        aria-busy={query.isFetching}
      >
        <p className="sr-only" role="status" aria-atomic="true">
          {query.isFetching
            ? "Buscando espacios…"
            : query.isError
              ? "No pudimos cargar los resultados. Podés reintentar la búsqueda."
              : `${query.data?.total || 0} coincidencias exactas y ${alternativeCount} alternativas.`}
        </p>
        <div className="map-toggle-row">
          <button
            className="map-toggle"
            type="button"
            aria-pressed={map}
            disabled={
              !map && (query.isPending || query.isError || items.length === 0)
            }
            aria-describedby={
              query.isError || (!query.isPending && items.length === 0)
                ? "map-unavailable"
                : undefined
            }
            onClick={() => {
              setMap((open) => !open);
              setSelected(null);
            }}
          >
            {map ? (
              <Grid2X2 size={17} aria-hidden="true" />
            ) : (
              <Map size={17} aria-hidden="true" />
            )}
            {map ? "Ver espacios" : "Ver mapa"}
          </button>
          <p className="results-view-hint">
            {map
              ? "Ubicaciones públicas aproximadas · coincidencias de esta página"
              : "Explorá los espacios y compará tu próximo plan"}
          </p>
          {(query.isError || (!query.isPending && items.length === 0)) && (
            <p id="map-unavailable" className="muted">
              {query.isError
                ? "El mapa estará disponible cuando se puedan cargar los resultados."
                : "No hay coincidencias exactas para mostrar en el mapa."}
            </p>
          )}
        </div>
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
                  {query.data?.total
                    ? `${query.data.total} espacios${params.get("startsAt") ? " disponibles" : ""}`
                    : alternativeCount
                      ? `Encontramos ${alternativeCount} opciones cercanas a lo que buscás`
                      : "Probemos otro plan"}
                </h2>
                <p className="results-summary">
                  {items.length} coincidencias exactas en esta página
                  {alternativeCount > 0 &&
                    ` · ${alternativeCount} alternativas más abajo`}
                  .
                  {params.get("startsAt")
                    ? " Disponibilidad comprobada para el intervalo solicitado; se revalida al reservar."
                    : " Sin fecha elegida: disponibilidad sin verificar."}
                </p>
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
            {items.length === 0 && alternativeCount === 0 && (
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
            <div id="exact-results" className={map ? "results-with-map" : ""}>
              <div className="property-grid">
                {items.map((p) => (
                  <PropertyCard
                    key={p.id}
                    p={p}
                    favorite={saved.has(p.id)}
                    onFavorite={favorite}
                    onHover={setSelected}
                    selected={map && selected === p.id}
                  />
                ))}
              </div>
              {map && !query.isError && items.length > 0 && (
                <aside
                  className="results-map-panel"
                  aria-labelledby="results-map-title"
                >
                  <div className="results-map-head">
                    <div>
                      <h3 id="results-map-title">Mapa de espacios</h3>
                      <p>Ubicaciones públicas aproximadas</p>
                    </div>
                    <span>{items.length} en esta página</span>
                  </div>
                  <Suspense fallback={<Loading />}>
                    <PropertyMap
                      items={items}
                      selected={selected}
                      onSelect={(id) => {
                        setSelected(id);
                        const card = resultsRef.current?.querySelector(
                          `[data-property-id="${CSS.escape(id)}"]`,
                        );
                        if (card?.getClientRects().length)
                          card.scrollIntoView({
                            block: "nearest",
                            behavior: "instant",
                          });
                      }}
                    />
                  </Suspense>
                  <p className="results-map-foot">
                    El mapa muestra las coincidencias exactas de esta página.
                    Las alternativas se presentan por separado.
                  </p>
                </aside>
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
        {!query.isError &&
          [
            [
              "location",
              "Alternativas cerca del destino",
              query.data?.alternatives || [],
            ],
            [
              "budget",
              "Alternativas con un pequeño sobreprecio",
              query.data?.alternatives || [],
            ],
            [
              "services",
              "Alternativas sin algunos servicios opcionales",
              query.data?.alternatives || [],
            ],
            [
              "schedule",
              "Otros horarios y fechas verificados",
              query.data?.otherDates || [],
            ],
          ].map(
            ([stage, title, options]) =>
              options.some((p) => p.stage === stage) && (
                <section
                  className="alternatives"
                  key={stage}
                  aria-label={title}
                >
                  <h3>{title}</h3>
                  <div className="property-grid">
                    {options
                      .filter((p) => p.stage === stage)
                      .map((p) => (
                        <PropertyCard
                          key={p.id}
                          p={p}
                          headingLevel={4}
                          favorite={saved.has(p.id)}
                          onFavorite={favorite}
                        />
                      ))}
                  </div>
                </section>
              ),
          )}
        {!query.isError && query.data?.limits?.scheduleExplorationBounded && (
          <p className="muted">
            Exploramos hasta {query.data.limits.windowDays} dias posteriores,
            conservando la duracion. No es una revision de todas las fechas
            posibles.
          </p>
        )}
        {!query.isError && query.data?.limits?.alternativesTruncated && (
          <p className="muted">
            Hay mas alternativas que el maximo mostrado. Ajusta los filtros para
            precisar tu busqueda.
          </p>
        )}
      </section>
      <Sponsors />
      <Hosts user={user} />
      <Steps />
    </main>
  );
}
