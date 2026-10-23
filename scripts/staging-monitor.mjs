import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const url =
  process.env.STAGING_HEALTH_URL || "https://localhost:8443/api/health";
const output = resolve(
  process.env.STAGING_MONITOR_LOG || ".local/staging-monitor.ndjson",
);
const allowLocalTls = process.env.STAGING_ALLOW_LOCAL_TLS === "true";
if (allowLocalTls) {
  if (!/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url))
    throw new Error(
      "STAGING_ALLOW_LOCAL_TLS solo puede usarse contra loopback.",
    );
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
const started = performance.now();
let record;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const body = await response.json().catch(() => null);
  record = {
    at: new Date().toISOString(),
    ok: response.ok && body?.status === "ok",
    status: response.status,
    latencyMs: Math.round(performance.now() - started),
  };
} catch (error) {
  record = {
    at: new Date().toISOString(),
    ok: false,
    error: error.name,
    latencyMs: Math.round(performance.now() - started),
  };
}
await mkdir(dirname(output), { recursive: true });
await appendFile(output, `${JSON.stringify(record)}\n`, { mode: 0o600 });
console.log(JSON.stringify(record));
if (!record.ok) process.exitCode = 1;
