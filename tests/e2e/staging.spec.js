import { test, expect } from "@playwright/test";

test("staging entrega web y completa una sesion segura", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();

  const email = `phase24-${Date.now()}@staging.pyapy.invalid`;
  const registration = await page.request.post("/api/v1/auth/register", {
    headers: { Origin: baseURL },
    data: {
      email,
      name: "Cuenta ficticia fase 24",
      password: "Phase-24-staging-password-123",
    },
  });
  expect(registration.status()).toBe(201);
  const registered = await registration.json();
  expect(registered.user.email).toBe(email);

  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(
    (cookie) => cookie.name === "pyapy_session",
  );
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.secure).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");

  const session = await page.request.get("/api/v1/auth/session");
  expect(session.ok()).toBe(true);
  const current = await session.json();
  expect(current.user.email).toBe(email);

  const logout = await page.request.post("/api/v1/auth/logout", {
    headers: { Origin: baseURL, "X-CSRF-Token": current.csrfToken },
  });
  expect(logout.ok()).toBe(true);
});
