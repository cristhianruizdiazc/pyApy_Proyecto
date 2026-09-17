import {
  scrypt as scryptCallback,
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { loginSchema, registerSchema } from "@pyapy/contracts";
import { pool, transaction, audit } from "./db.mjs";
import { config } from "./config.mjs";
import { fail } from "./errors.mjs";
const scrypt = promisify(scryptCallback);
const cookieName = "pyapy_session";
const cookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: "lax",
  path: "/api",
};
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 67108864,
  });
  return `scrypt$${salt}$${hash.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [, salt, hex] = stored.split("$");
  const hash = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 67108864,
  });
  const expected = Buffer.from(hex, "hex");
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}
const dummyHash = await hashPassword(randomBytes(32).toString("hex"));
export async function session(req, res, next) {
  const bearer = req.get("authorization");
  if (bearer && !/^Bearer [a-f0-9]{64}$/.test(bearer))
    fail(401, "INVALID_TOKEN", "La sesion no es valida.");
  const token = bearer ? bearer.slice(7) : req.cookies?.[cookieName];
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    req.tokenHash = digest(token);
    const row = (
      await pool.query(
        "SELECT u.id,u.email,u.name,u.role,s.csrf_token FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true",
        [req.tokenHash],
      )
    ).rows[0];
    if (row) {
      req.user = {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
      };
      req.csrf = row.csrf_token;
      req.cookieAuth = !bearer;
    }
  }
  if (
    req.user &&
    req.cookieAuth &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("x-csrf-token") !== req.csrf
  )
    fail(403, "CSRF", "La sesion necesita actualizarse.");
  next();
}
export function requireUser(req, res, next) {
  if (!req.user) fail(401, "UNAUTHENTICATED", "Inicia sesion para continuar.");
  next();
}
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    requireUser(req, res, () => {});
    if (!roles.includes(req.user.role))
      fail(403, "FORBIDDEN", "No tenes permiso para esta operacion.");
    next();
  };
async function issue(db, userId) {
  const token = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '7 days')",
    [digest(token), userId, csrfToken],
  );
  return { token, csrfToken };
}
function deliver(req, res, user, issued) {
  if (req.get("x-client") === "mobile") return res.json({ user, ...issued });
  res.cookie(cookieName, issued.token, { ...cookieOptions, maxAge: 604800000 });
  return res.json({ user, csrfToken: issued.csrfToken });
}
export const auth = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT",
    message: "Demasiados intentos. Proba de nuevo mas tarde.",
  },
});
auth.get("/session", (req, res) =>
  res.json({ user: req.user || null, csrfToken: req.csrf || null }),
);
auth.post("/register", limiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const hash = await hashPassword(input.password);
  const result = await transaction(async (db) => {
    const user = (
      await db.query(
        "INSERT INTO users(email,name,password_hash) VALUES($1,$2,$3) RETURNING id,email,name,role",
        [input.email, input.name, hash],
      )
    ).rows[0];
    const issued = await issue(db, user.id);
    await audit(db, user.id, "register", user.id);
    return { user, issued };
  });
  res.status(201);
  deliver(req, res, result.user, result.issued);
});
auth.post("/login", limiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const found = (
    await pool.query(
      "SELECT id,email,name,role,password_hash,active FROM users WHERE email=$1",
      [input.email],
    )
  ).rows[0];
  const valid = await verifyPassword(
    input.password,
    found?.password_hash || dummyHash,
  );
  if (!valid || !found?.active)
    fail(401, "INVALID_CREDENTIALS", "Email o contrasena incorrectos.");
  const user = {
    id: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
  };
  deliver(req, res, user, await issue(pool, user.id));
});
auth.post("/refresh", requireUser, async (req, res) => {
  const issued = await transaction(async (db) => {
    const deleted = await db.query(
      "DELETE FROM sessions WHERE token_hash=$1 RETURNING token_hash",
      [req.tokenHash],
    );
    if (!deleted.rowCount) fail(401, "SESSION_EXPIRED", "La sesion expiro.");
    return issue(db, req.user.id);
  });
  deliver(req, res, req.user, issued);
});
auth.post("/logout", requireUser, async (req, res) => {
  await pool.query("DELETE FROM sessions WHERE token_hash=$1", [req.tokenHash]);
  res.clearCookie(cookieName, cookieOptions);
  res.json({ ok: true });
});
