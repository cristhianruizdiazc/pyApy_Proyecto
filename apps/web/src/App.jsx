import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setCsrf } from "./api.js";
import { SessionContext, Loading, ErrorMessage } from "./ui.jsx";
import Home from "./Home.jsx";
import { Header, Footer } from "./SiteLayout.jsx";
import AuthContinuation from "./AuthContinuation.jsx";
import PageState from "./PageState.jsx";
const Detail = lazy(() => import("./Detail.jsx"));
const Account = lazy(() => import("./Account.jsx"));
const Owner = lazy(() => import("./Owner.jsx"));
const Admin = lazy(() => import("./Admin.jsx"));
const Help = lazy(() => import("./Help.jsx"));
const Auth = lazy(() => import("./Auth.jsx"));
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
  const client = useQueryClient();
  useEffect(
    () =>
      client.getQueryCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          event.action.type === "error" &&
          event.query.state.error?.status === 401 &&
          event.query.queryKey[0] !== "session"
        ) {
          setCsrf(null);
          client.setQueryData(["session"], { user: null });
        }
      }),
    [client],
  );
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
      <div
        className={`site-shell${location.pathname === "/" ? " reference-site" : ""}`}
      >
        <a className="skip-link" href="#main">
          Ir al contenido
        </a>
        {location.pathname !== "/ingresar" && <Header user={user} />}
        <div id="main" tabIndex={-1}>
          <AuthContinuation key={location.key} />
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
              <Route path="/ayuda" element={<Help />} />
              <Route
                path="*"
                element={
                  <PageState
                    title="Esta página no existe."
                    kicker="404 · PYAPY"
                  >
                    <p>
                      Revisá el enlace o encontrá tu próximo plan entre los
                      espacios disponibles.
                    </p>
                    <div className="state-actions">
                      <Link className="primary" to="/">
                        Volver a explorar
                      </Link>
                      <Link className="secondary" to="/ayuda">
                        Preguntas frecuentes
                      </Link>
                    </div>
                  </PageState>
                }
              />
            </Routes>
          </Suspense>
        </div>
        <Footer user={user} />
      </div>
    </SessionContext.Provider>
  );
}
