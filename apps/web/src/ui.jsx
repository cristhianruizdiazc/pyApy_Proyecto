import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { detailHref } from "./booking-selection.js";
import {
  Heart,
  MapPin,
  Users,
  ArrowUpRight,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { money } from "@pyapy/contracts";
export const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);
export function ErrorMessage({ error }) {
  return error ? (
    <p className="error" role="alert">
      {error.message || error}
    </p>
  ) : null;
}
export function Loading({ className = "" }) {
  return (
    <div className={`loading${className ? ` ${className}` : ""}`} role="status">
      <span />
      Cargando...
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Photo({ src, alt, ...props }) {
  return <PhotoImage key={src} src={src} alt={alt} {...props} />;
}
function PhotoImage({ src, alt, className = "", onError, ...props }) {
  const [failed, setFailed] = useState(false);
  const demo = /^\/demo\/(cabin|garden|house|palms|pool|retreat)\.jpg$/.exec(src || "");
  const image = (
    <img
      {...props}
      className={className}
      src={src}
      alt={alt}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
  return src && !failed ? (
    demo ? (
      <picture>
        <source
          media="(max-width: 700px)"
          srcSet={`/demo/${demo[1]}-640.webp`}
          type="image/webp"
        />
        <source srcSet={`/demo/${demo[1]}-1280.webp`} type="image/webp" />
        {image}
      </picture>
    ) : image
  ) : (
    <div
      {...props}
      className={`photo-placeholder${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={alt ? `Imagen no disponible: ${alt}` : "Imagen no disponible"}
    >
      <ImageIcon size={30} aria-hidden="true" />
    </div>
  );
}
export function PropertyCard({
  p,
  favorite = false,
  selected = false,
  onFavorite,
  onHover,
}) {
  const location = useLocation();
  const href = detailHref(
    p.id,
    location.pathname === "/" ? location.search : "",
  );
  return (
    <article
      className={`property-card${selected ? " is-selected" : ""}`}
      data-property-id={p.id}
      onMouseEnter={() => onHover?.(p.id)}
      onFocus={() => onHover?.(p.id)}
    >
      <Link className="card-image" to={href}>
        <Photo
          src={p.images[0]?.url}
          alt={p.images[0]?.alt || p.name}
          loading="lazy"
        />
        {p.isDemo && <span className="image-tag">Demo</span>}
        <span className="image-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      {onFavorite && (
        <button
          className={`favorite icon-button ${favorite ? "saved" : ""}`}
          title={favorite ? "Quitar de favoritos" : "Guardar favorito"}
          aria-label={favorite ? "Quitar de favoritos" : "Guardar favorito"}
          aria-pressed={favorite}
          onClick={() => onFavorite(p.id)}
        >
          <Heart size={19} fill={favorite ? "currentColor" : "none"} />
        </button>
      )}
      <div className="card-meta">
        <span>{p.kind}</span>
        <span>
          <Users size={14} />
          {p.capacity} personas
        </span>
      </div>
      <h2>
        <Link className="card-title" to={href}>
          {p.name}
        </Link>
      </h2>
      <p className="location">
        <MapPin size={14} />
        {p.city}, {p.department}
      </p>
      <div className="card-bottom">
        <span>
          <strong>Gs. {money(p.pricePerHour)}</strong>
          <small> / hora</small>
        </span>
        <span className="match-label">
          {p.availabilityChecked
            ? p.available
              ? "Disponible"
              : "Otra fecha"
            : `Mín. ${p.minHours} h`}
        </span>
      </div>
    </article>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar"
          title="Cerrar"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
