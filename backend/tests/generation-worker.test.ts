import mongoose from "mongoose";
import type { Job } from "bullmq";
import { Trip } from "@/models/Trip.js";
import { processGeneration } from "@/workers/generation.worker.js";
import type { GenerationJobData } from "@/queues/generation.queue.js";
import { AIInvalidResponseError } from "@/utils/errors.js";
import { validGeneration } from "./helpers/generation.js";

const ai = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@/services/ai.service.js", () => ({
  generateItinerary: ai.generate,
  GENERATION_MODEL: "test-model",
}));
vi.mock("@/utils/generationCache.js", () => ({
  computeGenerationCacheKey: () => "test",
  setCachedGeneration: vi.fn(),
}));

async function queuedTrip() {
  return Trip.create({
    userId: new mongoose.Types.ObjectId(),
    destination: "Goa",
    durationDays: 1,
    budgetTier: "Low",
    generationStatus: "queued",
    generationJobId: "job-1",
  });
}
const jobFor = (trip: Awaited<ReturnType<typeof queuedTrip>>) =>
  ({
    id: "job-1",
    data: { tripId: trip.id, userId: trip.userId.toString() },
    opts: { attempts: 2 },
    attemptsMade: 0,
  }) as Job<GenerationJobData>;

beforeEach(() => {
  ai.generate.mockReset();
});
it("persists a valid result and skips completed redeliveries", async () => {
  const trip = await queuedTrip();
  ai.generate.mockResolvedValue(validGeneration);
  await processGeneration(jobFor(trip));
  const result = await Trip.findById(trip.id);
  expect(result?.generationStatus).toBe("completed");
  expect(result?.status).toBe("draft");
  expect(result?.itinerary).toHaveLength(1);
  await processGeneration(jobFor(trip));
  expect(ai.generate).toHaveBeenCalledTimes(1);
});
it("does not generate for mismatched job ownership", async () => {
  const trip = await queuedTrip();
  const job = jobFor(trip);
  job.data.userId = new mongoose.Types.ObjectId().toString();
  await processGeneration(job);
  expect(ai.generate).not.toHaveBeenCalled();
});
it("keeps transient failures queued until attempts are exhausted", async () => {
  const trip = await queuedTrip();
  const job = jobFor(trip);
  ai.generate.mockRejectedValue(new Error("temporary provider failure"));
  await expect(processGeneration(job)).rejects.toThrow();
  expect((await Trip.findById(trip.id))?.generationStatus).toBe("queued");
  job.attemptsMade = 1;
  await expect(processGeneration(job)).rejects.toThrow();
  expect((await Trip.findById(trip.id))?.generationStatus).toBe("failed");
});
it("marks invalid schema responses terminal without persisting an itinerary", async () => {
  const trip = await queuedTrip();
  ai.generate.mockRejectedValue(new AIInvalidResponseError());
  await expect(processGeneration(jobFor(trip))).rejects.toThrow(
    "Invalid AI response",
  );
  const result = await Trip.findById(trip.id);
  expect(result?.generationStatus).toBe("failed");
  expect(result?.itinerary).toHaveLength(0);
});
