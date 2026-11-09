import { test, expect } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000001";
const property = {
  id,
  name: "Espacio QA T04",
  city: "San Bernardino",
  department: "Cordillera",
  zone: "Centro",
  kind: "Quinta",
  capacity: 50,
  pricePerHour: 10000,
  minHours: 1,
  maxHours: 240,
  openHour: 0,
  closeHour: 24,
  cancellationHours: 24,
  description: "Espacio simulado para QA de etiquetas y fechas.",
  rules: "Respetar capacidad.",
  images: [],
  amenities: [],
  reviews: [],
  socials: [],
  verified: false,
  isDemo: true,
  status: "published",
};

// Exercise the real UI and emitted requests without creating server data.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = { items: [] };
    if (path.endsWith("/auth/session"))
      json = {
        user: {
          id: "00000000-0000-4000-8000-000000000002",
          name: "QA T04",
          role: "customer",
        },
        csrfToken: "qa",
      };
    else if (path.endsWith("/catalog"))
      json = {
        cities: [{ id: 1, city: "San Bernardino" }],
        amenities: [{ code: "pool", label: "Piscina" }],
      };
    else if (path.endsWith("/availability")) json = { intervals: [] };
    else if (path.endsWith("/reservations/quote"))
      json = {
        currency: "PYG",
        hours: 24,
        totalAmount: 240000,
        cancellationHours: 24,
      };
    else if (/\/properties\/[^/]+$/.test(path)) json = property;
    else if (path.endsWith("/properties"))
      json = { items: [property], total: 1, alternatives: [], otherDates: [] };
    await route.fulfill({ json });
  });
});

test("18 personas conserva capacidad, URL, ficha y cotización", async ({
  page,
}) => {
  const catalog = [
    {
      ...property,
      id: "00000000-0000-4000-8000-000000000003",
      name: "Capacidad 17",
      capacity: 17,
    },
    { ...property, name: "Capacidad 18", capacity: 18 },
  ];
  // Controlled API: capacity is mandatory, as in the real search contract.
  await page.route("**/api/v1/properties?*", async (route) => {
    const guests = Number(
      new URL(route.request().url()).searchParams.get("guests") || 1,
    );
    const items = catalog.filter((p) => p.capacity >= guests);
    await route.fulfill({
      json: { items, total: items.length, alternatives: [], otherDates: [] },
    });
  });
  await page.goto("/");
  const form = page.locator(".search-form");
  await form.getByLabel("Personas", { exact: true }).fill("18");
  await form.getByLabel("Fecha de entrada").fill("2030-01-10");
  await form.getByRole("button", { name: "Más filtros" }).click();
  await expect(form.locator('[name="guests"]')).toHaveCount(1);
  await expect(form.locator('.advanced-filters [name="guests"]')).toHaveCount(
    0,
  );
  const request = page.waitForRequest(
    (r) =>
      r.url().includes("/api/v1/properties?") &&
      new URL(r.url()).searchParams.get("guests") === "18",
  );
  await form.getByRole("button", { name: "Buscar espacios" }).click();
  expect(new URL((await request).url()).searchParams.get("guests")).toBe("18");
  await expect(page).toHaveURL(/guests=18/);
  await expect(page.locator("#results .card-title")).toHaveText([
    "Capacidad 18",
  ]);
  await expect(page.locator("#results")).not.toContainText("Capacidad 17");
  await page.reload();
  await expect(form.getByLabel("Personas", { exact: true })).toHaveValue("18");
  await page.locator("#results .card-title").click();
  await expect(page).toHaveURL(/guests=18/);
  const booking = page.locator(".booking-panel");
  await expect(booking.getByLabel("Personas", { exact: true })).toHaveValue(
    "18",
  );
  const quote = page.waitForRequest("**/api/v1/reservations/quote");
  await booking
    .getByRole("button", { name: "Consultar disponibilidad" })
    .click();
  expect((await quote).postDataJSON().guests).toBe(18);
  await expect(booking.locator(".quote .stay-summary")).toContainText(
    "Personas18",
  );
});

