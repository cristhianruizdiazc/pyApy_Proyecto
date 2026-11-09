import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

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

// Entire API is simulated: no requests reach the development database.
async function mockApi(
  page,
  { empty = false, role = "client", expired = false, saved = false } = {},
) {
  let user = expired ? { id: "test-user", name: "Prueba", role } : null;
  let expires = expired;
  const writes = [];
  const requests = [];
  let failLogin = false;
  let saveStatus = 200;
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    requests.push(path);
    let json = { items: [] };
    if (req.method() !== "GET")
      writes.push({ path, method: req.method(), body: req.postDataJSON() });
    if (
      (path === "/search-intents" || path.startsWith("/favorites/")) &&
      saveStatus !== 200
    )
      return route.fulfill({
        status: saveStatus,
        json: { message: "No pudimos guardar. Intentá de nuevo." },
      });
    if (["/auth/login", "/auth/register"].includes(path)) {
      if (failLogin)
        return route.fulfill({
          status: 401,
          json: { message: "Credenciales incorrectas" },
        });
      user = { id: "test-user", name: "Prueba", role };
      expires = false;
      json = { user, csrfToken: "test-csrf" };
    } else if (path === "/auth/session") json = { user };
    else if (expires && ["/reservations", "/reservations/quote"].includes(path))
      return route.fulfill({
        status: 401,
        json: { message: "Sesión vencida" },
      });
    else if (path === "/catalog")
      json = { cities: [{ id: 1, city: "Aregua" }], amenities: [], plans: [] };
    else if (path === "/favorites")
      json = { items: saved ? [properties[0]] : [] };
    else if (path.endsWith("/availability")) json = { intervals: [] };
    else if (/^\/properties\/[^/]+$/.test(path))
      json = properties.find((p) => path.endsWith(p.id));
    else if (path === "/properties")
      json = {
        items: empty ? [] : properties,
        total: empty ? 0 : 42,
        alternatives: [],
        otherDates: [],
      };
    else if (path === "/owner/metrics")
      json = { properties: 0, bookings: 0, revenue: 0, views: 0, favorites: 0 };
    else if (path === "/reservations/quote")
      json = {
        currency: "PYG",
        hours: 24,
        totalAmount: 240000,
        cancellationHours: 24,
      };
    await route.fulfill({ json });
  });
  return {
    writes,
    requests,
    saveStatus: (status) => {
      saveStatus = status;
    },
    failLogin: (value) => {
      failLogin = value;
    },
  };
}
async function login(page) {
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("password-test-123");
  await page
    .locator("form")
    .getByRole("button", { name: "Ingresar", exact: true })
    .click();
}
const mutations = (writes) =>
  writes.filter(
    (w) =>
      w.path === "/search-intents" ||
      w.path.startsWith("/favorites/") ||
      w.path === "/reservations" ||
      w.path === "/owner-profile",
  );

test("interés conserva todos los filtros, sobrevive recarga y exige confirmación", async ({
  page,
}) => {
  const { writes } = await mockApi(page, { empty: true });
  await page.goto(origin);
  await page.getByRole("button", { name: "Guardar mi interés" }).click();
  await expect(page.getByRole("status")).toContainText("Confirmá");
  await page.reload();
  await login(page);
  await expect(page).toHaveURL(origin);
  expect(mutations(writes)).toHaveLength(0);
  await page.getByRole("button", { name: "Confirmar interés" }).click();
  await expect(page.locator(".auth-continuation[role='status']")).toContainText(
    "Guardamos tu interés",
  );
  expect(mutations(writes)).toEqual([
    {
      path: "/search-intents",
      method: "POST",
      body: Object.fromEntries(filters),
    },
  ]);
  await page.reload();
  expect(mutations(writes)).toHaveLength(1);
});

