import { Router } from "express";
import { z } from "zod";
import { DateTime } from "luxon";
import {
  propertySchema,
  searchSchema,
  idSchema,
  durationHours,
  ZONE,
} from "@pyapy/contracts";
import { pool, transaction, audit } from "./db.mjs";
import { requireUser, requireRole } from "./auth.mjs";
import { fail } from "./errors.mjs";
import { config } from "./config.mjs";

export const propertySelect = `SELECT p.*,g.city,g.department,pr.price_per_hour,a.min_hours,a.max_hours,a.open_hour,a.close_hour,a.cancellation_hours,
 COALESCE((SELECT json_agg(json_build_object('id',i.id,'url',i.path,'alt',i.alt) ORDER BY i.position,i.id) FROM property_images i WHERE i.property_id=p.id),'[]') images,
 COALESCE((SELECT json_agg(pa.amenity_code ORDER BY pa.amenity_code) FROM property_amenities pa WHERE pa.property_id=p.id),'[]') amenities,
 (SELECT round(avg(r.rating),1) FROM reviews r WHERE r.property_id=p.id AND r.visible) rating,
 (SELECT count(*)::integer FROM reviews r WHERE r.property_id=p.id AND r.visible) review_count
 FROM properties p JOIN geographic_locations g ON g.id=p.city_id JOIN pricing_rules pr ON pr.property_id=p.id JOIN availability_rules a ON a.property_id=p.id`;
