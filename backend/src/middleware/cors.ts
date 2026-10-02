import cors from "cors";
import type { RequestHandler } from "express";
import { config } from "@/config/env.js";
import { ForbiddenError } from "@/utils/errors.js";

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || config.frontend.origins.includes(origin))
      return callback(null, true);
    return callback(new ForbiddenError("Origin is not allowed"));
  },
  credentials: true,
});

// CORS alone does not stop a form POST. Validate browser origins before any auth
// cookie mutation; require an Origin for production cookie-authenticated requests.
export const protectAuthOrigin: RequestHandler = (req, _res, next) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const origin = req.get("origin");
  if (
    (origin && !config.frontend.origins.includes(origin)) ||
    (!origin &&
      (req.get("sec-fetch-site") === "cross-site" ||
        (config.env === "production" && req.cookies?.refreshToken)))
  ) {
    return next(new ForbiddenError("Trusted Origin header required"));
  }
  next();
};
