import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const label = process.argv[2] || "final";
if (!/^[a-z0-9-]+$/.test(label)) throw new Error("Etiqueta de informe no válida.");
const url = process.env.WEB_URL || "http://127.0.0.1:5173";
const accounts = JSON.parse(await readFile(".local/demo-accounts.json", "utf8"));
const browser = await chromium.launch();
const report = { label, date: new Date().toISOString(), url, checks: [], pageErrors: [] };
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.pageErrors.push({ width, message: error.message }));
    async function settle() { await expect(page.locator(".loading")).toHaveCount(0, { timeout: 20000 }); }
    async function visit(path) { await page.goto(`${url}${path}`); await expect(page.locator("main")).toBeVisible(); await settle(); }
    async function scan(name) {
      await settle();
      const result = await new AxeBuilder({ page }).withTags(tags).analyze();
      const summarize = (r) => ({ id: r.id, impact: r.impact, help: r.help, nodes: r.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })) });
      const overflow = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
      report.checks.push({ name, width, overflow, violations: result.violations.map(summarize), incomplete: result.incomplete.map(summarize) });
      console.log(`${width} ${name}: ${result.violations.length} reglas incumplidas`);
    }
    const catalog = await (await context.request.get(`${url}/api/v1/properties`)).json();
    const property = catalog.items.find((p) => p.images.length);
    await visit("/"); await scan("home");
    await page.getByRole("button", { name: /Más filtros/ }).click(); await scan("home-filters");
    await visit("/?city=Aregua");
    await page.getByRole("button", { name: "Explorar el mapa" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible(); await scan("search-map");
    await visit("/ingresar"); await scan("login");
    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click(); await scan("register");
    await visit(`/espacios/${property.id}`); await scan("detail");
    await page.getByRole("button", { name: `Ver todas las fotos de ${property.name}` }).click(); await scan("gallery-dialog");
    await page.keyboard.press("Escape");
    await visit("/pagina-inexistente"); await scan("not-found");
    for (const role of ["client", "owner", "admin"]) {
      await context.clearCookies();
      const response = await context.request.post(`${url}/api/v1/auth/login`, { data: accounts[role] });
      if (!response.ok()) throw new Error(`Login de auditoría ${role}: HTTP ${response.status()}`);
      if (role === "client") {
        for (const path of ["cuenta", "reservas", "favoritos"]) { await visit(`/${path}`); await scan(path); }
      } else if (role === "owner") {
        for (const section of ["properties", "calendar", "bookings", "plans"]) { await visit(`/propietario?section=${section}`); await scan(`owner-${section}`); }
        await visit("/propietario");
        await page.getByRole("button", { name: "Nuevo espacio", exact: true }).click(); await scan("owner-property-dialog");
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: /^Imagenes y contacto de/ }).first().click();
        for (const tab of ["Fotos", "Datos de llegada", "Redes"]) { await page.getByRole("dialog").getByRole("tab", { name: tab, exact: true }).click(); await scan(`owner-media-${tab}`); }
        await page.keyboard.press("Escape");
      } else {
        for (const section of ["overview", "users", "properties", "reviews", "plans", "subscriptions", "sponsors", "weights", "audit"]) { await visit(`/admin?section=${section}`); await scan(`admin-${section}`); }
        await visit("/admin?section=plans");
        await page.getByRole("button", { name: /^Editar plan/ }).first().click(); await scan("admin-plan-dialog");
        await page.keyboard.press("Escape");
        await visit("/admin?section=sponsors");
        await page.getByRole("button", { name: "Nueva campana" }).click(); await scan("admin-sponsor-dialog");
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  await mkdir(".local/audits", { recursive: true });
  report.summary = {
    states: report.checks.length,
    statesWithViolations: report.checks.filter((c) => c.violations.length).length,
    rules: [...new Set(report.checks.flatMap((c) => c.violations.map((r) => r.id)))],
    overflow: report.checks.filter((c) => c.overflow.document > c.overflow.viewport + 1).map((c) => `${c.width}:${c.name}`),
    pageErrors: report.pageErrors.length,
  };
  await writeFile(`.local/audits/axe-${label}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  if (report.summary.statesWithViolations || report.summary.overflow.length || report.pageErrors.length) process.exitCode = 1;
}
