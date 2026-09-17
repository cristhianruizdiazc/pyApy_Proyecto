import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import pg from "pg";
const current = parseEnv(await readFile(".env", "utf8"));
const adminUrl = current.DATABASE_ADMIN_URL || current.DATABASE_URL;
const url = new URL(adminUrl);
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55432" ||
  url.pathname !== "/pyapy"
)
  throw new Error(
    "Este comando solo opera sobre la instancia local aislada de pyApy.",
  );
const db = new pg.Client({ connectionString: adminUrl });
await db.connect();
if (current.DATABASE_ADMIN_URL) {
  try {
    await db.query(await readFile("database/permissions.sql", "utf8"));
    console.log("Permisos locales reaplicados sin cambiar credenciales.");
  } finally {
    await db.end();
  }
  process.exit(0);
}
const appPassword = randomBytes(32).toString("hex"),
  reportPassword = randomBytes(32).toString("hex");
try {
  await db.query("BEGIN");
  for (const [role, password] of [
    ["pyapy_app", appPassword],
    ["pyapy_reporter", reportPassword],
  ]) {
    const statement = (
      await db.query(
        "SELECT format('CREATE ROLE %I LOGIN PASSWORD %L',$1::text,$2::text) statement",
        [role, password],
      )
    ).rows[0].statement;
    await db.query(statement);
  }
  await db.query(
    "ALTER ROLE pyapy_reporter SET default_transaction_read_only=on",
  );
  await db.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  await db.query(await readFile("database/permissions.sql", "utf8"));
  await db.query("COMMIT");
  const appUrl = new URL(adminUrl);
  appUrl.username = "pyapy_app";
  appUrl.password = appPassword;
  const reportUrl = new URL(adminUrl);
  reportUrl.username = "pyapy_reporter";
  reportUrl.password = reportPassword;
  const next = {
    ...current,
    DATABASE_URL: appUrl.toString(),
    DATABASE_ADMIN_URL: adminUrl,
    REPORT_DATABASE_URL: reportUrl.toString(),
  };
  await writeFile(
    ".env",
    Object.entries(next)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n",
    { mode: 0o600 },
  );
  console.log(
    "API sin superusuario. Migraciones y reporte usan identidades separadas; secretos conservados solo en .env.",
  );
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
