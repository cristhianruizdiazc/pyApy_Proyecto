import { test as base, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { localInterval } from "../../packages/contracts/index.mjs";

function futureDay() {
  const date = new Date();
  date.setDate(date.getDate() + 60);
  return date.toISOString().slice(0, 10);
}
const test = base.extend({
  sharedAuth: [
    async ({ playwright }, use, workerInfo) => {
      const request = await playwright.request.newContext({
        baseURL: workerInfo.project.use.baseURL,
      });
      try {
        const accounts = JSON.parse(
          await readFile(".local/demo-accounts.json", "utf8"),
        );
        const auth = await request.post("/api/v1/auth/login", {
          headers: { "X-Client": "mobile" },
          data: accounts.owner,
        });
        expect(auth.ok()).toBeTruthy();
        const { token } = await auth.json();
        const registered = await request.post("/api/v1/auth/register", {
          data: {
            name: "Cliente de prueba de detalle",
            email: `detail-${randomUUID()}@example.invalid`,
            password: "Detalle-testing-password-123",
          },
        });
        expect(registered.status()).toBe(201);
        const { cookies } = await request.storageState();
        // Reuse auth only inside this worker, in memory; each test gets its own context and property.
        await use({ headers: { Authorization: `Bearer ${token}` }, cookies });
      } finally {
        await request.dispose();
      }
    },
    { scope: "worker" },
  ],
  space: async ({ page, sharedAuth }, use) => {
    await page.context().addCookies(sharedAuth.cookies);
    const request = page.request;
    const headers = sharedAuth.headers;
    const catalog = await (await request.get("/api/v1/catalog")).json();
    const input = {
      name: `Detalle E2E ${randomUUID().slice(0, 8)}`,
      description:
        "Espacio ficticio creado para verificar selección, cotización y reserva real.",
      cityId: catalog.cities[0].id,
      zone: "Pruebas",
      kind: "Quinta",
      capacity: 10,
      pricePerHour: 10000,
      minHours: 2,
      maxHours: 24,
      openHour: 0,
      closeHour: 24,
      cancellationHours: 24,
      amenities: ["pool"],
      latitude: -25.3,
      longitude: -57.3,
      status: "published",
      rules: "Respetá el horario acordado.",
    };
    const response = await request.post("/api/v1/properties", {
      headers,
      data: input,
    });
    expect(response.status()).toBe(201);
    const p = await response.json();
    try {
      await use({ p, input, headers });
    } finally {
      const reservations = await (
        await request.get("/api/v1/owner/reservations", { headers })
      ).json();
      for (const r of reservations.items || []) {
        if (r.propertyId === p.id && r.status === "confirmed")
          await request.post(`/api/v1/reservations/${r.id}/cancel`, {
            headers,
            data: {},
          });
      }
      await request.put(`/api/v1/properties/${p.id}`, {
        headers,
        data: { ...input, status: "draft" },
      });
    }
  },
});

test("el mapa de ficha se descarga solo al solicitarlo", async ({ page, space }) => {
  await page.goto(`/espacios/${space.p.id}`);
  await expect(
    page.getByRole("heading", { name: space.p.name, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".detail-info .property-map")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver mapa aproximado" }).click();
  await expect(page.locator(".detail-info .property-map")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ocultar mapa" })).toBeVisible();
});

async function openForQuote(page, p) {
  await page.goto(`/espacios/${p.id}`);
  await expect(
    page.getByRole("heading", { name: p.name, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Fecha de entrada", { exact: true }).fill(futureDay());
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(page.locator(".quote")).toContainText("80.000");
}

test("búsqueda lleva fecha y personas a la ficha y las conserva al registrarse", async ({
  page,
}) => {
  const interval = localInterval(futureDay(), "10:00", "16:00");
  await page.goto(
    `/?${new URLSearchParams({ city: "Aregua", guests: "3", ...interval })}`,
  );
  await page.getByRole("link", { name: "Casa del Lago", exact: true }).click();
  await expect(
    page.getByLabel("Fecha de entrada", { exact: true }),
  ).toHaveValue(futureDay());
  await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("10:00");
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("16:00");
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("3");
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(page).toHaveURL("/ingresar");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Cliente selección");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`selection-${randomUUID()}@example.invalid`);
  await page
    .getByLabel("Contrasena", { exact: true })
    .fill("Seleccion-testing-password-123");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL(/\/espacios\/.+startsAt=/);
  await expect(page.getByLabel("Desde", { exact: true })).toHaveValue("10:00");
  await expect(page.getByLabel("Hasta", { exact: true })).toHaveValue("16:00");
  await expect(page.getByLabel("Personas", { exact: true })).toHaveValue("3");
});

test("respuesta tardía no restaura cotización después de editar personas", async ({
  page,
  space,
}) => {
  let held,
    heldResponse,
    count = 0;
  await page.route("**/api/v1/reservations/quote", async (route) => {
    count += 1;
    if (count === 1) {
      heldResponse = await route.fetch();
      held = route;
    } else await route.continue();
  });
  await page.goto(`/espacios/${space.p.id}`);
  await page.getByLabel("Fecha de entrada", { exact: true }).fill(futureDay());
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect.poll(() => Boolean(held)).toBeTruthy();
  await page.getByLabel("Personas", { exact: true }).fill("4");
  await expect(page.locator(".quote")).toHaveCount(0);
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(page.locator(".quote .stay-summary")).toContainText("Personas4");
  await held.fulfill({ response: heldResponse });
  await expect(page.locator(".quote .stay-summary")).toContainText("Personas4");
  await page.getByLabel("Hasta", { exact: true }).fill("18:00");
  await expect(
    page.getByRole("button", { name: "Confirmar reserva" }),
  ).toHaveCount(0);
  await page.route("**/api/v1/reservations/quote", (route) =>
    route.fulfill({ json: {} }),
  );
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "No pudimos leer la cotización",
  );
  await expect(page.locator(".quote")).toHaveCount(0);
});

test("cambiar de propiedad descarta cotización y respuesta anterior", async ({
  page,
  space,
}) => {
  const list = await (
    await page.request.get("/api/v1/properties?city=Aregua")
  ).json();
  const other = list.items.find((p) => p.id !== space.p.id);
  expect(other).toBeTruthy();
  await page.route(/\/api\/v1\/properties$/, (route) =>
    route.fulfill({
      json: { items: [other], alternatives: [], otherDates: [], total: 1 },
    }),
  );
  await openForQuote(page, space.p);
  await page
    .locator(".similar")
    .getByRole("link", { name: other.name, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: other.name, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".quote")).toHaveCount(0);
  await expect(
    page.getByLabel("Fecha de entrada", { exact: true }),
  ).toHaveValue("");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: space.p.name, exact: true }),
  ).toBeVisible();
  let held, response;
  await page.route("**/api/v1/reservations/quote", async (route) => {
    response = await route.fetch();
    held = route;
  });
  await page.getByLabel("Fecha de entrada", { exact: true }).fill(futureDay());
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect.poll(() => Boolean(held)).toBeTruthy();
  await page
    .locator(".similar")
    .getByRole("link", { name: other.name, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: other.name, exact: true }),
  ).toBeVisible();
  await held.fulfill({ response });
  await expect(page.locator(".quote")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Confirmar reserva" }),
  ).toHaveCount(0);
});

test("ocupación posterior a cotización muestra conflicto real y permite cambiar horario", async ({
  page,
  space,
}) => {
  await openForQuote(page, space.p);
  const blocked = await page.request.post("/api/v1/owner/occupancies", {
    headers: { ...space.headers, "Idempotency-Key": randomUUID() },
    data: {
      propertyId: space.p.id,
      ...localInterval(futureDay(), "09:00", "17:00"),
      guests: 1,
      kind: "block",
      note: "Prueba de conflicto posterior a cotización",
    },
  });
  expect(blocked.status()).toBe(201);
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Ese horario acaba de ocuparse",
  );
  await expect(page.locator(".quote")).toHaveCount(0);
  await expect(page.locator(".booking-success")).toHaveCount(0);
  await expect(page.getByLabel("Desde", { exact: true })).toBeEnabled();
  await page.getByLabel("Desde", { exact: true }).fill("18:00");
  await page.getByLabel("Hasta", { exact: true }).fill("20:00");
  await page.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(page.locator(".quote")).toContainText("20.000");
});

test("respuesta perdida y recarga reintentan el mismo UUID sin duplicar la reserva", async ({
  page,
  space,
}) => {
  const attempts = [];
  let replayed;
  await page.route(/\/api\/v1\/reservations$/, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    attempts.push({
      key: route.request().headers()["idempotency-key"],
      body: route.request().postDataJSON(),
    });
    const response = await route.fetch();
    expect(response.ok()).toBeTruthy();
    if (attempts.length === 1) await route.abort("connectionfailed");
    else if (attempts.length === 2)
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{",
      });
    else {
      replayed = (await response.json()).replayed;
      await route.fulfill({ response });
    }
  });
  await openForQuote(page, space.p);
  await page
    .getByRole("button", { name: "Confirmar reserva" })
    .evaluate((button) => {
      button.click();
      button.click();
    });
  await expect(
    page.getByRole("button", { name: "Reintentar confirmación" }),
  ).toBeVisible();
  expect(attempts).toHaveLength(1);
  await expect(page.getByLabel("Personas", { exact: true })).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Reintentar confirmación" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar reserva", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reintentar confirmación" }).click();
  await expect(
    page.getByRole("button", { name: "Reintentar confirmación" }),
  ).toBeEnabled();
  await expect(page.locator(".booking-success")).toHaveCount(0);
  expect(attempts).toHaveLength(2);
  await page.getByRole("button", { name: "Reintentar confirmación" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu escapada está confirmada." }),
  ).toBeVisible();
  expect(attempts).toHaveLength(3);
  expect(attempts[1]).toEqual(attempts[0]);
  expect(attempts[2]).toEqual(attempts[0]);
  expect(replayed).toBe(true);
  const reservations = await (
    await page.request.get("/api/v1/reservations")
  ).json();
  expect(
    reservations.items.filter((r) => r.propertyId === space.p.id),
  ).toHaveLength(1);
  expect(
    await page.evaluate(
      (id) =>
        Object.keys(sessionStorage).some(
          (key) => key.startsWith("pyapy:booking-attempt:") && key.endsWith(id),
        ),
      space.p.id,
    ),
  ).toBe(false);
});

