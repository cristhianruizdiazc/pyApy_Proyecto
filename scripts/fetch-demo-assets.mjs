import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const assets = {
  pool: "photo-1576013551627-0cc20b96c2a7",
  house: "photo-1613490493576-7fde63acd811",
  garden: "photo-1600596542815-ffad4c1539a9",
  cabin: "photo-1449158743715-0a90ebb6d2d8",
  palms: "photo-1564013799919-ab600027ffc6",
  retreat: "photo-1613977257363-707ba9348227",
};
const destination = resolve("apps/web/public/demo");
await mkdir(destination, { recursive: true });
for (const [name, id] of Object.entries(assets)) {
  const path = resolve(destination, `${name}.jpg`);
  if (existsSync(path)) continue;
  const response = await fetch(
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=82`,
  );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    throw new Error(`No se pudo obtener ${name}: ${response.status}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  console.log(`Imagen de demostracion: ${name}.jpg`);
}
