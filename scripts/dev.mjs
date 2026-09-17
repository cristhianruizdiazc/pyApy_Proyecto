import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import net from "node:net";
async function freePort(start) {
  for (let port = start; port < start + 20; port++) {
    const available = await new Promise((ok) => {
      const server = net.createServer();
      server.once("error", () => ok(false));
      server.listen(port, "127.0.0.1", () => server.close(() => ok(true)));
    });
    if (available) return port;
  }
  throw new Error("No hay puertos disponibles.");
}
const apiPort = await freePort(4100),
  webPort = await freePort(5173);
const url = `http://127.0.0.1:${webPort}`;
const env = {
  ...process.env,
  PORT: String(apiPort),
  WEB_ORIGIN: url,
  API_PROXY: `http://127.0.0.1:${apiPort}`,
};
const api = spawn(process.execPath, ["apps/api/src/server.mjs"], {
  env,
  stdio: "inherit",
  windowsHide: true,
});
const web = spawn(
  process.execPath,
  [
    resolve("node_modules/vite/bin/vite.js"),
    "--host",
    "127.0.0.1",
    "--port",
    String(webPort),
  ],
  { cwd: resolve("apps/web"), env, stdio: "inherit", windowsHide: true },
);
await mkdir(".local", { recursive: true });
await writeFile(
  ".local/dev.json",
  JSON.stringify(
    {
      url,
      apiUrl: `http://127.0.0.1:${apiPort}`,
      pid: process.pid,
      apiPid: api.pid,
      webPid: web.pid,
    },
    null,
    2,
  ),
);
console.log(`pyApy web: ${url}`);
const stop = () => {
  api.kill();
  web.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of [api, web])
  child.on("exit", (code) => {
    if (code) {
      stop();
      process.exitCode = code;
    }
  });
