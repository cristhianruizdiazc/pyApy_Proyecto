import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { localInterval } from "@pyapy/contracts";

const interval = localInterval("2030-01-10", "09:00", "13:00");
const proposed = localInterval("2030-01-11", "20:00", "02:00");
const base = {
  city: "Aregua",
  department: "Central",
  kind: "Quinta",
  capacity: 30,
  pricePerHour: 10000,
  minHours: 4,
  maxHours: 240,
  openHour: 0,
  closeHour: 24,
  images: [],
  amenities: ["pool", "grill"],
  latitude: -25.3,
  longitude: -57.3,
  stage: "exact",
  available: true,
  availabilityChecked: true,
  estimatedTotal: 40000,
  estimatedHours: 4,
  reviews: [],
  socials: [],
  description: "Datos simulados para verificar presentación y navegación.",
};
const property = (number, extra = {}) => ({
  ...base,
  id: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
  name: `Quinta resultados ${number}`,
  ...extra,
});
const exact = [property(1), property(2, { latitude: -25.35 })];
const alternatives = [
  property(3, {
    stage: "location",
    distanceKm: 8.5,
    distanceReference: { city: "Aregua" },
  }),
  property(4, { stage: "budget", budgetExcess: 4000, budgetExcessPercent: 10 }),
  property(5, { stage: "services", missingOptionalAmenities: ["wifi"] }),
];
const otherDates = [
  property(6, {
    stage: "schedule",
    proposedInterval: proposed,
    estimatedHours: 6,
    estimatedTotal: 60000,
  }),
];
const search = new URLSearchParams({
  ...interval,
  guests: "18",
  city: "Aregua",
  amenities: "pool",
  strictCity: "true",
  sort: "match",
});

// Every API call and map tile is intercepted; no database writes occur here.
async function mockApi(page, { mode = "results", signedIn = false } = {}) {
  const state = {
    mode,
    searches: [],
    writes: [],
    favorites: new Set(),
    modules: 0,
    tiles: 0,
  };
  page.on("request", (request) => {
    if (/\/src\/Map\.jsx|\/assets\/Map-[^/]+\.js/.test(request.url()))
      state.modules++;
  });
  await page.route("https://tile.openstreetmap.org/**", (route) => {
    state.tiles++;
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace("/api/v1", "");
    if (request.method() !== "GET")
      state.writes.push({
        path,
        method: request.method(),
        body: request.postDataJSON(),
      });
    let json = { items: [] };
    if (path === "/auth/session")
      json = {
        user: signedIn
          ? { id: "results-customer", name: "Cliente QA", role: "customer" }
          : null,
        csrfToken: "results-test",
      };
    else if (path === "/catalog")
      json = {
        cities: [{ id: 1, city: "Aregua" }],
        amenities: [{ code: "pool", label: "Piscina" }],
        plans: [],
      };
    else if (path === "/favorites")
      json = { items: exact.filter((p) => state.favorites.has(p.id)) };
    else if (path.startsWith("/favorites/")) {
      const id = path.split("/").pop();
      if (request.method() === "PUT") state.favorites.add(id);
      else state.favorites.delete(id);
      json = { ok: true };
    } else if (path === "/properties") {
      state.searches.push(Object.fromEntries(url.searchParams));
      if (state.mode === "error")
        return route.fulfill({
          status: 503,
          json: { message: "Fallo de búsqueda QA" },
        });
      json = {
        items:
          state.mode === "empty"
            ? []
            : exact.map((p) => ({
                ...p,
                availabilityChecked: url.searchParams.has("startsAt"),
                available: url.searchParams.has("startsAt"),
              })),
        total: state.mode === "empty" ? 0 : 42,
        alternatives: state.mode === "empty" ? [] : alternatives,
        otherDates: state.mode === "empty" ? [] : otherDates,
      };
    } else if (/^\/properties\/[^/]+$/.test(path))
      json = [...exact, ...alternatives, ...otherDates].find((p) =>
        path.endsWith(p.id),
      );
    await route.fulfill({ json });
  });
  return state;
}

