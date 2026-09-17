import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
export const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
if (existsSync(resolve(root, ".env")))
  process.loadEnvFile(resolve(root, ".env"));
const env = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    PORT: z.coerce.number().default(4100),
    HOST: z.string().default("127.0.0.1"),
    TRUST_PROXY: z.enum(["0", "1"]).default("0"),
    WEB_ORIGIN: z.url().default("http://127.0.0.1:5173"),
    DEMO_MODE: z.enum(["true", "false"]).default("false"),
    UPLOAD_DIR: z.string().default(".local/uploads"),
  })
  .parse(process.env);
if (
  env.NODE_ENV === "production" &&
  (env.DEMO_MODE === "true" || !env.WEB_ORIGIN.startsWith("https://"))
)
  throw new Error("Produccion requiere HTTPS y DEMO_MODE=false.");
export const config = {
  ...env,
  production: env.NODE_ENV === "production",
  demo: env.DEMO_MODE === "true",
  uploads: resolve(root, env.UPLOAD_DIR),
};
