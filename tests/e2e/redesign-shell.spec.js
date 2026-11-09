import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every API request is intercepted; this suite never writes to a database.
async function mockApi(page, role = null) {
  let user = role ? { id: `shell-${role}`, name: "Prueba", role } : null;
  let logoutFails = false;
  let logoutCalls = 0;
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    let json = { items: [] };
    if (path === "/auth/session") json = { user, csrfToken: "shell-test" };
    else if (path === "/auth/logout") {
      logoutCalls++;
      if (logoutFails)
        return route.fulfill({
          status: 503,
          json: { message: "No pudimos cerrar sesión. Intentá de nuevo." },
        });
      user = null;
      json = { ok: true };
    } else if (path === "/catalog")
      json = { cities: [], amenities: [], plans: [] };
    else if (path === "/properties")
      json = { items: [], total: 0, alternatives: [], otherDates: [] };
    await route.fulfill({ json });
  });
  return {
    failLogout: (value) => {
      logoutFails = value;
    },
    logoutCalls: () => logoutCalls,
  };
}

async function openSession(page, mobile) {
  if (mobile) await page.getByRole("button", { name: "Abrir menú" }).click();
  else await page.locator(".account-menu summary").click();
  return page.locator(mobile ? ".mobile-nav-actions" : ".account-links");
}

test("base visual local, marca y estructura adaptable sin desbordamiento", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Barrido de tamaños desde escritorio",
  );
  await mockApi(page);
  const externalFonts = [];
  page.on("request", (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url()))
      externalFonts.push(request.url());
  });
  await page.goto("/ayuda");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Fraunces");
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Poppins");
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('550 32px "Fraunces"') &&
        document.fonts.check('400 16px "Poppins"'),
    ),
  ).toBe(true);
  for (const width of [
    320, 360, 390, 480, 600, 601, 780, 781, 820, 980, 981, 1024, 1180, 1440,
    1920,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `${width}px`,
    ).toBe(true);
    await expect(page.locator(".site-header .chosen-logo")).toBeVisible();
    await expect(page.locator(".site-header")).toHaveCSS("position", "sticky");
    if (width <= 980)
      await expect(
        page.getByRole("button", { name: "Abrir menú" }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole("navigation", { name: "Navegación principal" }),
      ).toBeVisible();
  }
  expect(externalFonts).toEqual([]);
});

test("menú móvil: teclado, Escape, clic exterior, cambio de tamaño y ruta", async ({
  page,
}) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ayuda");
  const button = page.getByRole("button", { name: "Abrir menú" });
  const navigation = page.getByRole("navigation", {
    name: "Navegación principal",
  });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(
    navigation.getByRole("link", { name: "Explorar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
  await expect(navigation).toBeHidden();
  await button.click();
  await page.locator(".site-header .brand").click();
  await expect(page).toHaveURL("/");
  await expect(navigation).toBeHidden();
  await button.click();
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(navigation).toBeHidden();
  await button.click();
  await page.locator("#main").focus();
  await expect(navigation).toBeHidden();
  await button.click();
  await navigation
    .getByRole("link", { name: "Cómo funciona", exact: true })
    .click();
  await expect(page).toHaveURL(/\/#como-funciona$/);
  await expect(navigation).toBeHidden();
});

for (const role of ["client", "owner", "admin"]) {
  test(`accesos de ${role} en portada, menú y rutas internas`, async ({
    page,
  }, info) => {
    await mockApi(page, role);
    await page.goto("/");
    const mobile = info.project.name === "mobile";
    if (!mobile)
      await expect(page.locator(".account-menu summary")).toHaveAccessibleName(
        /^Mi cuenta\s*:\s*Prueba$/,
      );
    const links = await openSession(page, mobile);
    for (const name of ["Mi cuenta", "Guardados", "Mis reservas"])
      await expect(
        links.getByRole("link", { name, exact: true }),
      ).toBeVisible();
    await expect(
      links.getByRole("link", { name: "Mi espacio", exact: true }),
    ).toHaveCount(role === "owner" ? 1 : 0);
    await expect(
      links.getByRole("link", { name: "Administración", exact: true }),
    ).toHaveCount(role === "admin" ? 1 : 0);
    await page.keyboard.press("Escape");
    await expect(
      page.locator(mobile ? ".mobile-menu" : ".account-menu summary"),
    ).toBeFocused();
    if (!mobile) {
      await openSession(page, false);
      await links.getByRole("link", { name: "Mi cuenta", exact: true }).focus();
      await page.setViewportSize({ width: 820, height: 900 });
      await expect(page.locator(".mobile-menu")).toBeFocused();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(
        page
          .locator(".main-nav")
          .getByRole("link", { name: "Explorar", exact: true }),
      ).toBeFocused();
    }
    await openSession(page, mobile);
    await links.getByRole("link", { name: "Mi cuenta", exact: true }).click();
    await expect(page).toHaveURL("/cuenta");
    await expect(
      page.getByRole("heading", { name: "Hola, Prueba.", exact: true }),
    ).toBeVisible();
    if (mobile) await expect(page.locator(".main-nav")).toBeHidden();
    else
      await expect(page.locator(".account-menu")).not.toHaveAttribute("open");
  });
}

test("error al salir conserva sesión y permite reintentar", async ({
  page,
}, info) => {
  const mock = await mockApi(page, "owner");
  mock.failLogout(true);
  await page.goto("/ayuda");
  const mobile = info.project.name === "mobile";
  const links = await openSession(page, mobile);
  await links
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(page.locator(".site-header").getByRole("alert")).toContainText(
    "No pudimos cerrar sesión",
  );
  expect(mock.logoutCalls()).toBe(1);
  await expect(
    links.getByRole("link", { name: "Mi espacio", exact: true }),
  ).toBeVisible();
  mock.failLogout(false);
  await links
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(
    page
      .locator(".header-actions")
      .getByRole("link", { name: "Ingresar", exact: true }),
  ).toBeVisible();
  expect(mock.logoutCalls()).toBe(2);
});

test("pie conectado a catálogo, anfitrión y ayuda; salto de contenido con foco", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/ayuda");
  const skip = page.getByRole("link", { name: "Ir al contenido", exact: true });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Quintas", exact: true })
    .click();
  await expect(page).toHaveURL(/\?kind=Quinta#results$/);
  await expect(
    page.getByRole("button", { name: "Quintas", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Publicar mi espacio", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ingresar$/);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Cómo funciona", exact: true }),
  ).toBeVisible();
});

test("contraste y semántica de estructura compartida en estados representativos", async ({
  page,
}, info) => {
  await mockApi(page, "admin");
  await page.goto("/ayuda");
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const open of [false, true]) {
    if (open) await openSession(page, info.project.name === "mobile");
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    await info.attach(`axe-${open ? "open" : "closed"}`, {
      body: JSON.stringify(audit),
      contentType: "application/json",
    });
    expect(audit.violations).toEqual([]);
  }
  expect(
    await page
      .locator(".main-nav a")
      .first()
      .evaluate((el) => getComputedStyle(el, "::after").transitionDuration),
  ).toBe("0s");
});
