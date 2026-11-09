import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { localInterval } from "@pyapy/contracts";

const id = "00000000-0000-4000-8000-000000000041";
const interval = localInterval("2030-01-10", "20:00", "02:00");
const property = {
  id,
  name: "Quinta de la ribera",
  description:
    "Un espacio para compartir cerca del lago, con jardín y piscina.",
  status: "published",
  kind: "Quinta",
  city: "Aregua",
  department: "Central",
  zone: "Alrededores del centro",
  capacity: 30,
  pricePerHour: 10000,
  minHours: 2,
  maxHours: 48,
  openHour: 0,
  closeHour: 24,
  cancellationHours: 24,
  amenities: ["pool", "grill"],
  rules: "Respetá el horario y cuidá el jardín.",
  latitude: -25.3,
  longitude: -57.3,
  verified: true,
  images: [
    { id: "one", url: "/demo/pool.jpg", alt: "Piscina junto al jardín" },
    { id: "two", url: "/demo/house.jpg", alt: "Casa junto al lago" },
    { id: "three", url: "/demo/garden.jpg", alt: "Jardín para descansar" },
    { id: "four", url: "/missing-detail.jpg", alt: "Foto sin conexión" },
  ],
  reviews: [{ id: "review", rating: 5, comment: "Un lindo día en familia." }],
  rating: 5,
  reviewCount: 1,
  socials: [{ platform: "instagram", url: "https://www.instagram.com/" }],
};
const href = `/espacios/${id}?${new URLSearchParams({ ...interval, guests: "18", returnTo: "/?city=Aregua&guests=18#espacios" })}`;

// This suite intercepts every API call and OSM tile. Integration lives in
// detail-reservation.spec.js, against the explicitly isolated database.
async function mockApi(page, overrides = {}) {
  const state = { writes: [], tiles: 0, fail: false, ...overrides };
  await page.route("https://tile.openstreetmap.org/**", (route) => {
    state.tiles++;
    return route.fulfill({ status: 204 });
  });
  await page.route("**/missing-detail.jpg", (route) => route.abort());
  await page.route("**/api/**", (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    if (req.method() !== "GET")
      state.writes.push({ path, body: req.postDataJSON() });
    let json = { items: [] };
    if (path === "/auth/session")
      json = {
        user: { id: "detail-client", name: "Cliente QA", role: "client" },
        csrfToken: "test",
      };
    else if (path === "/catalog")
      json = {
        amenities: [
          { code: "pool", label: "Piscina" },
          { code: "grill", label: "Parrilla" },
        ],
        cities: [],
        kinds: ["Quinta"],
      };
    else if (path === `/properties/${id}`) {
      if (state.fail)
        return route.fulfill({
          status: 503,
          json: { message: "No se pudo cargar el espacio" },
        });
      json = { ...property, ...state.property };
    } else if (path.endsWith("/availability")) json = { intervals: [] };
    else if (path === "/reservations/quote")
      json = {
        currency: "PYG",
        hours: 6,
        totalAmount: 67890,
        cancellationHours: 24,
      };
    return route.fulfill({ json });
  });
  return state;
}

async function scan(page) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
  const names = await new AxeBuilder({ page })
    .withRules(["label-content-name-mismatch"])
    .analyze();
  expect(names.violations).toEqual([]);
}

test("miniaturas, ampliación, teclado y foco conservan la foto elegida", async ({
  page,
}) => {
  const state = await mockApi(page);
  await page.goto(href);
  const gallery = page.getByRole("region", {
    name: `Fotos de ${property.name}`,
  });
  await gallery.getByRole("button", { name: "Seleccionar foto 2" }).click();
  await expect(gallery.locator(".gallery-cover img")).toHaveAttribute(
    "alt",
    "Casa junto al lago",
  );
  const open = gallery.getByRole("button", {
    name: `Ver todas las fotos de ${property.name}`,
  });
  await open.click();
  const dialog = page.getByRole("dialog", {
    name: `Fotos de ${property.name}`,
  });
  await expect(dialog.getByRole("status")).toHaveText("Foto 2 de 4");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.getByRole("status")).toHaveText("Foto 1 de 4");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator(".gallery-full-image")).toHaveAttribute(
    "aria-label",
    "Imagen no disponible: Foto sin conexión",
  );
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await scan(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  expect(state.writes.filter((write) => write.path !== "/events")).toEqual([]);
  expect(page.url()).toContain(`/espacios/${id}?`);
});

