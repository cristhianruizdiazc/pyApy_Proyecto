import { test, expect } from "@playwright/test";
import { localInterval } from "../../packages/contracts/index.mjs";

test("Cómo funciona abre los pasos y conserva el acceso a ayuda", async ({
  page,
}) => {
  await page.goto("/");
  const link = page
    .getByRole("navigation", { name: "Navegación principal" })
    .getByRole("link", { name: "Cómo funciona", exact: true });
  if (!(await link.isVisible()))
    await page.getByRole("button", { name: "Abrir menú" }).click();
  await link.click();
  await expect(page).toHaveURL(/\/#como-funciona$/);
  await expect(page.locator("#como-funciona .steps-grid li")).toHaveCount(3);
  await page.getByRole("link", { name: "Más ayuda para reservar" }).click();
  await expect(page).toHaveURL(/\/ayuda#ayuda$/);
  await expect(
    page.getByRole("heading", { name: "Cómo funciona pyApy", exact: true }),
  ).toBeVisible();
});

test("la portada ofrece los tipos del HTML y explora ubicaciones en el mapa", async ({
  page,
}) => {
  await page.goto("/");

  const categories = page.getByRole("group", { name: "Categorías" });
  await expect(categories.getByRole("button")).toHaveText([
    "Todos",
    "Quintas",
    "Piscinas",
    "Casas",
    "Quinchos",
    "Bungalows",
  ]);
  await categories.getByRole("button", { name: "Bungalows" }).click();
  await expect(page).toHaveURL(/kind=Bungalow/);
  await expect(
    page.getByRole("link", { name: "Bungalow Arami", exact: true }),
  ).toBeVisible();

  await categories.getByRole("button", { name: "Todos", exact: true }).click();
  await expect(page).not.toHaveURL(/kind=/);
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("personas permite ingresar y conservar una cantidad exacta", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/v1/properties?guests=23");
  expect(response.ok()).toBe(true);
  const property = (await response.json()).items.find(
    (p) => !p.isPublicSample && p.capacity >= 24,
  );
  expect(
    property,
    "Una propiedad reservable con capacidad para conservar y editar personas",
  ).toBeTruthy();
  await page.goto("/");
  const guests = page.getByRole("textbox", {
    name: "Personas",
    exact: true,
  });
  await expect(guests).toBeVisible();
  await guests.fill("23");
  await page.getByRole("button", { name: "Más filtros", exact: true }).click();
  await expect(page.locator('.search-form [name="guests"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Buscar espacios" }).click();
  await expect(page).toHaveURL(/guests=23/);
  await page.locator(`[data-property-id="${property.id}"] .card-title`).click();
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("23");
  await page.getByLabel("Personas", { exact: true }).fill("24");
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("24");
});

test("filtros conservan horario paraguayo, borrador y navegación de historial", async ({
  page,
}) => {
  const date = new Date();
  date.setDate(date.getDate() + 35);
  const day = date.toISOString().slice(0, 10);
  const interval = localInterval(day, "20:00", "02:00");
  const params = new URLSearchParams({
    city: "Aregua",
    kind: "Casa",
    guests: "2",
    amenities: "pool",
    ...interval,
  });
  await page.goto(`/?${params}`);
  await expect(page.getByLabel("Fecha de entrada")).toHaveValue(day);
  await expect(page.locator(".search-schedule")).toContainText(
    "20:00 – Hasta 02:00",
  );
  await page.getByRole("button", { name: /Más filtros/ }).click();
  await expect(page.locator('input[name="start"]')).toHaveValue("20:00");
  await expect(page.locator('input[name="end"]')).toHaveValue("02:00");
  await expect(page.locator('input[value="pool"]')).toBeChecked();
  await expect(page.locator('select[name="kind"]')).toHaveValue("Casa");
  await page.getByLabel("Personas", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Quintas", exact: true }).click();
  await expect(page).toHaveURL(/kind=Quinta/);
  const current = new URL(page.url()).searchParams;
  expect(current.get("guests")).toBe("4");
  expect(current.get("startsAt")).toBe(interval.startsAt);
  expect(current.get("endsAt")).toBe(interval.endsAt);
  expect(current.get("city")).toBe("Aregua");
  await page.getByRole("button", { name: /Más filtros/ }).click();
  await expect(page.locator('select[name="kind"]')).toHaveValue("Quinta");
  await page.goBack();
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("2");
  await page.goForward();
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("4");
  await page
    .getByRole("button", { name: "Limpiar filtros", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByLabel("Fecha de entrada")).toHaveValue("");
  await expect(page.locator('select[name="city"]')).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "Las mejores quintas te esperan" }),
  ).toBeVisible();
});

test("fallo de búsqueda ofrece reintentar y no se presenta como catálogo vacío", async ({
  page,
}) => {
  let failing = true;
  await page.route(/\/api\/v1\/properties(?:\?.*)?$/, async (route) => {
    if (failing)
      await route.fulfill({
        status: 503,
        json: { error: { message: "Consulta temporalmente no disponible" } },
      });
    else await route.continue();
  });
  await page.goto("/?city=Aregua");
  await expect(
    page.getByRole("button", { name: "Reintentar búsqueda" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Probemos otro plan." }),
  ).toHaveCount(0);
  await expect(page.locator(".property-card")).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Reintentar búsqueda" }).click();
  await expect(
    page.getByRole("link", { name: "Casa del Lago", exact: true }),
  ).toBeVisible();
});

test("imagen fallida conserva tarjeta accesible y enlace de detalle", async ({
  page,
}) => {
  await page.route(/\/demo\/[^/?]+\.(?:jpe?g|webp)(?:\?.*)?$/, (route) =>
    route.abort(),
  );
  await page.goto("/?city=Aregua");
  const card = page.locator(".property-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(
    card.getByRole("img", { name: /Imagen no disponible/ }),
  ).toBeVisible();
  await expect(
    card.getByRole("link", { name: "Casa del Lago", exact: true }),
  ).toBeVisible();
  expect(
    await card
      .locator(".card-image")
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBeGreaterThan(90);
});

test("identidad responsive, menú con teclado y movimiento reducido", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Una revisión de todos los anchos desde escritorio",
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Tu próxima escapada/, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Las mejores quintas te esperan" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".hero-image.visible")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    )
    .toBeTruthy();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
    await expect(
      page.getByRole("button", { name: "Buscar espacios" }),
    ).toBeVisible();
    if (width <= 800) {
      const menu = page.getByRole("button", { name: "Abrir menú" });
      await menu.click();
      await expect(
        page.getByRole("navigation", { name: "Navegación principal" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Publicar mi espacio" }).first(),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await expect(menu).toBeFocused();
    }
    await page.screenshot({
      path: info.outputPath(`artesanal-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: /Más filtros/ }).click();
  await expect(page.locator(".advanced-filters")).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
