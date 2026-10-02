import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { corsMiddleware } from "@/middleware/cors.js";
import { requestId } from "@/middleware/requestId.js";
import { errorHandler, asyncHandler } from "@/middleware/errorHandler.js";
import { sendSuccess } from "@/utils/apiResponse.js";
import apiRoutes from "@/routes/index.js";
import logger from "@/utils/logger.js";
import { config } from "@/config/env.js";
import { checkReadiness } from "@/utils/readiness.js";
import { ValidationError } from "@/utils/errors.js";
import { apiRateLimiter } from "@/middleware/rateLimit.js";

export const createApp = (): Express => {
  const app = express();

  // Default to direct-client IPs. Only trust a configured, controlled proxy path.
  app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");

  // ==================== REQUEST ID (must be early, before routes) ====================
  app.use(requestId);

  // ==================== SECURITY MIDDLEWARE ====================
  app.use(helmet());

  // ==================== BODY PARSING MIDDLEWARE ====================
  app.use(express.json({ limit: "256kb" }));
  app.use(
    express.urlencoded({
      limit: "256kb",
      extended: false,
      parameterLimit: 100,
    }),
  );

  // ==================== COOKIE PARSING ====================
  // Using built-in express.json() doesn't parse cookies
  // We need to add a simple cookie parser
  app.use((req: Request, res: Response, next: NextFunction) => {
    const cookies: Record<string, string> = Object.create(null);
    try {
      for (const cookie of (req.headers.cookie ?? "").split(";")) {
        const separator = cookie.indexOf("=");
        if (separator < 1) continue;
        const key = cookie.slice(0, separator).trim();
        if (!Object.hasOwn(cookies, key))
          cookies[key] = decodeURIComponent(cookie.slice(separator + 1));
      }
      req.cookies = cookies;
      next();
    } catch {
      next(new ValidationError("Malformed cookie header"));
    }
  });

  // ==================== CORS MIDDLEWARE ====================
  app.use(corsMiddleware);

  // ==================== REQUEST LOGGING MIDDLEWARE ====================
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - (req.startTime || Date.now());
      const level = res.statusCode >= 400 ? "warn" : "info";

      logger[level as keyof typeof logger](`${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        requestId: req.id,
      });
    });

    next();
  });

  // ==================== HEALTH CHECK ENDPOINT ====================
  app.get("/health", (req: Request, res: Response) => {
    return sendSuccess(res, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    });
  });

  app.get(
    ["/ready", "/api/ready"],
    asyncHandler(async (_req, res) => {
      const result = await checkReadiness();
      res.setHeader("Cache-Control", "no-store");
      res
        .status(result.ready ? 200 : 503)
        .json({ success: result.ready, data: result });
    }),
  );

  app.get("/api/health", (req: Request, res: Response) => {
    return sendSuccess(res, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    });
  });

  // Never allow shared caches or browsers to retain account-owned API payloads.
  app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "private, no-store");
    next();
  });
  // Health endpoints deliberately bypass Redis rate limiting for outage diagnosis.
  app.use("/api", apiRateLimiter);

  // ==================== API ROUTES ====================
  app.use("/api", apiRoutes);

  app.get("/api/status", (req: Request, res: Response) => {
    return sendSuccess(res, {
      message: "API is running",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // ==================== 404 HANDLER ====================
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      status: 404,
      message: `Route ${req.path} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  // ==================== ERROR HANDLER (MUST BE LAST) ====================
  app.use(errorHandler);

  return app;
};
