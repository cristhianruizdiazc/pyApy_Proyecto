import { test, expect } from "@playwright/test";

const properties = [1, 2].map((number) => ({
  id: `00000000-0000-4000-8000-00000000000${number}`,
  name: `Quinta retorno ${number}`,
  city: "Aregua",
  department: "Central",
  zone: "Centro",
  kind: "Quinta",
  capacity: 30,
  pricePerHour: 10000,
  minHours: 1,
  maxHours: 240,
  openHour: 0,
  closeHour: 24,
  cancellationHours: 24,
  description: "Espacio simulado para comprobar navegación.",
  images: [],
  amenities: ["pool", "wifi"],
  reviews: [],
  socials: [],
  status: "published",
  latitude: -25.3 - number / 100,
  longitude: -57.3,
}));
const filters = new URLSearchParams({
  city: "Aregua",
  startsAt: "2030-01-10T12:00:00.000Z",
  endsAt: "2030-01-11T12:00:00.000Z",
  guests: "18",
  budget: "500000",
  amenities: "pool,wifi",
  requiredAmenities: "pool",
  kind: "Quinta",
  strictCity: "true",
  strictBudget: "true",
  sort: "price",
  page: "2",
});
const origin = `/?${filters}`;

test.beforeEach(async ({ context }) => {
  await context.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({ status: 204 }),
  );
  await context.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = { items: [] };
    if (path.endsWith("/session")) json = { user: null };
    else if (path.endsWith("/catalog"))
      json = {
        cities: [{ id: 1, city: "Aregua" }],
        amenities: [
          { code: "pool", label: "Piscina" },
          { code: "wifi", label: "Wi-Fi" },
        ],
      };
    else if (path.endsWith("/availability")) json = { intervals: [] };
    else if (/\/properties\/[^/]+$/.test(path)) {
      json = properties.find((p) => path.endsWith(p.id));
    } else if (path.endsWith("/properties"))
      json = { items: properties, total: 42, alternatives: [], otherDates: [] };
    await route.fulfill({ json });
  });
});

async function expectOrigin(page) {
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(
    origin,
  );
  await expect(page.locator("#results .card-title")).toHaveText(
    properties.map((p) => p.name),
  );
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("18");
  await expect(page.getByText("Pagina 2", { exact: true })).toBeVisible();
}

test("compara dos fichas, conserva URL completa e historial y restaura scroll", async ({
  page,
}) => {
  await page.goto(origin);
  // Compare positions after the landing's fonts settle. A font swap while the
  // lazy detail route loads can legitimately move the browser's scroll anchor.
  await page.evaluate(() => document.fonts.ready);
  for (const property of properties) {
    const card = page.locator("#results .card-title", {
      hasText: property.name,
    });
    await card.scrollIntoViewIfNeeded();
    // Allow the scroll event to record the actual position before navigating.
    await page.waitForTimeout(100);
    const scroll = await page.evaluate(() => window.scrollY);
    await card.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      property.name,
    );
    const back = page.getByRole("link", { name: "Volver a resultados" });
    await expect(back).toHaveAttribute("href", origin);
    await expect(
      page.locator(".booking-panel").getByLabel("Personas", { exact: true }),
    ).toHaveValue("18");
    await back.click();
    await expectOrigin(page);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeCloseTo(scroll, 0);
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      property.name,
    );
    await page.goForward();
    await expectOrigin(page);
  }
});

test("enlace compartido, recarga y fichas similares conservan origen", async ({
  page,
  context,
}) => {
  await page.goto(origin);
  const href = await page
    .locator("#results .card-image")
    .first()
    .getAttribute("href");
  expect(new URL(href, page.url()).searchParams.get("returnTo")).toBe(origin);
  // A fresh page has no router state or previous entry from the search.
  const tab = await context.newPage();
  await tab.goto(href);
  await expect(
    tab.getByRole("link", { name: "Volver a resultados" }),
  ).toHaveAttribute("href", origin);
  await tab.close();
  await page.goto(href);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Volver a resultados" }),
  ).toHaveAttribute("href", origin);
  await page.locator(".similar .card-title").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    properties[1].name,
  );
  await page.getByRole("link", { name: "Volver a resultados" }).click();
  await expectOrigin(page);
});

test("acceso directo ofrece explorar y origen inválido nunca sale de la app", async ({
  page,
}) => {
  for (const invalid of [
    null,
    "https://example.com/",
    "//example.com/",
    "/\\example.com/",
    "/ingresar",
    "/%2fexample.com",
    "/\n/example.com",
  ]) {
    const search =
      invalid === null ? "" : `?returnTo=${encodeURIComponent(invalid)}`;
    await page.goto(`/espacios/${properties[0].id}${search}`);
    await expect(
      page
        .locator("main")
        .getByRole("link", { name: "Explorar espacios", exact: true }),
    ).toHaveAttribute("href", "/");
    await expect(
      page.getByRole("link", { name: "Volver a resultados" }),
    ).toHaveCount(0);
  }
  await page
    .locator("main")
    .getByRole("link", { name: "Explorar espacios", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
});

test("el enlace del mapa conserva búsqueda completa", async ({ page }) => {
  await page.goto(origin);
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await page.locator(".leaflet-interactive").first().click({ force: true });
  await page.getByRole("link", { name: "Ver espacio", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Volver a resultados" }),
  ).toHaveAttribute("href", origin);
});

test("error de ficha conserva retorno", async ({ page }) => {
  await page.goto(origin);
  await page.route(`**/api/v1/properties/${properties[0].id}`, (route) =>
    route.fulfill({
      status: 404,
      json: { message: "Espacio no disponible" },
    }),
  );
  await page.locator("#results .card-title").first().click();
  await expect(page.getByRole("alert")).toContainText("Espacio no disponible");
  await page.getByRole("link", { name: "Volver a resultados" }).click();
  await expectOrigin(page);
});
