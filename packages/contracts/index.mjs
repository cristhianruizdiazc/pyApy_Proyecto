import { z } from "zod";
import { DateTime } from "luxon";

export const ZONE = "America/Asuncion";
export const roles = ["client", "owner", "admin"];
export const kinds = [
  "Quinta",
  "Piscina",
  "Casa",
  "Bungalow",
  "Quincho",
  "Salon",
];
export const money = (amount) =>
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(
    Number(amount),
  );
export const idSchema = z.uuid();
const text = (min, max) => z.string().trim().min(min).max(max);
export const loginSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
  })
  .strict();
export const registerSchema = loginSchema.extend({ name: text(2, 100) });
export const intervalSchema = z
  .object({
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const bookingSchema = intervalSchema.extend({
  propertyId: idSchema,
  guests: z.number().int().min(1).max(1000),
});
export const propertySchema = z
  .object({
    name: text(3, 100),
    description: text(30, 5000),
    cityId: idSchema,
    zone: text(2, 100),
    kind: z.enum(kinds),
    capacity: z.number().int().min(1).max(1000),
    pricePerHour: z.number().int().min(1000).max(100000000),
    minHours: z.number().int().min(1).max(168).default(4),
    maxHours: z.number().int().min(1).max(720).default(24),
    openHour: z.number().int().min(0).max(23).default(0),
    closeHour: z.number().int().min(1).max(24).default(24),
    cancellationHours: z.number().int().min(0).max(720).default(24),
    rules: text(0, 2000).default(""),
    amenities: z.array(text(1, 40)).max(20).default([]),
    latitude: z.number().min(-28).max(-19),
    longitude: z.number().min(-63).max(-54),
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .strict()
  .refine((p) => p.minHours <= p.maxHours, {
    message: "La duracion minima supera a la maxima.",
  });
export const searchSchema = z
  .object({
    city: z.string().max(100).optional(),
    kind: z.enum(kinds).optional(),
    guests: z.coerce.number().int().min(1).max(1000).default(1),
    budget: z.coerce.number().int().min(1000).max(1000000000).optional(),
    amenities: z.string().max(500).default(""),
    startsAt: z.iso.datetime({ offset: true }).optional(),
    endsAt: z.iso.datetime({ offset: true }).optional(),
    sort: z.enum(["match", "price", "capacity"]).default("match"),
    page: z.coerce.number().int().min(1).max(1000).default(1),
  })
  .strict()
  .refine((v) => Boolean(v.startsAt) === Boolean(v.endsAt), {
    message: "Indica inicio y fin.",
  });
export function localInterval(
  date,
  start = "09:00",
  end = "17:00",
  endDate = date,
) {
  const a = DateTime.fromISO(`${date}T${start}`, { zone: ZONE });
  let b = DateTime.fromISO(`${endDate}T${end}`, { zone: ZONE });
  if (date === endDate && b <= a) b = b.plus({ days: 1 });
  if (!a.isValid || !b.isValid) throw new Error("Fecha u horario invalido.");
  return { startsAt: a.toUTC().toISO(), endsAt: b.toUTC().toISO() };
}
export function durationHours(startsAt, endsAt) {
  return (Date.parse(endsAt) - Date.parse(startsAt)) / 3600000;
}
