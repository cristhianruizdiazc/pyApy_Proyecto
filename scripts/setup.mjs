import { spawn } from "node:child_process";
for (const file of [
  "scripts/local-db.mjs",
  "apps/api/src/migrate.mjs",
  "scripts/harden-local-db.mjs",
  "apps/api/src/seed.mjs",
]) {
  await new Promise((ok, fail) => {
    const child = spawn(process.execPath, [file], {
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", fail);
    child.on("exit", (code) =>
      code === 0 ? ok() : fail(new Error(`Fallo en ${file}`)),
    );
  });
}
