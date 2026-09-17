import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import pg from "pg";
import { root, config } from "./config.mjs";
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_ADMIN_URL || config.DATABASE_URL,
});
export async function migrate() {
  const db = await pool.connect();
  try {
    await db.query("SELECT pg_advisory_lock(729104)");
    await db.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const file of (await readdir(resolve(root, "database/migrations")))
      .filter((v) => v.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(
        resolve(root, "database/migrations", file),
        "utf8",
      );
      const checksum = createHash("sha256").update(sql).digest("hex");
      const prior = (
        await db.query(
          "SELECT checksum FROM schema_migrations WHERE version=$1",
          [file],
        )
      ).rows[0];
      if (prior) {
        if (prior.checksum !== checksum)
          throw new Error(`Migracion aplicada modificada: ${file}`);
        continue;
      }
      await db.query("BEGIN");
      try {
        await db.query(sql);
        await db.query(
          "INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)",
          [file, checksum],
        );
        await db.query("COMMIT");
        console.log(`Migracion aplicada: ${file}`);
      } catch (error) {
        await db.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await db.query("SELECT pg_advisory_unlock(729104)");
    db.release();
  }
}
try {
  await migrate();
} catch (error) {
  console.error("Fallo de migracion:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
