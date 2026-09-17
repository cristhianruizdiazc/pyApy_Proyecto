import { app } from "./app.mjs";
import { config } from "./config.mjs";
import { pool } from "./db.mjs";
import { deliverNotifications } from "./worker.mjs";
await pool.query("SELECT 1");
const server = app.listen(config.PORT, config.HOST, () =>
  console.log(`pyApy API: http://${config.HOST}:${config.PORT}`),
);
let working = false;
const timer = setInterval(async () => {
  if (working) return;
  working = true;
  try {
    for (let i = 0; i < 20 && (await deliverNotifications()); i++) {
      /* bounded batch */
    }
    await pool.query("DELETE FROM sessions WHERE expires_at<now()");
  } catch {
    console.error(JSON.stringify({ event: "notification_worker_error" }));
  } finally {
    working = false;
  }
}, 3000);
async function close() {
  clearInterval(timer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGTERM", close);
process.on("SIGINT", close);
