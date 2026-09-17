import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".local", { recursive: true });
const secret = () => randomBytes(32).toString("hex");
await writeFile(
  ".local/compose.env",
  `POSTGRES_PASSWORD=${secret()}\nAPP_DB_PASSWORD=${secret()}\nREPORT_DB_PASSWORD=${secret()}\nWEB_ORIGIN=http://127.0.0.1:8080\nWEB_PORT=8080\nRUN_MODE=development\n`,
  { flag: "wx", mode: 0o600 },
);
console.log(
  "Configuracion local generada en .local/compose.env; no se imprime ni se versiona.",
);
