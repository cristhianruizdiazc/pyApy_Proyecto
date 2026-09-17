import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
test("marketplace carga fotos, filtra, abre mapa y no desborda", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Un lugar para cada plan." }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page
        .locator(".hero-image.visible")
        .evaluate((img) => img.complete && img.naturalWidth > 500),
    )
    .toBeTruthy();
  await expect
    .poll(() =>
      page
        .locator(".rail-item:not([aria-hidden]) .card-image img")
        .first()
        .evaluate((img) => img.complete && img.naturalWidth > 100),
    )
    .toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await mkdir(".local/screenshots", { recursive: true });
  await page.screenshot({
    path: `.local/screenshots/home-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Espacios siguientes" }).click();
  await page.getByRole("button", { name: "Espacios anteriores" }).click();
  await page.getByRole("button", { name: "Explorar el mapa" }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".leaflet-interactive").first()).toBeVisible();
  await page.locator('select[name="city"]').selectOption({ label: "Aregua" });
  await page.getByLabel("Cantidad de personas").fill("2");
  await page.getByRole("button", { name: "Buscar espacios" }).click();
  await expect(page.getByRole("heading", { name: /1 espacios/ })).toBeVisible();
  await page.getByRole("link", { name: "Casa del Lago", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Casa del Lago", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Consultar disponibilidad" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `.local/screenshots/detail-${info.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("cliente crea cuenta, guarda favorito, reserva y cancela con backend real", async ({
  page,
  request,
}, info) => {
  const accounts = JSON.parse(
    await readFile(".local/demo-accounts.json", "utf8"),
  );
  const auth = await request.post("/api/v1/auth/login", {
    headers: { "X-Client": "mobile" },
    data: accounts.owner,
  });
  expect(auth.ok()).toBeTruthy();
  const { token } = await auth.json();
  const headers = { Authorization: `Bearer ${token}` };
  const catalog = await (await request.get("/api/v1/catalog")).json();
  const input = {
    name: `E2E ${randomUUID().slice(0, 8)}`,
    description:
      "Propiedad temporal para verificar el flujo completo de reservas.",
    cityId: catalog.cities[0].id,
    zone: "Pruebas",
    kind: "Quinta",
    capacity: 8,
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
    rules: "",
  };
  const created = await request.post("/api/v1/properties", {
    headers,
    data: input,
  });
  expect(created.status()).toBe(201);
  const p = await created.json();
  try {
    await page.goto("/ingresar");
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    await page
      .getByLabel("Nombre", { exact: true })
      .fill(`Cliente ${info.project.name}`);
    await page
      .getByLabel("Email", { exact: true })
      .fill(`e2e-${randomUUID()}@example.invalid`);
    await page
      .getByLabel("Contrasena", { exact: true })
      .fill("Browser-testing-password-123");
    await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    await expect(page).toHaveURL("/");
    await page
      .getByRole("button", { name: "Guardar favorito" })
      .first()
      .click();
    await page.goto("/favoritos");
    await expect(page.locator(".property-card")).toHaveCount(1);
    await page.goto(`/espacios/${p.id}`);
    await expect(
      page.getByRole("heading", { name: p.name, exact: true }),
    ).toBeVisible();
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const formatted = date.toLocaleDateString("en-CA");
    await page.getByLabel("Fecha de entrada", { exact: true }).fill(formatted);
    await page.getByLabel("Personas", { exact: true }).fill("3");
    await page
      .getByRole("button", { name: "Consultar disponibilidad" })
      .click();
    await expect(page.locator(".quote")).toContainText("80.000");
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect(
      page.getByRole("heading", { name: "Tu escapada esta confirmada." }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Ver mi reserva" }).click();
    await expect(page.locator(".reservation-row")).toContainText(p.name);
    await page
      .getByRole("button", { name: `Cancelar reserva en ${p.name}` })
      .click();
    await page
      .getByRole("button", { name: "Cancelar reserva", exact: true })
      .click();
    await expect(page.locator(".reservation-row")).toContainText("Cancelada");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  } finally {
    await request.put(`/api/v1/properties/${p.id}`, {
      headers,
      data: { ...input, status: "draft" },
    });
  }
});
test("paneles autorizados muestran datos y calendario", async ({
  page,
}, info) => {
  const accounts = JSON.parse(
    await readFile(".local/demo-accounts.json", "utf8"),
  );
  for (const role of ["owner", "admin"]) {
    await page.context().clearCookies();
    await page.goto("/ingresar");
    await page.getByLabel("Email", { exact: true }).fill(accounts[role].email);
    await page
      .getByLabel("Contrasena", { exact: true })
      .fill(accounts[role].password);
    await page
      .locator("form")
      .getByRole("button", { name: "Ingresar", exact: true })
      .click();
    await expect(page).toHaveURL("/");
    await page.goto(role === "owner" ? "/propietario" : "/admin");
    await expect(page.locator(".metrics-strip")).toBeVisible();
    if (role === "owner") {
      await page.getByRole("tab", { name: "Calendario" }).click();
      await expect(page.locator(".calendar-grid")).toBeVisible();
    } else {
      await page.getByRole("tab", { name: "Usuarios", exact: true }).click();
      await expect(page.locator("table")).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `.local/screenshots/${role}-${info.project.name}.png`,
      fullPage: true,
    });
  }
});
