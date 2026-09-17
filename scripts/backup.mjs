import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes, createHash } from "node:crypto";
import pg from "pg";
import { config, root } from "../apps/api/src/config.mjs";
const run = promisify(execFile);
const adminUrl = process.env.DATABASE_ADMIN_URL || config.DATABASE_URL;
const url = new URL(adminUrl);
const bin =
  process.env.PG_BIN ||
  (process.platform === "win32"
    ? "C:/Program Files/PostgreSQL/16/bin"
    : "/usr/lib/postgresql/16/bin");
const exe = (name) =>
  resolve(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
const env = { ...process.env, PGPASSWORD: decodeURIComponent(url.password) };
const args = [
  "-h",
  url.hostname,
  "-p",
  url.port || "5432",
  "-U",
  decodeURIComponent(url.username),
];
const backupDir = resolve(root, ".local/backups");
await mkdir(backupDir, { recursive: true });
const file = resolve(
  backupDir,
  `pyapy-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`,
);
await run(
  exe("pg_dump"),
  [
    ...args,
    "-d",
    url.pathname.slice(1),
    "-Fc",
    "--no-owner",
    "--no-acl",
    "-f",
    file,
  ],
  { env, windowsHide: true },
);
const checksum = createHash("sha256")
  .update(await readFile(file))
  .digest("hex");
await writeFile(`${file}.sha256`, checksum, { mode: 0o600 });
console.log(
  "Backup creado en .local/backups. No contiene credenciales de conexion; tratar como datos privados.",
);
if (process.argv.includes("--verify")) {
  if (config.production || !["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error(
      "La verificacion automatica requiere instancia local, no produccion.",
    );
  const db = new pg.Client({ connectionString: adminUrl });
  await db.connect();
  const target = `pyapy_restore_${randomBytes(6).toString("hex")}`;
  try {
    await db.query(`CREATE DATABASE ${target}`);
    await run(
      exe("pg_restore"),
      [
        ...args,
        "-d",
        target,
        "--no-owner",
        "--no-acl",
        "--exit-on-error",
        file,
      ],
      { env, windowsHide: true },
    );
    const restoredUrl = new URL(adminUrl);
    restoredUrl.pathname = `/${target}`;
    const restored = new pg.Client({
      connectionString: restoredUrl.toString(),
    });
    await restored.connect();
    try {
      for (const table of [
        "users",
        "properties",
        "reservations",
        "audit_logs",
        "schema_migrations",
      ]) {
        const expected = (
          await db.query(`SELECT count(*)::integer n FROM ${table}`)
        ).rows[0].n;
        const actual = (
          await restored.query(`SELECT count(*)::integer n FROM ${table}`)
        ).rows[0].n;
        if (expected !== actual)
          throw new Error(`Conteo diferente en ${table}`);
      }
      const constraints = (
        await restored.query(
          "SELECT count(*)::integer n FROM pg_constraint WHERE contype='x' AND conrelid='reservations'::regclass",
        )
      ).rows[0].n;
      if (constraints !== 1) throw new Error("Falta la exclusion de reservas.");
      console.log(
        "PASS: restauracion aislada, conteos y constraint de concurrencia verificados.",
      );
    } finally {
      await restored.end();
    }
  } finally {
    if (/^pyapy_restore_[a-f0-9]{12}$/.test(target))
      await db.query(`DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);
    await db.end();
  }
}
