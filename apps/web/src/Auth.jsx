import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { api, setCsrf } from "./api.js";
import { Brand } from "./SiteLayout.jsx";
import { ErrorMessage } from "./ui.jsx";
import {
  localReturn,
  pendingAction,
  continuationMessage,
} from "./auth-return.js";
import "./auth.css";

export default function Auth() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const register = params.get("mode") === "registro";
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const feedback = useRef(null);
  const client = useQueryClient();
  const nav = useNavigate();
  const from = localReturn(location.state?.from);
  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);

  function changeMode(next) {
    if (sending.current) return;
    setError(null);
    const search = new URLSearchParams(location.search);
    if (next) search.set("mode", "registro");
    else search.delete("mode");
    nav(
      { pathname: "/ingresar", search: search.toString() },
      { replace: true, state: location.state },
    );
  }
  async function submit(event) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setError(null);
    setPending(true);
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body,
      });
      setCsrf(result.csrfToken);
      client.clear();
      client.setQueryData(["session"], result);
      nav(from, {
        replace: true,
        state: {
          pendingAction: pendingAction(location.state?.pendingAction, from),
        },
      });
    } catch (err) {
      setError(err);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-topbar">
        <Brand />
        <Link className="back-link" to={from}>
          <ArrowLeft size={17} />
          Volver a explorar
        </Link>
      </div>
      <div className="auth-sheet">
        <div className="auth-visual">
          <img src="/brand/escapada-960.webp" alt="" width="960" height="640" />
          <div>
            <span className="eyebrow">VIVÍ PARAGUAY</span>
            <p className="auth-visual-title">
              Los buenos planes
              <br />
              empiezan <em>afuera.</em>
            </p>
            <p>
              Un lugar para tus escapadas, tus favoritos y los momentos que
              vienen.
            </p>
            <ul>
              <li>
                <Heart size={18} />
                Guardá los lugares que te gustan.
              </li>
              <li>
                <CalendarDays size={18} />
                Organizá tus reservas.
              </li>
              <li>
                <MapPin size={18} />
                Descubrí espacios cerca de vos.
              </li>
            </ul>
          </div>
        </div>
        <section className="auth-form" aria-labelledby="auth-title">
          <p className="eyebrow">TU RINCÓN EN PYAPY</p>
          <h1 id="auth-title">
            {register
              ? "Tu próxima escapada empieza acá."
              : "Qué bueno verte de nuevo."}
          </h1>
          <p className="auth-context" role="status">
            {continuationMessage(
              location.state?.pendingAction,
              location.state?.from,
            )}
          </p>
          <div className="segmented" role="group" aria-label="Elegir acceso">
            <button
              type="button"
              className={!register ? "active" : ""}
              aria-pressed={!register}
              disabled={pending}
              onClick={() => changeMode(false)}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={register ? "active" : ""}
              aria-pressed={register}
              disabled={pending}
              onClick={() => changeMode(true)}
            >
              Crear cuenta
            </button>
          </div>
          <form onSubmit={submit} aria-busy={pending}>
            <fieldset disabled={pending}>
              <legend className="sr-only">
                {register ? "Crear mi cuenta" : "Ingresar a mi cuenta"}
              </legend>
              {register && (
                <label>
                  Nombre
                  <input
                    name="name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={12}
                  maxLength={128}
                  aria-describedby={register ? "password-hint" : undefined}
                  required
                />
              </label>
              {register && (
                <small id="password-hint">Al menos 12 caracteres.</small>
              )}
              <div className="auth-feedback" ref={feedback} tabIndex={-1}>
                <ErrorMessage error={error} />
              </div>
              <button className="primary" disabled={pending}>
                {pending
                  ? "Un momento..."
                  : register
                    ? "Crear mi cuenta"
                    : "Ingresar"}
                <ArrowRight size={18} />
              </button>
            </fieldset>
          </form>
          <p className="auth-note">
            Elegí tu próximo plan. La reserva se confirma después de consultar
            disponibilidad.
          </p>
        </section>
      </div>
    </main>
  );
}
