import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { mockManagementApi, managementId } from "./fixtures/management.js";

async function scan(page) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
}

test("texto al 200% conserva títulos y calendario a 320 px", async ({
  page,
}) => {
  const state = await mockManagementApi(page);
  await page.setViewportSize({ width: 320, height: 900 });
  for (const [role, route] of [
    ["owner", "/propietario?section=calendar"],
    ["admin", "/admin?section=users"],
  ]) {
    state.user.role = role;
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    // Double computed text sizes without widening the CSS viewport. This is
    // a text enlargement stress check, separate from native browser zoom.
    await page.evaluate(() => {
      const sizes = [...document.querySelectorAll("body, body *")]
        .filter((element) => element instanceof HTMLElement)
        .map((element) => [
          element,
          parseFloat(getComputedStyle(element).fontSize),
        ]);
      for (const [element, size] of sizes)
        element.style.fontSize = `${size * 2}px`;
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      role,
    ).toBe(true);
    for (const text of await page
      .locator("h1, .calendar-toolbar h2, .weekday, .day > strong")
      .all()) {
      expect(
        await text.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
        await text.textContent(),
      ).toBe(true);
    }
    if (role === "owner") {
      await page.getByRole("button", { name: "Mes siguiente" }).focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("button", { name: /Ver agenda del/ })
        .first()
        .click();
      await expect(
        page.getByRole("region", { name: "Agenda del día" }),
      ).toBeVisible();
    }
    await scan(page);
  }
  expect(state.writes).toEqual([]);
});

test("navegación del propietario conserva URL, historial y teclado sin escrituras", async ({
  page,
}) => {
  const state = await mockManagementApi(page);
  await page.goto("/propietario?section=calendar");
  const tabs = page.getByRole("tablist", { name: "Panel del propietario" });
  await expect(
    page.getByRole("region", { name: "Agenda del día" }),
  ).toContainText("QA-PARTICULAR");
  await tabs.getByRole("tab", { name: "Calendario", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/section=bookings/);
  await page.goBack();
  await expect(
    tabs.getByRole("tab", { name: "Calendario", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await tabs.getByRole("tab", { name: "Calendario", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page).toHaveURL(/section=plans/);
  await expect(page.locator(".plan")).toHaveCount(3);
  await page.keyboard.press("Home");
  await expect(page).toHaveURL(/section=properties/);
  expect(state.writes).toEqual([]);
  await scan(page);
});

test("editar espacio conserva campos y selección ante rechazo", async ({
  page,
}) => {
  const state = await mockManagementApi(page);
  const p = state.properties[0];
  await page.goto("/propietario");
  await page
    .getByRole("button", { name: `Editar ${p.name}`, exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Editar espacio" });
  await dialog.getByLabel("Capacidad", { exact: true }).fill("18");
  await dialog
    .getByLabel("Tarifa por hora (Gs.)", { exact: true })
    .fill("15000");
  state.failures[`/properties/${p.id}`] = 422;
  await dialog.getByRole("button", { name: "Guardar espacio" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Capacidad", { exact: true })).toHaveValue(
    "18",
  );
  await scan(page);
  delete state.failures[`/properties/${p.id}`];
  await dialog.getByRole("button", { name: "Guardar espacio" }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.writes.at(-1).body).toMatchObject({
    capacity: 18,
    pricePerHour: 15000,
    amenities: ["pool", "grill"],
    cityId: p.cityId,
    status: "published",
  });
});

test("fotos, datos privados y redes mantienen separación y recuperación", async ({
  page,
}) => {
  const state = await mockManagementApi(page);
  const p = state.properties[0];
  await page.goto("/propietario");
  await page
    .getByRole("button", { name: `Imágenes y contacto de ${p.name}` })
    .click();
  const dialog = page.getByRole("dialog");
  expect(state.requests.some((r) => r.path.endsWith("/private"))).toBe(false);
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "foto.jpg",
    mimeType: "image/jpeg",
    buffer: await readFile("apps/web/public/demo/pool.jpg"),
  });
  await expect(dialog.locator(".media-grid > div")).toHaveCount(2);
  await dialog.getByRole("button", { name: "Eliminar imagen" }).last().click();
  await expect(dialog.locator(".media-grid > div")).toHaveCount(1);
  await dialog
    .getByRole("tab", { name: "Datos de llegada", exact: true })
    .click();
  await expect(dialog.getByLabel("Dirección exacta")).toHaveValue(
    "Dirección privada ficticia 123",
  );
  await scan(page);
  await dialog.getByRole("tab", { name: "Redes", exact: true }).click();
  await dialog
    .getByLabel("Enlace HTTPS")
    .fill("https://www.instagram.com/pyapy_qa");
  state.failures[`/owner/properties/${p.id}/socials`] = 422;
  await dialog.getByRole("button", { name: "Guardar enlace" }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Enlace HTTPS")).toHaveValue(
    "https://www.instagram.com/pyapy_qa",
  );
  delete state.failures[`/owner/properties/${p.id}/socials`];
  await dialog.getByRole("button", { name: "Guardar enlace" }).click();
  await expect(dialog).toHaveCount(0);
});

test("calendario conserva filtro, agenda y solicitud explícita con UUID", async ({
  page,
}) => {
  const state = await mockManagementApi(page);
  const p = state.properties[0];
  await page.goto("/propietario?section=calendar");
  await page.getByLabel("Filtrar calendario por espacio").selectOption(p.id);
  await page
    .getByRole("button", { name: "Registrar ocupación", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("block");
  await dialog.getByLabel("Nota privada").fill("Mantenimiento de prueba");
  expect(state.writes).toEqual([]);
  await scan(page);
  await dialog
    .getByRole("button", { name: "Registrar ocupación", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const op = state.writes.at(-1);
  expect(op.path).toBe("/owner/occupancies");
  expect(op.body).toMatchObject({
    propertyId: p.id,
    kind: "block",
    note: "Mantenimiento de prueba",
    guests: 1,
  });
  expect(op.key).toMatch(/^[a-f0-9-]{36}$/);
});

test("cliente crea perfil y solicita plan solo al confirmar", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: "client" });
  await page.goto("/propietario?section=plans");
  await expect(
    page.getByRole("heading", { name: "Sumate como propietario." }),
  ).toBeVisible();
  expect(state.requests.some((r) => r.path.startsWith("/owner/"))).toBe(false);
  await page.getByLabel("Nombre comercial").fill("Anfitrión de prueba");
  expect(state.writes).toEqual([]);
  await scan(page);
  await page
    .getByRole("button", { name: "Crear perfil de propietario" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mi espacio", exact: true }),
  ).toBeVisible();
  expect(state.writes.map((w) => w.path)).toEqual(["/owner-profile"]);
  await page.getByRole("button", { name: "Solicitar plan" }).last().click();
  await expect(
    page.getByRole("status").filter({ hasText: "Solicitud registrada" }),
  ).toBeVisible();
  expect(state.writes.at(-1)).toMatchObject({
    path: "/owner/subscription",
    body: { planId: state.plans[2].id },
  });
});

test("las nueve secciones administrativas conservan datos y no escriben al navegar", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: "admin" });
  await page.goto("/admin?section=overview");
  await expect(page.locator(".overview-amount")).toContainText("80.000");
  const tabs = page.getByRole("tablist", {
    name: "Administración",
    exact: true,
  });
  for (const [key, label] of [
    ["users", "Usuarios"],
    ["properties", "Espacios"],
    ["reviews", "Reseñas"],
    ["plans", "Planes"],
    ["subscriptions", "Suscripciones"],
    ["sponsors", "Sponsors"],
    ["weights", "Matching"],
    ["audit", "Auditoría"],
  ]) {
    await tabs.getByRole("tab", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`section=${key}`));
    await expect(page.locator(".loading")).toHaveCount(0);
    if (key !== "weights") await expect(page.getByRole("table")).toBeVisible();
  }
  await page.locator(".audit-details summary").click();
  await expect(page.locator(".audit-details")).toContainText("Recurso:");
  await scan(page);
  expect(state.writes).toEqual([]);
});

test("usuarios, reseñas y pesos envían las acciones y respetan el rechazo", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: "admin" });
  await page.goto("/admin?section=users");
  const own = page.locator("tbody tr").filter({ hasText: state.user.email });
  await expect(own.getByRole("button")).toBeDisabled();
  const customer = page
    .locator("tbody tr")
    .filter({ hasText: "Cliente de prueba" });
  await customer.getByRole("button").click();
  await expect(customer).toContainText("Inactivo");
  await page.getByRole("tab", { name: "Reseñas", exact: true }).click();
  await page.getByRole("button", { name: "Cambiar visibilidad" }).click();
  await expect(page.locator("tbody tr")).toContainText("Oculta");
  await page.getByRole("tab", { name: "Matching", exact: true }).click();
  await page.getByLabel("Disponibilidad (%)").fill("21");
  await page.getByRole("button", { name: "Guardar pesos" }).click();
  await expect(page.getByRole("alert")).toContainText("sumar 100");
  await page.getByLabel("Disponibilidad (%)").fill("20");
  await page.getByRole("button", { name: "Guardar pesos" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(state.writes.map((w) => w.method)).toEqual([
    "PATCH",
    "PATCH",
    "PUT",
    "PUT",
  ]);
});

test("planes, suscripciones y sponsors conservan formularios y datos de API", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: "admin" });
  await page.goto("/admin?section=plans");
  await page
    .getByRole("button", { name: "Editar plan Activo", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mensualidad (Gs.)").fill("75000");
  state.failures[`/admin/plans/${state.plans[0].id}`] = 422;
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Mensualidad (Gs.)")).toHaveValue("75000");
  await scan(page);
  delete state.failures[`/admin/plans/${state.plans[0].id}`];
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("tab", { name: "Suscripciones", exact: true }).click();
  await page.getByRole("button", { name: "Gestionar suscripción" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Vencimiento").fill("2030-02-01");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("tab", { name: "Sponsors", exact: true }).click();
  await page.getByRole("button", { name: "Nueva campaña" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Sponsor", { exact: true }).fill("Nuevo sponsor QA");
  await dialog
    .getByLabel("Enlace HTTPS")
    .fill("https://example.invalid/sponsor");
  await dialog.getByLabel("Título de campaña").fill("Escapadas en familia");
  await dialog.getByLabel("Desde", { exact: true }).fill("2030-01-01");
  await dialog.getByLabel("Hasta", { exact: true }).fill("2030-02-01");
  await scan(page);
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.locator("tbody tr").filter({ hasText: "Nuevo sponsor QA" });
  await row.getByRole("button", { name: "Cambiar estado de campaña" }).click();
  await expect(row).toContainText("Pausada");
  expect(state.writes.at(-2)).toMatchObject({
    path: "/admin/sponsors",
    method: "POST",
    body: {
      name: "Nuevo sponsor QA",
      startsAt: "2030-01-01T00:00:00.000Z",
      endsAt: "2030-02-01T00:00:00.000Z",
    },
  });
});

test("tablas conservan filtro, límite cargado y desplazamiento interno por teclado", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: "admin" });
  state.users = Array.from({ length: 22 }, (_, i) => ({
    id: managementId(500 + i),
    name: `Cuenta ${i}`,
    email: `cuenta-${i}@example.invalid`,
    role: "client",
    active: true,
  }));
  await page.goto("/admin?section=users");
  await expect(page.locator("tbody tr")).toHaveCount(15);
  await page.getByRole("button", { name: "Mostrar más" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(22);
  await page.getByLabel("Buscar en registros cargados").fill("Cuenta 21");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 900 });
  const table = page.getByRole("region", { name: "Tabla de Usuarios" });
  await table.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => table.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(state.writes).toEqual([]);
});

for (const [route, endpoint, retry, missing] of [
  [
    "/propietario?section=calendar",
    "/owner/reservations",
    "Reintentar calendario",
    ".calendar-grid",
  ],
  ["/admin?section=users", "/admin/users", "Reintentar sección", "table"],
])
  test(`error en ${route} no aparenta vacío y conserva reintento`, async ({
    page,
  }) => {
    const state = await mockManagementApi(page, {
      role: route.startsWith("/admin") ? "admin" : "owner",
      failures: { [endpoint]: 503 },
    });
    await page.goto(route);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator(missing)).toHaveCount(0);
    delete state.failures[endpoint];
    await page.getByRole("button", { name: retry }).click();
    await expect(page.locator(missing)).toBeVisible();
    expect(state.writes).toEqual([]);
  });

test("ayuda, acceso denegado y página inexistente mantienen salidas operables", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: "client" });
  await page.goto("/admin?section=users");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Acceso administrativo",
  );
  expect(state.requests.some((r) => r.path.startsWith("/admin/"))).toBe(false);
  await scan(page);
  await page.goto("/ruta-inexistente");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Esta página no existe.",
  );
  await page
    .getByRole("main")
    .getByRole("link", { name: "Preguntas frecuentes", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Preguntas frecuentes",
  );
  await page.getByText("¿Cómo se calcula el precio?", { exact: true }).click();
  await expect(page.getByText(/La tarifa es por hora iniciada/)).toBeVisible();
  await scan(page);
  expect(state.writes).toEqual([]);
});

