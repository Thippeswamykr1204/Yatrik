import request from "supertest";
import { createApp } from "@/app.js";

const dependencies = vi.hoisted(() => ({ ping: vi.fn(), getWorkers: vi.fn() }));
vi.mock("@/config/redis.js", () => ({
  getRedisClient: () => ({ ping: dependencies.ping }),
  closeRedis: vi.fn(),
}));
vi.mock("@/queues/generation.queue.js", () => ({
  getGenerationQueue: () => ({ getWorkers: dependencies.getWorkers }),
}));

it("separates liveness from dependency and worker readiness", async () => {
  const app = createApp();
  dependencies.ping.mockRejectedValue(new Error("unavailable"));
  expect((await request(app).get("/health")).status).toBe(200);
  const down = await request(app).get("/ready");
  expect(down.status).toBe(503);
  expect(down.body.data.checks.redis).toBe(false);
  dependencies.ping.mockResolvedValue("PONG");
  dependencies.getWorkers.mockResolvedValue([]);
  expect((await request(app).get("/ready")).status).toBe(503);
  dependencies.getWorkers.mockResolvedValue([{ id: "worker" }]);
  const ready = await request(app).get("/api/ready");
  expect(ready.status).toBe(200);
  expect(ready.body.data.checks).toEqual({
    mongodb: true,
    redis: true,
    worker: true,
  });
});