test("confirmación muestra importe recalculado por backend y congela datos durante envío", async ({
  page,
  space,
}) => {
  await openForQuote(page, space.p);
  const edited = await page.request.put(`/api/v1/properties/${space.p.id}`, {
    headers: space.headers,
    data: { ...space.input, pricePerHour: 12000 },
  });
  expect(edited.ok()).toBeTruthy();
  let held, response;
  await page.route(/\/api\/v1\/reservations$/, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    response = await route.fetch();
    held = route;
  });
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect.poll(() => Boolean(held)).toBeTruthy();
  await expect(
    page.getByLabel("Fecha de entrada", { exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Personas", { exact: true })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Reservando...", exact: true }),
  ).toBeDisabled();
  await held.fulfill({ response });
  await expect(page.locator(".booking-success")).toContainText("96.000");
  await expect(page.locator(".booking-success")).toContainText(space.p.name);
  await expect(page.locator(".booking-success .stay-summary")).toContainText(
    "Personas2",
  );
});

test("galería accesible y error de fechas sin falsa disponibilidad", async ({
  page,
  space,
}, info) => {
  const detail = await (
    await page.request.get(`/api/v1/properties/${space.p.id}`)
  ).json();
  await page.route(`**/api/v1/properties/${space.p.id}`, (route) =>
    route.fulfill({
      json: {
        ...detail,
        images: [
          { id: "one", url: "/demo/pool.jpg", alt: "Piscina de prueba" },
          {
            id: "two",
            url: "/missing-gallery-photo.jpg",
            alt: "Jardín de prueba",
          },
          { id: "three", url: "/demo/house.jpg", alt: "Casa de prueba" },
        ],
      },
    }),
  );
  await page.route("**/missing-gallery-photo.jpg", (route) => route.abort());
  let failed = true;
  await page.route(
    `**/api/v1/properties/${space.p.id}/availability`,
    (route) =>
      failed
        ? route.fulfill({
            status: 503,
            json: { message: "No se pudo consultar la ocupación" },
          })
        : route.continue(),
  );
  await page.goto(`/espacios/${space.p.id}`);
  const open = page.getByRole("button", {
    name: `Ver todas las fotos de ${space.p.name}`,
  });
  await open.click();
  const dialog = page.getByRole("dialog", { name: `Fotos de ${space.p.name}` });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(dialog.locator(".gallery-full-image")).toHaveAttribute(
    "aria-label",
    "Imagen no disponible: Jardín de prueba",
  );
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("status")).toHaveText("Foto 3 de 3");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.locator(".occupied-dates summary").click();
  await expect(
    page.getByRole("button", { name: "Reintentar fechas ocupadas" }),
  ).toBeVisible();
  await expect(page.getByText(/Sin ocupaciones registradas/)).toHaveCount(0);
  failed = false;
  await page
    .getByRole("button", { name: "Reintentar fechas ocupadas" })
    .click();
  await expect(
    page.getByText("Sin ocupaciones registradas en el período consultado."),
  ).toBeVisible();
  if (info.project.name === "desktop") {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: info.outputPath(`detalle-${width}.png`),
        fullPage: true,
      });
    }
  }
});