test("invitado conserva destino de publicación y acceso administrativo sin consultas privadas", async ({
  page,
}) => {
  const state = await mockManagementApi(page, { role: null });
  await page.goto("/propietario?section=calendar");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Ingresar para publicar" })
    .click();
  await expect(page).toHaveURL("/ingresar");
  await expect(page.locator(".auth-context")).toContainText("publicación");
  await page.goto("/admin?section=users");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Ingresar", exact: true })
    .click();
  await expect(page).toHaveURL("/ingresar");
  expect(
    state.requests.some(
      (r) => r.path.startsWith("/admin/") || r.path.startsWith("/owner/"),
    ),
  ).toBe(false);
  expect(state.writes).toEqual([]);
});

test("fallo de sesión en gestión se distingue de acceso denegado y permite recuperar", async ({
  page,
}) => {
  const state = await mockManagementApi(page, {
    failures: { "/auth/session": 503 },
  });
  await page.goto("/admin?section=users");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "No pudimos comprobar tu sesión.",
  );
  expect(state.requests.some((r) => r.path.startsWith("/admin/"))).toBe(false);
  delete state.failures["/auth/session"];
  state.user.role = "admin";
  await page.getByRole("button", { name: "Reintentar sesión" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Administración",
  );
  await expect(page.getByRole("table")).toBeVisible();
  expect(state.writes).toEqual([]);
});

