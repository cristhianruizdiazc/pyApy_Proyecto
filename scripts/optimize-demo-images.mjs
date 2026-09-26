import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { basename, resolve } from "node:path";

const directory = resolve("apps/web/public/demo");
const files = ["cabin.jpg", "garden.jpg", "house.jpg", "palms.jpg", "pool.jpg", "retreat.jpg"];
const widths = [640, 1280];

await mkdir(directory, { recursive: true });
for (const file of files) {
  const source = resolve(directory, file);
  for (const width of widths) {
    const target = resolve(directory, `${basename(file, ".jpg")}-${width}.webp`);
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(target);
    console.log(target);
  }
}
