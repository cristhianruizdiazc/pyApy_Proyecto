import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../apps/api/src/app.mjs";
import { pool } from "../apps/api/src/db.mjs";
import {
  searchConfig,
  searchConfigSchema,
} from "../apps/api/src/search-config.mjs";
import { validatePeriod } from "../apps/api/src/properties.mjs";
import { localInterval } from "@pyapy/contracts";
import {
  detailHref,
  draftFromSearch,
  inputFromDraft,
} from "../apps/web/src/booking-selection.js";

const city = `Search-${randomUUID()}`,
  nearby = `Near-${randomUUID()}`;
const ids = {};
let owner, cityId, nearId;
const interval = localInterval("2030-01-10", "09:00", "13:00");
const query = {
  city,
  kind: "Bungalow",
  guests: 10,
  budget: 100000,
  amenities: "grill",
  requiredAmenities: "pool",
  ...interval,
};
async function search(extra = {}) {
  const response = await request(app)
    .get("/api/v1/properties")
    .query({ ...query, ...extra });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body;
}
const all = (r) => [...r.items, ...r.alternatives, ...r.otherDates];
test.before(async () => {
  owner = (
    await pool.query(
      "INSERT INTO users(email,name,password_hash,role) VALUES($1,'Search owner','unused','owner') RETURNING id",
      [`${randomUUID()}@example.invalid`],
    )
  ).rows[0].id;
  cityId = (
    await pool.query(
      "INSERT INTO geographic_locations(city,department,latitude,longitude) VALUES($1,'Test',-25.300,-57.300) RETURNING id",
      [city],
    )
  ).rows[0].id;
  nearId = (
    await pool.query(
      "INSERT INTO geographic_locations(city,department,latitude,longitude) VALUES($1,'Test',-25.400,-57.300) RETURNING id",
      [nearby],
    )
  ).rows[0].id;
  async function property(
    name,
    {
      location = cityId,
      price = 25000,
      capacity = 10,
      services = ["pool", "grill"],
      latitude = -25.3,
    } = {},
  ) {
    const id = (
      await pool.query(
        "INSERT INTO properties(owner_id,city_id,name,description,zone,kind,capacity,latitude,longitude,status,created_at) VALUES($1,$2,$3,'Search fixture','Test','Bungalow',$4,$5,-57.300,'published','2020-01-01') RETURNING id",
        [owner, location, name, capacity, latitude],
      )
    ).rows[0].id;
    await pool.query(
      "INSERT INTO pricing_rules(property_id,price_per_hour) VALUES($1,$2)",
      [id, price],
    );
    await pool.query(
      "INSERT INTO availability_rules(property_id,min_hours,max_hours,open_hour,close_hour) VALUES($1,2,8,9,17)",
      [id],
    );
    for (const code of services)
      await pool.query("INSERT INTO property_amenities VALUES($1,$2)", [
        id,
        code,
      ]);
    ids[name] = id;
  }
  await property("exact");
  await property("exact2");
  await property("location", { location: nearId, latitude: -25.4 });
  await property("budget", { price: 30000 });
  await property("tooExpensive", { price: 30001 });
  await property("services", { services: ["pool"] });
  await property("combination", {
    location: nearId,
    latitude: -25.4,
    services: ["pool"],
  });
  await property("small", { capacity: 9 });
  await property("missingRequired", { services: ["grill"] });
  await property("schedule");
  await pool.query(
    "INSERT INTO reservations(property_id,user_id,kind,starts_at,ends_at,guests,total_amount,locator,idempotency_key,request_hash,cancellation_hours) VALUES($1,$2,'block',$3,$4,1,0,$5,$6,'test',0)",
    [
      ids.schedule,
      owner,
      interval.startsAt,
      localInterval("2030-01-10", "09:00", "17:00").endsAt,
      randomUUID(),
      randomUUID(),
    ],
  );
  // Newer candidates would previously hide every useful property above.
  await pool.query(
    `WITH inserted AS (INSERT INTO properties(owner_id,city_id,name,description,zone,kind,capacity,latitude,longitude,status) SELECT $1,$2,'Decoy','Test','Test','Bungalow',10,-25.3,-57.3,'published' FROM generate_series(1,520) RETURNING id), prices AS (INSERT INTO pricing_rules SELECT id,1000000,'PYG' FROM inserted) INSERT INTO availability_rules SELECT id,1,1,0,24,24 FROM inserted`,
    [owner, cityId],
  );
});
test.after(() => pool.end());

