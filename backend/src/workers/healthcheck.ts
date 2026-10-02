import { hostname } from "node:os";
import { getRedisClient, closeRedis } from "@/config/redis.js";

// A per-container heartbeat ensures another healthy replica cannot hide a stuck worker.
async function main(): Promise<void> {
  const redis = getRedisClient();
  if (redis.status !== "ready")
    await new Promise<void>((resolve) => redis.once("ready", resolve));
  const healthy = await redis.exists(`yatrik:worker:${hostname()}`);
  await closeRedis();
  process.exit(healthy ? 0 : 1);
}
const deadline = setTimeout(() => process.exit(1), 4000).unref();
void main()
  .catch(() => process.exit(1))
  .finally(() => clearTimeout(deadline));
