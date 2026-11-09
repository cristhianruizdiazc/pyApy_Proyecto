import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Local evidence only. Run after preparing the isolated phase-0 runtime.
const directory = resolve(".local/redesign-phase0-2026-11-04");
const isolation = JSON.parse(
  await readFile(`${directory}/isolation.json`, "utf8"),
);
if (
  isolation.target.database !== "pyapy_redesign_phase0_20261104" ||
  !isolation.verifiedBeforeBrowserWrites ||
  isolation.source.database === isolation.target.database
)
  throw new Error("Verified database isolation is required.");
const base = isolation.webUrl;
const accounts = JSON.parse(
  await readFile(".local/demo-accounts.json", "utf8"),
);
const catalog = await (
  await fetch(`${base}/api/v1/properties?guests=18&sort=match`)
).json();
const property = catalog.items.find(
  (p) => !p.isPublicSample && p.images.length,
);
if (!property) throw new Error("A bookable reference property is required.");
const search = "?guests=18&sort=match";
const detail = `/espacios/${property.id}?guests=18&returnTo=${encodeURIComponent(`/${search}`)}`;
const viewports = [
  [360, 800],
  [390, 844],
  [430, 932],
  [600, 960],
  [820, 1180],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
const report = {
  date: new Date().toISOString(),
  timezone: "America/Asuncion",
  browser: "Chromium headless",
  mode: "Production build; isolated real API except explicitly simulated error/loading/empty states",
  property: {
    id: property.id,
    name: property.name,
    isDemo: property.isDemo,
    isPublicSample: property.isPublicSample,
  },
  viewports,
  captures: [],
  errors: [],
  limitations: [],
};
await mkdir(`${directory}/captures`, { recursive: true });
const browser = await chromium.launch();

async function settle(page) {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator(".loading")).toHaveCount(0, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page, name, { scan = false, simulated = false } = {}) {
  // Trigger lazy images before full-page capture, then return to the top.
  await page.evaluate(async () => {
    for (
      let y = 0;
      y < document.documentElement.scrollHeight;
      y += innerHeight
    ) {
      scrollTo(0, y);
      await new Promise((done) => setTimeout(done, 35));
    }
    await Promise.race([
      Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      ),
      new Promise((done) => setTimeout(done, 3000)),
    ]);
    scrollTo(0, 0);
  });
  const width = page.viewportSize().width;
  const file = `captures/${name}-${width}.png`;
  await page.screenshot({
    path: `${directory}/${file}`,
    fullPage: true,
    animations: "disabled",
  });
  const observation = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    headings: [...document.querySelectorAll("h1,h2,h3")]
      .filter((e) => e.getClientRects().length)
      .map((e) => ({ tag: e.tagName, text: e.textContent.trim() })),
    undecodedImages: [...document.images]
      .filter((i) => !i.complete || !i.naturalWidth)
      .map((i) => ({ src: i.getAttribute("src"), alt: i.alt })),
    activeElement: document.activeElement?.tagName,
    fonts: {
      body: getComputedStyle(document.body).fontFamily,
      h1: document.querySelector("h1")
        ? getComputedStyle(document.querySelector("h1")).fontFamily
        : null,
    },
  }));
  const result = { name, url: page.url(), file, simulated, ...observation };
  if (scan) {
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const compact = (rule) => ({
      id: rule.id,
      impact: rule.impact,
      nodes: rule.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    });
    result.axe = {
      violations: axe.violations.map(compact),
      incomplete: axe.incomplete.map(compact),
    };
  }
  report.captures.push(result);
  await writeFile(
    `${directory}/baseline.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(
    `${name} ${width}: overflow=${observation.documentWidth > width}, axe=${result.axe?.violations.length ?? "not run"}`,
  );
}
async function visit(page, path) {
  await page.goto(`${base}${path}`);
  await settle(page);
}
function track(page, label) {
  page.on("pageerror", (e) =>
    report.errors.push({ label, message: e.message }),
  );
}
async function optional(page, label, operation) {
  try {
    await operation();
  } catch (error) {
    report.limitations.push({ label, message: error.message });
    console.log(`LIMIT ${label}: ${error.message.split("\n")[0]}`);
  }
}
try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      timezoneId: "America/Asuncion",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    track(page, `public-${width}`);
    await page.goto(isolation.prototypeUrl);
    await page.evaluate(() => document.fonts.ready);
    await capture(page, "prototype-home");
    if ([390, 1440].includes(width)) {
      await page.locator(".property-card [data-open]").first().click();
      const prototypeDialog = page.locator("#propertyDialog[open]");
      if (await prototypeDialog.count())
        await capture(page, "prototype-detail");
      await page.keyboard.press("Escape");
      await page.locator("[data-host-open]:visible").first().click();
      await capture(page, "prototype-host");
    }
    await visit(page, "/");
    await capture(page, "app-home", { scan: [390, 1440].includes(width) });
    if (width === 390) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await capture(page, "app-mobile-menu");
      await page.keyboard.press("Escape");
      report.mobileMenu = {
        closedAfterEscape:
          (await page
            .getByRole("button", { name: "Abrir menú" })
            .getAttribute("aria-expanded")) === "false",
        focusReturned: await page
          .getByRole("button", { name: "Abrir menú" })
          .evaluate((button) => button === document.activeElement),
      };
    }
    if ([390, 1440].includes(width)) {
      await visit(page, `/${search}`);
      await capture(page, "app-results", { scan: true });
      await page
        .getByRole("button", { name: "Más filtros", exact: true })
        .click();
      await capture(page, "app-filters");
      await page
        .getByRole("button", { name: "Más filtros", exact: true })
        .click();
      await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
      await expect(page.locator(".leaflet-container")).toBeVisible();
      await capture(page, "app-map");
      await visit(page, detail);
      await capture(page, "app-detail", { scan: true });
      await page
        .getByRole("button", {
          name: `Ver todas las fotos de ${property.name}`,
          exact: true,
        })
        .click();
      await capture(page, "app-gallery");
      await page.keyboard.press("Escape");
      for (const path of [
        "/ingresar",
        "/ayuda",
        "/pagina-inexistente",
        "/cuenta",
        "/reservas",
        "/favoritos",
        "/propietario",
        "/admin",
      ]) {
        await visit(page, path);
        await capture(page, `guest-${path.slice(1)}`, {
          scan: ["/ingresar", "/ayuda"].includes(path),
        });
      }
      await visit(page, "/ingresar");
      await page
        .getByRole("button", { name: "Crear cuenta", exact: true })
        .click();
      await capture(page, "app-register");
      // Fault states are explicit interceptions, never evidence of a server defect.
      for (const state of ["empty", "error", "loading"]) {
        await page.route("**/api/v1/properties?**", async (route) => {
          if (state === "loading")
            await new Promise((done) => setTimeout(done, 4000));
          await route
            .fulfill({
              status: state === "error" ? 500 : 200,
              json:
                state === "error"
                  ? { message: "Fallo controlado de línea base" }
                  : { items: [], total: 0, alternatives: [], otherDates: [] },
            })
            .catch(() => {});
        });
        await page.goto(`${base}/${search}`);
        if (state === "loading")
          await expect(page.locator(".loading").first()).toBeVisible();
        else await settle(page);
        await capture(page, `app-${state}`, { simulated: true });
        await page.unrouteAll({ behavior: "wait" });
      }
    }
    await context.close();
  }
  // Private screens use actual login and actual isolated API data.
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    for (const role of ["client", "owner", "admin"]) {
      const context = await browser.newContext({
        viewport: { width, height },
        timezoneId: "America/Asuncion",
        reducedMotion: "reduce",
      });
      const response = await context.request.post(`${base}/api/v1/auth/login`, {
        data: accounts[role],
      });
      if (!response.ok())
        throw Error(`Isolated ${role} login: ${response.status()}`);
      const page = await context.newPage();
      track(page, `${role}-${width}`);
      const paths =
        role === "client"
          ? ["/cuenta", "/reservas", "/favoritos", "/propietario", "/admin"]
          : role === "owner"
            ? [
                "/propietario?section=properties",
                "/propietario?section=calendar",
                "/propietario?section=bookings",
                "/propietario?section=plans",
                "/admin",
              ]
            : [
                "overview",
                "users",
                "properties",
                "reviews",
                "plans",
                "subscriptions",
                "sponsors",
                "weights",
                "audit",
              ].map((section) => `/admin?section=${section}`);
      for (const path of paths) {
        await visit(page, path);
        const name = `${role}-${path.slice(1).replace("?section=", "-")}`;
        await capture(page, name, {
          scan:
            (role === "client" && path === "/reservas") ||
            (role === "owner" && path.endsWith("calendar")) ||
            (role === "admin" && path.endsWith("users")),
        });
      }
      if (role === "owner") {
        await visit(page, "/propietario");
        await page
          .getByRole("button", { name: "Nuevo espacio", exact: true })
          .click();
        await capture(page, "owner-new-property");
        await page.keyboard.press("Escape");
        await optional(page, `owner-edit-${width}`, async () => {
          await page
            .getByRole("button", { name: /^Editar / })
            .first()
            .click();
          await capture(page, "owner-edit-property");
          await page.keyboard.press("Escape");
        });
        await optional(page, `owner-media-${width}`, async () => {
          await page
            .getByRole("button", { name: /^Imagenes y contacto de/ })
            .first()
            .click();
          for (const tab of ["Fotos", "Datos de llegada", "Redes"]) {
            await page
              .getByRole("dialog")
              .getByRole("tab", { name: tab, exact: true })
              .click();
            await capture(page, `owner-media-${tab.replaceAll(" ", "-")}`);
          }
          await page.keyboard.press("Escape");
        });
      }
      if (role === "admin") {
        await visit(page, "/admin?section=plans");
        await page
          .getByRole("button", { name: /^Editar plan/ })
          .first()
          .click();
        await capture(page, "admin-plan-dialog");
        await page.keyboard.press("Escape");
        await visit(page, "/admin?section=sponsors");
        await page
          .getByRole("button", { name: "Nueva campana", exact: true })
          .click();
        await capture(page, "admin-sponsor-dialog");
      }
      await context.close();
    }
  // Baseline for exact amount, explicit search focus, and real quote. No confirmation.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    timezoneId: "America/Asuncion",
  });
  const page = await context.newPage();
  await visit(page, "/");
  await page.getByLabel("Personas", { exact: true }).fill("18");
  await page.getByRole("button", { name: "Buscar espacios" }).click();
  await settle(page);
  report.explicitSearch = {
    url: page.url(),
    focus: await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      text: document.activeElement.textContent?.slice(0, 100),
    })),
    liveRegions: await page
      .locator('[aria-live], [role="status"]')
      .allTextContents(),
  };
  await page.getByLabel("Personas", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Buscar espacios" }).click();
  await capture(page, "app-invalid-guests");
  await context.request.post(`${base}/api/v1/auth/login`, {
    data: accounts.client,
  });
  await visit(page, detail);
  await page.getByLabel("Fecha de entrada", { exact: true }).fill("2030-01-10");
  await page.getByLabel("Personas", { exact: true }).fill("18");
  await page
    .getByRole("button", { name: "Consultar disponibilidad", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Resumen de tu reserva" }),
  ).toBeVisible();
  await capture(page, "client-real-quote");
  report.realQuote = {
    confirmed: false,
    path: page.url(),
    summary: await page.locator(".quote").innerText(),
  };
  await context.close();
} finally {
  await browser.close();
  report.summary = {
    captures: report.captures.length,
    overflow: report.captures
      .filter((c) => c.documentWidth > c.viewport.width)
      .map((c) => `${c.name}-${c.viewport.width}`),
    pageErrors: report.errors.length,
    axeScans: report.captures.filter((c) => c.axe).length,
    axeViolations: report.captures.flatMap((c) =>
      (c.axe?.violations || []).map((v) => ({
        name: c.name,
        width: c.viewport.width,
        id: v.id,
        nodes: v.nodes.length,
      })),
    ),
    limitations: report.limitations.length,
  };
  await writeFile(
    `${directory}/baseline.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report.summary));
}
