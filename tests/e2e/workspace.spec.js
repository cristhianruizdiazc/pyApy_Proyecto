import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { localInterval } from "../../packages/contracts/index.mjs";

const test = base.extend({
  accounts: [
    async ({ playwright }, use, info) => {
      const demo = JSON.parse(
        await readFile(".local/demo-accounts.json", "utf8"),
      );
      const accounts = {};
      try {
        for (const role of ["owner", "admin", "client"]) {
          const api = await playwright.request.newContext({
            baseURL: info.project.use.baseURL,
          });
          const result = await api.post(
            `/api/v1/auth/${role === "client" ? "register" : "login"}`,
            {
              data:
                role === "client"
                  ? {
                      name: "Cliente paneles E2E",
                      email: `workspace-${randomUUID()}@example.invalid`,
                      password: "Workspace-testing-password-123",
                    }
                  : demo[role],
            },
          );
          expect(result.ok()).toBeTruthy();
          const data = await result.json();
          accounts[role] = {
            api,
            user: data.user,
            headers: { "X-CSRF-Token": data.csrfToken },
            cookies: (await api.storageState()).cookies,
          };
        }
        await use(accounts);
      } finally {
        for (const account of Object.values(accounts))
          await account.api.dispose();
      }
    },
    { scope: "worker" },
  ],
  space: async ({ accounts }, use) => {
    const { api, headers } = accounts.owner;
    const catalog = await (await api.get("/api/v1/catalog")).json();
    const input = {
      name: `Gestión E2E ${randomUUID().slice(0, 8)}`,
      description:
        "Espacio ficticio para verificar gestión de propiedades, calendario y cuenta.",
      cityId: catalog.cities[0].id,
      zone: "Pruebas de interfaz",
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
      rules: "Respetar los horarios.",
    };
    const response = await api.post("/api/v1/properties", {
      headers,
      data: input,
    });
    expect(response.status()).toBe(201);
    const p = await response.json();
    try {
      await use({ p, input });
    } finally {
      const reservations = await (
        await api.get("/api/v1/owner/reservations")
      ).json();
      for (const r of reservations.items || [])
        if (r.propertyId === p.id && r.status === "confirmed")
          await api.post(`/api/v1/reservations/${r.id}/cancel`, {
            headers,
            data: {},
          });
      await api.put(`/api/v1/properties/${p.id}`, {
        headers,
        data: { ...input, status: "draft" },
      });
    }
  },
});
async function visit(page, account, path) {
  await page.context().clearCookies();
  await page.context().addCookies(account.cookies);
  await page.goto(path);
}
function futureDay() {
  const d = new Date();
  d.setDate(d.getDate() + 80);
  return d.toISOString().slice(0, 10);
}

