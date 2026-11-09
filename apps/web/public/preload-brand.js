// Discover the landing resources before React and session requests complete.
// Other routes keep their own image budget; all URLs follow Vite's base path.
(() => {
  const base = new URL(".", document.currentScript.src);
  const path = window.location.pathname;
  const home =
    path === base.pathname || path === new URL("index.html", base).pathname;
  const access = path === new URL("ingresar", base).pathname;
  if (home || access) {
    const font = document.createElement("link");
    font.rel = "preload";
    font.as = "font";
    font.type = "font/woff2";
    font.crossOrigin = "anonymous";
    font.href = new URL("fonts/fraunces-italic.woff2", base).href;
    document.head.append(font);
  }
  if (home) {
    const hero = document.createElement("link");
    hero.rel = "preload";
    hero.as = "image";
    hero.href = new URL("brand/escapada-2172.webp", base).href;
    hero.imageSrcset = [960, 1600, 2172]
      .map(
        (width) =>
          `${new URL(`brand/escapada-${width}.webp`, base).href} ${width}w`,
      )
      .join(", ");
    hero.imageSizes = "(max-width: 780px) 2172px, 100vw";
    hero.fetchPriority = "high";
    document.head.append(hero);
  }
})();
