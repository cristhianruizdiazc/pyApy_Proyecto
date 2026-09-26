import lighthouse from "lighthouse";
import { chromium } from "@playwright/test";
import net from "node:net";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";

const label = process.argv[2] || "final";
if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Etiqueta de informe no válida.");
const base = process.env.WEB_URL || "http://127.0.0.1:5173";
const devices = (process.env.PERFORMANCE_DEVICES || "mobile,desktop").split(",");
if (!devices.length || devices.some((device) => !["mobile", "desktop"].includes(device)))
  throw new Error("PERFORMANCE_DEVICES must contain mobile, desktop, or both.");
const catalog = await (await fetch(`${base}/api/v1/properties`)).json();
const property = catalog.items.find((p) => p.images.length);
const report = { label, date: new Date().toISOString(), url: base, runs: [] };
await mkdir(".local/audits", { recursive: true });
for (const device of devices) {
  for (const [name, path] of [["home", "/"], ["detail", `/espacios/${property.id}`]]) {
    const server = net.createServer();
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    const port = server.address().port;
    await new Promise((done) => server.close(done));
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`, "--remote-debugging-address=127.0.0.1"] });
    try {
      const options = { port, hostname: "127.0.0.1", logLevel: "error", output: "json", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] };
      if (device === "desktop") Object.assign(options, { formFactor: "desktop", screenEmulation: { mobile: false, width: 1440, height: 1000, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } });
      const { lhr } = await lighthouse(`${base}${path}`, options);
      await writeFile(`.local/audits/lighthouse-${label}-${device}-${name}.json`, JSON.stringify(lhr, null, 2));
      const metrics = Object.fromEntries(["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "total-byte-weight"].map((id) => [id, lhr.audits[id]?.numericValue]));
      const findings = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 1).map((a) => ({ id: a.id, title: a.title, value: a.displayValue, savings: a.metricSavings }));
      report.runs.push({ device, name, scores: Object.fromEntries(Object.entries(lhr.categories).map(([id, c]) => [id, c.score])), metrics, findings, settings: lhr.configSettings, warnings: lhr.runWarnings, runtimeError: lhr.runtimeError });
      console.log(JSON.stringify(report.runs.at(-1)));
      if (lhr.runtimeError) process.exitCode = 1;
    } finally { await browser.close(); }
  }
}
await writeFile(`.local/audits/performance-${label}.json`, JSON.stringify(report, null, 2));
