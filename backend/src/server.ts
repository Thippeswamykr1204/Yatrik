import { createApp } from "./app.js";
import { connectDatabase } from "@/config/database.js";
import { config } from "@/config/env.js";
import { getRedisClient, closeRedis } from "@/config/redis.js";
import { closeGenerationQueue } from "@/queues/generation.queue.js";
import { initSentry, Sentry } from "@/config/sentry.js";
import {
  startQueueHealthCheck,
  stopQueueHealthCheck,
} from "@/utils/queueHealthCheck.js";
import logger from "@/utils/logger.js";

const startServer = async () => {
  try {
    initSentry();
    logger.info("🚀 Starting AI Travel Planner Backend...");

    // Validate environment
    logger.info(`📋 Environment: ${config.env}`);
    logger.info(`🔑 Environment validation: PASSED`);

    // Connect to database
    logger.info("🔗 Connecting to MongoDB...");
    await connectDatabase();
    const redis = getRedisClient();
    if (redis.status !== "ready") {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error("Redis startup timeout"));
        }, 5000);
        const ready = () => {
          cleanup();
          resolve();
        };
        const cleanup = () => {
          clearTimeout(timeout);
          redis.off("ready", ready);
        };
        redis.once("ready", ready);
      });
    }
    await redis.ping();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, config.host, () => {
      logger.info(
        `✅ Server is running on http://${config.host}:${config.port}`,
      );
      logger.info(
        `📝 Health check: http://${config.host}:${config.port}/health`,
      );
      logger.info(
        `🎯 API Status: http://${config.host}:${config.port}/api/status`,
      );
      logger.info("");
      logger.info("Readiness endpoint: /ready");

      // A1.4: periodic (not just startup) loud, non-fatal warning if generation jobs
      // pile up with no worker connected — catches the worker dying mid-flight too.
      startQueueHealthCheck();
    });

    server.requestTimeout = 30_000;
    server.headersTimeout = 15_000;
    let stopping = false;
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      if (stopping) return;
      stopping = true;
      logger.info(`\n📩 ${signal} received. Shutting down gracefully...`);
      stopQueueHealthCheck();

      server.close(async () => {
        logger.info("✅ HTTP server closed");

        try {
          // Import disconnect function
          const { disconnectDatabase } = await import("@/config/database.js");
          await closeGenerationQueue();
          await closeRedis();
          await disconnectDatabase();
          logger.info("✅ Database disconnected");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown", { error });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("❌ Forced shutdown - graceful shutdown took too long");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Uncaught exception handler
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", { error });
      Sentry.captureException(error);
      process.exit(1);
    });

    // Unhandled rejection handler
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection");
      Sentry.captureException(reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

startServer();
