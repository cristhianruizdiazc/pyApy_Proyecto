import { setTimeout as delay } from "node:timers/promises";

const base = (process.env.STAGING_URL || "https://localhost:8443").replace(
  /\/$/,
  "",
);
const attempts = Number(process.env.STAGING_SMOKE_ATTEMPTS || 30);
const allowLocalTls = process.env.STAGING_ALLOW_LOCAL_TLS === "true";

if (allowLocalTls) {
  if (!/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base))
    throw new Error(
      "STAGING_ALLOW_LOCAL_TLS solo puede usarse contra loopback.",
    );
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    redirect: "error",
    signal: AbortSignal.timeout(5000),
    ...options,
  });
  return response;
}

let health;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    health = await request("/api/health");
    if (health.ok) break;
  } catch (error) {
    if (attempt === attempts) throw error;
  }
  await delay(2000);
}
if (!health?.ok) throw new Error(`Health fallo con HTTP ${health?.status}`);
const payload = await health.json();
if (payload.status !== "ok") throw new Error("Health no devolvio status=ok.");

const page = await request("/");
if (!page.ok || !(await page.text()).includes('<div id="root"></div>'))
  throw new Error("La aplicacion web no entrego su shell esperado.");

const protectedRoute = await request("/api/v1/reservations");
if (protectedRoute.status !== 401)
  throw new Error("La API no protege una ruta privada sin sesion.");
if (!protectedRoute.headers.get("x-request-id"))
  throw new Error("La API no devolvio X-Request-Id.");

const insecure = await fetch(base.replace("https://", "http://"), {
  redirect: "manual",
  signal: AbortSignal.timeout(5000),
}).catch(() => null);
if (insecure?.ok)
  throw new Error(
    "El endpoint de staging tambien responde contenido por HTTP.",
  );

console.log(
  `PASS smoke staging: TLS, web, DB health, auth y request ID en ${base}.`,
);
