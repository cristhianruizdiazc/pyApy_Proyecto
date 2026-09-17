import pg from "pg";
import { config } from "./config.mjs";
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 12,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
  application_name: "pyapy-api",
});
pool.on("error", () =>
  console.error(JSON.stringify({ event: "database_connection_error" })),
);
export async function transaction(work) {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await work(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}
export async function audit(db, actor, action, resource) {
  await db.query(
    "INSERT INTO audit_logs(actor_id,action,resource_id) VALUES($1,$2,$3)",
    [actor, action, resource],
  );
}
