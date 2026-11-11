import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { localInterval } from "@pyapy/contracts";

// All API calls are intercepted. No database writes or external campaign visits.
async function mockApi(page, role = null) {
  let user = role ? { id: `home-${role}`, name: "Prueba", role } : null;
  const events = [];
  const writes = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    if (!["GET", "HEAD"].includes(request.method())) writes.push(path);
    let json = { items: [] };
    if (path === "/auth/session") json = { user, csrfToken: "home-test" };
    else if (path === "/auth/login") {
      user = { id: "home-customer", name: "Prueba", role: "customer" };
      json = { user, csrfToken: "home-test" };
    } else if (path === "/catalog")
      json = {
        cities: [
          { id: 1, city: "San Bernardino" },
          { id: 2, city: "Aregua" },
        ],
        amenities: [
          { code: "pool", label: "Piscina" },
          { code: "grill", label: "Parrilla" },
        ],
        plans: [],
      };
    else if (path === "/properties")
      json = { items: [], total: 0, alternatives: [], otherDates: [] };
    else if (path === "/owner/metrics")
      json = { properties: 0, reservations: 0, revenue: 0 };
    else if (path === "/sponsors")
      json = {
        items: [
          {
            id: "home-campaign",
            name: "Aliado QA",
            title: "Campaña de prueba",
            url: "https://example.invalid/campaign",
          },
        ],
      };
    else if (path === "/events") {
      events.push(request.postDataJSON());
      json = { ok: true };
    }
    await route.fulfill({ json });
  });
  return { events, writes };
}

test("hero se anticipa a la sesión y no se descarga en ayuda", async ({
  page,
}) => {
  await mockApi(page);
  let session;
  let images = [];
  page.on("request", (request) => {
    if (/\/brand\/escapada-\d+\.webp$/.test(request.url()))
      images.push(request.url());
  });
  await page.route("**/api/v1/auth/session", (route) => {
    session = route;
  });
  await page.goto("/");
  await expect.poll(() => Boolean(session)).toBe(true);
  await expect.poll(() => images.length).toBe(1);
  await session.fulfill({ json: { user: null, csrfToken: "home-test" } });
  await expect(page.locator(".hero-image")).toBeVisible();
  await page.locator(".hero-image").evaluate((img) => img.decode());
  expect(images).toHaveLength(1);

  session = null;
  images = [];
  await page.goto("/ayuda");
  await expect.poll(() => Boolean(session)).toBe(true);
  await session.fulfill({ json: { user: null, csrfToken: "home-test" } });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(images).toEqual([]);
});

test("portada compuesta, anclas, reflow y teclado", async ({ page }, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Barrido único de todos los anchos",
  );
  await mockApi(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".hero .search-form")).toBeVisible();
  await expect(page.locator(".benefits-list li")).toHaveCount(5);
  await expect(page.locator(".steps-grid li")).toHaveCount(3);
  await expect(page.locator("#anfitriones .hosts-cta")).toHaveAttribute(
    "href",
    "/ingresar",
  );
  for (const width of [
    320, 360, 390, 430, 480, 600, 601, 780, 781, 820, 980, 981, 1024, 1180,
    1366, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".more-filters").click();
    await expect(page.locator(".advanced-filters")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `${width}px`,
    ).toBe(true);
    for (const control of await page
      .locator(".search-main input, .search-main select, .search-button")
      .all()) {
      const rect = await control.boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    await page.locator(".more-filters").click();
    await expect(page.locator(".search-schedule")).toBeVisible();
  }
  await page.locator(".more-filters").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".advanced-filters")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Desde", { exact: true })).toBeFocused();
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  await nav.getByRole("link", { name: "Anfitriones", exact: true }).click();
  await expect(page).toHaveURL(/\/#anfitriones$/);
  await expect(
    page.getByRole("heading", {
      name: "Tus espacios pueden ser el próximo plan de alguien.",
    }),
  ).toBeInViewport();
  await nav.getByRole("link", { name: "Cómo funciona", exact: true }).click();
  await expect(page).toHaveURL(/\/#como-funciona$/);
  await expect(page.locator("#steps-title")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("18 personas, horario nocturno y todos los filtros conservan contrato e historial", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/?sort=price&page=2");
  const form = page.locator(".search-form");
  await form
    .getByRole("combobox", { name: "Zona / Ciudad", exact: true })
    .selectOption("San Bernardino");
  await form.getByLabel("Fecha de entrada").fill("2030-01-10");
  await form.getByLabel("Personas", { exact: true }).fill("18");
  await form.getByLabel("Horario / Turno").selectOption("custom");
  await form.getByLabel("Desde", { exact: true }).fill("20:00");
  await form.getByLabel("Hasta", { exact: true }).fill("02:00");
  await form
    .getByLabel("Presupuesto total (Gs.)", { exact: true })
    .fill("750000");
  await form
    .getByRole("combobox", { name: "Tipo", exact: true })
    .selectOption("Salon");
  await form.getByLabel("Piscina", { exact: true }).check();
  await form.getByLabel("Parrilla indispensable", { exact: true }).check();
  await form.getByLabel("Mantener estrictamente la ciudad").check();
  await form.getByLabel("Mantener estrictamente el presupuesto").check();
  await form.getByRole("button", { name: "Más filtros", exact: true }).click();
  await expect(form.locator(".advanced-filters")).toBeHidden();
  await expect(form.locator(".search-schedule")).toContainText(
    "20:00 – Hasta 02:00 (11/01/2030)",
  );
  await expect(form.locator(".search-schedule")).toContainText("6 h");
  await expect(form.locator(".search-head")).toContainText("Precios por hora");
  const emitted = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get("guests") === "18",
  );
  await form.getByRole("button", { name: "Buscar espacios" }).click();
  const expected = {
    city: "San Bernardino",
    guests: "18",
    budget: "750000",
    kind: "Salon",
    amenities: "pool",
    requiredAmenities: "grill",
    strictCity: "true",
    strictBudget: "true",
    sort: "price",
    ...localInterval("2030-01-10", "20:00", "02:00"),
  };
  expect(
    Object.fromEntries(new URL((await emitted).url()).searchParams),
  ).toEqual(expected);
  await expect(
    page.getByRole("region", { name: "Resultados de búsqueda", exact: true }),
  ).toBeFocused();
  await expect(page.locator("#results > [role=status]")).toHaveText(
    "0 coincidencias exactas y 0 alternativas.",
  );
  await expect(page).not.toHaveURL(/page=/);
  await page.reload();
  await expect(form.getByLabel("Personas", { exact: true })).toHaveValue("18");
  await form.getByRole("button", { name: "Más filtros", exact: true }).click();
  await expect(
    form.getByRole("combobox", { name: "Tipo", exact: true }),
  ).toHaveValue("Salon");
  await expect(
    form.getByLabel("Parrilla indispensable", { exact: true }),
  ).toBeChecked();
  await form.getByLabel("Personas", { exact: true }).fill("19");
  await page
    .getByRole("group", { name: "Categorías" })
    .getByRole("button", { name: "Quinchos", exact: true })
    .click();
  await expect(page).toHaveURL(/kind=Quincho/);
  expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
    ...expected,
    guests: "19",
    kind: "Quincho",
  });
  await page.goBack();
  await expect(form.getByLabel("Personas", { exact: true })).toHaveValue("18");
  await page.goForward();
  await expect(form.getByLabel("Personas", { exact: true })).toHaveValue("19");
});