test("SQL period rules match authoritative validation including overnight boundaries", async () => {
  for (const [start, end, open, close, min, max] of [
    ["22:00", "06:00", 22, 6, 2, 10],
    ["21:00", "06:00", 22, 6, 2, 10],
    ["09:00", "17:00", 9, 17, 4, 8],
    ["09:00", "18:00", 9, 17, 4, 12],
    ["09:00", "10:00", 0, 24, 2, 8],
    ["09:00", "09:00", 0, 24, 2, 24],
  ]) {
    const i = localInterval("2030-02-01", start, end);
    let valid = true;
    try {
      validatePeriod(
        { min_hours: min, max_hours: max, open_hour: open, close_hour: close },
        i.startsAt,
        i.endsAt,
      );
    } catch {
      valid = false;
    }
    const result = await pool.query(
      "SELECT search_period_valid($1,$2,$3,$4,$5,$6) valid",
      [i.startsAt, i.endsAt, min, max, open, close],
    );
    assert.equal(result.rows[0].valid, valid);
  }
});

test("SQL selection reaches oldest exact matches beyond 500 and paginates deterministically", async () => {
  const r = await search();
  assert.equal(r.total, 2);
  assert.equal(r.searchLimited, false);
  assert.deepEqual(
    r.items.map((p) => p.id),
    [ids.exact, ids.exact2].sort(),
  );
  assert.deepEqual(
    (await search()).items.map((p) => p.id),
    r.items.map((p) => p.id),
  );
  assert.equal((await search({ page: 2 })).items.length, 0);
  assert.deepEqual(
    r.alternatives.map((p) => p.stage),
    ["location", "budget", "services"],
  );
  assert.equal(new Set(all(r).map((p) => p.id)).size, all(r).length);
  assert.ok(
    all(r).every((p) => p.capacity >= 10 && p.amenities.includes("pool")),
  );
  assert.ok(
    !all(r).some((p) =>
      [
        ids.combination,
        ids.small,
        ids.tooExpensive,
        ids.missingRequired,
      ].includes(p.id),
    ),
  );
  assert.deepEqual(
    (await search({ sort: "price" })).alternatives.map((p) => p.stage),
    ["location", "budget", "services"],
  );
});
test("indispensable city, budget, services and type are never relaxed", async () => {
  const r = await search({
    strictCity: true,
    strictBudget: true,
    requiredAmenities: "pool,grill",
  });
  assert.equal(r.alternatives.length, 0);
  assert.ok(
    all(r).every(
      (p) =>
        p.city === city &&
        p.estimatedTotal <= 100000 &&
        p.amenities.includes("grill"),
    ),
  );
  assert.equal(all(await search({ kind: "Quincho" })).length, 0);
});
test("total uses requested rounded hours; overprice is inclusive at 20 percent", async () => {
  const r = await search();
  const b = r.alternatives.find((p) => p.stage === "budget");
  assert.equal(b.id, ids.budget);
  assert.equal(b.estimatedTotal, 120000);
  assert.equal(b.budgetExcess, 20000);
  assert.equal(b.budgetExcessPercent, 20);
  const shorter = await search({
    endsAt: new Date(
      Date.parse(interval.startsAt) + 2.5 * 3600000,
    ).toISOString(),
  });
  assert.equal(
    shorter.items.find((p) => p.id === ids.budget).estimatedTotal,
    90000,
  );
});
test("geographic radius includes boundary and excludes just outside", async () => {
  const p = (await search()).alternatives.find((p) => p.stage === "location");
  assert.ok(p.distanceKm > 11 && p.distanceKm < 12);
  assert.equal(p.distanceReference.type, "city_reference");
  const original = searchConfig.radiiKm;
  try {
    searchConfig.radiiKm = [p.distanceKm];
    assert.ok((await search()).alternatives.some((v) => v.id === p.id));
    searchConfig.radiiKm = [p.distanceKm - 0.000001];
    assert.ok(!(await search()).alternatives.some((v) => v.id === p.id));
  } finally {
    searchConfig.radiiKm = original;
  }
});
test("alternative interval respects blocks, opening and duration and reaches booking input", async () => {
  const r = await search();
  const p = r.otherDates.find((p) => p.id === ids.schedule);
  assert.ok(p);
  assert.equal(p.availabilityStatus, "verified");
  assert.deepEqual(
    p.proposedInterval,
    localInterval("2030-01-11", "09:00", "13:00"),
  );
  validatePeriod(
    { min_hours: 2, max_hours: 8, open_hour: 9, close_hour: 17 },
    p.proposedInterval.startsAt,
    p.proposedInterval.endsAt,
  );
  const original = new URLSearchParams({ ...interval, guests: "10" });
  const href = detailHref(p.id, original, p);
  const draft = draftFromSearch(href.split("?")[1], 10).draft;
  assert.deepEqual(inputFromDraft(draft, p.id), {
    propertyId: p.id,
    guests: 10,
    ...p.proposedInterval,
  });
  assert.equal(original.get("startsAt"), interval.startsAt);
  assert.equal(
    (
      await search({
        endsAt: localInterval("2030-01-10", "09:00", "09:00").endsAt,
      })
    ).otherDates.length,
    0,
  );
});
test("no date is an estimate without verified availability, config rejects unsafe bounds", async () => {
  const r = await search({ startsAt: undefined, endsAt: undefined });
  assert.equal(r.otherDates.length, 0);
  assert.ok(
    all(r).every(
      (p) =>
        !p.available &&
        !p.availabilityChecked &&
        p.availabilityStatus === "unchecked" &&
        p.estimateBasis === "property_minimum_hours",
    ),
  );
  assert.equal(
    searchConfigSchema.safeParse({ radiiKm: [50, 15] }).success,
    false,
  );
  assert.equal(
    searchConfigSchema.safeParse({ maxProbes: 100000 }).success,
    false,
  );
});

