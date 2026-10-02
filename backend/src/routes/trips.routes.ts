import { Router } from "express";
import {
  createNewTrip,
  getAllTrips,
  getSingleTrip,
  updateExistingTrip,
  updateTripMetadata,
  deleteExistingTrip,
  getTripStatistics,
  enqueueTripGeneration,
  getTripGenerationStatus,
} from "@/controllers/trips.controller.js";
import { verifyAuth } from "@/middleware/auth.middleware.js";
import { asyncHandler } from "@/middleware/errorHandler.js";
import { aiRateLimiter } from "@/middleware/rateLimit.js";
import { validateObjectIdParam } from "@/middleware/validateObjectIdParam.js";

const router = Router();

/**
 * All trip routes are protected (require authentication)
 */
router.use(verifyAuth);

/**
 * Trip Statistics
 * GET /api/trips/stats/overview
 * Returns: { totalTrips, draftTrips, completedTrips, archivedTrips, totalDaysPlanned }
 */
router.get("/stats/overview", asyncHandler(getTripStatistics));

/**
 * Create a new trip
 * POST /api/trips
 * Body: { destination, durationDays, budgetTier, interests?, startDate?, endDate? }
 */
router.post("/", asyncHandler(createNewTrip));

/**
 * Get all trips for current user (with pagination)
 * GET /api/trips
 * Query: page=1, limit=10, status?, sortBy?, sortOrder?
 */
router.get("/", asyncHandler(getAllTrips));
router.post(
  "/:tripId/generate",
  validateObjectIdParam("tripId"),
  aiRateLimiter,
  asyncHandler(enqueueTripGeneration),
);
router.get(
  "/:tripId/generation-status",
  validateObjectIdParam("tripId"),
  asyncHandler(getTripGenerationStatus),
);

/**
 * Get a single trip by ID
 * GET /api/trips/:tripId
 * Ownership validation: User can only access own trips
 */
router.get(
  "/:tripId",
  validateObjectIdParam("tripId"),
  asyncHandler(getSingleTrip),
);

/**
 * Update a trip
 * PUT /api/trips/:tripId
 * Body: { destination?, durationDays?, budgetTier?, interests?, itinerary?, hotels?, estimatedBudget?, packingList?, status?, startDate?, endDate? }
 * Ownership validation: User can only update own trips
 */
router.put(
  "/:tripId",
  validateObjectIdParam("tripId"),
  asyncHandler(updateExistingTrip),
);

/**
 * Update trip metadata only (destination/durationDays/budgetTier/interests/dates)
 * PATCH /api/trips/:tripId/metadata
 * Narrower surface than PUT — added per C1, see summary notes.
 */
router.patch(
  "/:tripId/metadata",
  validateObjectIdParam("tripId"),
  asyncHandler(updateTripMetadata),
);

/**
 * Delete a trip
 * DELETE /api/trips/:tripId
 * Ownership validation: User can only delete own trips
 */
router.delete(
  "/:tripId",
  validateObjectIdParam("tripId"),
  asyncHandler(deleteExistingTrip),
);

export default router;
