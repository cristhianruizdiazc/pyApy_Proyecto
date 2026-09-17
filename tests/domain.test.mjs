import test from "node:test";
import assert from "node:assert/strict";
import { bookingSchema, registerSchema, localInterval } from "@pyapy/contracts";
import { synchronize } from "@pyapy/contracts/offline";
import { validatePeriod, scoreProperty } from "../apps/api/src/properties.mjs";
import { pool } from "../apps/api/src/db.mjs";
test.after(() => pool.end());
test("contratos rechazan rol administrativo y precio arbitrario", () => {
  assert.equal(
    registerSchema.safeParse({
      name: "Cliente",
      email: "test@example.com",
      password: "a-valid-long-password",
      role: "admin",
    }).success,
    false,
  );
  assert.equal(
    bookingSchema.safeParse({
      propertyId: crypto.randomUUID(),
      startsAt: "2030-01-01T10:00:00Z",
      endsAt: "2030-01-01T14:00:00Z",
      guests: 2,
      totalAmount: 1,
    }).success,
    false,
  );
});
test("intervalos de Paraguay cruzan medianoche sin alterar su duracion", () => {
  const interval = localInterval("2030-01-01", "22:00", "06:00");
  assert.equal(
    (Date.parse(interval.endsAt) - Date.parse(interval.startsAt)) / 3600000,
    8,
  );
  assert.equal(
    validatePeriod(
      { min_hours: 2, max_hours: 10, open_hour: 22, close_hour: 6 },
      interval.startsAt,
      interval.endsAt,
    ),
    8,
  );
  assert.throws(
    () =>
      validatePeriod(
        { min_hours: 2, max_hours: 10, open_hour: 8, close_hour: 18 },
        interval.startsAt,
        interval.endsAt,
      ),
    (e) => e.code === "OPENING_HOURS",
  );
});
test("pesos cambian el ranking sin relajar capacidad obligatoria", () => {
  const p = {
    available: true,
    city: "Aregua",
    estimatedTotal: 100000,
    amenities: ["pool"],
  };
  const input = { city: "Luque", budget: 200000, wanted: ["pool"] };
  assert.equal(
    scoreProperty(p, input, {
      availability: 35,
      city: 20,
      capacity: 15,
      budget: 15,
      amenities: 15,
    }),
    80,
  );
  assert.equal(scoreProperty(p, input, { city: 100 }), 0);
});
test("offline conserva idempotencia, distingue conflicto y reintenta fallo de red", async () => {
  const keys = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  const queue = keys.map((key) => ({ key, status: "pending" }));
  const saved = [];
  const result = await synchronize(
    queue,
    async (item) => {
      if (item.key === keys[0]) return { locator: "confirmed-by-server" };
      if (item.key === keys[1])
        throw Object.assign(new Error("Horario ocupado"), { status: 409 });
      throw new Error("Sin conexion");
    },
    async (state) => saved.push(structuredClone(state)),
  );
  assert.deepEqual(
    result.map((x) => x.status),
    ["synced", "conflict", "pending"],
  );
  assert.deepEqual(
    result.map((x) => x.key),
    keys,
  );
  assert.ok(saved.some((s) => s[0].status === "syncing"));
  assert.equal(queue[0].status, "pending");
});
