import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";
import net from "node:net";
const run = promisify(execFile);
const local = resolve(".local");
const data = resolve(local, "postgres");
const bin =
  process.env.PG_BIN ||
  (process.platform === "win32"
    ? "C:/Program Files/PostgreSQL/16/bin"
    : "/usr/lib/postgresql/16/bin");
const exe = (name) =>
  resolve(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
await mkdir(local, { recursive: true });
let running = false;
if (existsSync(resolve(data, "PG_VERSION"))) {
  try {
    await run(exe("pg_ctl"), ["status", "-D", data], { windowsHide: true });
    running = true;
  } catch {
    /* start the existing task-specific cluster below */
  }
} else {
  if (existsSync(".env"))
    throw new Error("Ya existe .env; no se reemplazaran sus credenciales.");
  await new Promise((ok, fail) => {
    const server = net.createServer();
    server.once("error", fail);
    server.listen(55432, "127.0.0.1", () => server.close(ok));
  });
  const password = randomBytes(32).toString("hex");
  const passwordFile = resolve(local, "postgres-password");
  await writeFile(passwordFile, password, { mode: 0o600, flag: "wx" });
  await run(
    exe("initdb"),
    [
      "-D",
      data,
      "-U",
      "pyapy_local",
      "--encoding=UTF8",
      "--locale=C",
      "--auth=scram-sha-256",
      `--pwfile=${passwordFile}`,
    ],
    { windowsHide: true },
  );
  await writeFile(
    ".env",
    `NODE_ENV=development\nDATABASE_URL=postgresql://pyapy_local:${password}@127.0.0.1:55432/pyapy\nWEB_ORIGIN=http://127.0.0.1:5173\nPORT=4100\nHOST=127.0.0.1\nDEMO_MODE=true\nUPLOAD_DIR=.local/uploads\n`,
    { mode: 0o600, flag: "wx" },
  );
}
if (!running)
  await new Promise((ok, fail) => {
    const child = spawn(
      exe("pg_ctl"),
      [
        "start",
        "-D",
        data,
        "-l",
        resolve(local, "postgres.log"),
        "-o",
        "-p 55432 -h 127.0.0.1",
        "-w",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    child.once("error", fail);
    child.once("exit", (code) =>
      code === 0
        ? ok()
        : fail(new Error("No se pudo iniciar PostgreSQL; revisar su log.")),
    );
  });
process.loadEnvFile(".env");
const url = new URL(process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL);
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55432" ||
  url.pathname !== "/pyapy"
)
  throw new Error("La configuracion no corresponde a la base local aislada.");
try {
  await run(
    exe("createdb"),
    ["-h", "127.0.0.1", "-p", "55432", "-U", url.username, "pyapy"],
    { windowsHide: true, env: { ...process.env, PGPASSWORD: url.password } },
  );
} catch (error) {
  if (!error.stderr?.includes("already exists"))
    throw new Error(
      "No se pudo crear la base pyapy. Revisar .local/postgres.log.",
      { cause: error },
    );
}
console.log(
  "PostgreSQL local de pyApy listo en 127.0.0.1:55432. Credenciales generadas en .env (excluido de Git).",
);
