import { z } from "zod";

const optionalValue = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );
const positiveInteger = z.coerce.number().int().positive();
const origin = z
  .string()
  .url()
  .refine(
    (value) => new URL(value).origin === value,
    "Must be an origin without a path or trailing slash",
  );
const originList = z.string().transform((value, ctx) => {
  const origins = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!origins.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide at least one allowed frontend origin",
    });
    return [];
  }
  for (const allowedOrigin of origins) {
    if (!origin.safeParse(allowedOrigin).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid frontend origin: ${allowedOrigin}`,
      });
    }
  }
  return origins;
});
const optionalOriginList = z.preprocess(
  (value) => (value === "" ? undefined : value),
  originList.optional(),
);
const optionalDomain = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .trim()
    .max(253)
    .regex(/^[a-z0-9.-]+$/i, "Invalid cookie domain")
    .optional(),
);
const booleanValue = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .default("false");
const duration = z
  .string()
  .max(10)
  .regex(/^\d+[smhd]$/, "Use a positive duration such as 15m or 7d")
  .refine(
    (value) =>
      parseInt(value, 10) > 0 && durationMilliseconds(value) <= 90 * 86_400_000,
    "Duration must be positive and at most 90 days",
  );

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: positiveInteger.max(65535).default(5000),
    HOST: z.string().default("0.0.0.0"),
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(?:\+srv)?:\/\//, "Must be a MongoDB URI"),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRY: duration.default("15m"),
    JWT_REFRESH_EXPIRY: duration.default("7d"),
    GEMINI_API_KEY: z.string().min(1),
    REDIS_URL: z
      .string()
      .url()
      .refine((value) => /^rediss?:/.test(value), "Must be a Redis URL")
      .optional(),
    FRONTEND_URL: origin.default("http://localhost:3000"),
    FRONTEND_URL_PROD: optionalValue(origin),
    // Comma-separated exact origins for local + Vercel/custom-domain deployments.
    FRONTEND_URLS: optionalOriginList,
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    COOKIE_SECURE: booleanValue,
    COOKIE_DOMAIN: optionalDomain,
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    RATE_LIMIT_WINDOW_MS: positiveInteger.max(86_400_000).default(900_000),
    RATE_LIMIT_MAX_REQUESTS: positiveInteger.default(100),
    AUTH_RATE_LIMIT_WINDOW_MS: positiveInteger.max(86_400_000).default(900_000),
    AUTH_RATE_LIMIT_MAX_REQUESTS: positiveInteger.default(10),
    AI_RATE_LIMIT_MAX_REQUESTS: positiveInteger.default(5),
    SENTRY_DSN: optionalValue(z.string().url()),
  })
  .superRefine((env, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (env.JWT_SECRET === env.JWT_REFRESH_SECRET)
      issue("JWT_REFRESH_SECRET", "Access and refresh secrets must differ");
    if (env.NODE_ENV === "production") {
      if (!env.REDIS_URL) issue("REDIS_URL", "Redis is required in production");
      const productionOrigins =
        env.FRONTEND_URLS ??
        (env.FRONTEND_URL_PROD ? [env.FRONTEND_URL_PROD] : []);
      if (
        !productionOrigins.length ||
        productionOrigins.some(
          (allowedOrigin) => !allowedOrigin.startsWith("https://"),
        )
      )
        issue(
          "FRONTEND_URL_PROD",
          "An explicit HTTPS frontend origin is required in production",
        );
      for (const key of [
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "GEMINI_API_KEY",
      ] as const) {
        if (/placeholder|change.?me|example|test-|replace/i.test(env[key]))
          issue(key, "Replace placeholder credentials before deployment");
      }
    }
    if (env.COOKIE_SAME_SITE === "none" && env.NODE_ENV !== "production") {
      issue(
        "COOKIE_SAME_SITE",
        "SameSite=None requires production HTTPS cookies",
      );
    }
    if (env.COOKIE_SAME_SITE === "none" && !env.COOKIE_SECURE) {
      issue("COOKIE_SECURE", "SameSite=None requires Secure cookies");
    }
  });

export function durationMilliseconds(value: string): number {
  const units: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return parseInt(value, 10) * units[value.slice(-1)];
}
