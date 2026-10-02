import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const money = z.number().finite().min(0).max(1_000_000_000);
export const activityResponseSchema = z.object({
  title: text(200),
  description: text(1000),
  estimatedCostINR: money,
  timeOfDay: z.enum(["Morning", "Afternoon", "Evening"]),
  location: text(300),
});
export const itineraryDayResponseSchema = z.object({
  dayNumber: z.number().int().min(1).max(30),
  activities: z.array(activityResponseSchema).min(1).max(12),
});
export const hotelResponseSchema = z.object({
  name: text(200),
  tier: z.enum(["Budget", "Mid-Range", "Luxury"]),
  estimatedCostPerNightINR: money,
  rating: z.number().finite().min(0).max(5),
  address: text(500),
  amenities: z.array(text(100)).max(30),
});
export const budgetResponseSchema = z
  .object({
    transport: money,
    accommodation: money,
    food: money,
    activities: money,
    total: money,
  })
  .refine(
    (budget) =>
      Math.abs(
        budget.total -
          budget.transport -
          budget.accommodation -
          budget.food -
          budget.activities,
      ) < 0.01,
    "Budget total must equal its components",
  );
export const packingItemResponseSchema = z.object({
  item: text(100),
  category: z.enum(["Documents", "Clothing", "Gear", "Toiletries", "Other"]),
  isPacked: z.boolean(),
  weatherRelevant: z.boolean(),
});
export const packingListResponseSchema = z
  .array(packingItemResponseSchema)
  .min(1)
  .max(100);
export const generatedTripResponseSchema = z
  .object({
    itinerary: z.array(itineraryDayResponseSchema).min(1).max(30),
    hotels: z.array(hotelResponseSchema).min(1).max(20),
    estimatedBudget: budgetResponseSchema,
    packingList: packingListResponseSchema,
  })
  .refine(
    (trip) => trip.itinerary.every((day, index) => day.dayNumber === index + 1),
    "Itinerary days must be consecutive and unique",
  );
export const generatedTripForDurationSchema = (days: number) =>
  generatedTripResponseSchema.refine(
    (trip) => trip.itinerary.length === days,
    "Itinerary must match the requested duration",
  );
export const optimizedBudgetResponseSchema = z
  .object({
    originalBudget: budgetResponseSchema,
    optimizedBudget: budgetResponseSchema,
    savings: money,
    suggestions: z.object({
      hotels: z.array(hotelResponseSchema).max(20),
      activityAdjustments: z.array(text(1000)).max(20),
      generalTips: z.array(text(1000)).max(20),
    }),
  })
  .refine(
    (result) =>
      Math.abs(
        result.savings -
          result.originalBudget.total +
          result.optimizedBudget.total,
      ) < 0.01,
    "Savings must equal the budget difference",
  );
