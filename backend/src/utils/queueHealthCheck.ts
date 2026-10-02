import { getGenerationQueue } from "@/queues/generation.queue.js";
import logger from "@/utils/logger.js";
import { Trip } from "@/models/Trip.js";

const STUCK_JOB_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // every 3 minutes

/**
 * A1.4 — ongoing safety net, not just a startup check.
 *
 * This does NOT fix a missing generation worker. It exists so that a missing worker
 * fails loudly (a warning in the API's own logs) instead of silently — including if the
 * worker dies well *after* the API booted successfully, which a one-time startup check
 * can never catch. Lives in the API process specifically, since detecting "the worker
 * isn't running" has to happen from somewhere other than the worker itself.
 *
 * Best-effort and non-fatal: any error here is logged and swallowed, never thrown, and
 * a failed check never crashes or restarts the API.
 */
export async function checkGenerationWorkerHealth(): Promise<void> {
  try {
    const queue = getGenerationQueue();

    const [waiting, active, workers] = await Promise.all([
      queue.getJobs(["waiting"], 0, 100),
      queue.getJobs(["active"], 0, 100),
      queue.getWorkers(),
    ]);

    // A producer can die between claiming Mongo state and adding the Redis job.
    // Recover those orphaned claims, and terminal queue failures (e.g. stalled jobs).
    const claims = await Trip.find({
      generationStatus: { $in: ["queued", "generating"] },
      updatedAt: { $lt: new Date(Date.now() - STUCK_JOB_THRESHOLD_MS) },
    })
      .select("_id generationJobId")
      .limit(100);
    for (const claim of claims) {
      if (!claim.generationJobId) continue;
      const job = await queue.getJob(claim.generationJobId);
      const state = await job?.getState();
      if (!job || state === "failed" || state === "completed") {
        await Trip.updateOne(
          {
            _id: claim._id,
            generationJobId: claim.generationJobId,
            generationStatus: { $in: ["queued", "generating"] },
          },
          {
            $set: {
              generationStatus: "failed",
              generationStage: "failed",
              generationError: "Generation interrupted. Please try again.",
            },
          },
        );
      }
    }

    if (workers.length > 0) return; // a worker is connected — nothing to warn about

    const now = Date.now();
    const stuck = [...waiting, ...active].filter(
      (job) => job.timestamp && now - job.timestamp > STUCK_JOB_THRESHOLD_MS,
    );

    if (stuck.length > 0) {
      const oldestAgeMs = Math.max(...stuck.map((job) => now - job.timestamp));
      const oldestAgeMin = Math.round(oldestAgeMs / 60000);
      logger.warn(
        `${stuck.length} generation job(s) have been waiting over ${STUCK_JOB_THRESHOLD_MS / 60000} ` +
          `minutes with no apparent worker activity (oldest: ${oldestAgeMin}m) — is the generation ` +
          `worker service running? On Render this means yatrik-generation-worker is down; locally, ` +
          `run \`npm run worker:generation\` alongside \`npm run dev\`.`,
      );
    }
  } catch (error) {
    logger.error("Queue health check failed (non-fatal)", { error });
  }
}

let healthCheckInterval: ReturnType<typeof setInterval> | undefined;

/** Starts the periodic poll. Call once at boot; call stopQueueHealthCheck() on shutdown. */
export function startQueueHealthCheck(): void {
  if (healthCheckInterval) return; // idempotent — don't stack intervals
  void checkGenerationWorkerHealth(); // one immediate check, then poll
  healthCheckInterval = setInterval(
    () => void checkGenerationWorkerHealth(),
    CHECK_INTERVAL_MS,
  );
  healthCheckInterval.unref();
}

export function stopQueueHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = undefined;
  }
}
