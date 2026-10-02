import dotenv from "dotenv";
import { envSchema, durationMilliseconds } from "./env.schema.js";

// Containers use injected environment variables. Never read local secrets in tests.
if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // Only field names and schema messages: never print values from process.env.
  throw new Error(
    `Environment validation failed: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
  );
}
const env = parsed.data;
const frontendOrigins =
  env.FRONTEND_URLS ??
  (env.NODE_ENV === "production"
    ? [env.FRONTEND_URL_PROD!]
    : [env.FRONTEND_URL]);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  // Render injects PORT; binding all interfaces is required for its health checks.
  host: env.HOST,
  trustProxy: env.TRUST_PROXY,
  mongodb: { uri: env.MONGODB_URI },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRY,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRY,
    refreshMaxAge: durationMilliseconds(env.JWT_REFRESH_EXPIRY),
  },
  cookie: {
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
    domain: env.COOKIE_DOMAIN,
  },
  gemini: { apiKey: env.GEMINI_API_KEY },
  redis: { url: env.REDIS_URL ?? "redis://127.0.0.1:6379" },
  frontend: {
    url: frontendOrigins[0],
    origins: frontendOrigins,
  },
  logging: { level: env.LOG_LEVEL },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    authWindowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    authMaxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    aiMaxRequests: env.AI_RATE_LIMIT_MAX_REQUESTS,
  },
  sentry: { dsn: env.SENTRY_DSN },
} as const;

export default config;