for (const confirm of [false, true]) {
  test(`favorito vuelve a filtros y ${confirm ? "confirma" : "descarta"} sin escritura previa`, async ({
    page,
  }, testInfo) => {
    const { writes } = await mockApi(page);
    await page.goto(origin);
    await page
      .locator("#results")
      .getByRole("button", { name: "Guardar favorito" })
      .first()
      .click();
    await login(page);
    await expect(page).toHaveURL(origin);
    expect(mutations(writes)).toHaveLength(0);
    const banner = page.getByRole("region", { name: "Continuar tu tarea" });
    await expect(banner).toBeInViewport();
    await expect(banner).toBeFocused();
    if (confirm) {
      await mkdir(".local/t08", { recursive: true });
      await page.screenshot({
        path: `.local/t08/favorite-${testInfo.project.name}.png`,
      });
      await page.getByRole("link", { name: "Ver espacio pendiente" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        properties[0].name,
      );
      await page.getByRole("button", { name: "Confirmar favorito" }).click();
      await expect(
        page.locator(".auth-continuation[role='status']"),
      ).toContainText("Espacio guardado");
      expect(mutations(writes)).toEqual([
        { path: `/favorites/${properties[0].id}`, method: "PUT", body: null },
      ]);
    } else {
      await page.getByRole("button", { name: "Ahora no" }).click();
      await expect(
        page.getByRole("button", { name: "Confirmar favorito" }),
      ).toHaveCount(0);
      expect(mutations(writes)).toHaveLength(0);
    }
  });
}

for (const destination of [
  "/reservas?status=confirmed#lista",
  "/favoritos",
  "/cuenta",
]) {
  test(`acceso privado retorna a ${destination} con registro o ingreso`, async ({
    page,
  }) => {
    const { writes } = await mockApi(page);
    await page.goto(destination);
    await page
      .getByRole("link", { name: "Ingresar", exact: true })
      .last()
      .click();
    if (destination === "/cuenta") {
      await page
        .getByRole("button", { name: "Crear cuenta", exact: true })
        .click();
      await page.getByLabel("Nombre", { exact: true }).fill("Prueba");
      await page.getByLabel("Email", { exact: true }).fill("test@example.com");
      await page
        .getByLabel("Contraseña", { exact: true })
        .fill("password-test-123");
      await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    } else await login(page);
    await expect(page).toHaveURL(destination);
    expect(mutations(writes)).toHaveLength(0);
  });
}

for (const role of ["client", "owner", "admin"]) {
  test(`publicación respeta rol ${role} sin alta automática`, async ({
    page,
    isMobile,
  }) => {
    const { writes, requests } = await mockApi(page, { role });
    await page.goto("/");
    if (isMobile) {
      await page.getByRole("button", { name: "Abrir men\u00fa" }).click();
      await page.locator(".mobile-host-link").click();
    } else await page.locator(".header-actions .host-link").click();
    await login(page);
    await expect(page).toHaveURL("/propietario");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      role === "client" ? "Sumate como propietario." : "Mi espacio",
    );
    expect(mutations(writes)).toHaveLength(0);
    if (role === "client")
      expect(requests.some((path) => path.startsWith("/owner/"))).toBe(false);
  });
}

test("reserva conserva selección editada y origen; no cotiza ni confirma al ingresar", async ({
  page,
}) => {
  const { writes } = await mockApi(page);
  await page.goto(origin);
  await page.locator("#results .card-title").first().click();
  const panel = page.locator(".booking-panel");
  await panel.getByLabel("Personas", { exact: true }).fill("19");
  await panel.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await login(page);
  await expect(panel.getByLabel("Personas", { exact: true })).toHaveValue("19");
  await expect(
    panel.getByLabel("Fecha de entrada", { exact: true }),
  ).toHaveValue("2030-01-10");
  await expect(
    page.getByRole("link", { name: "Volver a resultados" }),
  ).toHaveAttribute("href", origin);
  expect(writes.some((w) => w.path.startsWith("/reservations"))).toBe(false);
  await panel.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await expect(panel.getByRole("button", { name: /Confirmar/ })).toBeVisible();
  expect(
    writes.filter((w) => w.path === "/reservations/quote")[0].body.guests,
  ).toBe(19);
  expect(mutations(writes)).toHaveLength(0);
});

