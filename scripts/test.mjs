import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import pg from "pg";
import { config, root } from "../apps/api/src/config.mjs";
if (config.production)
  throw new Error("No ejecutar pruebas de desarrollo contra produccion.");
const adminUrl = process.env.DATABASE_ADMIN_URL || config.DATABASE_URL;
const url = new URL(adminUrl);
if (!["127.0.0.1", "localhost"].includes(url.hostname))
  throw new Error("El runner automatico requiere PostgreSQL local aislado.");
const database = `pyapy_test_${randomBytes(6).toString("hex")}`;
const admin = new pg.Client({ connectionString: adminUrl });
await admin.connect();
const run = (args, env) =>
  new Promise((ok, fail) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0
        ? ok()
        : fail(new Error(`Verificacion termino con codigo ${code}`)),
    );
  });
try {
  await admin.query(`CREATE DATABASE ${database}`);
  url.pathname = `/${database}`;
  const env = {
    ...process.env,
    DATABASE_URL: url.toString(),
    DATABASE_ADMIN_URL: url.toString(),
    NODE_ENV: "test",
    DEMO_MODE: "false",
    UPLOAD_DIR: ".local/test-uploads",
  };
  await run(["apps/api/src/migrate.mjs"], env);
  const files = (await readdir("tests"))
    .filter((f) => f.endsWith(".test.mjs"))
    .map((f) => `tests/${f}`);
  await run(["--test", "--test-concurrency=1", ...files], env);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (/^pyapy_test_[a-f0-9]{12}$/.test(database))
    await admin.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
  await admin.end();
}
