import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Compass,
  Heart,
  CalendarDays,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { api, setCsrf } from "./api.js";
import { SessionContext, Loading, ErrorMessage } from "./ui.jsx";
import Home from "./Home.jsx";
const Detail = lazy(() => import("./Detail.jsx"));
const Account = lazy(() => import("./Account.jsx"));
const Owner = lazy(() => import("./Owner.jsx"));
const Admin = lazy(() => import("./Admin.jsx"));
function Auth() {
  const location = useLocation();
  const [register, setRegister] = useState(
    () => new URLSearchParams(location.search).get("mode") === "registro",
  );
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const client = useQueryClient();
  const nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: form,
      });
      setCsrf(result.csrfToken);
      client.clear();
      client.setQueryData(["session"], result);
      nav(location.state?.from || "/");
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-visual">
        <img src="/demo/pool.jpg" alt="Piscina al aire libre" />
        <div>
          <span className="eyebrow">UN RATITO PARA VOS</span>
          <p className="auth-visual-title">
            Nos vemos
            <br />
            afuera.
          </p>
        </div>
      </div>
      <section className="auth-form">
        <Link to="/" className="brand">
          <img
            className="chosen-logo"
            src="/brand/logoElegido.png"
            alt="pyApy"
          />
        </Link>
        <h1>
          {register
            ? "Tu proxima escapada empieza aca."
            : "Que bueno verte de nuevo."}
        </h1>
        <div className="segmented">
          <button
            className={!register ? "active" : ""}
            onClick={() => setRegister(false)}
          >
            Ingresar
          </button>
          <button
            className={register ? "active" : ""}
            onClick={() => setRegister(true)}
          >
            Crear cuenta
          </button>
        </div>
        <form onSubmit={submit}>
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
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Contrasena
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          {register && <small>Al menos 12 caracteres.</small>}
          <ErrorMessage error={error} />
          <button className="primary" disabled={pending}>
            {pending
              ? "Un momento..."
              : register
                ? "Crear mi cuenta"
                : "Ingresar"}
            <ArrowUpRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}
function Header({ user }) {
  const [open, setOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const menuButtonRef = useRef(null);
  const menuId = useId();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const client = useQueryClient();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      menuButtonRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
    <header className="site-header">
      <Link className="brand" to="/">
        <img className="chosen-logo" src="/brand/logoElegido.png" alt="pyApy" />
        {isHome && (
          <span className="brand-tagline">Quintas · Casas · Bungalows</span>
        )}
      </Link>
      <nav
        id={menuId}
        aria-label="Navegación principal"
        className={open ? "open" : ""}
      >
        {isHome ? (
          <>
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <Link to="/?sort=match#results">Explorar</Link>
            <a href="/#como-funciona">Cómo funciona</a>
            <Link
              className="nav-host-link"
              to={user ? "/propietario" : "/ingresar"}
            >
              Soy Anfitrión
            </Link>
          </>
        ) : (
          <NavLink to="/" end>
            <Compass size={16} />
            Explorar
          </NavLink>
        )}
        <Link
          className="mobile-host-link"
          to={user ? "/propietario" : "/ingresar"}
        >
          Publicar mi espacio <ArrowUpRight size={16} />
        </Link>
        {!isHome && user && (
          <>
            <NavLink to="/favoritos">
              <Heart size={16} />
              Guardados
            </NavLink>
            <NavLink to="/reservas">
              <CalendarDays size={16} />
              Mis reservas
            </NavLink>
          </>
        )}
        {!isHome && user?.role === "owner" && (
          <NavLink to="/propietario">
            <LayoutDashboard size={16} />
            Mi espacio
          </NavLink>
        )}
        {!isHome && user?.role === "admin" && (
          <NavLink to="/admin">
            <ShieldCheck size={16} />
            Administracion
          </NavLink>
        )}
      </nav>
      <div className="header-actions">
        {isHome && (
          <>
            <span className="header-country">
              <MapPin size={16} /> Paraguay
            </span>
            <Link
              className="icon-button header-favorite"
              to={user ? "/favoritos" : "/ingresar"}
              aria-label="Mis favoritos"
            >
              <Heart size={19} />
            </Link>
          </>
        )}
        <Link className="host-link" to={user ? "/propietario" : "/ingresar"}>
          Publicar mi espacio
          <ArrowUpRight size={16} />
        </Link>
        {user ? (
          <>
            <Link
              className="avatar"
              to="/cuenta"
              title={user.name}
              aria-label={`Mi cuenta: ${user.name}`}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
            <button
              type="button"
              className="icon-button logout"
              title={logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
              aria-label={logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
              aria-busy={logoutPending}
              disabled={logoutPending}
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link className="login-link" to="/ingresar">
              Ingresar
            </Link>
            {isHome && (
              <Link className="register-link" to="/ingresar?mode=registro">
                Registrarse
              </Link>
            )}
          </>
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
      <ErrorMessage error={logoutError} />
    </header>
  );
}
function DetailRouteLoading() {
  return (
    <main className="page detail-route-loading" aria-busy="true">
      <Loading />
    </main>
  );
}
export default function App() {
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const data = await api("/auth/session");
      setCsrf(data.csrfToken);
      return data;
    },
  });
  const user = session.data?.user;
  const location = useLocation();
  useEffect(() => {
    const target =
      location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return (
    <SessionContext.Provider value={{ user, session }}>
      <div className={location.pathname === "/" ? "reference-site" : ""}>
        <a className="skip-link" href="#main">
          Ir al contenido
        </a>
        {location.pathname !== "/ingresar" && <Header user={user} />}
        <div id="main">
          <ErrorMessage error={session.error} />
          <Suspense
            fallback={
              location.pathname.startsWith("/espacios/") ? (
                <DetailRouteLoading />
              ) : (
                <Loading />
              )
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ingresar" element={<Auth />} />
              <Route path="/espacios/:id" element={<Detail />} />
              <Route path="/reservas" element={<Account view="reservas" />} />
              <Route path="/favoritos" element={<Account view="favoritos" />} />
              <Route path="/cuenta" element={<Account view="cuenta" />} />
              <Route path="/propietario" element={<Owner />} />
              <Route path="/admin" element={<Admin />} />
              <Route
                path="*"
                element={
                  <main className="page">
                    <h1>Esta pagina no existe.</h1>
                    <Link to="/">Volver a explorar</Link>
                  </main>
                }
              />
            </Routes>
          </Suspense>
        </div>
        <footer className="site-footer">
          {location.pathname === "/" ? (
            <>
              <p className="home-footer-copy">
                <Heart size={12} /> PYAPY — VIVÍ PARAGUAY, VIVÍ SUS QUINTAS
              </p>
              <svg
                className="footer-waves"
                viewBox="0 0 1440 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0 12C80-10 96 80 200 68S350 63 430 100H0Z"
                  fill="#d2decc"
                />
                <path d="M0 57C150 45 192 94 355 100H0Z" fill="#afc7ab" />
                <path
                  d="M1160 100C1280 17 1310 96 1440 24V100Z"
                  fill="#d2decc"
                />
              </svg>
              <img
                className="footer-flower"
                src="/brand/nanduti-flower.svg"
                alt=""
              />
            </>
          ) : (
            <>
              <Link className="brand" to="/">
                <img
                  className="chosen-logo"
                  src="/brand/logoElegido.png"
                  alt="pyApy"
                />
              </Link>
              <p>Un lugar. Tu gente. Un buen plan.</p>
              <span>Inspirados en los hilos del encaje ju y el ñandutí.</span>
            </>
          )}
        </footer>
      </div>
    </SessionContext.Provider>
  );
}
