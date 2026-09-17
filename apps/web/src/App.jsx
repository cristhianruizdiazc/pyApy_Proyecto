import { lazy, Suspense, useEffect, useState } from "react";
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
  const [register, setRegister] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const client = useQueryClient();
  const nav = useNavigate();
  const location = useLocation();
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
          <h1>
            Nos vemos
            <br />
            afuera.
          </h1>
        </div>
      </div>
      <section className="auth-form">
        <Link to="/" className="brand">
          pyApy<span>↗</span>
        </Link>
        <h2>
          {register
            ? "Tu proxima escapada empieza aca."
            : "Que bueno verte de nuevo."}
        </h2>
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
  const location = useLocation();
  const client = useQueryClient();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [location.pathname]);
  async function logout() {
    await api("/auth/logout", { method: "POST", body: {} });
    setCsrf(null);
    client.clear();
    nav("/");
  }
  return (
    <header className="site-header">
      <Link className="brand" to="/">
        pyApy<span>↗</span>
      </Link>
      <nav aria-label="Navegacion principal" className={open ? "open" : ""}>
        <NavLink to="/" end>
          <Compass size={16} />
          Explorar
        </NavLink>
        {user && (
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
        {user?.role === "owner" && (
          <NavLink to="/propietario">
            <LayoutDashboard size={16} />
            Mi espacio
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/admin">
            <ShieldCheck size={16} />
            Administracion
          </NavLink>
        )}
      </nav>
      <div className="header-actions">
        <Link className="host-link" to={user ? "/propietario" : "/ingresar"}>
          Publicar mi espacio
          <ArrowUpRight size={16} />
        </Link>
        {user ? (
          <>
            <Link className="avatar" to="/cuenta" title={user.name}>
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
            <button
              className="icon-button logout"
              title="Cerrar sesion"
              aria-label="Cerrar sesion"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link className="login-link" to="/ingresar">
            Ingresar
          </Link>
        )}
        <button
          className="icon-button mobile-menu"
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
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
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <SessionContext.Provider value={{ user, session }}>
      <a className="skip-link" href="#main">
        Ir al contenido
      </a>
      {location.pathname !== "/ingresar" && <Header user={user} />}
      <div id="main">
        <ErrorMessage error={session.error} />
        <Suspense fallback={<Loading />}>
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
      <footer>
        <Link className="brand" to="/">
          pyApy<span>↗</span>
        </Link>
        <p>Un lugar. Tu gente. Un buen plan.</p>
        <span>Hecho para descubrir Paraguay.</span>
      </footer>
    </SessionContext.Provider>
  );
}
