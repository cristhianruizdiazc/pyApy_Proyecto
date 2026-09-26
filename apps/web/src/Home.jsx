import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Map,
  Grid2X2,
  MapPin,
  Sun,
  Check,
  Pause,
  Play,
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
  Photo,
} from "./ui.jsx";
const PropertyMap = lazy(() => import("./Map.jsx"));
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
        role="region"
        aria-label="Espacios para tu próximo plan"
        tabIndex={0}
        ref={ref}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            scroll(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
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
  const [map, setMap] = useState(false);
  const [selected, setSelected] = useState(null);
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
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
  const hasSearch = params.size > 0;
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => {
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener("change", changed);
    return () => preference.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      if (
        !document.hidden &&
        !searchRef.current?.contains(document.activeElement)
      )
        setSlide((s) => (s + 1) % 3);
    }, 8000);
    return () => clearInterval(interval);
  }, [playing]);
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
  const heroImages = ["pool", "house", "retreat"];
  const heroAlt = [
    "Piscina rodeada de naturaleza, imagen ilustrativa",
    "Casa junto al agua, imagen ilustrativa",
    "Espacio de descanso al aire libre, imagen ilustrativa",
  ];
  const heroImage = heroImages[slide];
  return (
    <main className="marketplace-home">
      <section className="hero" aria-label="Escapadas en Paraguay">
        <picture>
          <source
            media="(max-width: 700px)"
            srcSet={`/demo/${heroImage}-640.webp`}
            type="image/webp"
          />
          <source
            srcSet={`/demo/${heroImage}-1280.webp`}
            type="image/webp"
          />
          <img
            key={heroImage}
            className="hero-image visible"
            src={`/demo/${heroImage}.jpg`}
            alt={heroAlt[slide]}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sun size={16} />
            ESCAPADAS CON RAÍCES
          </div>
          <h1>
            Un lugar.
            <br />
            Tu gente.
            <br />
            <span>Un buen plan.</span>
          </h1>
          <p>Encontrá tu próxima escapada en Paraguay.</p>
          <a href="#buscar" className="hero-link">
            Encontrá tu lugar
            <ArrowUpRight size={19} />
          </a>
        </div>
        <div className="hero-bottom">
          <span>
            <MapPin size={14} />
            Paraguay, a tu aire.
          </span>
          <div className="slide-controls">
            {heroImages.map((_, i) => (
              <button
                key={i}
                className={slide === i ? "active" : ""}
                aria-label={`Ver imagen ${i + 1}`}
                aria-pressed={slide === i}
                onClick={() => {
                  setSlide(i);
                  setPlaying(false);
                }}
              />
            ))}
            <button
              className="slideshow-playback"
              aria-label={playing ? "Pausar imágenes" : "Reproducir imágenes"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
          </div>
        </div>
        {catalog.data?.demo && (
          <span className="demo-badge">Entorno de demostración</span>
        )}
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
          <Rail items={items} favorites={saved} onFavorite={favorite} />
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
      <section className="locations-band">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EL PLAN TAMBIÉN ES EL CAMINO</span>
              <h2>Un poco más allá.</h2>
            </div>
            <span className="muted">Lugares para volver.</span>
          </div>
          <div className="locations-grid">
            {[
              ["San Bernardino", "El lago siempre es un buen plan.", "house"],
              ["Aregua", "Una pausa entre verde y calma.", "garden"],
              ["Altos", "El aire cambia, vos también.", "retreat"],
            ].map(([city, copy, img]) => (
              <Link
                key={city}
                to={`/?city=${encodeURIComponent(city)}`}
                className="location-tile"
              >
                <Photo
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
