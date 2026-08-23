import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import routes from "./routes";
import webhooksRoutes from "./routes/webhooks.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export const app = express();

// Required when running behind a reverse proxy (Nginx, etc. — see the
// deployment docs). Without this, express-rate-limit and req.ip see the
// proxy's IP for every request instead of the real client's, which
// silently breaks all IP-based rate limiting (everyone shares one bucket).
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(hpp()); // strips duplicate query/body params (?amount=100&amount=999 style parameter pollution)

// Basic access logging — skips /health (uptime-monitor noise) and the
// webhook route (payment payloads shouldn't land in general app logs;
// WebhookEvent already stores the full payload for audit purposes).
app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req) => req.path === "/health" || req.path.startsWith("/api/webhooks"),
  })
);

// CORS_ORIGIN accepts a comma-separated list so the customer app and admin
// app (different ports/domains) can both reach the same backend.
// e.g. CORS_ORIGIN=http://localhost:5173,http://localhost:5174
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, Paystack's
      // webhook POSTs) with no origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Global rate limit — tighter limits belong on specific sensitive routes
// (e.g. login, purchase) once those are built out.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// IMPORTANT: the Paystack webhook route is mounted here, with express.raw(),
// BEFORE the global express.json() below. Webhook signature verification
// (HMAC over the raw body) breaks if the body has already been parsed and
// re-serialized — whitespace/key-ordering differences change the hash.
// This must stay ahead of express.json() in the middleware order.
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json", limit: "1mb" }),
  webhooksRoutes
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