test("tarjetas distinguen exactas, etapas, importes y horarios propuestos", async ({
  page,
}) => {
  const state = await mockApi(page);
  await page.goto(`/?${search}`);
  await expect(page.locator("#exact-results .card-title")).toHaveText(
    exact.map((p) => p.name),
  );
  await expect(page.locator("#exact-results .card-availability")).toHaveText([
    "Disponible para tu horario",
    "Disponible para tu horario",
  ]);
  await expect(page.locator(".alternatives")).toHaveCount(4);
  await expect(page.getByText(/8.5 km del punto/)).toBeVisible();
  await expect(page.getByText(/4.000 sobre tu presupuesto/)).toBeVisible();
  await expect(
    page.getByText(/No incluye servicios opcionales: Wi-Fi/),
  ).toBeVisible();
  const card = page.locator(`[data-property-id="${otherDates[0].id}"]`);
  await expect(card).toContainText("60.000 por 6 h");
  await expect(card).toContainText("Al abrir se seleccionará este intervalo.");
  await card.locator(".card-title").click();
  const url = new URL(page.url());
  expect(url.searchParams.get("startsAt")).toBe(proposed.startsAt);
  expect(url.searchParams.get("endsAt")).toBe(proposed.endsAt);
  expect(url.searchParams.get("guests")).toBe("18");
  expect(url.searchParams.get("returnTo")).toBe(`/?${search}`);
  await expect
    .poll(
      () =>
        state.writes.filter((r) => r.body?.event === "search_select").length,
    )
    .toBe(1);
});

test("mapa diferido coordina selección por teclado y conserva página y filtros", async ({
  page,
}, info) => {
  const state = await mockApi(page);
  await page.goto(`/?${search}`);
  await expect(page.locator("#exact-results .property-card")).toHaveCount(2);
  expect(state.modules).toBe(0);
  expect(state.tiles).toBe(0);
  const origin = page.url(),
    count = state.searches.length;
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await expect(page.locator(".results-map-panel")).toBeVisible();
  await expect(page.locator(".leaflet-interactive")).toHaveCount(2);
  await expect(page.locator(".results-map-head")).toContainText(
    "2 en esta página",
  );
  await expect(
    page.getByRole("link", { name: "OpenStreetMap", exact: true }),
  ).toBeVisible();
  const marker = page.getByRole("button", {
    name: /Quinta resultados 2, Aregua/,
  });
  await marker.focus();
  await page.keyboard.press("Enter");
  await expect(marker).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".leaflet-popup-content")).toContainText(
    "40.000 por 4 h",
  );
  await expect(page.locator(".property-card.is-selected")).toHaveAttribute(
    "data-property-id",
    exact[1].id,
  );
  if (info.project.name === "desktop") {
    // Keyboard selection scrolls the list under the stationary pointer.
    // Move outside first so this exercises a fresh pointer entry.
    await page.mouse.move(0, 0);
    await page.locator("#exact-results .property-card").first().hover();
    await expect(
      page.getByRole("button", { name: /Quinta resultados 1, Aregua/ }),
    ).toHaveAttribute("aria-pressed", "true");
  } else
    await expect(page.locator("#exact-results .property-grid")).toBeHidden();
  await page.getByRole("button", { name: "Ver espacios", exact: true }).click();
  await expect(page.locator("#exact-results .property-grid")).toBeVisible();
  expect(page.url()).toBe(origin);
  expect(state.searches.length).toBe(count);
  await page.getByLabel("Ordenar resultados").selectOption("price");
  await expect(page).toHaveURL(/sort=price/);
  await page.getByRole("button", { name: "Pagina siguiente" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByLabel("Ordenar resultados").selectOption("capacity");
  await expect(page).not.toHaveURL(/page=/);
  await expect.poll(() => state.searches.at(-1)?.sort).toBe("capacity");
  expect(state.searches.at(-1)).toMatchObject({
    city: "Aregua",
    guests: "18",
    strictCity: "true",
    amenities: "pool",
    ...interval,
  });
});

