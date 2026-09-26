import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const envFile = resolve(".local/compose.env");
await access(envFile, constants.R_OK);
const compose =
  process.env.COMPOSE_BIN ||
  (process.platform === "win32"
    ? resolve(".local/tools/docker-compose.exe")
    : "docker");
const prefix = process.env.COMPOSE_BIN
  ? []
  : process.platform === "win32"
    ? []
    : ["compose"];
const run = (args) =>
  new Promise((ok, fail) => {
    const child = spawn(compose, [...prefix, ...args], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0 ? ok(stdout) : fail(new Error(stderr || `Compose termino con ${code}`)),
    );
  });
const config = JSON.parse(
  await run([
    "--env-file",
    envFile,
    "--profile",
    "test",
    "--profile",
    "tools",
    "config",
    "--format",
    "json",
  ]),
);
const required = ["db", "migrate", "api", "web", "admin-report", "test"];
for (const name of required)
  if (!config.services?.[name]) throw new Error(`Servicio Compose ausente: ${name}`);
const api = config.services.api, web = config.services.web, db = config.services.db, test = config.services.test;
if (
  api.build?.target !== "production" ||
  config.services.migrate.build?.target !== "production" ||
  test.build?.target !== "test"
)
  throw new Error("Los servicios deben seleccionar explicitamente su etapa Docker.");
if (db.ports?.length) throw new Error("PostgreSQL no debe publicar puertos al host.");
if (!web.ports?.every((port) => port.host_ip === "127.0.0.1"))
  throw new Error("La web debe limitarse al loopback en desarrollo.");
for (const [name, service] of Object.entries({ api, web, test })) {
  if (!service.read_only || !service.cap_drop?.includes("ALL") || !service.security_opt?.includes("no-new-privileges:true"))
    throw new Error(`Hardening incompleto en ${name}.`);
}
const demo = api.environment.DEMO_MODE;
const seedDemo = config.services.migrate.environment.SEED_DEMO;
if (!["true", "false"].includes(demo) || !["true", "false"].includes(seedDemo))
  throw new Error("DEMO_MODE y SEED_DEMO deben declararse explicitamente.");
if (seedDemo === "true" && demo !== "true")
  throw new Error("No se pueden sembrar fixtures con DEMO_MODE=false.");
if (
  process.env.CONTAINER_EXPECT_DEMO === "true" &&
  !(demo === "true" && seedDemo === "true")
)
  throw new Error("La verificacion de desarrollo requiere DEMO_MODE y SEED_DEMO=true.");
const [apiDockerfile, webDockerfile, phpDockerfile, ignored] = await Promise.all([
  readFile("apps/api/Dockerfile", "utf8"),
  readFile("apps/web/Dockerfile", "utf8"),
  readFile("apps/admin-php/Dockerfile", "utf8"),
  readFile(".dockerignore", "utf8"),
]);
if (
  !/\bUSER\s+node\b/.test(apiDockerfile) ||
  !/nginxinc\/nginx-unprivileged/.test(webDockerfile) ||
  !/\bUSER\s+nobody\b/.test(phpDockerfile)
)
  throw new Error("Las imagenes finales deben usar usuarios no privilegiados.");
for (const forbidden of [".env", ".local", ".context"])
  if (!ignored.includes(forbidden)) throw new Error(`.dockerignore debe excluir ${forbidden}.`);
console.log("Configuracion de contenedores valida: entornos dev/test/prod, secretos externos y hardening declarados.");
