import { Trip, type ITrip } from "@/models/Trip.js";
import { Types, type FilterQuery, type SortOrder } from "mongoose";
import type { UpdateTripInput } from "@/validators/trips.validators.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  DatabaseError,
  ConflictError,
} from "@/utils/errors.js";
import logger from "@/utils/logger.js";

interface CreateTripInput {
  destination: string;
  durationDays: number;
  budgetTier: "Low" | "Medium" | "High";
  interests?: string[];
  startDate?: Date;
  endDate?: Date;
}

interface TripListResponse {
  trips: ITrip[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Create a new trip
 */
export const createTrip = async (
  userId: string,
  input: CreateTripInput,
): Promise<ITrip> => {
  try {
    const trip = new Trip({
      userId,
      destination: input.destination,
      durationDays: input.durationDays,
      budgetTier: input.budgetTier,
      interests: input.interests || [],
      startDate: input.startDate,
      endDate: input.endDate,
      status: "draft",
    });

    await trip.save();
    logger.info(`Trip created: ${trip._id} for user ${userId}`);
    return trip;
  } catch (error) {
    logger.error("Error creating trip", { error });
    throw new DatabaseError("Failed to create trip");
  }
};

/**
 * Get all trips for a user with pagination
 */
export const getUserTrips = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<TripListResponse> => {
  try {
    const query: FilterQuery<ITrip> = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, SortOrder> = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [trips, total] = await Promise.all([
      Trip.find(query).sort(sortObj).skip(skip).limit(limit).exec(),
      Trip.countDocuments(query),
    ]);

    return {
      trips,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching user trips", { error });
    throw new DatabaseError("Failed to fetch trips");
  }
};

/**
 * Get a single trip by ID
 */
export const getTripById = async (
  userId: string,
  tripId: string,
): Promise<ITrip> => {
  try {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new NotFoundError("Trip");
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      throw new ForbiddenError("You do not have access to this trip");
    }

    return trip;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    logger.error("Error fetching trip", { error });
    throw new DatabaseError("Failed to fetch trip");
  }
};

/**
 * Update a trip
 */
export const updateTrip = async (
  userId: string,
  tripId: string,
  input: UpdateTripInput,
): Promise<ITrip> => {
  try {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new NotFoundError("Trip");
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      throw new ForbiddenError("You do not have access to this trip");
    }

    if (["queued", "generating"].includes(trip.generationStatus)) {
      throw new ConflictError(
        "Wait for itinerary generation before editing this trip",
      );
    }
    const startDate = input.startDate ?? trip.startDate;
    const endDate = input.endDate ?? trip.endDate;
    if (startDate && endDate && startDate > endDate)
      throw new ValidationError("End date must not precede start date");

    // Do not clear existing fields when an optional property was omitted.
    Object.assign(
      trip,
      Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      ),
    );

    await trip.save();
    logger.info(`Trip updated: ${tripId}`);
    return trip;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    if (error instanceof ValidationError || error instanceof ConflictError)
      throw error;
    logger.error("Error updating trip", { error });
    throw new DatabaseError("Failed to update trip");
  }
};

/**
 * Delete a trip
 */
export const deleteTrip = async (
  userId: string,
  tripId: string,
): Promise<void> => {
  try {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new NotFoundError("Trip");
    }

    // Verify ownership
    if (trip.userId.toString() !== userId) {
      throw new ForbiddenError("You do not have access to this trip");
    }

    await Trip.deleteOne({ _id: tripId, userId });
    logger.info(`Trip deleted: ${tripId}`);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    logger.error("Error deleting trip", { error });
    throw new DatabaseError("Failed to delete trip");
  }
};

/**
 * Get trip statistics for user
 */
export const getTripStats = async (
  userId: string,
): Promise<{
  totalTrips: number;
  draftTrips: number;
  completedTrips: number;
  archivedTrips: number;
  totalDaysPlanned: number;
}> => {
  try {
    // Aggregate counters in MongoDB; do not load every itinerary into API memory.
    const [stats] = await Trip.aggregate<{
      totalTrips: number;
      draftTrips: number;
      completedTrips: number;
      archivedTrips: number;
      totalDaysPlanned: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          draftTrips: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          completedTrips: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          archivedTrips: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
          },
          totalDaysPlanned: { $sum: "$durationDays" },
        },
      },
      { $project: { _id: 0 } },
    ]);
    return (
      stats ?? {
        totalTrips: 0,
        draftTrips: 0,
        completedTrips: 0,
        archivedTrips: 0,
        totalDaysPlanned: 0,
      }
    );
  } catch (error) {
    logger.error("Error getting trip stats", { error });
    throw new DatabaseError("Failed to fetch trip statistics");
  }
};
