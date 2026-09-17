import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { idSchema } from "@pyapy/contracts";
import { pool, transaction, audit } from "./db.mjs";
import { requireRole } from "./auth.mjs";
import { loadProperty, authorizeProperty } from "./properties.mjs";
import { config } from "./config.mjs";
import { fail } from "./errors.mjs";
export const images = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
});
images.post(
  "/properties/:id/images",
  requireRole("owner", "admin"),
  async (req, res, next) => {
    const p = await loadProperty(pool, req.params.id);
    authorizeProperty(req.user, p);
    next();
  },
  upload.single("image"),
  async (req, res) => {
    if (!req.file) fail(422, "IMAGE_REQUIRED", "Selecciona una imagen.");
    let buffer;
    try {
      buffer = await sharp(req.file.buffer, {
        limitInputPixels: 24000000,
        animated: false,
      })
        .rotate()
        .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      fail(
        422,
        "INVALID_IMAGE",
        "El archivo no es una imagen valida o supera los limites.",
      );
    }
    const id = randomUUID();
    await mkdir(config.uploads, { recursive: true });
    const path = resolve(config.uploads, `${id}.webp`);
    try {
      await transaction(async (db) => {
        const p = await loadProperty(db, req.params.id, { lock: true });
        authorizeProperty(req.user, p);
        const count = (
          await db.query(
            "SELECT count(*)::integer n FROM property_images WHERE property_id=$1",
            [p.id],
          )
        ).rows[0].n;
        if (count >= 12)
          fail(422, "IMAGE_LIMIT", "Cada propiedad admite hasta 12 imagenes.");
        await sharp(buffer).toFile(path);
        await db.query(
          "INSERT INTO property_images(id,property_id,path,alt,position) VALUES($1,$2,$3,$4,$5)",
          [id, p.id, `/api/v1/media/${id}`, p.name, count],
        );
        await audit(db, req.user.id, "image_upload", p.id);
      });
    } catch (error) {
      await unlink(path).catch(() => {});
      throw error;
    }
    res.status(201).json({ id, url: `/api/v1/media/${id}` });
  },
);
images.get("/media/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const p = (
    await pool.query(
      "SELECT p.owner_id,p.status,p.is_demo FROM property_images i JOIN properties p ON p.id=i.property_id WHERE i.id=$1",
      [id],
    )
  ).rows[0];
  if (
    !p ||
    ((p.status !== "published" || (!config.demo && p.is_demo)) &&
      req.user?.id !== p.owner_id &&
      req.user?.role !== "admin")
  )
    fail(404, "NOT_FOUND", "Imagen no encontrada.");
  res.set("Cache-Control", "private, max-age=0, must-revalidate");
  res
    .type("webp")
    .sendFile(resolve(config.uploads, `${id}.webp`), { dotfiles: "allow" });
});
images.delete(
  "/properties/:id/images/:imageId",
  requireRole("owner", "admin"),
  async (req, res) => {
    const imageId = idSchema.parse(req.params.imageId);
    await transaction(async (db) => {
      const p = await loadProperty(db, req.params.id, { lock: true });
      authorizeProperty(req.user, p);
      const result = await db.query(
        "DELETE FROM property_images WHERE id=$1 AND property_id=$2 RETURNING id",
        [imageId, p.id],
      );
      if (!result.rowCount) fail(404, "NOT_FOUND", "Imagen no encontrada.");
      await audit(db, req.user.id, "image_delete", p.id);
    });
    await unlink(resolve(config.uploads, `${imageId}.webp`)).catch(() => {});
    res.json({ ok: true });
  },
);
