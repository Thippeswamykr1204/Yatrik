import mongoose from "mongoose";
import { getRedisClient } from "@/config/redis.js";
import { getGenerationQueue } from "@/queues/generation.queue.js";

export async function checkReadiness(): Promise<{
  ready: boolean;
  checks: Record<string, boolean>;
}> {
  const checks = { mongodb: false, redis: false, worker: false };
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all([
        (async () => {
          if (mongoose.connection.readyState !== 1 || !mongoose.connection.db)
            return;
          await mongoose.connection.db.admin().ping();
          checks.mongodb = true;
        })(),
        (async () => {
          checks.redis = (await getRedisClient().ping()) === "PONG";
          checks.worker = (await getGenerationQueue().getWorkers()).length > 0;
        })(),
      ]),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Readiness timeout")),
          3500,
        );
      }),
    ]);
  } catch {
    /* Unavailable dependencies are represented in the response, not leaked. */
  } finally {
    clearTimeout(timeout);
  }
  return { ready: Object.values(checks).every(Boolean), checks };
}
