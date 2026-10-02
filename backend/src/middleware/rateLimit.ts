import {
  rateLimit,
  type Store,
  type Options,
  type IncrementResponse,
} from "express-rate-limit";
import { getRedisClient } from "@/config/redis.js";
import { config } from "@/config/env.js";
import { AppError } from "@/utils/errors.js";

// One atomic increment+expiry operation shared by every replica. No process-local
// production fallback: Redis failures must not silently disable abuse protection.
const incrementScript = `
local hits = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {hits, ttl}
`;
export class RedisRateLimitStore implements Store {
  localKeys = false;
  private windowMs = 60_000;
  constructor(public prefix: string) {}
  init(options: Options): void {
    this.windowMs = options.windowMs;
  }
  async increment(key: string): Promise<IncrementResponse> {
    try {
      const [totalHits, ttl] = (await getRedisClient().eval(
        incrementScript,
        1,
        `${this.prefix}${key}`,
        this.windowMs,
      )) as [number, number];
      return { totalHits, resetTime: new Date(Date.now() + ttl) };
    } catch {
      throw new AppError(
        "Request protection temporarily unavailable",
        503,
        "SERVICE_UNAVAILABLE",
      );
    }
  }
  async decrement(key: string): Promise<void> {
    await getRedisClient().eval(
      "if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end return 0",
      1,
      `${this.prefix}${key}`,
    );
  }
  async resetKey(key: string): Promise<void> {
    await getRedisClient().del(`${this.prefix}${key}`);
  }
}

const commonOptions = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  passOnStoreError: false,
};
// Unit/integration API tests use isolated memory stores. Redis-store behavior is
// tested separately against Redis in CI; development and production always share Redis.
const store = (name: string) =>
  config.env === "test"
    ? undefined
    : new RedisRateLimitStore(`yatrik:rate:${name}:`);
export const apiRateLimiter = rateLimit({
  ...commonOptions,
  store: store("api"),
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
export const authRateLimiter = rateLimit({
  ...commonOptions,
  store: store("auth"),
  windowMs: config.rateLimit.authWindowMs,
  limit: config.rateLimit.authMaxRequests,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});
export const aiRateLimiter = rateLimit({
  ...commonOptions,
  store: store("ai"),
  windowMs: 3_600_000,
  limit: config.rateLimit.aiMaxRequests,
  keyGenerator: (req) => req.user!.id,
  message: {
    success: false,
    message: "AI generation limit reached. Please try again in an hour.",
  },
});
