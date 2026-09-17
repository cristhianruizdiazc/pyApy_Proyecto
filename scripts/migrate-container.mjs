import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import pg from "pg";
await new Promise((ok, fail) => {
  const child = spawn(process.execPath, ["apps/api/src/migrate.mjs"], {
    stdio: "inherit",
  });
  child.on("error", fail);
  child.on("exit", (code) =>
    code === 0 ? ok() : fail(new Error("Fallo de migracion")),
  );
});
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query(await readFile("database/permissions.sql", "utf8"));
} finally {
  await db.end();
}
