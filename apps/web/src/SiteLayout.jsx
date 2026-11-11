import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { api, setCsrf } from "./api.js";
import { ErrorMessage } from "./ui.jsx";
import { returnState } from "./auth-return.js";

export function Brand({ loading }) {
  return (
    <Link className="brand" to="/" aria-label="pyApy, ir al inicio">
      <img
        className="chosen-logo"
        src="/brand/logo-96.webp"
        srcSet="/brand/logo-96.webp 96w, /brand/logo-192.webp 192w, /brand/logo-288.webp 288w"
        sizes={
          loading === "lazy"
            ? "(max-width: 600px) 73px, 86px"
            : "(max-width: 600px) 55px, 66px"
        }
        alt="pyApy"
        width="1331"
        height="1181"
        loading={loading}
      />
    </Link>
  );
}

function SessionLinks({ user, onLogout, pending }) {
  return (
    <>
      <NavLink to="/cuenta">
        <UserRound size={16} />
        Mi cuenta
      </NavLink>
      <NavLink to="/favoritos">
        <Heart size={16} />
        Guardados
      </NavLink>
      <NavLink to="/reservas">
        <CalendarDays size={16} />
        Mis reservas
      </NavLink>
      {user.role === "owner" && (
        <NavLink to="/propietario">
          <LayoutDashboard size={16} />
          Mi espacio
        </NavLink>
      )}
      {user.role === "admin" && (
        <NavLink to="/admin">
          <ShieldCheck size={16} />
          Administración
        </NavLink>
      )}
      <button
        type="button"
        onClick={onLogout}
        disabled={pending}
        aria-busy={pending}
      >
        <LogOut size={16} />
        {pending ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
    </>
  );
}

export function Header({ user }) {
  const [open, setOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const navRef = useRef(null);
  const accountRef = useRef(null);
  const lastFocusRef = useRef(null);
  const menuId = useId();
  const location = useLocation();
  const client = useQueryClient();
  const nav = useNavigate();
  const hostTo = user ? "/propietario" : "/ingresar";
  useEffect(() => {
    setOpen(false);
    if (accountRef.current) accountRef.current.open = false;
  }, [location.pathname, location.search, location.hash, user?.id, user?.role]);
  useEffect(() => {
    if (open) navRef.current?.querySelector("a")?.focus();
  }, [open]);
  useEffect(() => {
    function close(event) {
      if (event.type === "focusin" && event.target !== document.body)
        lastFocusRef.current = event.target;
      if (event.type === "pointerdown") lastFocusRef.current = null;
      if (event.type === "keydown") {
        if (event.key !== "Escape" || event.defaultPrevented) return;
        if (accountRef.current?.open) {
          event.preventDefault();
          accountRef.current.open = false;
          accountRef.current.querySelector("summary")?.focus();
        } else if (open) {
          event.preventDefault();
          setOpen(false);
          menuButtonRef.current?.focus();
        }
      } else if (!headerRef.current?.contains(event.target)) {
        setOpen(false);
        if (accountRef.current) accountRef.current.open = false;
      } else if (
        !accountRef.current?.contains(event.target) &&
        accountRef.current
      ) {
        accountRef.current.open = false;
      }
    }
    const desktop = window.matchMedia("(min-width: 981px)");
    function resize() {
      // Browsers may blur a control as soon as its media query hides it,
      // before delivering the matchMedia change event.
      const focused =
        document.activeElement === document.body
          ? lastFocusRef.current
          : document.activeElement;
      if (accountRef.current?.contains(focused) && !desktop.matches)
        menuButtonRef.current?.focus();
      if (navRef.current?.contains(focused) && !desktop.matches)
        menuButtonRef.current?.focus();
      if (menuButtonRef.current === focused && desktop.matches)
        navRef.current?.querySelector("a")?.focus();
      setOpen(false);
      if (accountRef.current) accountRef.current.open = false;
    }
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    document.addEventListener("focusin", close);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("focusin", close);
      desktop.removeEventListener("change", resize);
    };
  }, [open]);
  async function logout() {
    if (logoutPending) return;
    setLogoutPending(true);
    setLogoutError(null);
    try {
      await api("/auth/logout", { method: "POST", body: {} });
      setCsrf(null);
      client.clear();
      setOpen(false);
      if (accountRef.current) accountRef.current.open = false;
      nav("/");
    } catch (err) {
      setLogoutError(
        err instanceof Error
          ? err
          : new Error("No pudimos cerrar sesión. Intentá de nuevo."),
      );
    } finally {
      setLogoutPending(false);
    }
  }
  return (
    <header
      ref={headerRef}
      className={`site-header${open ? " menu-open" : ""}`}
    >
      <div className="layout-container header-inner">
        <Brand />
        <nav
          ref={navRef}
          id={menuId}
          aria-label="Navegación principal"
          className={`main-nav${open ? " open" : ""}`}
        >
          <NavLink to="/" end>
            Explorar
          </NavLink>
          <Link className="nav-host-link" to="/#anfitriones">
            Anfitriones
          </Link>
          <Link to="/#como-funciona">Cómo funciona</Link>
          <NavLink to="/ayuda#ayuda">Preguntas frecuentes</NavLink>
          <div className="mobile-nav-actions">
            <Link
              className="host-link mobile-host-link"
              to={hostTo}
              state={{ from: "/propietario" }}
            >
              Publicar mi espacio <ArrowUpRight size={16} />
            </Link>
            {user ? (
              <SessionLinks
                user={user}
                onLogout={logout}
                pending={logoutPending}
              />
            ) : (
              <Link to="/ingresar" state={returnState(location)}>
                Ingresar
              </Link>
            )}
          </div>
        </nav>
        <div className="header-actions">
          <Link
            className="host-link"
            to={hostTo}
            state={{ from: "/propietario" }}
          >
            Publicar mi espacio <ArrowUpRight size={16} />
          </Link>
          {user ? (
            <>
              <details className="account-menu" ref={accountRef}>
                <summary>
                  <span className="avatar" aria-hidden="true">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    Mi cuenta<span className="sr-only">: {user.name}</span>
                  </span>
                </summary>
                <div className="account-links">
                  <SessionLinks
                    user={user}
                    onLogout={logout}
                    pending={logoutPending}
                  />
                </div>
              </details>
              <Link
                className="avatar mobile-account"
                to="/cuenta"
                aria-label={`Mi cuenta: ${user.name}`}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </Link>
            </>
          ) : (
            <Link
              className="login-link"
              to="/ingresar"
              state={returnState(location)}
            >
              Ingresar
            </Link>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            className="icon-button mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <ErrorMessage error={logoutError} />
    </header>
  );
}

export function Footer({ user }) {
  return (
    <footer className="site-footer">
      <div className="layout-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand loading="lazy" />
            <p>
              Espacios para desconectar, cerca de casa. Naturaleza, piscinas y
              tiempo compartido en Paraguay.
            </p>
            <p className="footer-place">
              <MapPin size={16} />
              Paraguay
            </p>
          </div>
          <nav className="footer-col" aria-label="Explorar espacios">
            <h2>Explorar</h2>
            <ul>
              <li>
                <Link to="/?kind=Quinta#results">Quintas</Link>
              </li>
              <li>
                <Link to="/?kind=Casa#results">Casas</Link>
              </li>
              <li>
                <Link to="/?kind=Bungalow#results">Bungalows</Link>
              </li>
            </ul>
          </nav>
          <nav className="footer-col" aria-label="Ayuda y anfitriones">
            <h2>Anfitriones</h2>
            <ul>
              <li>
                <Link
                  to={user ? "/propietario" : "/ingresar"}
                  state={{ from: "/propietario" }}
                >
                  Publicar mi espacio
                </Link>
              </li>
              <li>
                <Link to="/#como-funciona">Cómo funciona</Link>
              </li>
              <li>
                <Link to="/ayuda#ayuda">Preguntas frecuentes</Link>
              </li>
              <li>
                <Link to="/">Explorar espacios</Link>
              </li>
              {user && (
                <li>
                  <Link to="/cuenta">Mi cuenta</Link>
                </li>
              )}
              {user?.role === "admin" && (
                <li>
                  <Link to="/admin">Administración</Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>pyApy · Viví Paraguay, viví sus quintas</span>
          <Link to="/ayuda#ayuda">Ayuda para tu próxima escapada</Link>
        </div>
      </div>
    </footer>
  );
}
