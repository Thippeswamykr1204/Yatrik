import { Queue } from "bullmq";
import { getRedisClient } from "@/config/redis.js";
import logger from "@/utils/logger.js";

export const GENERATION_QUEUE_NAME = "itinerary-generation";
export interface GenerationJobData {
  tripId: string;
  userId: string;
}
let queue: Queue<GenerationJobData> | undefined;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (!queue) {
    queue = new Queue<GenerationJobData>(GENERATION_QUEUE_NAME, {
      connection: getRedisClient(),
    });
    queue.on("error", () => logger.warn("Generation queue unavailable"));
  }
  return queue;
}
export async function closeGenerationQueue(): Promise<void> {
  await queue?.close();
  queue = undefined;
}
