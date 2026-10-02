import { hostname } from "node:os";
import mongoose from "mongoose";
import { Worker, UnrecoverableError, type Job } from "bullmq";
import { connectDatabase, disconnectDatabase } from "@/config/database.js";
import { Trip } from "@/models/Trip.js";
import { AIGenerationLog } from "@/models/AIGenerationLog.js";
import {
  generateItinerary,
  GENERATION_MODEL,
  type GeminiUsageMetadata,
} from "@/services/ai.service.js";
import {
  GENERATION_QUEUE_NAME,
  type GenerationJobData,
} from "@/queues/generation.queue.js";
import {
  createWorkerConnection,
  getRedisClient,
  closeRedis,
} from "@/config/redis.js";
import {
  computeGenerationCacheKey,
  setCachedGeneration,
} from "@/utils/generationCache.js";
import { AIInvalidResponseError } from "@/utils/errors.js";
import logger from "@/utils/logger.js";

export async function processGeneration(
  job: Job<GenerationJobData>,
): Promise<void> {
  const trip = await Trip.findOne({
    _id: job.data.tripId,
    userId: job.data.userId,
    generationJobId: job.id,
  });
  // A stalled job can run again after it has committed its result. Do not pay twice.
  if (
    !trip ||
    trip.generationStatus === "completed" ||
    trip.generationStatus === "failed"
  )
    return;
  const filter = {
    _id: trip._id,
    userId: job.data.userId,
    generationJobId: job.id,
  };
  await Trip.updateOne(filter, {
    $set: { generationStatus: "generating", generationStage: "preparing" },
    $unset: { generationError: 1 },
  });
  const startedAt = Date.now();
  let usage: GeminiUsageMetadata | undefined;
  try {
    const result = await generateItinerary(
      {
        destination: trip.destination,
        durationDays: trip.durationDays,
        budgetTier: trip.budgetTier,
        interests: trip.interests,
      },
      async (generationStage) => {
        await Trip.updateOne(filter, { $set: { generationStage } });
      },
      (nextUsage) => {
        usage = {
          promptTokenCount:
            (usage?.promptTokenCount ?? 0) + (nextUsage?.promptTokenCount ?? 0),
          candidatesTokenCount:
            (usage?.candidatesTokenCount ?? 0) +
            (nextUsage?.candidatesTokenCount ?? 0),
        };
      },
    );
    await Trip.updateOne(
      filter,
      {
        $set: {
          ...result,
          generationStatus: "completed",
          generationStage: "completed",
        },
        $unset: { generationError: 1 },
      },
      { runValidators: true },
    );
    await setCachedGeneration(computeGenerationCacheKey(trip), result);
    await recordUsage("success");
    logger.info("Generation completed", { jobId: job.id });
  } catch (error) {
    const terminal =
      error instanceof AIInvalidResponseError ||
      job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    await Trip.updateOne(filter, {
      $set: terminal
        ? {
            generationStatus: "failed",
            generationStage: "failed",
            generationError: "Generation failed. Please try again.",
          }
        : { generationStatus: "queued", generationStage: "preparing" },
    });
    await recordUsage("failed");
    if (error instanceof AIInvalidResponseError)
      throw new UnrecoverableError("Invalid AI response");
    throw error;
  }
  async function recordUsage(status: "success" | "failed") {
    await AIGenerationLog.create({
      userId: trip!.userId,
      tripId: trip!._id,
      jobId: job.id,
      model: GENERATION_MODEL,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      latencyMs: Date.now() - startedAt,
      cacheHit: false,
      status,
    }).catch(() => logger.warn("Generation usage recording unavailable"));
  }
}

async function startWorker(): Promise<void> {
  // Never consume a job before MongoDB is usable.
  await connectDatabase();
  const connection = createWorkerConnection();
  const worker = new Worker<GenerationJobData>(
    GENERATION_QUEUE_NAME,
    processGeneration,
    { connection, concurrency: 2 },
  );
  worker.on("error", () => logger.error("Generation worker error"));
  worker.on("failed", (job) => {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
    void Trip.updateOne(
      {
        _id: job.data.tripId,
        generationJobId: job.id,
        generationStatus: { $ne: "completed" },
      },
      {
        $set: {
          generationStatus: "failed",
          generationStage: "failed",
          generationError: "Generation failed. Please try again.",
        },
      },
    ).catch(() => logger.error("Unable to record failed generation"));
  });
  await worker.waitUntilReady();
  logger.info("Generation worker started");
  const heartbeatKey = `yatrik:worker:${hostname()}`;
  const heartbeat = setInterval(() => {
    if (mongoose.connection.readyState === 1 && worker.isRunning()) {
      void getRedisClient()
        .set(heartbeatKey, "1", "EX", 30)
        .catch(() => logger.warn("Worker heartbeat unavailable"));
    }
  }, 10_000);
  heartbeat.unref();
  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    clearInterval(heartbeat);
    await getRedisClient()
      .del(heartbeatKey)
      .catch(() => undefined);
    const deadline = setTimeout(() => process.exit(1), 110_000).unref();
    await worker.close();
    connection.disconnect();
    await closeRedis();
    await disconnectDatabase();
    clearTimeout(deadline);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

// Importing the processor in tests must not start a worker or contact Gemini.
if (process.env.NODE_ENV !== "test") {
  void startWorker().catch(() => {
    logger.error("Worker startup failed");
    process.exit(1);
  });
}
