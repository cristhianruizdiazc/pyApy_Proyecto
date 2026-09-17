import { Router } from "express";
import { z } from "zod";
import { idSchema } from "@pyapy/contracts";
import { pool, transaction, audit } from "./db.mjs";
import { requireUser, requireRole } from "./auth.mjs";
import {
  loadProperty,
  authorizeProperty,
  propertySelect,
  publicProperty,
} from "./properties.mjs";
import { fail } from "./errors.mjs";
export const management = Router();
management.get("/sponsors", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT c.id,c.title,s.name,s.url FROM sponsor_campaigns c JOIN sponsors s ON s.id=c.sponsor_id WHERE c.active AND now() BETWEEN c.starts_at AND c.ends_at LIMIT 10",
      )
    ).rows,
  }),
);
management.post("/events", async (req, res) => {
  const data = z
    .object({
      event: z.enum(["view", "sponsor_click", "sponsor_impression"]),
      propertyId: idSchema.optional(),
      campaignId: idSchema.optional(),
    })
    .strict()
    .parse(req.body);
  if (data.event === "view") {
    if (!data.propertyId) fail(422, "INVALID_EVENT", "Falta la propiedad.");
    const p = await loadProperty(pool, data.propertyId);
    if (p.status !== "published")
      fail(404, "NOT_FOUND", "Propiedad no encontrada.");
  } else if (!data.campaignId) fail(422, "INVALID_EVENT", "Falta la campana.");
  await pool.query(
    "INSERT INTO analytics_events(event,property_id,campaign_id) VALUES($1,$2,$3)",
    [data.event, data.propertyId || null, data.campaignId || null],
  );
  res.status(201).json({ ok: true });
});
management.use(requireUser);
management.get("/reservations/:id/arrival", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const result = (
    await pool.query(
      "SELECT d.address,d.phone,d.latitude,d.longitude FROM reservations r JOIN properties p ON p.id=r.property_id LEFT JOIN property_private_data d ON d.property_id=p.id WHERE r.id=$1 AND r.status='confirmed' AND (r.user_id=$2 OR p.owner_id=$2 OR $3::boolean)",
      [id, req.user.id, req.user.role === "admin"],
    )
  ).rows[0];
  if (!result) fail(404, "NOT_FOUND", "Reserva no encontrada.");
  res.json(result);
});
management.get("/favorites", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        `${propertySelect} JOIN favorites f ON f.property_id=p.id WHERE f.user_id=$1 AND p.status='published'`,
        [req.user.id],
      )
    ).rows.map(publicProperty),
  }),
);
management.put("/favorites/:id", async (req, res) => {
  const p = await loadProperty(pool, req.params.id);
  if (p.status !== "published")
    fail(404, "NOT_FOUND", "Propiedad no encontrada.");
  await transaction(async (db) => {
    const result = await db.query(
      "INSERT INTO favorites(user_id,property_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING property_id",
      [req.user.id, p.id],
    );
    if (result.rowCount)
      await db.query(
        "INSERT INTO analytics_events(event,property_id) VALUES('favorite',$1)",
        [p.id],
      );
  });
  res.json({ ok: true });
});
management.delete("/favorites/:id", async (req, res) => {
  await pool.query(
    "DELETE FROM favorites WHERE user_id=$1 AND property_id=$2",
    [req.user.id, idSchema.parse(req.params.id)],
  );
  res.json({ ok: true });
});
management.get("/notifications", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT id,reservation_id,message,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
        [req.user.id],
      )
    ).rows,
  }),
);
management.post("/notifications/:id/read", async (req, res) => {
  const result = await pool.query(
    "UPDATE notifications SET read_at=now() WHERE user_id=$1 AND id=$2 RETURNING id",
    [req.user.id, idSchema.parse(req.params.id)],
  );
  if (!result.rowCount) fail(404, "NOT_FOUND", "Notificacion no encontrada.");
  res.json({ ok: true });
});
management.get(
  "/owner/metrics",
  requireRole("owner", "admin"),
  async (req, res) => {
    const counts = (
      await pool.query(
        `SELECT (SELECT count(*) FROM properties WHERE owner_id=$1)::integer properties,
   (SELECT count(*) FROM reservations r JOIN properties p ON p.id=r.property_id WHERE p.owner_id=$1 AND r.status='confirmed' AND r.kind='pyapy')::integer bookings,
   (SELECT COALESCE(sum(r.total_amount),0)::text FROM reservations r JOIN properties p ON p.id=r.property_id WHERE p.owner_id=$1 AND r.status='confirmed' AND r.kind='pyapy') revenue,
   (SELECT count(*) FROM analytics_events e JOIN properties p ON p.id=e.property_id WHERE p.owner_id=$1 AND e.event='view')::integer views,
   (SELECT count(*) FROM favorites f JOIN properties p ON p.id=f.property_id WHERE p.owner_id=$1)::integer favorites`,
        [req.user.id],
      )
    ).rows[0];
    res.json(counts);
  },
);
management.get(
  "/owner/subscription",
  requireRole("owner", "admin"),
  async (req, res) =>
    res.json({
      subscription:
        (
          await pool.query(
            "SELECT s.status,s.ends_at,p.name,p.monthly_price FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.owner_id=$1",
            [req.user.id],
          )
        ).rows[0] || null,
    }),
);
management.post(
  "/owner/subscription",
  requireRole("owner", "admin"),
  async (req, res) => {
    const { planId } = z.object({ planId: idSchema }).strict().parse(req.body);
    const p = (
      await pool.query(
        "SELECT id FROM subscription_plans WHERE id=$1 AND active",
        [planId],
      )
    ).rows[0];
    if (!p) fail(404, "NOT_FOUND", "Plan no disponible.");
    await transaction(async (db) => {
      await db.query(
        "INSERT INTO subscriptions(owner_id,plan_id,status) VALUES($1,$2,'pending') ON CONFLICT(owner_id) DO UPDATE SET plan_id=$2,status='pending',ends_at=NULL",
        [req.user.id, planId],
      );
      await audit(db, req.user.id, "subscription_request", req.user.id);
    });
    res.status(201).json({ status: "pending" });
  },
);
management.get(
  "/owner/properties/:id/private",
  requireRole("owner", "admin"),
  async (req, res) => {
    const p = await loadProperty(pool, req.params.id);
    authorizeProperty(req.user, p);
    res.json(
      (
        await pool.query(
          "SELECT address,phone,latitude,longitude FROM property_private_data WHERE property_id=$1",
          [p.id],
        )
      ).rows[0] || {},
    );
  },
);
management.put(
  "/owner/properties/:id/private",
  requireRole("owner", "admin"),
  async (req, res) => {
    const d = z
      .object({
        address: z.string().trim().max(300),
        phone: z.string().trim().max(40),
        latitude: z.number().min(-28).max(-19).nullable(),
        longitude: z.number().min(-63).max(-54).nullable(),
      })
      .strict()
      .parse(req.body);
    await transaction(async (db) => {
      const p = await loadProperty(db, req.params.id, { lock: true });
      authorizeProperty(req.user, p);
      await db.query(
        "INSERT INTO property_private_data(property_id,address,phone,latitude,longitude) VALUES($1,$2,$3,$4,$5) ON CONFLICT(property_id) DO UPDATE SET address=$2,phone=$3,latitude=$4,longitude=$5",
        [p.id, d.address, d.phone, d.latitude, d.longitude],
      );
      await audit(db, req.user.id, "private_data_update", p.id);
    });
    res.json({ ok: true });
  },
);
management.put(
  "/owner/properties/:id/socials",
  requireRole("owner", "admin"),
  async (req, res) => {
    const d = z
      .object({
        platform: z.enum(["instagram", "facebook", "tiktok", "youtube"]),
        url: z.url().max(500),
      })
      .strict()
      .parse(req.body);
    const hosts = {
      instagram: ["instagram.com", "www.instagram.com"],
      facebook: ["facebook.com", "www.facebook.com"],
      tiktok: ["tiktok.com", "www.tiktok.com"],
      youtube: ["youtube.com", "www.youtube.com", "youtu.be"],
    };
    const url = new URL(d.url);
    if (
      url.protocol !== "https:" ||
      !hosts[d.platform].includes(url.hostname) ||
      url.username ||
      url.password
    )
      fail(
        422,
        "INVALID_URL",
        "El enlace debe pertenecer a la red social indicada.",
      );
    await transaction(async (db) => {
      const p = await loadProperty(db, req.params.id, { lock: true });
      authorizeProperty(req.user, p);
      await db.query(
        "INSERT INTO property_social_networks(property_id,platform,url) VALUES($1,$2,$3) ON CONFLICT(property_id,platform) DO UPDATE SET url=$3",
        [p.id, d.platform, d.url],
      );
      await audit(db, req.user.id, "social_update", p.id);
    });
    res.json({ ok: true });
  },
);
management.use("/admin", requireRole("admin"));
management.get("/admin/overview", async (req, res) => {
  const [users, props, bookings, intents, jobs] = await Promise.all([
    pool.query("SELECT count(*)::integer total FROM users"),
    pool.query("SELECT count(*)::integer total FROM properties"),
    pool.query(
      "SELECT count(*)::integer total,COALESCE(sum(total_amount),0)::text revenue FROM reservations WHERE status='confirmed' AND kind='pyapy'",
    ),
    pool.query(
      "SELECT city,count(*)::integer searches FROM search_intents GROUP BY city ORDER BY searches DESC LIMIT 20",
    ),
    pool.query(
      "SELECT count(*) FILTER(WHERE delivered_at IS NULL AND dead_at IS NULL)::integer pending,count(*) FILTER(WHERE dead_at IS NOT NULL)::integer failed FROM notification_jobs",
    ),
  ]);
  res.json({
    users: users.rows[0].total,
    properties: props.rows[0].total,
    ...bookings.rows[0],
    demand: intents.rows,
    jobs: jobs.rows[0],
  });
});
management.get("/admin/users", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT id,name,email,role,active,created_at FROM users ORDER BY created_at DESC LIMIT 200",
      )
    ).rows,
  }),
);
management.patch("/admin/users/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const d = z.object({ active: z.boolean() }).strict().parse(req.body);
  if (id === req.user.id)
    fail(422, "SELF_CHANGE", "No podes desactivar tu propia cuenta.");
  await transaction(async (db) => {
    const result = await db.query(
      "UPDATE users SET active=$1 WHERE id=$2 RETURNING id",
      [d.active, id],
    );
    if (!result.rowCount) fail(404, "NOT_FOUND", "Usuario no encontrado.");
    if (!d.active)
      await db.query("DELETE FROM sessions WHERE user_id=$1", [id]);
    await audit(db, req.user.id, "user_active_change", id);
  });
  res.json({ ok: true });
});
management.get("/admin/properties", async (req, res) =>
  res.json({
    items: (
      await pool.query(`${propertySelect} ORDER BY p.created_at DESC LIMIT 200`)
    ).rows.map(publicProperty),
  }),
);
management.patch("/admin/properties/:id", async (req, res) => {
  const d = z
    .object({
      verified: z.boolean(),
      status: z.enum(["draft", "published", "suspended"]),
    })
    .strict()
    .parse(req.body);
  await transaction(async (db) => {
    const p = await loadProperty(db, req.params.id, { lock: true });
    await db.query("UPDATE properties SET verified=$1,status=$2 WHERE id=$3", [
      d.verified,
      d.status,
      p.id,
    ]);
    await audit(db, req.user.id, "property_moderate", p.id);
  });
  res.json({ ok: true });
});
management.get("/admin/audit", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT id,actor_id,action,resource_id,created_at FROM audit_logs ORDER BY id DESC LIMIT 200",
      )
    ).rows,
  }),
);
management.get("/admin/reviews", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT id,rating,comment,visible,created_at FROM reviews ORDER BY created_at DESC LIMIT 200",
      )
    ).rows,
  }),
);
management.patch("/admin/reviews/:id", async (req, res) => {
  const d = z.object({ visible: z.boolean() }).strict().parse(req.body);
  const id = idSchema.parse(req.params.id);
  await transaction(async (db) => {
    const result = await db.query(
      "UPDATE reviews SET visible=$1 WHERE id=$2 RETURNING id",
      [d.visible, id],
    );
    if (!result.rowCount) fail(404, "NOT_FOUND", "Resena no encontrada.");
    await audit(db, req.user.id, "review_moderate", id);
  });
  res.json({ ok: true });
});
management.get("/admin/plans", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT * FROM subscription_plans ORDER BY monthly_price",
      )
    ).rows,
  }),
);
management.patch("/admin/plans/:id", async (req, res) => {
  const d = z
    .object({
      monthlyPrice: z.number().int().min(0).max(100000000),
      active: z.boolean(),
    })
    .strict()
    .parse(req.body);
  const id = idSchema.parse(req.params.id);
  await transaction(async (db) => {
    const result = await db.query(
      "UPDATE subscription_plans SET monthly_price=$1,active=$2 WHERE id=$3 RETURNING id",
      [d.monthlyPrice, d.active, id],
    );
    if (!result.rowCount) fail(404, "NOT_FOUND", "Plan no encontrado.");
    await audit(db, req.user.id, "plan_update", id);
  });
  res.json({ ok: true });
});
management.get("/admin/subscriptions", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT s.*,u.name,p.name plan FROM subscriptions s JOIN users u ON u.id=s.owner_id JOIN subscription_plans p ON p.id=s.plan_id",
      )
    ).rows,
  }),
);
management.patch("/admin/subscriptions/:id", async (req, res) => {
  const d = z
    .object({
      status: z.enum(["active", "expired"]),
      endsAt: z.iso.datetime({ offset: true }),
    })
    .strict()
    .parse(req.body);
  const id = idSchema.parse(req.params.id);
  await transaction(async (db) => {
    const result = await db.query(
      "UPDATE subscriptions SET status=$1,ends_at=$2 WHERE owner_id=$3 RETURNING owner_id",
      [d.status, d.endsAt, id],
    );
    if (!result.rowCount) fail(404, "NOT_FOUND", "Suscripcion no encontrada.");
    await audit(db, req.user.id, "subscription_update", id);
  });
  res.json({ ok: true });
});
management.get("/admin/weights", async (req, res) =>
  res.json({
    items: (
      await pool.query("SELECT * FROM matching_weights ORDER BY criterion")
    ).rows,
  }),
);
management.put("/admin/weights", async (req, res) => {
  const d = z
    .object({
      availability: z.number().int().min(0).max(100),
      city: z.number().int().min(0).max(100),
      capacity: z.number().int().min(0).max(100),
      budget: z.number().int().min(0).max(100),
      amenities: z.number().int().min(0).max(100),
    })
    .strict()
    .refine((v) => Object.values(v).reduce((a, b) => a + b, 0) === 100)
    .parse(req.body);
  await transaction(async (db) => {
    for (const [key, value] of Object.entries(d))
      await db.query(
        "UPDATE matching_weights SET weight=$1 WHERE criterion=$2",
        [value, key],
      );
    await audit(db, req.user.id, "matching_update", null);
  });
  res.json({ ok: true });
});
management.get("/admin/sponsors", async (req, res) =>
  res.json({
    items: (
      await pool.query(
        "SELECT c.*,s.name,s.url FROM sponsor_campaigns c JOIN sponsors s ON s.id=c.sponsor_id ORDER BY c.starts_at DESC",
      )
    ).rows,
  }),
);
management.post("/admin/sponsors", async (req, res) => {
  const d = z
    .object({
      name: z.string().trim().min(2).max(100),
      url: z
        .url()
        .max(500)
        .refine((u) => new URL(u).protocol === "https:"),
      title: z.string().trim().min(3).max(150),
      startsAt: z.iso.datetime({ offset: true }),
      endsAt: z.iso.datetime({ offset: true }),
    })
    .strict()
    .refine((v) => Date.parse(v.endsAt) > Date.parse(v.startsAt))
    .parse(req.body);
  await transaction(async (db) => {
    const s = (
      await db.query(
        "INSERT INTO sponsors(name,url) VALUES($1,$2) RETURNING id",
        [d.name, d.url],
      )
    ).rows[0];
    const c = (
      await db.query(
        "INSERT INTO sponsor_campaigns(sponsor_id,title,starts_at,ends_at) VALUES($1,$2,$3,$4) RETURNING id",
        [s.id, d.title, d.startsAt, d.endsAt],
      )
    ).rows[0];
    await audit(db, req.user.id, "sponsor_create", c.id);
  });
  res.status(201).json({ ok: true });
});
management.patch("/admin/sponsors/:id", async (req, res) => {
  const d = z.object({ active: z.boolean() }).strict().parse(req.body);
  const id = idSchema.parse(req.params.id);
  await transaction(async (db) => {
    const result = await db.query(
      "UPDATE sponsor_campaigns SET active=$1 WHERE id=$2 RETURNING id",
      [d.active, id],
    );
    if (!result.rowCount) fail(404, "NOT_FOUND", "Campana no encontrada.");
    await audit(db, req.user.id, "sponsor_toggle", id);
  });
  res.json({ ok: true });
});