test("sesión vencida en reservas ofrece ingreso con destino y sin bucles", async ({
  page,
}) => {
  const { writes } = await mockApi(page, { expired: true });
  await page.goto("/reservas?status=confirmed");
  await page
    .getByRole("link", { name: "Ingresar", exact: true })
    .last()
    .click();
  await login(page);
  await expect(page).toHaveURL("/reservas?status=confirmed");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Mis reservas",
  );
  expect(mutations(writes)).toHaveLength(0);
});

test("sesión vencida al cotizar conserva borrador y requiere nueva consulta", async ({
  page,
}) => {
  const { writes } = await mockApi(page, { expired: true });
  await page.goto(`/espacios/${properties[0].id}?${filters}`);
  const panel = page.locator(".booking-panel");
  await panel.getByLabel("Personas", { exact: true }).fill("21");
  await panel.getByRole("button", { name: "Consultar disponibilidad" }).click();
  await login(page);
  await expect(panel.getByLabel("Personas", { exact: true })).toHaveValue("21");
  expect(writes.filter((w) => w.path === "/reservations/quote")).toHaveLength(
    1,
  );
  expect(mutations(writes)).toHaveLength(0);
});

test("error de ingreso permite reintentar con destino intacto y atrás no vuelve a login", async ({
  page,
}) => {
  const api = await mockApi(page);
  api.failLogin(true);
  await page.goto(origin);
  await page.locator(".login-link").click();
  await login(page);
  await expect(page.getByRole("alert")).toContainText(
    "Credenciales incorrectas",
  );
  api.failLogin(false);
  await login(page);
  await expect(page).toHaveURL(origin);
  await page.goBack();
  await expect(page).toHaveURL(origin);
});

for (const status of [401, 503]) {
  test(`confirmación rechazada con ${status} conserva tarea para reintento explícito`, async ({
    page,
  }) => {
    const api = await mockApi(page, { empty: true });
    await page.goto(origin);
    await page.getByRole("button", { name: "Guardar mi interés" }).click();
    await login(page);
    api.saveStatus(status);
    await page.getByRole("button", { name: "Confirmar interés" }).click();
    if (status === 401) {
      await expect(page).toHaveURL("/ingresar");
      api.saveStatus(200);
      await login(page);
    } else {
      await expect(page.getByRole("alert")).toContainText("No pudimos guardar");
      api.saveStatus(200);
    }
    await expect(page).toHaveURL(origin);
    expect(mutations(api.writes)).toHaveLength(1);
    await page.getByRole("button", { name: "Confirmar interés" }).click();
    await expect(
      page.locator(".auth-continuation[role='status']"),
    ).toContainText("Guardamos tu interés");
    expect(mutations(api.writes)).toHaveLength(2);
  });
}

test("sesión vencida al quitar favorito conserva la operación original", async ({
  page,
}) => {
  const api = await mockApi(page, { expired: true, saved: true });
  api.saveStatus(401);
  await page.goto(origin);
  await page
    .locator("#results")
    .getByRole("button", { name: "Quitar de favoritos" })
    .click();
  await expect(page).toHaveURL("/ingresar");
  api.saveStatus(200);
  await login(page);
  expect(mutations(api.writes)).toHaveLength(1);
  await page.getByRole("button", { name: "Confirmar quitar favorito" }).click();
  await expect(page.locator(".auth-continuation[role='status']")).toContainText(
    "Espacio quitado",
  );
  expect(mutations(api.writes).map((write) => write.method)).toEqual([
    "DELETE",
    "DELETE",
  ]);
});

test("retornos maliciosos y login recursivo usan raíz segura", async ({
  page,
}) => {
  await mockApi(page);
  for (const from of [
    "https://example.com",
    "//example.com",
    "/ingresar",
    "/ingresar?from=/ingresar",
    "/\\example.com",
    "/%2f%2fexample.com",
    "/foo/../ingresar",
  ]) {
    await page.goto("/ingresar");
    await page.evaluate(
      (from) => history.replaceState({ usr: { from } }, ""),
      from,
    );
    await page.reload();
    await login(page);
    await expect(page).toHaveURL("/");
  }
});
