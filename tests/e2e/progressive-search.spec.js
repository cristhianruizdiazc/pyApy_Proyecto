import { test, expect } from "@playwright/test";
import { localInterval } from "@pyapy/contracts";

test("alternatives show differences and explicitly transfer the chosen interval", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/v1/properties");
  expect(response.ok()).toBeTruthy();
  const p = (await response.json()).items[0];
  expect(p).toBeTruthy();
  const original = localInterval("2030-01-10", "09:00", "13:00");
  const proposed = localInterval("2030-01-11", "09:00", "13:00");
  await page.route("**/api/v1/properties?*", (route) =>
    route.fulfill({
      json: {
        items: [],
        total: 0,
        page: 1,
        alternatives: [],
        otherDates: [
          {
            ...p,
            stage: "schedule",
            proposedInterval: proposed,
            availabilityChecked: true,
            available: true,
            estimatedHours: 4,
            estimatedTotal: 4 * p.pricePerHour,
          },
        ],
        searchLimited: false,
      },
    }),
  );
  await page.goto(`/?${new URLSearchParams({ ...original, guests: "5" })}`);
  await expect(
    page.getByRole("heading", {
      name: "Encontramos 1 opciones cercanas a lo que buscás",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Al abrir se seleccionará este intervalo.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator('input[name="date"]').first()).toHaveValue(
    "2030-01-10",
  );
  await page.locator(".alternatives .card-title").click();
  await expect(page).toHaveURL(/searchStage=schedule/);
  const url = new URL(page.url());
  expect(url.searchParams.get("startsAt")).toBe(proposed.startsAt);
  expect(url.searchParams.get("guests")).toBe("5");
  await expect(
    page.locator('.booking-panel input[type="date"]').first(),
  ).toHaveValue("2030-01-11");
});

test("technical failure is separate from an empty search; strict controls persist in URL", async ({
  page,
}) => {
  await page.route("**/api/v1/properties?*", (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "TEST_FAILURE",
        message: "Consulta temporalmente indisponible",
      },
    }),
  );
  await page.goto("/?city=Aregua");
  await expect(
    page.getByRole("button", { name: "Reintentar búsqueda" }),
  ).toBeVisible();
  await expect(
    page.getByText("No hay coincidencias exactas.", { exact: false }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: /personalizar|filtros|más opciones|opciones/i,
    })
    .first()
    .click();
  await page.getByLabel("Mantener estrictamente la ciudad").check();
  await page.getByLabel("Mantener estrictamente el presupuesto").check();
  await page.getByLabel("Parrilla indispensable").check();
  await page
    .locator("form")
    .filter({ has: page.locator('[name="city"]') })
    .getByRole("button", { name: /buscar/i })
    .click();
  await expect(page).toHaveURL(/strictCity=true/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("strictBudget")).toBe("true");
  expect(params.get("requiredAmenities")).toContain("grill");
});