test("cuenta filtra guardados y marca notificación como leída sin perder acceso al historial", async ({
  page,
  accounts,
  space,
}) => {
  const { api, headers } = accounts.client;
  expect(
    (await api.put(`/api/v1/favorites/${space.p.id}`, { headers })).ok(),
  ).toBeTruthy();
  await visit(page, accounts.client, "/favoritos");
  await page.getByLabel("Buscar lugar guardado").fill(space.p.name);
  await expect(page.locator(".property-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Quitar de favoritos" }).click();
  await expect(
    page.getByRole("heading", { name: "Tus favoritos empiezan con un lugar." }),
  ).toBeVisible();
  // Deterministic notification transport; business delivery remains covered by API tests.
  let read = false;
  const id = randomUUID();
  await page.route("**/api/v1/notifications", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id,
            message: "Recordatorio de tu escapada de prueba",
            created_at: new Date().toISOString(),
            read_at: read ? new Date().toISOString() : null,
          },
        ],
      },
    }),
  );
  await page.route(`**/api/v1/notifications/${id}/read`, (route) => {
    read = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page
    .getByRole("navigation", { name: "Mi cuenta", exact: true })
    .getByRole("link", { name: "Mi cuenta", exact: true })
    .click();
  await expect(
    page.getByText("Recordatorio de tu escapada de prueba"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Marcar como leida" }).click();
  await expect(
    page.getByRole("heading", { name: "Estás al día." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Todas", exact: true }).click();
  await expect(
    page.getByText("Recordatorio de tu escapada de prueba"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Marcar como leida" }),
  ).toHaveCount(0);
});

test("llegada privada no reaparece al cerrar el diálogo durante una respuesta tardía", async ({
  page,
  accounts,
  space,
}) => {
  const privateInfo = {
    address: "Dirección privada ficticia E2E",
    phone: "000000",
    latitude: null,
    longitude: null,
  };
  expect(
    (
      await accounts.owner.api.put(
        `/api/v1/owner/properties/${space.p.id}/private`,
        { headers: accounts.owner.headers, data: privateInfo },
      )
    ).ok(),
  ).toBeTruthy();
  const booking = await accounts.client.api.post("/api/v1/reservations", {
    headers: { ...accounts.client.headers, "Idempotency-Key": randomUUID() },
    data: {
      propertyId: space.p.id,
      guests: 2,
      ...localInterval(futureDay(), "09:00", "17:00"),
    },
  });
  expect(booking.status()).toBe(201);
  await visit(page, accounts.client, "/reservas");
  await page.getByLabel("Buscar reserva", { exact: true }).fill(space.p.name);
  await expect(page.getByText(privateInfo.address)).toHaveCount(0);
  let held, response;
  await page.route("**/api/v1/reservations/*/arrival", async (route) => {
    response = await route.fetch();
    held = route;
  });
  await page
    .getByRole("button", { name: `Datos de llegada a ${space.p.name}` })
    .click();
  await expect.poll(() => Boolean(held)).toBeTruthy();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cerrar", exact: true })
    .click();
  await held.fulfill({ response });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(privateInfo.address)).toHaveCount(0);
  await page.unroute("**/api/v1/reservations/*/arrival");
  await page
    .getByRole("button", { name: `Datos de llegada a ${space.p.name}` })
    .click();
  await expect(page.getByRole("dialog")).toContainText(privateInfo.address);
  await page.keyboard.press("Escape");
  await page
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("cancelled");
  await expect(
    page.getByRole("heading", {
      name: "No hay coincidencias con estos filtros.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(
    page.locator(".reservation-row").filter({ hasText: space.p.name }),
  ).toBeVisible();
});

test("propietario edita espacio y conserva formularios de fotos, contacto y redes", async ({
  page,
  accounts,
  space,
}) => {
  await visit(page, accounts.owner, "/propietario");
  await page.getByLabel("Buscar mi espacio").fill(space.p.name);
  await page
    .getByRole("button", { name: `Editar ${space.p.name}`, exact: true })
    .click();
  const edit = page.getByRole("dialog", { name: "Editar espacio" });
  await edit.getByLabel("Capacidad", { exact: true }).fill("14");
  await edit.getByRole("button", { name: "Guardar espacio" }).click();
  await expect(edit).toHaveCount(0);
  await expect(page.locator(".owner-property-row")).toContainText(
    "14 personas",
  );
  const mediaButton = page.getByRole("button", {
    name: `Imagenes y contacto de ${space.p.name}`,
  });
  await mediaButton.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Datos de llegada" }).click();
  await dialog
    .getByLabel("Direccion exacta")
    .fill("Calle ficticia de prueba 123");
  await dialog.getByLabel("Telefono privado").fill("000000");
  await dialog
    .getByRole("button", { name: "Guardar contacto privado" })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(
    (
      await (
        await accounts.owner.api.get(
          `/api/v1/owner/properties/${space.p.id}/private`,
        )
      ).json()
    ).address,
  ).toBe("Calle ficticia de prueba 123");
  await mediaButton.click();
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "prueba.jpg",
    mimeType: "image/jpeg",
    buffer: await readFile("apps/web/public/demo/pool.jpg"),
  });
  await expect(dialog.locator(".media-grid > div")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Eliminar imagen" }).click();
  await expect(dialog.locator(".media-grid > div")).toHaveCount(0);
  await dialog.getByRole("tab", { name: "Redes", exact: true }).click();
  await dialog
    .getByLabel("Enlace HTTPS")
    .fill("https://www.instagram.com/pyapy_demo_e2e");
  await dialog.getByRole("button", { name: "Guardar enlace" }).click();
  await expect(dialog).toHaveCount(0);
  const data = await (
    await accounts.owner.api.get(`/api/v1/properties/${space.p.id}`)
  ).json();
  expect(
    data.socials.some(
      (s) => s.url === "https://www.instagram.com/pyapy_demo_e2e",
    ),
  ).toBe(true);
});

test("calendario con agenda crea bloqueo real y permite cancelarlo desde reservas", async ({
  page,
  accounts,
  space,
}) => {
  await visit(page, accounts.owner, "/propietario?section=calendar");
  const calendar = page.getByRole("tab", { name: "Calendario", exact: true });
  await calendar.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Reservas", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.goBack();
  await expect(calendar).toHaveAttribute("aria-selected", "true");
  await page
    .getByLabel("Filtrar calendario por espacio")
    .selectOption(space.p.id);
  const [year, month] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Asuncion" })
    .split("-")
    .map(Number);
  const day = new Date(Date.UTC(year, month, 15)).toISOString().slice(0, 10);
  await page.getByRole("button", { name: "Mes siguiente" }).click();
  await page
    .getByRole("button", { name: `Ver agenda del ${day}, 0 ocupaciones` })
    .click();
  await page
    .getByRole("button", { name: "Registrar ocupación", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("block");
  await dialog
    .getByRole("button", { name: "Registrar ocupacion", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Agenda del día" }),
  ).toContainText(space.p.name);
  await expect(
    page.getByRole("button", { name: `Ver agenda del ${day}, 1 ocupaciones` }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Reservas", exact: true }).click();
  await page.getByLabel("Buscar reserva").fill(space.p.name);
  await page
    .getByRole("button", { name: `Cancelar reserva en ${space.p.name}` })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar cancelacion" })
    .click();
  await expect(page.locator(".reservation-row")).toContainText("Cancelada");
});

test("administración filtra, verifica y suspende sin perder acceso a auditoría", async ({
  page,
  accounts,
  space,
}) => {
  await visit(page, accounts.admin, "/admin?section=properties");
  await page.getByLabel("Buscar en registros cargados").fill(space.p.name);
  const row = page.locator("tbody tr").filter({ hasText: space.p.name });
  await row
    .getByRole("button", { name: `Cambiar verificacion de ${space.p.name}` })
    .click();
  await expect(row).toContainText("Verificado");
  await row.getByRole("button", { name: "Suspender", exact: true }).click();
  await expect(row).toContainText("Suspendido");
  await row.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(row).toContainText("Publicado");
  await page.getByRole("tab", { name: "Auditoría", exact: true }).click();
  await expect(page).toHaveURL(/section=audit/);
  await expect(
    page.locator(".audit-details").first().locator("p").first(),
  ).toBeHidden();
  await page.locator(".audit-details").first().locator("summary").click();
  await expect(page.locator(".audit-details").first()).toContainText(
    "Recurso:",
  );
  await page.getByRole("tab", { name: "Matching", exact: true }).click();
  const weights = await (
    await accounts.admin.api.get("/api/v1/admin/weights")
  ).json();
  const field = weights.items.find((i) => i.weight < 100);
  await page
    .locator(`input[name="${field.criterion}"]`)
    .fill(String(field.weight + 1));
  await page.getByRole("button", { name: "Guardar pesos" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(
    await (await accounts.admin.api.get("/api/v1/admin/weights")).json(),
  ).toEqual(weights);
});

test("fallos de panel no aparentan vacíos y cliente no obtiene administración", async ({
  page,
  accounts,
}) => {
  await page.route("**/api/v1/favorites", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Error de favoritos de prueba" },
    }),
  );
  await visit(page, accounts.client, "/favoritos");
  await expect(
    page.getByRole("button", { name: "Reintentar favoritos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tus favoritos empiezan con un lugar." }),
  ).toHaveCount(0);
  await page.unroute("**/api/v1/favorites");
  await page.getByRole("button", { name: "Reintentar favoritos" }).click();
  await expect(
    page.getByRole("heading", { name: "Tus favoritos empiezan con un lugar." }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acceso administrativo" }),
  ).toBeVisible();
  expect((await page.request.get("/api/v1/admin/users")).status()).toBe(403);
  await page.route("**/api/v1/owner/reservations", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Error de calendario de prueba" },
    }),
  );
  await visit(page, accounts.owner, "/propietario?section=calendar");
  await expect(
    page.getByRole("button", { name: "Reintentar calendario" }),
  ).toBeVisible();
  await expect(page.locator(".calendar-grid")).toHaveCount(0);
  await page.unroute("**/api/v1/owner/reservations");
  await page.getByRole("button", { name: "Reintentar calendario" }).click();
  await expect(page.locator(".calendar-grid")).toBeVisible();
  await page.route("**/api/v1/admin/overview", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Error de resumen de prueba" },
    }),
  );
  await visit(page, accounts.admin, "/admin");
  await expect(
    page.getByRole("button", { name: "Reintentar sección" }),
  ).toBeVisible();
  await expect(page.locator(".metrics-strip")).toHaveCount(0);
});

test("paneles y cuenta mantienen navegación y ancho en pantallas pequeñas", async ({
  page,
  accounts,
}, info) => {
  test.setTimeout(90000);
  const widths =
    info.project.name === "desktop" ? [320, 768, 1024, 1440] : [390];
  for (const [role, path] of [
    ["client", "/cuenta"],
    ["owner", "/propietario?section=calendar"],
    ["admin", "/admin?section=users"],
  ]) {
    await visit(page, accounts[role], path);
    await expect(page.locator(".workspace-page")).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: info.outputPath(`${role}-${width}.png`),
        fullPage: true,
        scale: "css",
        animations: "disabled",
      });
    }
  }
});