test("paneles y estados conservan composición y reflow a 320–1920 px", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  test.skip(
    info.project.name === "mobile",
    "Un solo barrido; los recorridos se ejecutan también en móvil.",
  );
  const state = await mockManagementApi(page);
  state.properties[0].name = "Quinta" + "Ribera".repeat(20);
  for (const [role, route] of [
    ["owner", "/propietario?section=properties"],
    ["owner", "/propietario?section=calendar"],
    ["owner", "/propietario?section=plans"],
    ["admin", "/admin?section=users"],
    ["client", "/admin"],
    ["client", "/ayuda"],
  ]) {
    state.user.role = role;
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [
      320, 360, 390, 430, 600, 820, 980, 1080, 1081, 1366, 1440, 1920,
    ]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} ${width}`,
      ).toBe(true);
      if (await page.locator(".workspace-layout").count())
        await expect(
          page.locator(".workspace-layout > .workspace-tabs"),
        ).toHaveAttribute(
          "aria-orientation",
          width > 1080 ? "vertical" : "horizontal",
        );
      await page.screenshot({
        path: info.outputPath(
          `${role}-${route.replaceAll(/[^a-z]/gi, "-")}-${width}.png`,
        ),
        fullPage: true,
      });
    }
    await scan(page);
  }
});
