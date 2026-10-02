import mongoose from "mongoose";
import request from "supertest";
import { Worker } from "bullmq";
import { createApp } from "@/app.js";
import { Trip } from "@/models/Trip.js";
import { getRedisClient, createWorkerConnection } from "@/config/redis.js";
import {
  GENERATION_QUEUE_NAME,
  closeGenerationQueue,
  type GenerationJobData,
} from "@/queues/generation.queue.js";
import { processGeneration } from "@/workers/generation.worker.js";
import { generateAccessToken } from "@/utils/tokens.js";
import { validGeneration } from "./helpers/generation.js";

vi.mock("@/services/ai.service.js", async () => {
  const { validGeneration: result } = await import("./helpers/generation.js");
  return {
    GENERATION_MODEL: "test-model",
    generateItinerary: vi.fn(async () => result),
  };
});

describe.skipIf(!process.env.TEST_REDIS_URL)(
  "real Redis/BullMQ generation flow",
  () => {
    it("enqueues through the API and persists the worker result without a provider call", async () => {
      const redis = getRedisClient();
      if (redis.status !== "ready")
        await new Promise<void>((resolve) => redis.once("ready", resolve));
      const connection = createWorkerConnection();
      const worker = new Worker<GenerationJobData>(
        GENERATION_QUEUE_NAME,
        processGeneration,
        { connection },
      );
      await worker.waitUntilReady();
      try {
        const userId = new mongoose.Types.ObjectId().toString();
        const trip = await Trip.create({
          userId,
          destination: `Goa-${userId}`,
          durationDays: 1,
          budgetTier: "Low",
        });
        const token = generateAccessToken({
          id: userId,
          email: "queue@example.com",
          name: "Queue Tester",
        });
        const app = createApp();
        const response = await request(app)
          .post(`/api/trips/${trip.id}/generate`)
          .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(202);
        expect(response.body.data.jobId).toBeTruthy();
        await expect
          .poll(async () => (await Trip.findById(trip.id))?.generationStatus)
          .toBe("completed");
        const result = await Trip.findById(trip.id);
        expect(result?.estimatedBudget.total).toBe(
          validGeneration.estimatedBudget.total,
        );
        // A generated plan is not a completed holiday; only the traveler marks that.
        expect(result?.status).toBe("draft");
        const status = await request(app)
          .get(`/api/trips/${trip.id}/generation-status`)
          .set("Authorization", `Bearer ${token}`);
        expect(status.body.data.generationStatus).toBe("completed");
      } finally {
        await worker.close();
        connection.disconnect();
        await closeGenerationQueue();
      }
    });
  },
);
