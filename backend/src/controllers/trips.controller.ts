import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import {
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripStats,
} from "@/services/trips.service.js";
import {
  validateCreateTrip,
  validateUpdateTrip,
  validateUpdateTripMetadata,
  validateQuery,
} from "@/validators/trips.validators.js";
import { sendSuccess, sendPaginated } from "@/utils/apiResponse.js";
import { ValidationError, AppError } from "@/utils/errors.js";
import logger from "@/utils/logger.js";
import { Trip } from "@/models/Trip.js";
import { getGenerationQueue } from "@/queues/generation.queue.js";
import {
  computeGenerationCacheKey,
  getCachedGeneration,
} from "@/utils/generationCache.js";

/**
 * Create a new trip
 * POST /api/trips
 */
export const createNewTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    // Validate input
    const validation = validateCreateTrip(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => ({
          ...acc,
          [err.path[0]]: err.message,
        }),
        {},
      );
      throw new ValidationError("Validation failed", errors);
    }

    // Convert string dates to Date objects
    const tripData = {
      ...validation.data,
      startDate: validation.data.startDate
        ? new Date(validation.data.startDate)
        : undefined,
      endDate: validation.data.endDate
        ? new Date(validation.data.endDate)
        : undefined,
    };

    // Create trip
    const trip = await createTrip(req.user.id, tripData);

    sendSuccess(res, trip, "Trip created successfully", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all trips for current user
 * GET /api/trips
 */
export const getAllTrips = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    // Validate query parameters
    const validation = validateQuery(req.query);
    if (!validation.success) {
      throw new ValidationError("Invalid query parameters");
    }

    const { page, limit, status, sortBy, sortOrder } = validation.data;

    // Get trips
    const result = await getUserTrips(
      req.user.id,
      page,
      limit,
      status,
      sortBy,
      sortOrder,
    );

    sendPaginated(res, result.trips, result.total, result.page, result.limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single trip by ID
 * GET /api/trips/:tripId
 */
export const getSingleTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    const { tripId } = req.params;

    // Get trip
    const trip = await getTripById(req.user.id, tripId);

    sendSuccess(res, trip, "Trip fetched successfully", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a trip
 * PUT /api/trips/:tripId
 */
export const updateExistingTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    const { tripId } = req.params;

    // Validate input
    const validation = validateUpdateTrip(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => ({
          ...acc,
          [err.path[0]]: err.message,
        }),
        {},
      );
      throw new ValidationError("Validation failed", errors);
    }

    // Convert string dates to Date objects
    const tripData = {
      ...validation.data,
      startDate: validation.data.startDate
        ? new Date(validation.data.startDate)
        : undefined,
      endDate: validation.data.endDate
        ? new Date(validation.data.endDate)
        : undefined,
    };

    // Update trip
    const trip = await updateTrip(req.user.id, tripId, tripData);

    sendSuccess(res, trip, "Trip updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Update only trip metadata (destination/durationDays/budgetTier/interests/dates)
 * PATCH /api/trips/:tripId/metadata
 * Narrower than PUT /:tripId — cannot touch itinerary/hotels/estimatedBudget/packingList/status.
 */
export const updateTripMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    const { tripId } = req.params;

    const validation = validateUpdateTripMetadata(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => ({
          ...acc,
          [err.path[0]]: err.message,
        }),
        {},
      );
      throw new ValidationError("Validation failed", errors);
    }

    const trip = await updateTrip(req.user.id, tripId, validation.data);

    sendSuccess(res, trip, "Trip metadata updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a trip
 * DELETE /api/trips/:tripId
 */
export const deleteExistingTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    const { tripId } = req.params;

    // Delete trip
    await deleteTrip(req.user.id, tripId);

    sendSuccess(res, null, "Trip deleted successfully", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get trip statistics
 * GET /api/trips/stats/overview
 */
export const getTripStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not authenticated");
    }

    // Get stats
    const stats = await getTripStats(req.user.id);

    sendSuccess(res, stats, "Trip statistics fetched successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const enqueueTripGeneration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) throw new Error("User not authenticated");
    const trip = await getTripById(req.user.id, req.params.tripId);
    if (
      ["queued", "generating"].includes(trip.generationStatus) &&
      trip.generationJobId
    ) {
      sendSuccess(
        res,
        { jobId: trip.generationJobId },
        "Generation already in progress",
        202,
      );
      return;
    }
    const jobId = randomUUID();
    logger.info("AI generation starting", {
      tripId: trip._id.toString(),
      jobId,
      requestId: req.id,
    });
    const claimed = await Trip.findOneAndUpdate(
      {
        _id: trip._id,
        userId: req.user.id,
        generationStatus: { $nin: ["queued", "generating"] },
      },
      {
        $set: {
          generationStatus: "queued",
          generationStage: "preparing",
          generationJobId: jobId,
        },
        $unset: { generationError: 1 },
      },
      { new: true },
    );
    if (!claimed) {
      const current = await getTripById(req.user.id, req.params.tripId);
      sendSuccess(
        res,
        { jobId: current.generationJobId },
        "Generation already in progress",
        202,
      );
      return;
    }

    // B3: serve from cache when an identical generation has run before
    const cacheKey = computeGenerationCacheKey({
      destination: trip.destination,
      durationDays: trip.durationDays,
      budgetTier: trip.budgetTier,
      interests: trip.interests,
    });
    const cached = await getCachedGeneration(cacheKey, trip.durationDays);
    if (cached) {
      await Trip.updateOne(
        { _id: trip._id, generationJobId: jobId },
        {
          $set: {
            itinerary: cached.itinerary,
            hotels: cached.hotels,
            estimatedBudget: cached.estimatedBudget,
            packingList: cached.packingList,
            generationStatus: "completed",
            generationStage: "completed",
          },
          $unset: { generationError: 1 },
        },
        { runValidators: true },
      );
      sendSuccess(res, { jobId }, "Generation completed from cache", 202);
      return;
    }

    try {
      await getGenerationQueue().add(
        "generate-itinerary",
        { tripId: trip._id.toString(), userId: req.user.id },
        {
          jobId,
          attempts: 2,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      await Trip.updateOne(
        { _id: trip._id, generationJobId: jobId },
        {
          $set: {
            generationStatus: "failed",
            generationStage: "failed",
            generationError: "Unable to queue generation. Please try again.",
          },
        },
      );
      logger.error("AI generation enqueue failed", {
        tripId: trip._id.toString(),
        jobId,
        requestId: req.id,
        error,
      });
      throw new AppError(
        "Generation queue temporarily unavailable",
        503,
        "SERVICE_UNAVAILABLE",
      );
    }
    sendSuccess(res, { jobId }, "Generation queued", 202);
  } catch (error) {
    next(error);
  }
};

export const getTripGenerationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) throw new Error("User not authenticated");
    const trip = await getTripById(req.user.id, req.params.tripId);
    sendSuccess(res, {
      generationStatus: trip.generationStatus,
      generationStage: trip.generationStage,
      ...(trip.generationStatus === "failed" && trip.generationError
        ? { error: trip.generationError }
        : {}),
    });
  } catch (error) {
    next(error);
  }
};
