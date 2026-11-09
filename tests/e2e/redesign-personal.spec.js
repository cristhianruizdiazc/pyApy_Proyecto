import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  mockPersonalApi,
  accountUser,
  savedProperties,
  personalReservations,
} from "./fixtures/personal-area.js";

async function login(page) {
  await page.getByLabel("Email", { exact: true }).fill(accountUser.email);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("Personal-testing-password-123");
  await page
    .locator("form")
    .getByRole("button", { name: "Ingresar", exact: true })
    .click();
}
async function scan(page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}

test("modos de acceso conservan destino y datos sin envíos al cambiar o recargar", async ({
  page,
}) => {
  const state = await mockPersonalApi(page, { user: null });
  await page.goto("/ingresar?mode=registro");
  await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();
  await page.reload();
  await page.evaluate(() =>
    history.replaceState(
      { usr: { from: "/cuenta?avisos=todos#notificaciones" } },
      "",
    ),
  );
  await page.reload();
  await page.getByLabel("Email", { exact: true }).fill(accountUser.email);
  const modes = page.getByRole("group", { name: "Elegir acceso" });
  await modes.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL("/ingresar");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    accountUser.email,
  );
  await modes
    .getByRole("button", { name: "Crear cuenta", exact: true })
    .click();
  await expect(page).toHaveURL("/ingresar?mode=registro");
  await expect(
    modes.getByRole("button", { name: "Crear cuenta", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(state.writes).toEqual([]);
  await scan(page);
  await page.getByLabel("Nombre", { exact: true }).fill(accountUser.name);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("Personal-testing-password-123");
  await page
    .getByRole("button", { name: "Crear mi cuenta", exact: true })
    .click();
  await expect(page).toHaveURL("/cuenta?avisos=todos#notificaciones");
  expect(state.writes.map((w) => w.path)).toEqual(["/auth/register"]);
});

test("acceso pendiente congela campos y modo, rechaza duplicado y permite corregir error", async ({
  page,
}) => {
  const state = await mockPersonalApi(page, { user: null });
  let held,
    count = 0;
  await page.route("**/api/v1/auth/login", (route) => {
    count++;
    held = route;
  });
  await page.goto("/ingresar");
  await page.getByLabel("Email", { exact: true }).fill(accountUser.email);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("Personal-testing-password-123");
  await page.locator("form").evaluate((form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect.poll(() => Boolean(held)).toBe(true);
  expect(count).toBe(1);
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Crear cuenta", exact: true }),
  ).toBeDisabled();
  await held.fulfill({
    status: 401,
    json: { message: "Revisá tus credenciales." },
  });
  await expect(page.getByRole("alert")).toContainText(
    "Revisá tus credenciales.",
  );
  await expect(page.locator(".auth-feedback")).toBeFocused();
  await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
  await scan(page);
  await page.unroute("**/api/v1/auth/login");
  await login(page);
  await expect(page).toHaveURL("/");
  expect(state.writes.filter((w) => w.path !== "/auth/login")).toEqual([]);
});

test("cuenta muestra perfil de consulta, accesos y notificaciones con estados reales", async ({
  page,
}) => {
  const state = await mockPersonalApi(page);
  await page.goto("/cuenta");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `Hola, ${accountUser.name}.`,
  );
  await page.getByText("Datos de mi cuenta", { exact: true }).click();
  await expect(page.locator(".account-profile")).toContainText(
    accountUser.email,
  );
  await expect(page.locator(".account-profile input")).toHaveCount(0);
  await expect(page.locator(".notification")).toHaveCount(2);
  await page.getByRole("button", { name: "Todas", exact: true }).click();
  await expect(page.locator(".notification")).toHaveCount(3);
  await expect(page.locator(".notification.is-read")).toHaveCount(1);
  expect(state.writes).toEqual([]);
  await scan(page);
  await page
    .getByRole("navigation", { name: "Mi cuenta", exact: true })
    .getByRole("link", { name: "Mis reservas" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Mis reservas",
  );
});

test("notificación pendiente no se duplica; fallo conserva aviso y reintento actualiza estado", async ({
  page,
}) => {
  const state = await mockPersonalApi(page);
  await page.goto("/cuenta");
  const row = page.locator(".notification").first();
  const mark = row.getByRole("button", { name: "Marcar como leída" });
  let held,
    count = 0;
  await page.route("**/api/v1/notifications/*/read", (route) => {
    count++;
    held = route;
  });
  await mark.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect.poll(() => Boolean(held)).toBe(true);
  expect(count).toBe(1);
  await expect(mark).toBeDisabled();
  await held.fulfill({
    status: 503,
    json: { message: "No se pudo marcar la notificación." },
  });
  await expect(page.getByRole("alert")).toContainText("No se pudo marcar");
  await expect(page.locator(".notification")).toHaveCount(2);
  await page.unroute("**/api/v1/notifications/*/read");
  await mark.click();
  await expect(page.locator(".notification")).toHaveCount(1);
  await expect(page.locator(".account-notice")).toBeFocused();
  expect(state.writes.filter((w) => w.path.endsWith("/read"))).toHaveLength(1);
});

test("Guardados usa tarjetas, tarifa horaria y bloqueo mientras se quita un favorito", async ({
  page,
}) => {
  const state = await mockPersonalApi(page);
  await page.goto("/favoritos?startsAt=2030-01-10T12%3A00%3A00Z&guests=999");
  await expect(page.locator(".search-property-card")).toHaveCount(3);
  const card = page.locator(".search-property-card").first();
  await expect(card).toContainText("/ hora");
  await expect(card.locator(".card-title")).toHaveAttribute(
    "href",
    `/espacios/${savedProperties[0].id}`,
  );
  let held,
    count = 0;
  await page.route("**/api/v1/favorites/*", (route) => {
    count++;
    held = route;
  });
  await card
    .getByRole("button", { name: "Quitar de favoritos" })
    .evaluate((button) => {
      button.click();
      button.click();
    });
  await expect.poll(() => Boolean(held)).toBe(true);
  expect(count).toBe(1);
  await expect(
    card.getByRole("button", { name: "Quitar de favoritos" }),
  ).toBeDisabled();
  await held.fulfill({
    status: 503,
    json: { message: "No pudimos quitar el favorito." },
  });
  await expect(page.getByRole("alert")).toContainText("No pudimos quitar");
  await expect(page.locator(".search-property-card")).toHaveCount(3);
  await page.unroute("**/api/v1/favorites/*");
  await card.getByRole("button", { name: "Quitar de favoritos" }).click();
  await expect(page.locator(".search-property-card")).toHaveCount(2);
  expect(state.favorites.map((p) => p.id)).not.toContain(savedProperties[0].id);
  await expect(page.locator(".account-notice")).toBeFocused();
  await scan(page);
  await page
    .getByRole("button", { name: "Quitar de favoritos" })
    .first()
    .click();
  await expect(page.locator(".search-property-card")).toHaveCount(1);
  await expect(page.locator(".account-notice")).toBeFocused();
});

test("sesión vencida al quitar desde Guardados conserva destino y exige confirmar tras ingresar", async ({
  page,
}) => {
  const state = await mockPersonalApi(page);
  const path = `/favorites/${savedProperties[0].id}`;
  state.failures[path] = 401;
  await page.goto("/favoritos?vista=guardados#lista");
  await page
    .getByRole("button", { name: "Quitar de favoritos" })
    .first()
    .click();
  await expect(page).toHaveURL("/ingresar");
  delete state.failures[path];
  await login(page);
  await expect(page).toHaveURL("/favoritos?vista=guardados#lista");
  expect(state.writes.filter((w) => w.path === path)).toHaveLength(1);
  await page.getByRole("button", { name: "Confirmar quitar favorito" }).click();
  await expect(page.locator(".auth-continuation.success")).toContainText(
    "Espacio quitado",
  );
  expect(state.writes.filter((w) => w.path === path)).toHaveLength(2);
});

test("reservas conservan clasificación, detalles, llegada autorizada y cancelación con rechazo", async ({
  page,
}) => {
  const state = await mockPersonalApi(page);
  await page.goto("/reservas");
  await expect(page.locator(".reservation-row")).toHaveCount(3);
  const row = page.locator(".reservation-row").first();
  await row.getByText("Ver detalles", { exact: true }).click();
  await expect(row).toContainText("PYAPY-PLAN-2030");
  await expect(row).toContainText("Personas18");
  expect(await page.content()).not.toContain("Calle privada ficticia");
  await row.getByRole("button", { name: /Datos de llegada/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Calle privada ficticia 123",
  );
  await expect(
    page.getByRole("link", { name: "Ver ubicación de llegada" }),
  ).toHaveAttribute("href", /openstreetmap\.org/);
  await scan(page);
  await page.keyboard.press("Escape");
  await expect(
    row.getByRole("button", { name: /Datos de llegada/ }),
  ).toBeFocused();
  const cancelPath = `/reservations/${personalReservations[0].id}/cancel`;
  state.failures[cancelPath] = 409;
  await row.getByRole("button", { name: /Cancelar reserva en/ }).click();
  const dialog = page.getByRole("dialog", {
    name: "Cancelar reserva",
    exact: true,
  });
  expect(state.writes).toEqual([]);
  await dialog
    .getByRole("button", { name: "Cancelar reserva", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(row).toContainText("Confirmada");
  await scan(page);
  delete state.failures[cancelPath];
  await dialog
    .getByRole("button", { name: "Cancelar reserva", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("cancelled");
  await expect(page.locator(".reservation-row")).toHaveCount(2);
});

test("reseña de estadía terminada conserva borrador tras rechazo y publica solo explícitamente", async ({
  page,
}) => {
  const state = await mockPersonalApi(page);
  await page.goto("/reservas");
  await page
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("past");
  await page.getByRole("button", { name: /Opinar sobre/ }).click();
  const dialog = page.getByRole("dialog");
  const experience = "Compartimos un hermoso día en familia.";
  await dialog.getByLabel("Tu experiencia").fill(experience);
  await dialog.getByLabel("Puntuación").selectOption("4");
  expect(state.writes).toEqual([]);
  state.failures["/reviews"] = 403;
  await dialog.getByRole("button", { name: "Publicar opinión" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Tu experiencia")).toHaveValue(experience);
  await scan(page);
  delete state.failures["/reviews"];
  await dialog.getByRole("button", { name: "Publicar opinión" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".account-notice")).toContainText(
    "Tu opinión fue publicada",
  );
  expect(
    state.writes.filter((w) => w.path === "/reviews").map((w) => w.body),
  ).toEqual(
    Array(2).fill({
      reservationId: personalReservations[1].id,
      rating: 4,
      comment: experience,
    }),
  );
});

for (const [route, endpoint, retry, empty] of [
  ["/cuenta", "/notifications", "Reintentar notificaciones", "Estás al día."],
  [
    "/favoritos",
    "/favorites",
    "Reintentar favoritos",
    "Tus favoritos empiezan con un lugar.",
  ],
  [
    "/reservas",
    "/reservations",
    "Reintentar reservas",
    "Todavía no hay una fecha marcada.",
  ],
]) {
  test(`error en ${route} ofrece reintento y no aparece como vacío`, async ({
    page,
  }) => {
    const state = await mockPersonalApi(page, {
      failures: { [endpoint]: 503 },
    });
    await page.goto(route);
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: empty, exact: true }),
    ).toHaveCount(0);
    await scan(page);
    delete state.failures[endpoint];
    await page.getByRole("button", { name: retry }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    expect(state.writes).toEqual([]);
  });
}

test("fallo de sesión se distingue de invitado y permite recuperar la cuenta", async ({
  page,
}) => {
  const state = await mockPersonalApi(page, {
    user: null,
    failures: { "/auth/session": 503 },
  });
  await page.goto("/cuenta");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "No pudimos comprobar tu sesión.",
  );
  await expect(
    page.getByRole("main").getByRole("link", { name: "Ingresar", exact: true }),
  ).toHaveCount(0);
  delete state.failures["/auth/session"];
  state.user = accountUser;
  await page.getByRole("button", { name: "Reintentar sesión" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `Hola, ${accountUser.name}.`,
  );
  expect(state.writes).toEqual([]);
});

test("área personal y acceso conservan reflow a 320–1920 px", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  test.skip(
    info.project.name === "mobile",
    "El barrido se ejecuta una vez; los demás casos cubren emulación móvil.",
  );
  const state = await mockPersonalApi(page);
  state.user.name = `Ana${"DelRio".repeat(20)}`;
  state.user.email = `${"correo".repeat(20)}@example.invalid`;
  state.reservations[0].propertyName = `Quinta${"Ribera".repeat(20)}`;
  state.notifications[0].message = "Aviso".repeat(60);
  for (const route of [
    "/cuenta",
    "/favoritos",
    "/reservas",
    "/ingresar?mode=registro",
  ]) {
    await page.goto(route);
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
        `${route} ${width}`,
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`${route.split("?")[0].slice(1)}-${width}.png`),
        fullPage: true,
      });
    }
  }
});
