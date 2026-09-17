import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { propertySchema } from "@pyapy/contracts";
import { app } from "../apps/api/src/app.mjs";
import { pool } from "../apps/api/src/db.mjs";
import { deliverNotifications } from "../apps/api/src/worker.mjs";
let owner, client, other, admin, property, secondProperty, cityId;
const auth = (method, path, user) => {
  const agent = request(app);
  return agent[method](`/api/v1${path}`).set(
    "Authorization",
    `Bearer ${user.token}`,
  );
};
async function signup(name) {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Client", "mobile")
    .send({
      name,
      email: `${name}-${randomUUID()}@example.invalid`,
      password: "Testing-password-with-24-chars",
    });
  assert.equal(response.status, 201);
  return response.body;
}
const future = (day = 1) => {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + day + 10);
  start.setUTCHours(12, 0, 0, 0);
  return {
    startsAt: start.toISOString(),
    endsAt: new Date(+start + 4 * 3600000).toISOString(),
  };
};
const body = (day = 1, id = property.id) => ({
  propertyId: id,
  guests: 5,
  ...future(day),
});
test.before(async () => {
  owner = await signup("owner");
  client = await signup("client");
  other = await signup("other");
  admin = await signup("admin");
  await pool.query("UPDATE users SET role='admin' WHERE id=$1", [
    admin.user.id,
  ]);
  assert.equal(
    (
      await auth("post", "/owner-profile", owner).send({
        commercialName: "Propietario de pruebas",
      })
    ).status,
    201,
  );
  const catalog = await request(app).get("/api/v1/catalog");
  cityId = catalog.body.cities[0].id;
  const input = {
    name: "Propiedad de prueba",
    description: "Espacio reservado a pruebas automaticas de pyApy.",
    cityId,
    zone: "Zona de pruebas",
    kind: "Quinta",
    capacity: 10,
    pricePerHour: 25000,
    minHours: 2,
    maxHours: 48,
    openHour: 0,
    closeHour: 24,
    cancellationHours: 24,
    rules: "Solo pruebas.",
    amenities: ["pool"],
    latitude: -25.123456,
    longitude: -57.123456,
    status: "published",
  };
  const response = await auth("post", "/properties", owner).send(input);
  assert.equal(response.status, 201, JSON.stringify(response.body));
  property = response.body;
  secondProperty = (
    await auth("post", "/properties", owner).send({
      ...input,
      name: "Segunda propiedad",
    })
  ).body;
});
test.after(() => pool.end());
test("datos de llegada requieren reserva confirmada y autorizacion por recurso", async () => {
  await auth(
    "put",
    `/owner/properties/${secondProperty.id}/private`,
    owner,
  ).send({
    address: "Llegada de prueba",
    phone: "Contacto privado",
    latitude: -25.12,
    longitude: -57.12,
  });
  const result = await auth("post", "/reservations", client)
    .set("Idempotency-Key", randomUUID())
    .send(body(15, secondProperty.id));
  assert.equal(result.status, 201);
  const id = result.body.reservation.id;
  assert.equal(
    (await auth("get", `/reservations/${id}/arrival`, client)).body.address,
    "Llegada de prueba",
  );
  assert.equal(
    (await auth("get", `/reservations/${id}/arrival`, other)).status,
    404,
  );
  await auth("post", `/reservations/${id}/cancel`, client).send({});
  assert.equal(
    (await auth("get", `/reservations/${id}/arrival`, client)).status,
    404,
  );
});
test("bloqueos cortos no heredan la duracion comercial minima", async () => {
  const interval = future(16);
  interval.endsAt = new Date(
    Date.parse(interval.startsAt) + 30 * 60000,
  ).toISOString();
  const response = await auth("post", "/owner/occupancies", owner)
    .set("Idempotency-Key", randomUUID())
    .send({
      propertyId: property.id,
      guests: 1,
      ...interval,
      kind: "block",
      note: "Mantenimiento",
    });
  assert.equal(response.status, 201);
  assert.equal(response.body.reservation.totalAmount, 0);
});
test("autenticacion real rechaza rol inyectado y credenciales invalidas", async () => {
  assert.equal(
    (
      await request(app).post("/api/v1/auth/register").send({
        name: "Attack",
        email: "attack@example.invalid",
        password: "long-enough-password",
        role: "admin",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await request(app).post("/api/v1/auth/login").send({
        email: "none@example.invalid",
        password: "long-enough-password",
      })
    ).status,
    401,
  );
  assert.equal((await request(app).get("/api/v1/reservations")).status, 401);
  assert.equal((await auth("get", "/admin/users", client)).status, 403);
});
test("sesion cookie exige CSRF, rechaza origen ajeno y bearer malformado", async () => {
  const agent = request.agent(app);
  const signupResponse = await agent.post("/api/v1/auth/register").send({
    name: "Cookie user",
    email: `cookie-${randomUUID()}@example.invalid`,
    password: "Cookie-testing-password-123",
  });
  assert.equal(signupResponse.status, 201);
  assert.match(signupResponse.headers["set-cookie"][0], /HttpOnly/);
  assert.equal((await agent.post("/api/v1/auth/logout").send({})).status, 403);
  assert.equal(
    (
      await agent
        .post("/api/v1/auth/logout")
        .set("Authorization", "bad")
        .send({})
    ).status,
    401,
  );
  assert.equal(
    (
      await agent
        .post("/api/v1/auth/logout")
        .set("X-CSRF-Token", signupResponse.body.csrfToken)
        .set("Origin", "https://evil.example")
        .send({})
    ).status,
    403,
  );
  assert.equal(
    (
      await agent
        .post("/api/v1/auth/logout")
        .set("X-CSRF-Token", signupResponse.body.csrfToken)
        .send({})
    ).status,
    200,
  );
  assert.equal((await agent.get("/api/v1/auth/session")).body.user, null);
});
test("registro publico oculta PII y redondea coordenadas", async () => {
  const response = await auth(
    "put",
    `/owner/properties/${property.id}/private`,
    owner,
  ).send({
    address: "PRIVATE-ADDRESS",
    phone: "PRIVATE-PHONE",
    latitude: -25.1234567,
    longitude: -57.1234567,
  });
  assert.equal(response.status, 200);
  const publicResponse = await request(app).get(
    `/api/v1/properties/${property.id}`,
  );
  assert.equal(publicResponse.status, 200);
  assert.equal(publicResponse.body.latitude, -25.123);
  assert.equal(publicResponse.body.ownerId, undefined);
  assert.ok(!JSON.stringify(publicResponse.body).includes("PRIVATE"));
  assert.equal(
    (await auth("get", `/owner/properties/${property.id}/private`, other))
      .status,
    403,
  );
});
test("propietario ajeno no puede editar ni bloquear un espacio", async () => {
  await auth("post", "/owner-profile", other).send({
    commercialName: "Otro propietario",
  });
  assert.equal(
    (
      await auth("post", "/owner/occupancies", other)
        .set("Idempotency-Key", randomUUID())
        .send({ ...body(2), kind: "block", note: "" })
    ).status,
    404,
  );
  assert.equal(
    (await auth("get", `/owner/properties/${property.id}/private`, other))
      .status,
    404,
  );
});
test("precio y estado son calculados por el servidor", async () => {
  assert.equal(
    (
      await auth("post", "/reservations", client)
        .set("Idempotency-Key", randomUUID())
        .send({ ...body(3), totalAmount: 1 })
    ).status,
    422,
  );
  const response = await auth("post", "/reservations", client)
    .set("Idempotency-Key", randomUUID())
    .send(body(3));
  assert.equal(response.status, 201);
  assert.equal(response.body.reservation.totalAmount, 100000);
  assert.equal(response.body.reservation.kind, "pyapy");
  assert.match(response.body.reservation.locator, /^[A-F0-9]{24}$/);
});
test("diez reservas simultaneas para un mismo intervalo confirman exactamente una", async () => {
  const attempts = await Promise.all(
    Array.from({ length: 10 }, () =>
      auth("post", "/reservations", client)
        .set("Idempotency-Key", randomUUID())
        .send(body(4)),
    ),
  );
  assert.equal(
    attempts.filter((r) => r.status === 201).length,
    1,
    JSON.stringify(attempts.map((r) => r.status)),
  );
  assert.equal(attempts.filter((r) => r.status === 409).length, 9);
});
test("editar reglas no invalida reservas confirmadas ni cambia su precio pactado", async () => {
  const editable = Object.fromEntries(
    Object.keys(propertySchema.shape).map((key) => [key, property[key]]),
  );
  const reservation = (
    await auth("post", "/reservations", client)
      .set("Idempotency-Key", randomUUID())
      .send(body(20))
  ).body.reservation;
  for (const change of [
    { capacity: 4 },
    { minHours: 6 },
    { openHour: 15, closeHour: 20 },
  ]) {
    const result = await auth("put", `/properties/${property.id}`, owner).send({
      ...editable,
      ...change,
    });
    assert.equal(result.status, 409, JSON.stringify(result.body));
    assert.equal(result.body.code, "EXISTING_RESERVATIONS");
  }
  assert.equal(
    (
      await auth("put", `/properties/${property.id}`, owner).send({
        ...editable,
        pricePerHour: 30000,
      })
    ).status,
    200,
  );
  const saved = (
    await pool.query("SELECT total_amount FROM reservations WHERE id=$1", [
      reservation.id,
    ])
  ).rows[0];
  assert.equal(Number(saved.total_amount), 100000);
  assert.equal(
    (await auth("put", `/properties/${property.id}`, owner).send(editable))
      .status,
    200,
  );
});
test("replay concurrente devuelve una reserva y rechaza cambio de contenido", async () => {
  const key = randomUUID();
  const responses = await Promise.all(
    Array.from({ length: 4 }, () =>
      auth("post", "/reservations", client)
        .set("Idempotency-Key", key)
        .send(body(5)),
    ),
  );
  assert.equal(responses.filter((r) => r.status === 201).length, 1);
  assert.equal(new Set(responses.map((r) => r.body.reservation.id)).size, 1);
  assert.equal(
    (
      await auth("post", "/reservations", client)
        .set("Idempotency-Key", key)
        .send(body(5, secondProperty.id))
    ).body.code,
    "IDEMPOTENCY_CONFLICT",
  );
});
test("bloqueos y reservas particulares comparten exclusion con pyApy", async () => {
  for (const [day, kind] of [
    [6, "block"],
    [7, "owner"],
  ]) {
    assert.equal(
      (
        await auth("post", "/owner/occupancies", owner)
          .set("Idempotency-Key", randomUUID())
          .send({ ...body(day), kind, note: "Prueba" })
      ).status,
      201,
    );
    const response = await auth("post", "/reservations", client)
      .set("Idempotency-Key", randomUUID())
      .send(body(day));
    assert.equal(response.status, 409);
  }
});
test("cancelacion comprueba identidad, libera intervalo y no permite falsificar actor", async () => {
  const reservation = (
    await auth("post", "/reservations", client)
      .set("Idempotency-Key", randomUUID())
      .send(body(8))
  ).body.reservation;
  assert.equal(
    (
      await auth("post", `/reservations/${reservation.id}/cancel`, other).send(
        {},
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await auth("post", `/reservations/${reservation.id}/cancel`, client).send(
        { actorRole: "admin" },
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await auth("post", `/reservations/${reservation.id}/cancel`, client).send(
        {},
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await auth("post", "/reservations", client)
        .set("Idempotency-Key", randomUUID())
        .send(body(8))
    ).status,
    201,
  );
});
test("intervalos contiguos son validos y capacidad es obligatoria", async () => {
  const interval = future(9);
  assert.equal(
    (
      await auth("post", "/reservations", client)
        .set("Idempotency-Key", randomUUID())
        .send({ ...body(9), guests: 11 })
    ).status,
    422,
  );
  assert.equal(
    (
      await auth("post", "/reservations", client)
        .set("Idempotency-Key", randomUUID())
        .send(body(9))
    ).status,
    201,
  );
  assert.equal(
    (
      await auth("post", "/reservations", client)
        .set("Idempotency-Key", randomUUID())
        .send({
          propertyId: property.id,
          guests: 1,
          startsAt: interval.endsAt,
          endsAt: new Date(
            Date.parse(interval.endsAt) + 4 * 3600000,
          ).toISOString(),
        })
    ).status,
    201,
  );
});
test("busqueda muestra alternativas y descarta capacidad insuficiente", async () => {
  const result = await request(app)
    .get("/api/v1/properties")
    .query({ city: "Ciudad inexistente", guests: 2 });
  assert.equal(result.status, 200);
  assert.equal(result.body.items.length, 0);
  assert.ok(result.body.alternatives.length >= 1);
  assert.equal(
    (await request(app).get("/api/v1/properties").query({ guests: 100 })).body
      .items.length,
    0,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/v1/properties")
        .query({ city: "' OR 1=1 --", guests: 2 })
    ).status,
    200,
  );
});
test("archivos se validan por contenido; privados no son accesibles por UUID conocido", async () => {
  const invalid = await auth(
    "post",
    `/properties/${property.id}/images`,
    owner,
  ).attach("image", Buffer.from('<svg onload="alert(1)">'), {
    filename: "bad.jpg",
    contentType: "image/jpeg",
  });
  assert.equal(invalid.status, 422);
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "#194b3b" },
  })
    .png()
    .toBuffer();
  const uploaded = await auth(
    "post",
    `/properties/${property.id}/images`,
    owner,
  ).attach("image", png, {
    filename: "../../image.png",
    contentType: "image/png",
  });
  assert.equal(uploaded.status, 201);
  assert.equal((await request(app).get(uploaded.body.url)).status, 200);
  await pool.query("UPDATE properties SET status='draft' WHERE id=$1", [
    property.id,
  ]);
  assert.equal((await request(app).get(uploaded.body.url)).status, 404);
  assert.equal(
    (await auth("get", `/media/${uploaded.body.id}`, owner)).status,
    200,
  );
  await pool.query("UPDATE properties SET status='published' WHERE id=$1", [
    property.id,
  ]);
});
test("resenas requieren estadia terminada y notificaciones se entregan fuera de la reserva", async () => {
  const result = await auth("post", "/reviews", client).send({
    reservationId: randomUUID(),
    rating: 5,
    comment: "Una resena no autorizada.",
  });
  assert.equal(result.status, 403);
  let delivered = 0;
  while (await deliverNotifications()) delivered++;
  assert.ok(delivered > 0);
  const notifications = await auth("get", "/notifications", client);
  assert.ok(notifications.body.items.length > 0);
});
test("administracion modifica permisos efectivos, registra auditoria y revoca sesiones", async () => {
  assert.equal(
    (
      await auth("patch", `/admin/users/${other.user.id}`, admin).send({
        active: false,
      })
    ).status,
    200,
  );
  assert.equal((await auth("get", "/reservations", other)).status, 401);
  const result = await auth("get", "/admin/audit", admin);
  assert.ok(
    result.body.items.some(
      (r) => r.action === "user_active_change" && r.actor_id === admin.user.id,
    ),
  );
  await assert.rejects(
    () => pool.query("DELETE FROM audit_logs WHERE action='register'"),
    /append only/,
  );
});
