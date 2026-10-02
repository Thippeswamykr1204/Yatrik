import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// These are test-only placeholders. MongoDB itself is supplied by MongoMemoryServer below.
process.env.NODE_ENV = "test";
process.env.TRUST_PROXY = "1";
process.env.COOKIE_SAME_SITE = "lax";
process.env.LOG_LEVEL = "error";
delete process.env.SENTRY_DSN;
if (process.env.TEST_REDIS_URL)
  process.env.REDIS_URL = process.env.TEST_REDIS_URL;
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/yatrick-test-placeholder";
process.env.JWT_SECRET =
  "test-access-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-that-is-at-least-thirty-two-characters";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.RATE_LIMIT_MAX_REQUESTS = "1000";
process.env.AUTH_RATE_LIMIT_WINDOW_MS = "60000";
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = "3";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { ip: "127.0.0.1" },
  });
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(() => {
  // Test failures must never fall through to a real paid provider request.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Network fetch must be mocked in tests");
    }),
  );
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  const collections = await mongoose.connection.db?.collections();
  await Promise.all(
    collections?.map((collection) => collection.deleteMany({})) ?? [],
  );
});

afterAll(async () => {
  const { closeRedis } = await import("@/config/redis.js");
  await closeRedis();
  await mongoose.disconnect();
  await mongoServer?.stop();
});
