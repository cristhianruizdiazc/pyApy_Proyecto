import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { bookingSchema, idSchema } from "@pyapy/contracts";
import { pool, transaction, audit } from "./db.mjs";
import { requireUser, requireRole, digest } from "./auth.mjs";
import {
  loadProperty,
  authorizeProperty,
  validatePeriod,
} from "./properties.mjs";
import { fail } from "./errors.mjs";
import { config } from "./config.mjs";
export const bookings = Router();
bookings.use(requireUser);
function output(r) {
  return {
    id: r.id,
    propertyId: r.property_id,
    propertyName: r.property_name,
    city: r.city,
    kind: r.kind,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    guests: r.guests,
    totalAmount: Number(r.total_amount),
    status: r.status,
    locator: r.locator,
    cancellationHours: r.cancellation_hours,
    createdAt: r.created_at,
    note: r.note,
  };
}
export async function createBooking(
  user,
  input,
  key,
  kind = "pyapy",
  note = "",
) {
  idSchema.parse(key);
  const hash = digest(JSON.stringify({ input, kind, note }));
  return transaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `${user.id}:${key}`,
    ]);
    const prior = (
      await db.query(
        "SELECT * FROM reservations WHERE user_id=$1 AND idempotency_key=$2",
        [user.id, key],
      )
    ).rows[0];
    if (prior) {
      if (prior.request_hash !== hash)
        fail(
          409,
          "IDEMPOTENCY_CONFLICT",
          "La clave ya corresponde a otra solicitud.",
        );
      return { reservation: output(prior), replayed: true };
    }
    const p = await loadProperty(db, input.propertyId, { lock: true });
    if (kind === "pyapy") {
      if (p.status !== "published" || (!config.demo && p.is_demo))
        fail(404, "NOT_FOUND", "Propiedad no disponible.");
      if (p.owner_id === user.id)
        fail(
          422,
          "OWN_PROPERTY",
          "Registra esta ocupacion desde tu calendario.",
        );
    } else authorizeProperty(user, p);
    if (input.guests > p.capacity)
      fail(422, "CAPACITY", "La cantidad de personas supera la capacidad.");
    const rules =
      kind === "block"
        ? { min_hours: 1 / 60, max_hours: 720, open_hour: 0, close_hour: 24 }
        : p;
    const hours = validatePeriod(rules, input.startsAt, input.endsAt);
    const total = kind === "block" ? 0 : Math.ceil(hours) * p.price_per_hour;
    const r = (
      await db.query(
        "INSERT INTO reservations(property_id,user_id,kind,starts_at,ends_at,guests,total_amount,locator,note,idempotency_key,request_hash,cancellation_hours) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
        [
          p.id,
          user.id,
          kind,
          input.startsAt,
          input.endsAt,
          input.guests,
          total,
          randomBytes(12).toString("hex").toUpperCase(),
          note,
          key,
          hash,
          p.cancellation_hours,
        ],
      )
    ).rows[0];
    await audit(db, user.id, "booking_create", r.id);
    await db.query(
      "INSERT INTO analytics_events(event,property_id) VALUES('reserve',$1)",
      [p.id],
    );
    for (const recipient of new Set([user.id, p.owner_id]))
      await db.query(
        "INSERT INTO notification_jobs(user_id,reservation_id,message) VALUES($1,$2,$3)",
        [recipient, r.id, `Reserva ${r.locator} confirmada en ${p.name}.`],
      );
    return {
      reservation: output({ ...r, property_name: p.name, city: p.city }),
      replayed: false,
    };
  });
}
bookings.post("/reservations/quote", async (req, res) => {
  const input = bookingSchema.parse(req.body);
  const p = await loadProperty(pool, input.propertyId);
  if (p.status !== "published" || (!config.demo && p.is_demo))
    fail(404, "NOT_FOUND", "Propiedad no disponible.");
  if (input.guests > p.capacity)
    fail(422, "CAPACITY", "La cantidad de personas supera la capacidad.");
  const hours = validatePeriod(p, input.startsAt, input.endsAt);
  const conflict = (
    await pool.query(
      "SELECT 1 FROM reservations WHERE property_id=$1 AND status='confirmed' AND tstzrange(starts_at,ends_at,'[)') && tstzrange($2,$3,'[)') LIMIT 1",
      [p.id, input.startsAt, input.endsAt],
    )
  ).rowCount;
  if (conflict)
    fail(409, "BOOKING_CONFLICT", "Ese horario ya no esta disponible.");
  res.json({
    totalAmount: Math.ceil(hours) * p.price_per_hour,
    currency: "PYG",
    hours,
    cancellationHours: p.cancellation_hours,
  });
});
bookings.post("/reservations", async (req, res) => {
  const result = await createBooking(
    req.user,
    bookingSchema.parse(req.body),
    req.get("idempotency-key"),
  );
  res.status(result.replayed ? 200 : 201).json(result);
});
bookings.post(
  "/owner/occupancies",
  requireRole("owner", "admin"),
  async (req, res) => {
    const input = bookingSchema
      .extend({
        kind: z.enum(["owner", "block"]),
        note: z.string().trim().max(500).default(""),
      })
      .parse(req.body);
    const { kind, note, ...data } = input;
    const result = await createBooking(
      req.user,
      data,
      req.get("idempotency-key"),
      kind,
      note,
    );
    res.status(result.replayed ? 200 : 201).json(result);
  },
);
bookings.get("/reservations", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT r.*,p.name property_name,g.city FROM reservations r JOIN properties p ON p.id=r.property_id JOIN geographic_locations g ON g.id=p.city_id WHERE r.user_id=$1 ORDER BY r.starts_at DESC LIMIT 200",
        [req.user.id],
      )
    ).rows.map(output),
  }),
);
bookings.get(
  "/owner/reservations",
  requireRole("owner", "admin"),
  async (req, res) =>
    res.json({
      items: (
        await pool.query(
          "SELECT r.*,p.name property_name,g.city FROM reservations r JOIN properties p ON p.id=r.property_id JOIN geographic_locations g ON g.id=p.city_id WHERE p.owner_id=$1 ORDER BY r.starts_at DESC LIMIT 500",
          [req.user.id],
        )
      ).rows.map(output),
    }),
);
bookings.post("/reservations/:id/cancel", async (req, res) => {
  z.object({})
    .strict()
    .parse(req.body || {});
  const id = idSchema.parse(req.params.id);
  const result = await transaction(async (db) => {
    const r = (
      await db.query(
        "SELECT r.*,p.owner_id,p.name property_name FROM reservations r JOIN properties p ON p.id=r.property_id WHERE r.id=$1 FOR UPDATE OF r",
        [id],
      )
    ).rows[0];
    if (
      !r ||
      (r.user_id !== req.user.id &&
        r.owner_id !== req.user.id &&
        req.user.role !== "admin")
    )
      fail(404, "NOT_FOUND", "Reserva no encontrada.");
    if (r.status === "cancelled") return output(r);
    if (req.user.role !== "admin" && Date.parse(r.starts_at) <= Date.now())
      fail(422, "ALREADY_STARTED", "La reserva ya comenzo.");
    if (
      req.user.id !== r.owner_id &&
      req.user.role !== "admin" &&
      Date.parse(r.starts_at) - Date.now() < r.cancellation_hours * 3600000
    )
      fail(
        422,
        "CANCELLATION_POLICY",
        "La reserva esta fuera del plazo de cancelacion.",
      );
    const updated = (
      await db.query(
        "UPDATE reservations SET status='cancelled',cancelled_at=now() WHERE id=$1 RETURNING *",
        [id],
      )
    ).rows[0];
    await audit(db, req.user.id, "booking_cancel", id);
    await db.query(
      "INSERT INTO analytics_events(event,property_id) VALUES('cancel',$1)",
      [r.property_id],
    );
    for (const recipient of new Set([r.user_id, r.owner_id]))
      await db.query(
        "INSERT INTO notification_jobs(user_id,reservation_id,message) VALUES($1,$2,$3)",
        [recipient, r.id, `Reserva ${r.locator} cancelada.`],
      );
    return output(updated);
  });
  res.json({ reservation: result });
});
bookings.post("/reviews", async (req, res) => {
  const input = z
    .object({
      reservationId: idSchema,
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().min(10).max(1500),
    })
    .strict()
    .parse(req.body);
  const r = (
    await pool.query(
      "SELECT property_id FROM reservations WHERE id=$1 AND user_id=$2 AND kind='pyapy' AND status='confirmed' AND ends_at<now()",
      [input.reservationId, req.user.id],
    )
  ).rows[0];
  if (!r)
    fail(
      403,
      "REVIEW_NOT_ALLOWED",
      "Solo podes opinar sobre una estadia completada.",
    );
  await pool.query(
    "INSERT INTO reviews(reservation_id,user_id,property_id,rating,comment) VALUES($1,$2,$3,$4,$5)",
    [
      input.reservationId,
      req.user.id,
      r.property_id,
      input.rating,
      input.comment,
    ],
  );
  res.status(201).json({ ok: true });
});
