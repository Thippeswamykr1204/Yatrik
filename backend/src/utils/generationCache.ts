import { createHash } from "node:crypto";
import { getRedisClient } from "@/config/redis.js";
import {
  generatedTripResponseSchema,
  generatedTripForDurationSchema,
} from "@/validators/ai-response.validators.js";
import { AIGeneratedTrip } from "@/types/ai.types.js";
import logger from "@/utils/logger.js";

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const CACHE_PREFIX = "gen-cache:v2:";

export interface CacheableGenerationInput {
  destination: string;
  durationDays: number;
  budgetTier: "Low" | "Medium" | "High";
  interests: string[];
}

/** Normalized hash of { destination, durationDays, budgetTier, interests } used as the cache key. */
export function computeGenerationCacheKey(
  input: CacheableGenerationInput,
): string {
  const normalized = {
    destination: input.destination.trim().toLowerCase(),
    durationDays: input.durationDays,
    budgetTier: input.budgetTier,
    interests: [...input.interests].map((i) => i.trim().toLowerCase()).sort(),
  };
  const hash = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
  return `${CACHE_PREFIX}${hash}`;
}

/** Returns the cached, schema-validated generation result on a hit, or null on a miss/invalid entry. */
export async function getCachedGeneration(
  cacheKey: string,
  durationDays?: number,
): Promise<AIGeneratedTrip | null> {
  try {
    const raw = await getRedisClient().get(cacheKey);
    if (!raw) {
      logger.info("Generation cache miss", { cacheKey });
      return null;
    }
    const schema = durationDays
      ? generatedTripForDurationSchema(durationDays)
      : generatedTripResponseSchema;
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      logger.warn(
        "Generation cache entry failed validation, treating as miss",
        { cacheKey },
      );
      return null;
    }
    logger.info("Generation cache hit", { cacheKey });
    return parsed.data;
  } catch (error) {
    logger.error("Error reading generation cache", { cacheKey, error });
    return null;
  }
}

/** Writes a validated generation result to the cache with a 24h TTL. */
export async function setCachedGeneration(
  cacheKey: string,
  result: AIGeneratedTrip,
): Promise<void> {
  try {
    const validated = generatedTripResponseSchema.parse(result);
    await getRedisClient().set(
      cacheKey,
      JSON.stringify(validated),
      "EX",
      CACHE_TTL_SECONDS,
    );
  } catch (error) {
    logger.error("Error writing generation cache", { cacheKey, error });
  }
}
