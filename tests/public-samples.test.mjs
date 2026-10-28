import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import request from "supertest";
import { app } from "../apps/api/src/app.mjs";
import { pool } from "../apps/api/src/db.mjs";

test.after(() => pool.end());

test("six public demo listings remain searchable with their inactive owner", async () => {
  const samples = (
    await pool.query(
      `SELECT p.id,p.name,u.active FROM properties p JOIN users u ON u.id=p.owner_id
       WHERE u.email='catalog-demo-owner@pyapy.invalid' AND p.is_public_sample`,
    )
  ).rows;
  assert.equal(samples.length, 6);
  assert.ok(samples.every((p) => !p.active));
  assert.deepEqual(
    samples.map((p) => p.name).sort(),
    [
      "Casa del Lago",
      "La Sagrada",
      "El Patio de Altos",
      "La Escondida",
      "Bungalow Arasá",
      "Maria",
    ].sort(),
  );
  const search = await request(app).get("/api/v1/properties");
  assert.equal(search.status, 200);
  for (const sample of samples) {
    const result = search.body.items.find((p) => p.id === sample.id);
    assert.ok(result, `${sample.name} must appear in the public catalog`);
    assert.equal(result.isPublicSample, true);
    assert.equal(result.isDemo, true);
    assert.equal(result.verified, false);
    assert.ok(result.images.length);
    assert.ok(result.amenities.length);
    const detail = await request(app).get(`/api/v1/properties/${sample.id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.isPublicSample, true);
  }
});

test("real property names, cities and all 19 original photos replace three old samples", async () => {
  const expected = [
    {
      name: "La Escondida",
      city: "Luque",
      folder: "la-escondida",
      prefix: "luque",
      count: 8,
    },
    {
      name: "La Sagrada",
      city: "San Bernardino",
      folder: "la-sagrada",
      prefix: "sanber",
      count: 7,
    },
    {
      name: "Maria",
      city: "Atyra",
      folder: "maria",
      prefix: "atyra",
      count: 4,
    },
  ];
  for (const property of expected) {
    const search = await request(app)
      .get("/api/v1/properties")
      .query({ city: property.city });
    assert.equal(search.status, 200);
    const p = search.body.items.find((item) => item.name === property.name);
    assert.ok(p, `${property.name} must be searchable in ${property.city}`);
    assert.equal(p.kind, "Quinta");
    assert.equal(p.images.length, property.count);
    assert.ok(!p.description.includes("ficticia"));
    for (let n = 1; n <= property.count; n++) {
      const image = p.images[n - 1];
      assert.equal(image.url, `/properties/${property.folder}/${n}.jpeg`);
      assert.equal(image.alt, `${property.name}, fotografía ${n}`);
      const original =
        property.prefix === "sanber" && n === 5
          ? "sanber5jpeg.jpeg"
          : `${property.prefix}${n}.jpeg`;
      const photo = await readFile(`apps/web/public${image.url}`);
      assert.equal(photo.subarray(0, 3).toString("hex"), "ffd8ff");
      // Original source files stay in the user's local Photos folder.
      // CI checks the published assets; local verification also checks fidelity.
      if (existsSync(`Photos/${original}`))
        assert.deepEqual(photo, await readFile(`Photos/${original}`));
    }
  }
  const old = await pool.query(
    `SELECT p.id FROM properties p JOIN users u ON u.id=p.owner_id
     WHERE u.email='catalog-demo-owner@pyapy.invalid'
     AND p.name IN ('Quinta Tajy','Quinta Yvytu','Refugio Ysyry')`,
  );
  assert.equal(old.rowCount, 0);
});

test("public samples cannot be quoted or booked even if their owner is activated", async () => {
  const registered = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Client", "mobile")
    .send({
      name: "Sample test",
      email: `${randomUUID()}@example.invalid`,
      password: "Testing-password-with-24-chars",
    });
  assert.equal(registered.status, 201);
  const sample = (
    await pool.query(
      "SELECT id,owner_id FROM properties WHERE is_public_sample LIMIT 1",
    )
  ).rows[0];
  const startsAt = new Date(Date.now() + 30 * 86400000).toISOString();
  const endsAt = new Date(Date.parse(startsAt) + 4 * 3600000).toISOString();
  const input = { propertyId: sample.id, guests: 2, startsAt, endsAt };
  try {
    for (const active of [false, true]) {
      await pool.query("UPDATE users SET active=$1 WHERE id=$2", [
        active,
        sample.owner_id,
      ]);
      for (const path of ["/reservations/quote", "/reservations"]) {
        const response = await request(app)
          .post(`/api/v1${path}`)
          .set("Authorization", `Bearer ${registered.body.token}`)
          .set("Idempotency-Key", randomUUID())
          .send(input);
        assert.equal(response.status, 422, JSON.stringify(response.body));
        assert.equal(response.body.code, "SAMPLE_PROPERTY");
      }
    }
    assert.equal(
      (
        await pool.query("SELECT 1 FROM reservations WHERE property_id=$1", [
          sample.id,
        ])
      ).rowCount,
      0,
    );
  } finally {
    await pool.query("UPDATE users SET active=false WHERE id=$1", [
      sample.owner_id,
    ]);
  }
});
