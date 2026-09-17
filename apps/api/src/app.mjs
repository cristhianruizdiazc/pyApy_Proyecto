import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { config, root } from "./config.mjs";
import { pool } from "./db.mjs";
import { session, auth } from "./auth.mjs";
import { properties } from "./properties.mjs";
import { bookings } from "./bookings.mjs";
import { management } from "./management.mjs";
import { images } from "./images.mjs";
import { HttpError } from "./errors.mjs";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", Number(config.TRUST_PROXY));
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.set("X-Request-Id", req.requestId);
  res.on("finish", () => {
    if (config.NODE_ENV !== "test")
      console.log(
        JSON.stringify({
          requestId: req.requestId,
          method: req.method,
          status: res.statusCode,
        }),
      );
  });
  next();
});
app.use(helmet());
app.use(
  cors({
    origin: config.WEB_ORIGIN,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "Idempotency-Key",
      "X-Client",
    ],
  }),
);
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    origin &&
    origin !== config.WEB_ORIGIN
  )
    return res
      .status(403)
      .json({ code: "ORIGIN", message: "Origen no permitido." });
  next();
});
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      code: "RATE_LIMIT",
      message: "Demasiadas solicitudes. Espera un momento.",
    },
  }),
);
app.get("/api/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});
if (config.demo)
  app.use("/demo", express.static(resolve(root, "apps/web/public/demo")));
app.use("/api/v1", session, (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api/v1/auth", auth);
app.use("/api/v1", properties);
app.use("/api/v1", images);
app.use("/api/v1", management);
app.use("/api/v1", bookings);
app.use((req, res) =>
  res
    .status(404)
    .json({ code: "NOT_FOUND", message: "Recurso no encontrado." }),
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  let status = 500,
    code = "INTERNAL_ERROR",
    message = "No se pudo completar la operacion.";
  if (error instanceof ZodError) {
    status = 422;
    code = "VALIDATION";
    message = "Revisa los campos ingresados.";
  } else if (error instanceof HttpError) {
    status = error.status;
    code = error.code;
    message = error.message;
  } else if (error.code === "23P01") {
    status = 409;
    code = "BOOKING_CONFLICT";
    message = "Ese horario acaba de ocuparse. Elegi otro intervalo.";
  } else if (error.code === "23505") {
    status = 409;
    code = "DUPLICATE";
    message = "La operacion ya existe o entra en conflicto con un registro.";
  } else if (error.code === "23503") {
    status = 422;
    code = "INVALID_REFERENCE";
    message = "El recurso relacionado no es valido.";
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "El formato de la solicitud no es valido.";
  } else if (
    error.type === "entity.too.large" ||
    error.code === "LIMIT_FILE_SIZE"
  ) {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "El archivo o la solicitud supera el limite permitido.";
  } else if (error.name === "MulterError") {
    status = 422;
    code = "INVALID_UPLOAD";
    message = "La carga de archivos no es valida.";
  }
  if (status >= 500)
    console.error(
      JSON.stringify({
        event: "request_error",
        requestId: req.requestId,
        errorType: error.name,
        code: error.code || "unknown",
      }),
    );
  res.status(status).json({ code, message, requestId: req.requestId });
});