test("favoritos persisten y guardar interés exige una acción explícita", async ({
  page,
}) => {
  const state = await mockApi(page, { signedIn: true });
  await page.goto(`/?${search}`);
  const favorite = page
    .locator("#exact-results .property-card")
    .first()
    .getByRole("button", { name: "Guardar favorito" });
  await favorite.click();
  const saved = page
    .locator("#exact-results .property-card")
    .first()
    .getByRole("button", { name: "Quitar de favoritos" });
  await expect(saved).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(saved).toHaveAttribute("aria-pressed", "true");
  await saved.click();
  await expect(favorite).toHaveAttribute("aria-pressed", "false");
  state.mode = "empty";
  await page.getByLabel("Ordenar resultados").selectOption("price");
  await expect(
    page.getByRole("button", { name: "Guardar mi interés" }),
  ).toBeVisible();
  expect(state.writes.filter((r) => r.path === "/search-intents")).toHaveLength(
    0,
  );
  await page.getByRole("button", { name: "Guardar mi interés" }).click();
  await expect(
    page.getByText("Guardamos tu interés en esta búsqueda."),
  ).toBeVisible();
  expect(
    state.writes.find((r) => r.path === "/search-intents").body,
  ).toMatchObject({ guests: "18", ...interval });
});

test("error no se presenta como vacío y puede recuperarse sin perder selección", async ({
  page,
}) => {
  const state = await mockApi(page, { mode: "error" });
  await page.goto(`/?${search}`);
  await expect(
    page.getByRole("button", { name: "Reintentar búsqueda" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Guardar mi interés" }),
  ).toHaveCount(0);
  await expect(page.locator(".map-toggle")).toBeDisabled();
  state.mode = "results";
  await page.getByRole("button", { name: "Reintentar búsqueda" }).click();
  await expect(page.locator("#exact-results .property-card")).toHaveCount(2);
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("18");
});

test("sin fecha informa disponibilidad sin verificar y conserva muestras", async ({
  page,
}) => {
  await mockApi(page);
  await page.route("**/api/v1/properties?*", (route) =>
    route.fulfill({
      json: {
        items: [
          property(1, {
            available: false,
            availabilityChecked: false,
            isDemo: true,
            isPublicSample: true,
          }),
        ],
        total: 1,
        alternatives: [],
        otherDates: [],
      },
    }),
  );
  await page.goto("/?guests=18");
  await expect(page.locator(".card-kind")).toContainText("Demo");
  await expect(page.locator(".card-availability")).toHaveText(
    "Muestra · no admite reservas",
  );
  await expect(page.locator(".search-estimate")).toContainText(
    "disponibilidad sin verificar",
  );
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await page.locator(".leaflet-interactive").click();
  await expect(page.locator(".leaflet-popup-content")).toContainText(
    "Muestra · no admite reservas",
  );
});

test("resultados y mapa conservan reflow, geometría y accesibilidad", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  test.skip(
    info.project.name !== "desktop",
    "Barrido único de anchos y estados",
  );
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const report = [];
  await mkdir(".local/redesign-phase3-2026-11-07/mock-captures", {
    recursive: true,
  });
  for (const width of [
    320, 360, 390, 430, 600, 820, 1024, 1180, 1181, 1366, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/?${search}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#exact-results .property-card")).toHaveCount(2);
    for (const map of [false, true]) {
      if (map)
        await page
          .getByRole("button", { name: "Ver mapa", exact: true })
          .click();
      if (map) await expect(page.locator(".property-map")).toBeVisible();
      await page.locator("#results").scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (map && width > 1180) {
        const grid = await page
          .locator("#exact-results .property-grid")
          .boundingBox();
        const panel = await page.locator(".results-map-panel").boundingBox();
        expect(grid.x + grid.width).toBeLessThan(panel.x);
      }
      const entry = { width, map };
      if ([390, 1440].includes(width)) {
        if (map) {
          await page.locator(".leaflet-interactive").first().focus();
          await page.keyboard.press("Enter");
        }
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        entry.violations = audit.violations;
        expect(audit.violations).toEqual([]);
        const names = await new AxeBuilder({ page })
          .withRules(["label-content-name-mismatch"])
          .analyze();
        expect(names.violations).toEqual([]);
        await page.locator("#results").screenshot({
          path: `.local/redesign-phase3-2026-11-07/mock-captures/results-${width}-${map ? "map" : "list"}.png`,
        });
      }
      report.push(entry);
    }
  }
  expect(errors).toEqual([]);
  await writeFile(
    ".local/redesign-phase3-2026-11-07/mock-visual.json",
    JSON.stringify({ report, errors }, null, 2),
  );
});