test("valida enteros de 1 a 1000 y permite quitar la cantidad", async ({
  page,
}) => {
  const initial = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/v1/properties",
  );
  await page.goto("/");
  await initial;
  await expect(page.locator("#results")).toHaveAttribute("aria-busy", "false");
  const form = page.locator(".search-form");
  const guests = form.getByRole("textbox", {
    name: "Personas",
    exact: true,
  });
  const searches = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/properties?")) searches.push(r.url());
  });
  for (const invalid of ["0", "1001"]) {
    const before = searches.length;
    await guests.fill(invalid);
    await form.getByRole("button", { name: "Buscar espacios" }).click();
    await expect(form.getByRole("alert")).toHaveText(
      "Indicá una cantidad entera de personas entre 1 y 1000.",
    );
    await expect(guests).toHaveAttribute("aria-invalid", "true");
    await expect(guests).toBeFocused();
    expect(searches.length).toBe(before);
    expect(new URL(page.url()).searchParams.has("guests")).toBe(false);
  }
  for (const valid of ["1", "1000", "18", ""]) {
    await guests.fill(valid);
    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/api/v1/properties?") &&
        (new URL(r.url()).searchParams.get("guests") || "") === valid,
    );
    await guests.press("Enter");
    await request;
    expect(new URL(page.url()).searchParams.get("guests")).toBe(valid || null);
    await expect(form.getByRole("alert")).toHaveCount(0);
  }
});

test("Personas permite solo dígitos, pegado numérico y edición sin incrementar", async ({
  page,
}) => {
  await page.goto("/?guests=18");
  const guests = page.locator('.search-form [name="guests"]');
  await guests.pressSequentially("abcEe+-., ");
  await expect(guests).toHaveValue("18");
  for (const text of ["abc", "1e2", "1.5", "-1", "18 personas"]) {
    await guests.evaluate((el, value) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", value);
      const event = new ClipboardEvent("paste", {
        clipboardData,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
      if (!event.defaultPrevented) el.setRangeText(value);
    }, text);
    await expect(guests).toHaveValue("18");
    // Covers input events from autofill/IME paths that bypass key filtering.
    await guests.fill(text);
    await expect(guests).toHaveValue("18");
  }
  const pasteCancelled = await guests.evaluate((el) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", "25");
    const event = new ClipboardEvent("paste", {
      clipboardData,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
    if (!event.defaultPrevented) {
      el.setSelectionRange(0, el.value.length);
      el.setRangeText("25");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return event.defaultPrevented;
  });
  expect(pasteCancelled).toBe(false);
  await expect(guests).toHaveValue("25");
  await guests.press("ArrowUp");
  await guests.press("ArrowDown");
  await expect(guests).toHaveValue("25");
  await guests.press("Home");
  await guests.press("Delete");
  await expect(guests).toHaveValue("5");
  await guests.press("End");
  await guests.press("Backspace");
  await expect(guests).toHaveValue("");
  await guests.pressSequentially("18");
  await expect(guests).toHaveValue("18");
});

test("cantidad visible, teclado y foco a 360, 390, 768 y 1440 px", async ({
  page,
}, info) => {
  await page.goto("/?guests=18");
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const guests = page.getByRole("textbox", {
      name: "Personas",
      exact: true,
    });
    await guests.scrollIntoViewIfNeeded();
    await guests.focus();
    await guests.press("ArrowUp");
    await expect(guests).toHaveValue("18");
    await guests.press("ArrowDown");
    await expect(guests).toHaveValue("18");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(guests).toBeFocused();
    const geometry = await guests.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        outline: css.outlineStyle,
        outlineWidth: css.outlineWidth,
      };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(width);
    expect(geometry.width).toBeGreaterThan(40);
    expect(geometry.height).toBeGreaterThan(20);
    expect(geometry.outline).not.toBe("none");
    await page.screenshot({
      path: `.local/t04/${info.project.name}-${width}.png`,
      fullPage: true,
    });
  }
});
