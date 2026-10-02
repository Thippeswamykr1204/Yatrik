import { Redis } from "ioredis";
import { config } from "@/config/env.js";
import logger from "@/utils/logger.js";

let client: Redis | undefined;

/** Request-side commands fail promptly instead of queuing forever during outages. */
export function getRedisClient(): Redis {
  if (!client) {
    client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 3000,
      commandTimeout: 3000,
    });
    client.on("error", () => logger.warn("Redis connection unavailable"));
  }
  return client;
}

/** BullMQ workers need blocking connections and unlimited reconnect attempts. */
export function createWorkerConnection(): Redis {
  const connection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    connectTimeout: 3000,
  });
  connection.on("error", () =>
    logger.warn("Worker Redis connection unavailable"),
  );
  return connection;
}

export async function closeRedis(): Promise<void> {
  client?.disconnect();
  client = undefined;
}