test("server paginates more than 20 exact properties with no duplicates", async () => {
  await pool.query(
    `WITH inserted AS (INSERT INTO properties(owner_id,city_id,name,description,zone,kind,capacity,latitude,longitude,status) SELECT $1,$2,'Page fixture','Test','Test','Bungalow',10,-25.3,-57.3,'published' FROM generate_series(1,23) RETURNING id), prices AS (INSERT INTO pricing_rules SELECT id,25000,'PYG' FROM inserted), rules AS (INSERT INTO availability_rules SELECT id,2,8,9,17,24 FROM inserted) INSERT INTO property_amenities SELECT id,code FROM inserted CROSS JOIN unnest(ARRAY['pool','grill']) code`,
    [owner, cityId],
  );
  const a = await search(),
    b = await search({ page: 2 });
  assert.equal(a.total, 25);
  assert.equal(a.items.length, 20);
  assert.equal(b.items.length, 5);
  assert.equal(new Set([...a.items, ...b.items].map((p) => p.id)).size, 25);
});

test("selected verified interval is revalidated on reservation and analytics records stage", async () => {
  const p = (await search()).otherDates.find((p) => p.id === ids.schedule);
  const registered = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Client", "mobile")
    .send({
      name: "Search client",
      email: `${randomUUID()}@example.invalid`,
      password: "Testing-password-with-24-chars",
    });
  assert.equal(registered.status, 201);
  const input = {
    propertyId: p.id,
    guests: 10,
    ...p.proposedInterval,
    searchStage: "schedule",
  };
  const auth = { Authorization: `Bearer ${registered.body.token}` };
  const savedIntent = await request(app)
    .post("/api/v1/search-intents")
    .set(auth)
    .send({ ...query, strictCity: true, strictBudget: true });
  assert.equal(savedIntent.status, 201);
  const saved = (
    await pool.query(
      "SELECT required_amenities,strict_city,strict_budget FROM search_intents WHERE user_id=$1",
      [registered.body.user.id],
    )
  ).rows[0];
  assert.deepEqual(saved, {
    required_amenities: ["pool"],
    strict_city: true,
    strict_budget: true,
  });
  assert.equal(
    (
      await request(app)
        .post("/api/v1/reservations/quote")
        .set(auth)
        .send(input)
    ).status,
    200,
  );
  const key = randomUUID();
  const booked = await request(app)
    .post("/api/v1/reservations")
    .set(auth)
    .set("Idempotency-Key", key)
    .send(input);
  assert.equal(booked.status, 201, JSON.stringify(booked.body));
  assert.equal(booked.body.reservation.totalAmount, 100000);
  assert.equal(
    (
      await request(app)
        .post("/api/v1/reservations")
        .set(auth)
        .set("Idempotency-Key", randomUUID())
        .send(input)
    ).status,
    409,
  );
  const events = (
    await pool.query(
      "SELECT search_stage FROM analytics_events WHERE event='reserve' AND property_id=$1",
      [p.id],
    )
  ).rows;
  assert.deepEqual(events, [{ search_stage: "schedule" }]);
  await pool.query("UPDATE users SET active=false WHERE id=$1", [owner]);
  assert.equal(all(await search()).length, 0);
  assert.equal(
    (
      await request(app)
        .post("/api/v1/reservations/quote")
        .set(auth)
        .send(input)
    ).status,
    404,
  );
});
