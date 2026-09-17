import { createContext, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
export function Loading() {
  return (
    <div className="loading" role="status">
      <span />
      Cargando...
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Photo({ src, alt, ...props }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        e.currentTarget.hidden = true;
      }}
      {...props}
    />
  ) : (
    <div className="photo-placeholder">
      <ImageIcon size={30} />
    </div>
  );
}
export function PropertyCard({ p, favorite = false, onFavorite, onHover }) {
  return (
    <article
      className="property-card"
      onMouseEnter={() => onHover?.(p.id)}
      onFocus={() => onHover?.(p.id)}
    >
      <Link className="card-image" to={`/espacios/${p.id}`}>
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
      <Link className="card-title" to={`/espacios/${p.id}`}>
        {p.name}
      </Link>
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
            : `Min. ${p.minHours} h`}
        </span>
      </div>
    </article>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
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
