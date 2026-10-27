import { z } from "zod";

export const searchConfigSchema = z
  .object({
    radiiKm: z
      .array(z.number().positive().max(200))
      .min(1)
      .max(5)
      .refine((a) => a.every((v, i) => !i || v > a[i - 1]))
      .default([15, 30, 50]),
    maxOverpricePercent: z.number().min(0).max(50).default(20),
    alternatives: z.number().int().min(1).max(30).default(6),
    windowDays: z.number().int().min(1).max(30).default(7),
    maxIntervals: z.number().int().min(1).max(30).default(6),
    maxProbes: z.number().int().min(1).max(720).default(168),
    stepHours: z.number().int().min(1).max(24).default(1),
    timeoutMs: z.number().int().min(100).max(10000).default(5000),
    maxQueries: z.number().int().min(5).max(10).default(5),
  })
  .strict();
export const searchConfig = searchConfigSchema.parse(
  JSON.parse(process.env.SEARCH_CONFIG || "{}"),
);