export function publicProperty(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    cityId: p.city_id,
    city: p.city,
    department: p.department,
    zone: p.zone,
    kind: p.kind,
    capacity: p.capacity,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    pricePerHour: p.price_per_hour,
    minHours: p.min_hours,
    maxHours: p.max_hours,
    openHour: p.open_hour,
    closeHour: p.close_hour,
    cancellationHours: p.cancellation_hours,
    rules: p.rules,
    status: p.status,
    verified: p.verified,
    isDemo: p.is_demo,
    images: p.images,
    amenities: p.amenities,
    rating: p.rating ? Number(p.rating) : null,
    reviewCount: p.review_count,
  };
}
export function validatePeriod(p, startsAt, endsAt, { future = true } = {}) {
  const hours = durationHours(startsAt, endsAt);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 720)
    fail(422, "INVALID_INTERVAL", "El intervalo no es valido.");
  if (future && Date.parse(startsAt) <= Date.now())
    fail(422, "PAST_DATE", "Elegi una fecha futura.");
  if (hours < p.min_hours || hours > p.max_hours)
    fail(
      422,
      "DURATION",
      `La estadia debe durar entre ${p.min_hours} y ${p.max_hours} horas.`,
    );
  if (p.open_hour === 0 && p.close_hour === 24) return hours;
  const start = DateTime.fromISO(startsAt, { setZone: true }).setZone(ZONE);
  const end = DateTime.fromISO(endsAt, { setZone: true }).setZone(ZONE);
  let opening = start.startOf("day").plus({ hours: p.open_hour });
  if (p.close_hour <= p.open_hour && start.hour < p.close_hour)
    opening = opening.minus({ days: 1 });
  let closing = opening.startOf("day").plus({ hours: p.close_hour });
  if (p.close_hour <= p.open_hour) closing = closing.plus({ days: 1 });
  if (start < opening || end > closing)
    fail(
      422,
      "OPENING_HOURS",
      "El horario esta fuera de la disponibilidad de la propiedad.",
    );
  return hours;
}
export async function loadProperty(db, id, { lock = false } = {}) {
  const p = (
    await db.query(
      `${propertySelect} WHERE p.id=$1 ${lock ? "FOR UPDATE OF p" : ""}`,
      [idSchema.parse(id)],
    )
  ).rows[0];
  if (!p) fail(404, "NOT_FOUND", "Propiedad no encontrada.");
  return p;
}
export function authorizeProperty(user, p) {
  if (user.role !== "admin" && p.owner_id !== user.id)
    fail(404, "NOT_FOUND", "Propiedad no encontrada.");
}
export function scoreProperty(p, input, weights) {
  const values = {
    availability: p.available ? 1 : 0,
    city:
      !input.city || p.city.toLowerCase() === input.city.toLowerCase() ? 1 : 0,
    capacity: 1,
    budget: !input.budget || p.estimatedTotal <= input.budget ? 1 : 0,
    amenities: input.wanted.length
      ? input.wanted.filter((a) => p.amenities.includes(a)).length /
        input.wanted.length
      : 1,
  };
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  return total
    ? Math.round(
        (Object.entries(weights).reduce(
          (sum, [key, weight]) => sum + weight * (values[key] || 0),
          0,
        ) *
          100) /
          total,
      )
    : 0;
}
export const properties = Router();
properties.get("/catalog", async (req, res) => {
  const [cities, amenities, plans] = await Promise.all([
    pool.query(
      "SELECT id,city,department FROM geographic_locations ORDER BY city",
    ),
    pool.query("SELECT * FROM amenities ORDER BY label"),
    pool.query(
      "SELECT * FROM subscription_plans WHERE active ORDER BY monthly_price",
    ),
  ]);
  res.json({
    cities: cities.rows,
    amenities: amenities.rows,
    plans: plans.rows,
    demo: config.demo,
    timezone: ZONE,
  });
});
properties.get("/properties", async (req, res) => {
  const q = searchSchema.parse(req.query);
  const wanted = q.amenities.split(",").filter(Boolean);
  if (
    q.startsAt &&
    (durationHours(q.startsAt, q.endsAt) <= 0 ||
      Date.parse(q.startsAt) <= Date.now())
  )
    fail(422, "INVALID_INTERVAL", "Elegi un intervalo futuro valido.");
  const args = [q.guests, q.kind || null, !config.demo];
  const rows = (
    await pool.query(
      `${propertySelect} WHERE p.status='published' AND p.capacity >= $1 AND ($2::text IS NULL OR p.kind=$2) AND (NOT $3::boolean OR NOT p.is_demo) ORDER BY p.created_at DESC LIMIT 500`,
      args,
    )
  ).rows;
  const busy = q.startsAt
    ? new Set(
        (
          await pool.query(
            "SELECT DISTINCT property_id FROM reservations WHERE status='confirmed' AND tstzrange(starts_at,ends_at,'[)') && tstzrange($1,$2,'[)')",
            [q.startsAt, q.endsAt],
          )
        ).rows.map((r) => r.property_id),
      )
    : new Set();
  const weights = Object.fromEntries(
    (await pool.query("SELECT * FROM matching_weights")).rows.map((r) => [
      r.criterion,
      r.weight,
    ]),
  );
  const scored = rows.map((row) => {
    const p = publicProperty(row);
    let valid = true;
    if (q.startsAt) {
      try {
        validatePeriod(row, q.startsAt, q.endsAt);
      } catch {
        valid = false;
      }
    }
    p.available = valid && !busy.has(p.id);
    p.availabilityChecked = Boolean(q.startsAt);
    p.estimatedTotal =
      Math.ceil(q.startsAt ? durationHours(q.startsAt, q.endsAt) : p.minHours) *
      p.pricePerHour;
    p.score = scoreProperty(p, { ...q, wanted }, weights);
    p.exact =
      p.available &&
      (!q.city || p.city.toLowerCase() === q.city.toLowerCase()) &&
      (!q.budget || p.estimatedTotal <= q.budget) &&
      wanted.every((a) => p.amenities.includes(a));
    return p;
  });
  const compare = (a, b) =>
    q.sort === "price"
      ? a.estimatedTotal - b.estimatedTotal
      : q.sort === "capacity"
        ? a.capacity - b.capacity
        : b.score - a.score;
  const exact = scored.filter((p) => p.exact).sort(compare);
  const alternatives = scored
    .filter((p) => !p.exact && p.available)
    .sort(compare)
    .slice(0, 6);
  const otherDates = scored
    .filter((p) => !p.available)
    .sort(compare)
    .slice(0, 6);
  res.json({
    items: exact.slice((q.page - 1) * 20, q.page * 20),
    total: exact.length,
    page: q.page,
    alternatives,
    otherDates,
    searchLimited: rows.length === 500,
  });
});
properties.post("/search-intents", requireUser, async (req, res) => {
  const q = searchSchema.parse(req.body);
  await pool.query(
    "INSERT INTO search_intents(user_id,city,guests,budget,starts_at,ends_at,requested_amenities,results_count) VALUES($1,$2,$3,$4,$5,$6,$7,0)",
    [
      req.user.id,
      q.city || null,
      q.guests,
      q.budget || null,
      q.startsAt || null,
      q.endsAt || null,
      q.amenities.split(",").filter(Boolean),
    ],
  );
  res.status(201).json({ ok: true });
});
properties.get("/properties/:id", async (req, res) => {
  const p = await loadProperty(pool, req.params.id);
  if (
    (p.status !== "published" || (!config.demo && p.is_demo)) &&
    (!req.user || (p.owner_id !== req.user.id && req.user.role !== "admin"))
  )
    fail(404, "NOT_FOUND", "Propiedad no encontrada.");
  const [reviews, socials] = await Promise.all([
    pool.query(
      "SELECT r.id,r.rating,r.comment,r.created_at FROM reviews r WHERE r.property_id=$1 AND r.visible ORDER BY r.created_at DESC LIMIT 50",
      [p.id],
    ),
    pool.query(
      "SELECT platform,url FROM property_social_networks WHERE property_id=$1",
      [p.id],
    ),
  ]);
  res.json({
    ...publicProperty(p),
    reviews: reviews.rows,
    socials: socials.rows,
  });
});
properties.get("/properties/:id/availability", async (req, res) => {
  const p = await loadProperty(pool, req.params.id);
  if (p.status !== "published" || (!config.demo && p.is_demo))
    fail(404, "NOT_FOUND", "Propiedad no encontrada.");
  const dates = (
    await pool.query(
      "SELECT starts_at,ends_at FROM reservations WHERE property_id=$1 AND status='confirmed' AND ends_at>now() AND starts_at<now()+interval '365 days' ORDER BY starts_at LIMIT 500",
      [p.id],
    )
  ).rows;
  res.json({ intervals: dates });
});
properties.post("/owner-profile", requireUser, async (req, res) => {
  const input = z
    .object({ commercialName: z.string().trim().min(2).max(100) })
    .strict()
    .parse(req.body);
  await transaction(async (db) => {
    await db.query(
      "INSERT INTO owner_profiles(user_id,commercial_name) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET commercial_name=$2",
      [req.user.id, input.commercialName],
    );
    await db.query(
      "UPDATE users SET role='owner' WHERE id=$1 AND role='client'",
      [req.user.id],
    );
    await audit(db, req.user.id, "owner_onboarding", req.user.id);
  });
  res.status(201).json({ ok: true });
});
properties.get(
  "/owner/properties",
  requireRole("owner", "admin"),
  async (req, res) =>
    res.json({
      items: (
        await pool.query(
          `${propertySelect} WHERE p.owner_id=$1 ORDER BY p.created_at DESC`,
          [req.user.id],
        )
      ).rows.map(publicProperty),
    }),
);
async function saveProperty(db, user, input, id) {
  if (id) {
    const p = await loadProperty(db, id, { lock: true });
    authorizeProperty(user, p);
    if (p.status === "suspended" && user.role !== "admin")
      fail(
        403,
        "SUSPENDED",
        "La propiedad esta suspendida por administracion.",
      );
    // Booking creation takes the same property lock, so this check is atomic.
    const commitments = (
      await db.query(
        "SELECT starts_at,ends_at,guests FROM reservations WHERE property_id=$1 AND status='confirmed' AND kind<>'block' AND ends_at>now()",
        [id],
      )
    ).rows;
    const rules = {
      min_hours: input.minHours,
      max_hours: input.maxHours,
      open_hour: input.openHour,
      close_hour: input.closeHour,
    };
    for (const reservation of commitments) {
      let compatible = reservation.guests <= input.capacity;
      try {
        validatePeriod(
          rules,
          reservation.starts_at.toISOString(),
          reservation.ends_at.toISOString(),
          { future: false },
        );
      } catch {
        compatible = false;
      }
      if (!compatible)
        fail(
          409,
          "EXISTING_RESERVATIONS",
          "La capacidad o los horarios nuevos no son compatibles con reservas confirmadas.",
        );
    }
  }
  const city = (
    await db.query("SELECT id FROM geographic_locations WHERE id=$1", [
      input.cityId,
    ])
  ).rows[0];
  const available = (
    await db.query("SELECT code FROM amenities WHERE code=ANY($1)", [
      input.amenities,
    ])
  ).rows;
  if (!city || new Set(input.amenities).size !== available.length)
    fail(422, "INVALID_CATALOG", "Ciudad o servicios invalidos.");
  const values = [
    input.name,
    input.description,
    input.cityId,
    input.zone,
    input.kind,
    input.capacity,
    Math.round(input.latitude * 1000) / 1000,
    Math.round(input.longitude * 1000) / 1000,
    input.rules,
    input.status,
  ];
  if (!id)
    id = (
      await db.query(
        "INSERT INTO properties(name,description,city_id,zone,kind,capacity,latitude,longitude,rules,status,owner_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id",
        [...values, user.id],
      )
    ).rows[0].id;
  else
    await db.query(
      "UPDATE properties SET name=$1,description=$2,city_id=$3,zone=$4,kind=$5,capacity=$6,latitude=$7,longitude=$8,rules=$9,status=$10,updated_at=now() WHERE id=$11",
      [...values, id],
    );
  await db.query(
    "INSERT INTO pricing_rules(property_id,price_per_hour) VALUES($1,$2) ON CONFLICT(property_id) DO UPDATE SET price_per_hour=$2",
    [id, input.pricePerHour],
  );
  await db.query(
    "INSERT INTO availability_rules(property_id,min_hours,max_hours,open_hour,close_hour,cancellation_hours) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(property_id) DO UPDATE SET min_hours=$2,max_hours=$3,open_hour=$4,close_hour=$5,cancellation_hours=$6",
    [
      id,
      input.minHours,
      input.maxHours,
      input.openHour,
      input.closeHour,
      input.cancellationHours,
    ],
  );
  await db.query("DELETE FROM property_amenities WHERE property_id=$1", [id]);
  for (const amenity of input.amenities)
    await db.query(
      "INSERT INTO property_amenities(property_id,amenity_code) VALUES($1,$2)",
      [id, amenity],
    );
  await audit(db, user.id, "property_save", id);
  return id;
}
properties.post(
  "/properties",
  requireRole("owner", "admin"),
  async (req, res) => {
    const input = propertySchema.parse(req.body);
    const id = await transaction((db) => saveProperty(db, req.user, input));
    res.status(201).json(publicProperty(await loadProperty(pool, id)));
  },
);
properties.put(
  "/properties/:id",
  requireRole("owner", "admin"),
  async (req, res) => {
    const input = propertySchema.parse(req.body);
    const id = idSchema.parse(req.params.id);
    await transaction((db) => saveProperty(db, req.user, input, id));
    res.json(publicProperty(await loadProperty(pool, id)));
  },
);
