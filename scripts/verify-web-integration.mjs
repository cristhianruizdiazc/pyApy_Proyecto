import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { resolve } from "node:path";

// Dedicated processes, shared local demo DB. Never stop the developer's existing instance.
async function freePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  return port;
}
const apiPort = await freePort();
let webPort = await freePort();
while (webPort === apiPort) webPort = await freePort();
const url = `http://127.0.0.1:${webPort}`;
const apiUrl = `http://127.0.0.1:${apiPort}`;
const env = {
  ...process.env,
  HOST: "127.0.0.1",
  PORT: String(apiPort),
  WEB_ORIGIN: url,
  API_PROXY: apiUrl,
  WEB_URL: url,
};
const children = [];
const auditMode = ["--audit", "--performance"].includes(process.argv[2]) ? process.argv[2] : null;
function start(args, cwd) {
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", (error) => console.error(error.message));
  children.push(child);
  return child;
}
async function ready(endpoint, child) {
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null)
      throw new Error(`Proceso terminado antes de estar listo: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return;
    } catch {
      /* Retry while booting. */
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`No respondió ${endpoint}`);
}
const stop = () => {
  for (const child of children) if (child.exitCode === null) child.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  const api = start(["apps/api/src/server.mjs"], process.cwd());
  const web = start(
    [
      resolve("node_modules/vite/bin/vite.js"),
      ...(auditMode ? ["preview"] : []),
      "--host",
      "127.0.0.1",
      "--port",
      String(webPort),
      "--strictPort",
    ],
    resolve("apps/web"),
  );
  await Promise.all([ready(`${apiUrl}/api/v1/catalog`, api), ready(url, web)]);
  console.log(`${auditMode ? "Auditoría de build" : "E2E"} en instancia local aislada: ${url}`);
  const tests = start(
    auditMode ? [auditMode === "--audit" ? "scripts/audit-frontend.mjs" : "scripts/audit-performance.mjs", ...process.argv.slice(3)] : [
      resolve("node_modules/@playwright/test/cli.js"),
      "test",
      ...process.argv.slice(2),
    ],
    process.cwd(),
  );
  const [code] = await once(tests, "exit");
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stop();
}
