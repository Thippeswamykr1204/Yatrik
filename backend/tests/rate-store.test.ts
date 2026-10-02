import { randomUUID } from "node:crypto";
import type { Options } from "express-rate-limit";
import { RedisRateLimitStore } from "@/middleware/rateLimit.js";
import { getRedisClient } from "@/config/redis.js";
import * as redisConfig from "@/config/redis.js";

it("fails closed with a service-unavailable error when Redis fails", async () => {
  vi.spyOn(redisConfig, "getRedisClient").mockImplementation(() => {
    throw new Error("private-redis-url");
  });
  const store = new RedisRateLimitStore("test:");
  store.init({ windowMs: 1000 } as Options);
  await expect(store.increment("client")).rejects.toMatchObject({
    statusCode: 503,
    message: "Request protection temporarily unavailable",
  });
});

// CI supplies a real Redis service; no process-local mock can prove atomicity.
describe.skipIf(!process.env.TEST_REDIS_URL)(
  "distributed Redis rate store",
  () => {
    it("shares atomic counters across replicas, namespaces, and expiry", async () => {
      const redis = getRedisClient();
      if (redis.status !== "ready")
        await new Promise<void>((resolve) => redis.once("ready", resolve));
      const prefix = `test:rate:${randomUUID()}:`;
      const first = new RedisRateLimitStore(prefix);
      const second = new RedisRateLimitStore(prefix);
      const other = new RedisRateLimitStore(`${prefix}other:`);
      for (const store of [first, second, other])
        store.init({ windowMs: 100 } as Options);
      const counts = await Promise.all(
        Array.from({ length: 10 }, (_, index) =>
          (index % 2 ? first : second).increment("user"),
        ),
      );
      expect(
        counts.map((item) => item.totalHits).sort((a, b) => a - b),
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect((await other.increment("user")).totalHits).toBe(1);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect((await second.increment("user")).totalHits).toBe(1);
      await first.resetKey("user");
      await other.resetKey("user");
    });
  },
);