test("enlace directo y recarga muestran intervalo nocturno, 18 personas y total del servidor", async ({
  page,
}) => {
  const state = await mockApi(page);
  await page.goto(href);
  await page.reload();
  await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("20:00");
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("02:00");
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("18");
  const selection = page.getByLabel("Intervalo elegido");
  await expect(selection).toContainText("6 h de duración");
  await expect(selection).toContainText("Personas18");
  await expect(
    page.getByRole("link", { name: "Volver a resultados" }),
  ).toHaveAttribute("href", "/?city=Aregua&guests=18#espacios");
  expect(
    state.writes.filter((write) => write.path.startsWith("/reservations")),
  ).toEqual([]);
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(
    page.getByRole("region", { name: "Resumen de tu reserva" }),
  ).toContainText("67.890");
  await expect(page.locator(".quote")).toBeFocused();
  await scan(page);
  await page.getByLabel("Personas", { exact: true }).fill("19");
  await expect(page.locator(".quote")).toHaveCount(0);
  await expect(selection).toContainText("Personas19");
});

test("mapa bajo demanda, reglas, opiniones y redes siguen disponibles", async ({
  page,
}) => {
  const state = await mockApi(page);
  await page.goto(href);
  await expect(page.locator(".property-map")).toHaveCount(0);
  expect(state.tiles).toBe(0);
  await page.getByRole("button", { name: "Ver mapa aproximado" }).click();
  await expect(page.locator(".property-map")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "OpenStreetMap", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ocultar mapa" }).click();
  await expect(page.locator(".property-map")).toHaveCount(0);
  await page.getByText("Reglas del espacio", { exact: true }).click();
  await expect(page.getByText(property.rules, { exact: true })).toBeVisible();
  await expect(page.getByText(property.reviews[0].comment)).toBeVisible();
  await expect(page.getByRole("link", { name: /instagram/ })).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
});

test("error de ficha admite reintento y la muestra no ofrece reservas", async ({
  page,
}) => {
  const state = await mockApi(page, { fail: true });
  await page.goto(href);
  await expect(page.getByRole("alert")).toContainText(
    "No se pudo cargar el espacio",
  );
  await expect(page.locator(".booking-fields")).toHaveCount(0);
  state.fail = false;
  state.property = {
    isPublicSample: true,
    isDemo: true,
    images: [],
    reviews: [],
    socials: [],
  };
  await page.getByRole("button", { name: "Reintentar espacio" }).click();
  await expect(
    page.getByRole("heading", { name: "Espacio de demostración" }),
  ).toBeVisible();
  await expect(
    page.getByText("El anfitrión todavía no agregó fotos."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Consultar disponibilidad" }),
  ).toHaveCount(0);
  await scan(page);
});

test("ficha y galería se adaptan al umbral y a 320–1920 px", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "El barrido de anchos se ejecuta una vez; las demás pruebas cubren móvil.",
  );
  await mockApi(page, { property: { name: `Escapada${"Ribera".repeat(18)}` } });
  await page.goto(href);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [
    320, 360, 390, 430, 600, 820, 980, 981, 1024, 1366, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const gallery = await page.locator(".property-gallery").boundingBox();
    const content = await page.locator(".detail-info").boundingBox();
    if (width > 980)
      expect(gallery.x + gallery.width).toBeLessThanOrEqual(content.x + 1);
    else expect(gallery.y + gallery.height).toBeLessThanOrEqual(content.y + 1);
    await page.screenshot({
      path: info.outputPath(`ficha-${width}.png`),
      fullPage: true,
    });
  }
  await scan(page);
});
