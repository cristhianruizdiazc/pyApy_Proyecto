import { spawn } from "node:child_process";
import { resolve } from "node:path";
import "../apps/api/src/config.mjs";
if (!process.env.REPORT_DATABASE_URL)
  throw new Error("Ejecutar primero scripts/harden-local-db.mjs.");
const url = new URL(process.env.REPORT_DATABASE_URL);
const php = process.env.PHP_BIN || resolve(".local/tools/php-8.5.10/php.exe");
const env = {
  ...process.env,
  DB_HOST: url.hostname,
  DB_PORT: url.port || "5432",
  DB_NAME: url.pathname.slice(1),
  DB_USER: decodeURIComponent(url.username),
  DB_PASSWORD: decodeURIComponent(url.password),
};
const args = [
  "-d",
  `extension_dir=${resolve(".local/tools/php-8.5.10/ext")}`,
  "-d",
  "extension=pdo_pgsql",
  "apps/admin-php/report.php",
];
await new Promise((ok, fail) => {
  const child = spawn(php, args, { env, stdio: "inherit", windowsHide: true });
  child.on("error", fail);
  child.on("exit", (code) =>
    code === 0 ? ok() : fail(new Error("El reporte PHP fallo.")),
  );
});
