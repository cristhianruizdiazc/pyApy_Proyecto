import { test, expect } from "@playwright/test";

const id = "00000000-0000-4000-8000-000000000001";
const property = {
  id,
  name: "Espacio QA T02",
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
          name: "QA T02",
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

test("search controls expose their visible labels, including expanded and conditional filters", async ({
  page,
}) => {
  // Unknown selected amenities are rendered as conditional controls too.
  await page.goto("/?amenities=custom");
  const form = page.locator(".search-form");
  await form.getByRole("button", { name: "Más filtros" }).click();
  await expect(
    form.getByRole("button", { name: "Buscar espacios" }),
  ).toHaveAccessibleName("Buscar espacios");
  await expect(
    form.getByRole("button", { name: "Más filtros" }),
  ).toHaveAccessibleName("Más filtros");
  for (const name of [
    "Todos",
    "Quintas",
    "Piscinas",
    "Casas",
    "Quinchos",
    "Bungalows",
  ])
    await expect(
      page
        .getByRole("group", { name: "Categorías" })
        .getByRole("button", { name, exact: true }),
    ).toHaveAccessibleName(name);
  const controls = [];
  for (const name of [
    "Zona / Ciudad",
    "Fecha de entrada",
    "Horario / Turno",
    "Personas",
    "Presupuesto máx.",
    "Desde",
    "Hasta",
    "Presupuesto total (Gs.)",
    "Tipo",
    "Mantener estrictamente la ciudad",
    "Mantener estrictamente el presupuesto",
    "Piscina indispensable",
    "custom indispensable",
    "Piscina",
    "custom",
  ]) {
    const control = [
      "Zona / Ciudad",
      "Horario / Turno",
      "Presupuesto máx.",
      "Tipo",
    ].includes(name)
      ? form.getByRole("combobox", { name, exact: true })
      : form.getByLabel(name, { exact: true });
    await expect(control).toBeVisible();
    await expect(control).toHaveAccessibleName(name);
    controls.push(await control.getAttribute("id"));
  }
  const associations = await form.locator("input,select").evaluateAll((els) =>
    els.map((el) => {
      const labelledBy = el.getAttribute("aria-labelledby");
      return {
        native: [...el.labels].some((label) => label.control === el),
        labelledBy: labelledBy
          ? labelledBy.split(/\s+/).every((id) => document.getElementById(id))
          : false,
      };
    }),
  );
  expect(associations.every((a) => a.native || a.labelledBy)).toBe(true);
  expect(
    await page.locator("[id]").evaluateAll((els) => {
      const ids = els.map((el) => el.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    }),
  ).toEqual([]);

  await form
    .getByRole("combobox", { name: "Zona / Ciudad", exact: true })
    .focus();
  const keyboardOrder = [];
  for (let index = 0; index < 100; index += 1) {
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        id: el.id,
        text: el.textContent.trim(),
        tag: el.tagName,
      };
    });
    if (active.id) keyboardOrder.push(active.id);
    if (active.tag === "BUTTON" && active.text === "Todos") break;
    await page.keyboard.press("Tab");
  }
  for (const controlId of controls) expect(keyboardOrder).toContain(controlId);
  await form.getByRole("button", { name: "Más filtros" }).focus();
  await page.keyboard.press("Enter");
  await expect(form.getByLabel("Personas", { exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(form.locator('[name="guests"]')).toHaveCount(1);
  const strict = form.getByLabel("Mantener estrictamente la ciudad");
  await strict.focus();
  await page.keyboard.press("Space");
  await expect(strict).toBeChecked();
  const shift = form.getByLabel("Horario / Turno");
  await shift.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(shift).toHaveValue("day");
});

for (const scenario of [
  {
    name: "full day",
    shift: "full",
    endsAt: "2030-01-11T12:00:00.000Z",
    endDate: "2030-01-11",
  },
  {
    name: "daytime",
    shift: "day",
    endsAt: "2030-01-10T20:00:00.000Z",
    endDate: "",
  },
]) {
  test(`search date is arrival and checkout is the end of ${scenario.name}`, async ({
    page,
  }) => {
    await page.goto("/");
    const form = page.locator(".search-form");
    await form
      .getByLabel("Fecha de entrada", { exact: true })
      .fill("2030-01-10");
    await form.getByLabel("Horario / Turno").selectOption(scenario.shift);
    await form.getByLabel("Personas", { exact: true }).fill("4");
    const searchPromise = page.waitForRequest(
      (r) =>
        r.url().includes("/api/v1/properties?") &&
        new URL(r.url()).searchParams.has("startsAt"),
    );
    await form.getByRole("button", { name: "Buscar espacios" }).click();
    const params = new URL((await searchPromise).url()).searchParams;
    const expected = {
      startsAt: "2030-01-10T12:00:00.000Z",
      endsAt: scenario.endsAt,
    };
    expect(params.get("startsAt")).toBe(expected.startsAt);
    expect(params.get("endsAt")).toBe(expected.endsAt);
    await page.locator("#results .card-title").first().click();
    const booking = page.locator(".booking-panel");
    await expect(
      booking.getByLabel("Fecha de entrada", { exact: true }),
    ).toHaveValue("2030-01-10");
    await expect(
      booking.getByLabel("Fecha de salida", { exact: true }),
    ).toHaveValue(scenario.endDate);
    const quotePromise = page.waitForRequest("**/api/v1/reservations/quote");
    await booking
      .getByRole("button", { name: "Consultar disponibilidad" })
      .click();
    expect((await quotePromise).postDataJSON()).toEqual({
      propertyId: id,
      guests: 4,
      ...expected,
    });
    await expect(
      booking.locator(".quote .stay-summary > div").nth(0),
    ).toContainText("Entrada");
    await expect(
      booking.locator(".quote .stay-summary > div").nth(0),
    ).toContainText("10 ene");
    await expect(
      booking.locator(".quote .stay-summary > div").nth(1),
    ).toContainText("Salida");
    await expect(
      booking.locator(".quote .stay-summary > div").nth(1),
    ).toContainText(scenario.endDate ? "11 ene" : "10 ene");
  });
}
