import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "./api.js";
import { detailHref } from "./booking-selection.js";
import { useSession, ErrorMessage } from "./ui.jsx";
import {
  continuationMessage,
  pendingAction,
  returnState,
} from "./auth-return.js";
import "./auth-continuation.css";

export default function AuthContinuation() {
  const location = useLocation();
  const nav = useNavigate();
  const client = useQueryClient();
  const { user } = useSession();
  const action = pendingAction(
    location.state?.pendingAction,
    location.pathname,
  );
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const banner = useRef(null);
  useEffect(() => {
    if (
      !user ||
      (!location.state?.pendingAction && !location.state?.savedAction)
    )
      return;
    const frame = requestAnimationFrame(() => banner.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [user, location.state]);
  if (!user || location.pathname === "/ingresar") return null;
  if (location.state?.savedAction)
    return (
      <p
        className="auth-continuation success"
        role="status"
        ref={banner}
        tabIndex={-1}
      >
        {location.state.savedAction === "favorite"
          ? "Espacio guardado en favoritos."
          : location.state.savedAction === "removedFavorite"
            ? "Espacio quitado de favoritos."
            : "Guardamos tu interés en esta búsqueda."}
      </p>
    );
  if (!action) return null;
  const persistent = ["favorite", "interest"].includes(action.type);
  function dismiss() {
    nav(location.pathname + location.search + location.hash, {
      replace: true,
      state: null,
    });
  }
  async function confirm() {
    if (sending.current) return;
    sending.current = true;
    setPending(true);
    setError(null);
    try {
      await api(
        action.type === "favorite"
          ? `/favorites/${action.id}`
          : "/search-intents",
        {
          method:
            action.type === "favorite"
              ? action.remove
                ? "DELETE"
                : "PUT"
              : "POST",
          ...(action.type === "interest"
            ? { body: Object.fromEntries(new URLSearchParams(location.search)) }
            : {}),
        },
      );
      client.invalidateQueries({ queryKey: ["favorites"] });
      nav(location.pathname + location.search + location.hash, {
        replace: true,
        state: { savedAction: action.remove ? "removedFavorite" : action.type },
      });
    } catch (err) {
      if (err.status === 401) {
        client.setQueryData(["session"], { user: null });
        nav("/ingresar", { state: returnState(location, action) });
      } else setError(err);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <section
      className="auth-continuation"
      aria-label="Continuar tu tarea"
      ref={banner}
      tabIndex={-1}
    >
      <p role="status">{continuationMessage(action)}</p>
      {action.type === "favorite" && (
        <Link
          state={{ pendingAction: action }}
          to={detailHref(
            action.id,
            location.search,
            null,
            location.pathname === "/"
              ? location.pathname + location.search + location.hash
              : null,
          )}
        >
          Ver espacio pendiente
        </Link>
      )}
      <ErrorMessage error={error} />
      {persistent && (
        <button className="primary" disabled={pending} onClick={confirm}>
          {pending
            ? "Guardando…"
            : action.type === "favorite"
              ? action.remove
                ? "Confirmar quitar favorito"
                : "Confirmar favorito"
              : "Confirmar interés"}
        </button>
      )}
      <button className="secondary" disabled={pending} onClick={dismiss}>
        {persistent ? "Ahora no" : "Entendido"}
      </button>
    </section>
  );
}
