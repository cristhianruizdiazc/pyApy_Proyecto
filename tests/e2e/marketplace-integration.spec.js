import { test, expect } from "@playwright/test";
import { localInterval } from "../../packages/contracts/index.mjs";

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
  await expect(page.getByLabel("Fecha de la escapada")).toHaveValue(day);
  await expect(page.locator(".search-schedule")).toContainText(
    "20:00 – Hasta 02:00",
  );
  await page.getByRole("button", { name: /Más filtros/ }).click();
  await expect(page.locator('input[name="start"]')).toHaveValue("20:00");
  await expect(page.locator('input[name="end"]')).toHaveValue("02:00");
  await expect(page.locator('input[value="pool"]')).toBeChecked();
  await expect(page.locator('select[name="kind"]')).toHaveValue("Casa");
  await page.getByLabel("Cantidad de personas").fill("4");
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
  await expect(page.getByLabel("Cantidad de personas")).toHaveValue("2");
  await page.goForward();
  await expect(page.getByLabel("Cantidad de personas")).toHaveValue("4");
  await page
    .getByRole("button", { name: "Limpiar filtros", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByLabel("Fecha de la escapada")).toHaveValue("");
  await expect(page.locator('select[name="city"]')).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "Un lugar para cada plan." }),
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
  ).toBeGreaterThan(150);
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
    page.getByRole("button", { name: "Reproducir imágenes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Un lugar para cada plan." }),
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