test("intervalos largos de URL y requisitos desconocidos se conservan hasta editar", async ({
  page,
}) => {
  await mockApi(page);
  const interval = localInterval(
    "2030-01-10",
    "20:00:30",
    "02:00:45",
    "2030-01-12",
  );
  await page.goto(
    `/?${new URLSearchParams({ ...interval, guests: "18", requiredAmenities: "custom-required" })}`,
  );
  const form = page.locator(".search-form");
  await expect(form.locator(".search-schedule")).toContainText("12/01/2030");
  await form.getByRole("button", { name: "Más filtros", exact: true }).click();
  await expect(
    form.getByLabel("custom-required indispensable", { exact: true }),
  ).toBeChecked();
  await form.getByRole("button", { name: "Buscar espacios" }).click();
  await expect(page).toHaveURL(/strictCity=false/);
  expect(new URL(page.url()).searchParams.get("startsAt")).toBe(
    interval.startsAt,
  );
  expect(new URL(page.url()).searchParams.get("endsAt")).toBe(interval.endsAt);
  expect(new URL(page.url()).searchParams.get("requiredAmenities")).toBe(
    "custom-required",
  );
});

test("sponsors conservan impresiones y clics con la nueva composición", async ({
  page,
}) => {
  const mock = await mockApi(page);
  await page.route("https://example.invalid/**", (route) =>
    route.fulfill({ body: "QA" }),
  );
  await page.goto("/");
  const sponsor = page.getByRole("complementary", { name: "Publicidad" });
  await expect(sponsor).toBeVisible();
  await expect
    .poll(
      () => mock.events.filter((e) => e.event === "sponsor_impression").length,
    )
    .toBe(1);
  const popupPromise = page.waitForEvent("popup");
  await sponsor.getByRole("link").click();
  const popup = await popupPromise;
  await popup.close();
  await expect
    .poll(() => mock.events.filter((e) => e.event === "sponsor_click").length)
    .toBe(1);
  expect(
    await page.evaluate(
      () =>
        !!(
          document
            .querySelector(".sponsor-band")
            .compareDocumentPosition(document.querySelector("#anfitriones")) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ),
  ).toBe(true);
});

for (const role of [null, "customer", "owner", "admin"]) {
  test(`Publicá tus espacios conserva el flujo real para ${role || "invitado"}`, async ({
    page,
  }) => {
    const mock = await mockApi(page, role);
    await page.goto("/");
    await expect(page.locator(".site-header .chosen-logo")).toBeVisible();
    await page.locator(".hosts-cta").click();
    if (!role) {
      await expect(page).toHaveURL(/\/ingresar$/);
      await page
        .getByLabel("Email", { exact: true })
        .fill("qa@example.invalid");
      await page
        .getByLabel("Contraseña", { exact: true })
        .fill("Testing-password-123");
      await page
        .locator("form")
        .getByRole("button", { name: "Ingresar", exact: true })
        .click();
    }
    await expect(page).toHaveURL(/\/propietario$/);
    if (!role || role === "customer")
      await expect(
        page.getByRole("button", { name: "Crear perfil de propietario" }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("tab", { name: "Espacios", exact: true }),
      ).toBeVisible();
    expect(
      mock.writes.filter(
        (path) => path !== "/events" && path !== "/auth/login",
      ),
    ).toEqual([]);
  });
}

test("semántica y contraste de portada con filtros cerrados y abiertos", async ({
  page,
}, info) => {
  await mockApi(page);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-image")).toHaveJSProperty("complete", true);
  for (const expanded of [false, true]) {
    if (expanded) await page.locator(".more-filters").click();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    await info.attach(`axe-home-${expanded}`, {
      body: JSON.stringify(audit),
      contentType: "application/json",
    });
    expect(audit.violations).toEqual([]);
  }
});
