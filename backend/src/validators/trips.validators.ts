import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");
const money = z.number().finite().min(0).max(1_000_000_000);
const shortText = z.string().trim().min(1).max(100);
const dateString = z
  .string()
  .max(35)
  .refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
    const date = new Date(value);
    return (
      Number.isFinite(date.getTime()) &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        date.toISOString().slice(0, 10) === value)
    );
  }, "Invalid date");
const dateValue = z.union([
  dateString.transform((value) => new Date(value)),
  z.date(),
]);
const activitySchema = z.object({
  _id: objectIdSchema.optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  estimatedCostINR: money.default(0),
  timeOfDay: z.enum(["Morning", "Afternoon", "Evening"]).default("Morning"),
  location: z.string().max(300).optional(),
  completed: z.boolean().default(false),
});
const itineraryDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(30),
  activities: z.array(activitySchema).max(30).default([]),
});
const hotelSchema = z.object({
  _id: objectIdSchema.optional(),
  name: z.string().trim().min(1).max(200),
  tier: z.enum(["Budget", "Mid-Range", "Luxury"]),
  estimatedCostPerNightINR: money,
  rating: z.number().finite().min(0).max(5),
  address: z.string().max(500).optional(),
  amenities: z.array(z.string().max(100)).max(30).optional(),
});
const budgetSchema = z.object({
  transport: money.default(0),
  accommodation: money.default(0),
  food: money.default(0),
  activities: money.default(0),
  total: money.default(0),
});
const packingItemSchema = z.object({
  _id: objectIdSchema.optional(),
  item: shortText,
  category: z.enum(["Documents", "Clothing", "Gear", "Toiletries", "Other"]),
  isPacked: z.boolean().default(false),
  weatherRelevant: z.boolean().optional(),
});
const metadata = {
  destination: shortText,
  durationDays: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 day")
    .max(30, "Duration cannot exceed 30 days"),
  budgetTier: z.enum(["Low", "Medium", "High"]),
  interests: z.array(shortText).max(20),
};
const dateOrder = (trip: {
  startDate?: Date | string;
  endDate?: Date | string;
}) =>
  !trip.startDate ||
  !trip.endDate ||
  new Date(trip.startDate) <= new Date(trip.endDate);
const dateIssue = {
  message: "End date must not precede start date",
  path: ["endDate"],
};
export const createTripSchema = z
  .object({
    ...metadata,
    interests: metadata.interests.default([]),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
  })
  .refine(dateOrder, dateIssue);
export const updateTripSchema = z
  .object({
    ...metadata,
    itinerary: z.array(itineraryDaySchema).max(30),
    hotels: z.array(hotelSchema).max(30),
    estimatedBudget: budgetSchema,
    packingList: z.array(packingItemSchema).max(100),
    status: z.enum(["draft", "completed", "archived"]),
    startDate: dateValue,
    endDate: dateValue,
  })
  .partial()
  .refine(dateOrder, dateIssue)
  .refine(
    (trip) =>
      !trip.itinerary ||
      new Set(trip.itinerary.map((day) => day.dayNumber)).size ===
        trip.itinerary.length,
    { message: "Itinerary days must be unique", path: ["itinerary"] },
  );
export const updateTripMetadataSchema = z
  .object({ ...metadata, startDate: dateValue, endDate: dateValue })
  .partial()
  .refine(dateOrder, dateIssue);
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["draft", "completed", "archived"]).optional(),
  sortBy: z
    .enum(["createdAt", "destination", "durationDays"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateTripMetadataInput = z.infer<typeof updateTripMetadataSchema>;
export type QueryInput = z.infer<typeof querySchema>;
export const validateCreateTrip = (data: unknown) =>
  createTripSchema.safeParse(data);
export const validateUpdateTrip = (data: unknown) =>
  updateTripSchema.safeParse(data);
export const validateUpdateTripMetadata = (data: unknown) =>
  updateTripMetadataSchema.safeParse(data);
export const validateQuery = (data: unknown) => querySchema.safeParse(data);
