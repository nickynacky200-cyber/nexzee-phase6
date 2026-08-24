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

// Required when running behind a reverse proxy (Nginx, etc.)
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());

app.use(hpp());

app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req) =>
      req.path === "/health" || req.path.startsWith("/api/webhooks"),
  })
);

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Paystack webhook must use raw body BEFORE express.json()
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json", limit: "1mb" }),
  webhooksRoutes
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Root route — useful for checking that Render is running
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Nexzee API is running",
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API routes
app.use("/api", routes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);
