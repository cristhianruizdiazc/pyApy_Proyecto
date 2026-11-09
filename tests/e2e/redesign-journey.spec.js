import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { localInterval } from "@pyapy/contracts";

// Real API throughout: the occupied interval must produce an actual SQL
// alternative, which survives return/login before an explicit reservation.
test("alternativa real conserva el recorrido hasta reservar y cancelar", async ({
  page,
  request,
}) => {
  const accounts = JSON.parse(
    await readFile(".local/demo-accounts.json", "utf8"),
  );
  const login = await request.post("/api/v1/auth/login", {
    headers: { "X-Client": "mobile" },
    data: accounts.owner,
  });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const catalog = await (await request.get("/api/v1/catalog")).json();
  const input = {
    name: `Recorrido ficticio ${randomUUID().slice(0, 8)}`,
    description:
      "Espacio ficticio aislado para comprobar búsqueda, retorno, acceso y reserva.",
    cityId: catalog.cities[0].id,
    zone: "Pruebas de rediseño",
    kind: "Quinta",
    capacity: 1000,
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
    rules: "Espacio exclusivo para pruebas automatizadas.",
  };
  const created = await request.post("/api/v1/properties", {
    headers,
    data: input,
  });
  expect(created.status()).toBe(201);
  const property = await created.json();
  try {
    const day = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    const original = localInterval(day, "09:00", "13:00");
    const blocked = await request.post("/api/v1/owner/occupancies", {
      headers: { ...headers, "Idempotency-Key": randomUUID() },
      data: {
        propertyId: property.id,
        ...original,
        guests: 1,
        kind: "block",
        note: "Forzar una alternativa real en la copia de pruebas",
      },
    });
    expect(blocked.status()).toBe(201);
    // High capacity separates this fixture from the demo catalogue without
    // intercepting search responses or relying on result order.
    const query = new URLSearchParams({ ...original, guests: "999" });
    const search = await request.get(`/api/v1/properties?${query}`);
    expect(search.status()).toBe(200);
    const results = await search.json();
    expect(results.items.some((p) => p.id === property.id)).toBe(false);
    const alternative = results.otherDates.find((p) => p.id === property.id);
    expect(alternative?.proposedInterval).toBeTruthy();
    expect(alternative.proposedInterval).not.toEqual(original);

    await page.goto(`/?${query}`);
    const card = page.locator(
      `.alternatives [data-property-id="${property.id}"] .card-title`,
    );
    await card.click();
    const selectedUrl = page.url();
    expect(new URL(selectedUrl).searchParams.get("startsAt")).toBe(
      alternative.proposedInterval.startsAt,
    );
    await page.getByRole("link", { name: "Volver a resultados" }).click();
    expect(new URL(page.url()).searchParams.get("startsAt")).toBe(
      original.startsAt,
    );
    await card.click();
    expect(page.url()).toBe(selectedUrl);
    await page
      .getByRole("button", { name: "Consultar disponibilidad" })
      .click();
    await expect(page).toHaveURL(/\/ingresar$/);
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    await page
      .getByLabel("Nombre", { exact: true })
      .fill("Cliente recorrido QA");
    await page
      .getByLabel("Email", { exact: true })
      .fill(`journey-${randomUUID()}@example.invalid`);
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill("Journey-testing-password-123");
    await page.getByRole("button", { name: "Crear mi cuenta" }).click();
    await expect(page).toHaveURL(selectedUrl);
    await expect(page.getByLabel("Personas", { exact: true })).toHaveValue(
      "999",
    );
    await expect(page.locator(".quote")).toHaveCount(0);
    await expect(page.locator(".booking-success")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Consultar disponibilidad" })
      .click();
    await expect(page.locator(".quote")).toContainText("40.000");
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await expect(
      page.getByRole("heading", { name: "Tu escapada está confirmada." }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Ver mi reserva" }).click();
    const row = page
      .locator(".reservation-row")
      .filter({ hasText: property.name });
    await expect(row).toContainText("Confirmada");
    const reservations = await (
      await page.request.get("/api/v1/reservations")
    ).json();
    const booked = reservations.items.find((r) => r.propertyId === property.id);
    expect(booked.guests).toBe(999);
    expect(Date.parse(booked.startsAt)).toBe(
      Date.parse(alternative.proposedInterval.startsAt),
    );
    expect(Date.parse(booked.endsAt)).toBe(
      Date.parse(alternative.proposedInterval.endsAt),
    );
    await row
      .getByRole("button", { name: `Cancelar reserva en ${property.name}` })
      .click();
    await page
      .getByRole("button", { name: "Cancelar reserva", exact: true })
      .click();
    await expect(row).toContainText("Cancelada");
  } finally {
    const reservations = await (
      await request.get("/api/v1/owner/reservations", { headers })
    ).json();
    for (const r of reservations.items || []) {
      if (r.propertyId === property.id && r.status === "confirmed") {
        const cancelled = await request.post(
          `/api/v1/reservations/${r.id}/cancel`,
          { headers, data: {} },
        );
        expect(cancelled.status()).toBe(200);
      }
    }
    const draft = await request.put(`/api/v1/properties/${property.id}`, {
      headers,
      data: { ...input, status: "draft" },
    });
    expect(draft.status()).toBe(200);
  }
});
