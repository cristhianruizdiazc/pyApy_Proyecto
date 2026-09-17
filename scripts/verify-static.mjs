import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readdir, mkdir, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  "index.html",
  ...(await readdir(resolve(root, "html")))
    .filter((name) => name.endsWith(".html"))
    .map((name) => `html/${name}`),
];
const captures = resolve(root, ".local/screenshots/static");
await mkdir(captures, { recursive: true });
const browser = await chromium.launch({ headless: true });
const visited = new Set();
const indexed = new Set();
let localLinks = 0;
try {
  for (const width of [1440, 390, 320]) {
    // file:// must remain usable even when no HTTP server is reachable.
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      offline: true,
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    for (const file of pages) {
      const url = pathToFileURL(resolve(root, file)).href;
      await page.goto(url, { waitUntil: "load" });
      await page.locator("h1").waitFor();
      assert.equal(await page.locator("h1").count(), 1, `${file}: un solo h1`);
      assert.equal(
        await page.locator("script").count(),
        0,
        `${file}: no necesita JavaScript`,
      );
      const invalidImages = await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach((img) => {
          img.loading = "eager";
        });
        await Promise.all(images.map((img) => img.decode().catch(() => {})));
        return images.filter((img) => !img.naturalWidth).map((img) => img.src);
      });
      assert.deepEqual(
        invalidImages,
        [],
        `${file}: imagenes locales completas`,
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(overflow, false, `${file}: no desborda a ${width}px`);
      if (width === 1440) {
        const links = await page
          .locator("a[href],link[href],img[src]")
          .evaluateAll((elements) =>
            elements.map((element) => element.href || element.src),
          );
        for (const href of links) {
          const target = new URL(href);
          if (target.protocol !== "file:") continue;
          const path = fileURLToPath(target);
          assert.ok(
            path.startsWith(root),
            `${file}: enlace fuera del proyecto`,
          );
          await access(path);
          localLinks++;
          if (file === "html/indice.html" && path.endsWith(".html"))
            indexed.add(path);
          if (target.hash && target.pathname === new URL(url).pathname) {
            const exists = await page.evaluate(
              (id) => Boolean(document.getElementById(id)),
              decodeURIComponent(target.hash.slice(1)),
            );
            assert.ok(exists, `${file}: destino ${target.hash} existe`);
          }
        }
        visited.add(resolve(root, file));
      }
      if (
        width !== 320 &&
        [
          "index.html",
          "html/quinta-yvytu.html",
          "html/propietario.html",
          "html/administracion.html",
          "html/indice.html",
        ].includes(file)
      ) {
        await page.screenshot({
          path: resolve(
            captures,
            `${file.replaceAll("/", "-").replace(".html", "")}-${width}.png`,
          ),
          fullPage: true,
        });
      }
    }
    await page.goto(pathToFileURL(resolve(root, "html/explorar.html")).href);
    await page.locator('select[name="city"]').selectOption("aregua");
    assert.equal(await page.locator(".property-card:visible").count(), 1);
    assert.match(
      await page.locator(".property-card:visible h3").innerText(),
      /Casa del Lago/,
    );
    await page.locator('select[name="city"]').selectOption("all");
    await page
      .locator('input[name="kind"][value="Quinta"]')
      .check({ force: true });
    assert.equal(await page.locator(".property-card:visible").count(), 2);
    await page
      .locator('input[name="kind"][value="all"]')
      .check({ force: true });
    await page.locator(".filter-menu summary").click();
    await page.locator('select[name="budget"]').selectOption("50000");
    assert.equal(await page.locator(".property-card:visible").count(), 2);
    await page.locator('select[name="budget"]').selectOption("all");
    await page.locator('select[name="guests"]').selectOption("6");
    assert.equal(await page.locator(".property-card:visible").count(), 6);
    await page.locator('select[name="guests"]').selectOption("30");
    assert.equal(await page.locator(".property-card:visible").count(), 2);
    await page
      .locator(".property-card:visible .favorite input")
      .first()
      .check();
    assert.equal(await page.locator(".favorite input:checked").count(), 1);
    await page.locator('select[name="city"]').selectOption("caacupe");
    assert.equal(await page.locator(".property-card:visible").count(), 0);
    assert.ok(await page.locator(".catalog-empty").isVisible());
    await page.locator(".catalog-empty a").click();
    assert.equal(await page.locator(".property-card:visible").count(), 6);
    if (width < 780) {
      await page.locator(".mobile-menu summary").click();
      assert.ok(
        await page.locator('.mobile-menu a[href="indice.html"]').isVisible(),
      );
      await page.locator('.mobile-menu a[href="indice.html"]').click();
      assert.match(await page.title(), /Indice/);
    }
    assert.deepEqual(runtimeErrors, []);
    await context.close();
    console.log(
      `PASS: ${pages.length} pantallas file:// sin conexion, fotos, enlaces, filtros CSS y ancho ${width}px.`,
    );
  }
  for (const file of visited)
    assert.ok(indexed.has(file), `Pantalla sin indexar: ${file}`);
  console.log(
    `PASS: ${pages.length} pantallas indexadas y ${localLinks} enlaces/recursos locales verificados.`,
  );
  console.log(
    "Capturas en .local/screenshots/static. No se requirio Docker, API ni servidor web.",
  );
} finally {
  await browser.close();
}
