import assert from "node:assert/strict";
import pg from "pg";
import { config } from "../apps/api/src/config.mjs";
const api = new pg.Client({ connectionString: config.DATABASE_URL });
const reporter = new pg.Client({
  connectionString: process.env.REPORT_DATABASE_URL,
});
await api.connect();
await reporter.connect();
try {
  const identity = (
    await api.query(
      "SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user",
    )
  ).rows[0];
  assert.deepEqual(identity, {
    rolsuper: false,
    rolcreatedb: false,
    rolcreaterole: false,
  });
  await assert.rejects(
    () => api.query("DELETE FROM audit_logs WHERE false"),
    (e) => e.code === "42501",
  );
  await assert.rejects(
    () => api.query("SELECT * FROM schema_migrations"),
    (e) => e.code === "42501",
  );
  await reporter.query("SELECT * FROM administrative_property_report LIMIT 1");
  await assert.rejects(
    () => reporter.query("SELECT password_hash FROM users LIMIT 1"),
    (e) => e.code === "42501",
  );
  console.log(
    "PASS: API sin privilegios administrativos; auditoria protegida; PHP limitado a vista agregada.",
  );
} finally {
  await api.end();
  await reporter.end();
}
