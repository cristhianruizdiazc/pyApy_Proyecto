import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const property = {
  id: "00000000-0000-4000-8000-000000000006",
  name: "Quinta QA mapa",
  city: "Aregua",
  kind: "Quinta",
  capacity: 30,
  pricePerHour: 10000,
  images: [],
  amenities: [],
  latitude: -25.3,
  longitude: -57.3,
};
const filters = "city=Aregua&guests=18&budget=500000&sort=price&page=2";

async function mockApi(page, initial = "results") {
  const state = { value: initial, searches: 0, tiles: 0, modules: 0 };
  page.on("request", (request) => {
    if (/\/src\/Map\.jsx|\/assets\/Map-[^/]+\.js/.test(request.url()))
      state.modules++;
  });
  await page.route("https://tile.openstreetmap.org/**", (route) => {
    state.tiles++;
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = { items: [] };
    if (path.endsWith("/session")) json = { user: null };
    if (path.endsWith("/catalog"))
      json = { cities: [{ city: "Aregua", id: 1 }], amenities: [] };
    if (path.endsWith("/properties")) {
      state.searches++;
      if (state.value === "error")
        return route.fulfill({
          status: 500,
          json: { error: "Error QA de búsqueda" },
        });
      json = {
        items: state.value === "empty" ? [] : [property],
        total: state.value === "empty" ? 0 : 1,
        alternatives: [],
        otherDates: [],
      };
    }
    return route.fulfill({ json });
  });
  return state;
}

async function geometry(page, label, info) {
  const measurement = await page.locator(".map-toggle-row").evaluate((row) => {
    const button = row.querySelector("button");
    const rect = button.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const next = row.nextElementSibling.getBoundingClientRect();
    return {
      button: rect.toJSON(),
      row: rowRect.toJSON(),
      next: next.toJSON(),
      opacity: getComputedStyle(button).opacity,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(measurement.button.height).toBeGreaterThanOrEqual(44);
  expect(measurement.row.height).toBeGreaterThanOrEqual(
    measurement.button.height,
  );
  expect(measurement.next.top).toBeGreaterThanOrEqual(measurement.row.bottom);
  expect(Number(measurement.opacity)).toBeGreaterThan(0);
  expect(measurement.overflow).toBe(false);
  await mkdir(".local/t06", { recursive: true });
  const name = `${info.project.name}-${label}`;
  await writeFile(
    `.local/t06/${name}.json`,
    JSON.stringify(measurement, null, 2),
  );
  await page.locator(".map-toggle").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.local/t06/${name}.png`, fullPage: true });
}

for (const width of [360, 390, 768, 1440]) {
  test(`mapa único conserva filtros y resultados a ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const state = await mockApi(page);
    await page.goto(`/?${filters}`);
    const toggle = page.locator(".map-toggle");
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAccessibleName("Ver mapa");
    await expect(toggle).toHaveCount(1);
    expect(state.modules).toBe(0);
    expect(state.tiles).toBe(0);
    await expect(page.locator(".property-map")).toHaveCount(0);
    await geometry(page, `results-${width}`, info);
    const requests = state.searches;
    const url = page.url();
    const cards = await page
      .locator(".property-grid .card-title")
      .allTextContents();
    await toggle.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(toggle).toBeFocused();
    expect(
      await toggle.evaluate((button) => {
        const style = getComputedStyle(button);
        return (
          button.matches(":focus-visible") && style.outlineStyle !== "none"
        );
      }),
    ).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.locator(".property-map")).toBeVisible();
    await expect(page.locator(".leaflet-interactive")).toHaveCount(1);
    await expect(toggle).toHaveAccessibleName("Ver espacios");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toBeFocused();
    expect(state.modules).toBeGreaterThan(0);
    await geometry(page, `open-${width}`, info);
    if (info.project.name === "mobile") await toggle.tap();
    else await page.keyboard.press("Space");
    await expect(page.locator(".property-map")).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(page.url()).toBe(url);
    expect(state.searches).toBe(requests);
    expect(
      await page.locator(".property-grid .card-title").allTextContents(),
    ).toEqual(cards);
    await expect(page.getByLabel("Personas", { exact: true })).toHaveValue(
      "18",
    );
  });
}

for (const mode of ["empty", "error"]) {
  test(`mapa explica indisponibilidad y se recupera desde ${mode}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({
      width: info.project.name === "mobile" ? 390 : 360,
      height: 844,
    });
    const state = await mockApi(page, mode);
    await page.goto(`/?${filters}`);
    const toggle = page.getByRole("button", { name: "Ver mapa", exact: true });
    await expect(page.locator("#map-unavailable")).toBeVisible();
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAccessibleDescription(
      mode === "error"
        ? "El mapa estará disponible cuando se puedan cargar los resultados."
        : "No hay coincidencias exactas para mostrar en el mapa.",
    );
    expect(state.modules).toBe(0);
    expect(state.tiles).toBe(0);
    await geometry(page, mode, info);
    state.value = "results";
    if (mode === "error")
      await page.getByRole("button", { name: "Reintentar búsqueda" }).click();
    else await page.getByLabel("Ordenar resultados").selectOption("capacity");
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator(".property-map")).toBeVisible();
  });
}

for (const mode of ["empty", "error"]) {
  test(`permite cerrar el mapa si la búsqueda cambia a ${mode}`, async ({
    page,
  }) => {
    const state = await mockApi(page);
    await page.goto(`/?${filters}`);
    await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
    await expect(page.locator(".property-map")).toBeVisible();
    state.value = mode;
    await page.getByLabel("Ordenar resultados").selectOption("capacity");
    await expect(page.locator("#map-unavailable")).toBeVisible();
    const toggle = page.getByRole("button", {
      name: "Ver espacios",
      exact: true,
    });
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(page.locator(".property-map")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Ver mapa", exact: true }),
    ).toBeDisabled();
  });
}

test("portada permite abrir y volver al carrusel sin modificar la URL", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/");
  await expect(page.locator(".property-rail")).toBeVisible();
  const url = page.url();
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  await expect(page.locator(".property-map")).toBeVisible();
  await page.getByRole("button", { name: "Ver espacios", exact: true }).click();
  await expect(page.locator(".property-rail")).toBeVisible();
  expect(page.url()).toBe(url);
});
