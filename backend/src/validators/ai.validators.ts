import { z } from "zod";
import { objectIdSchema } from "./trips.validators.js";

export const generateItinerarySchema = z.object({ tripId: objectIdSchema });
export const regenerateDaySchema = z.object({
  tripId: objectIdSchema,
  dayNumber: z.number().int().min(1).max(30),
  feedback: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .default("Regenerate with different activities"),
});
export const optimizeBudgetSchema = z.object({
  tripId: objectIdSchema,
  targetBudgetINR: z.number().finite().min(1).max(1_000_000_000),
});
export const chatSchema = z.object({
  tripId: objectIdSchema,
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .max(20)
    .default([]),
});
export const packingListSchema = generateItinerarySchema;
export type GenerateItineraryInput = z.infer<typeof generateItinerarySchema>;
export type RegenerateDayInput = z.infer<typeof regenerateDaySchema>;
export type OptimizeBudgetInput = z.infer<typeof optimizeBudgetSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export const validateGenerateItinerary = (data: unknown) =>
  generateItinerarySchema.safeParse(data);
export const validateRegenerateDay = (data: unknown) =>
  regenerateDaySchema.safeParse(data);
export const validateOptimizeBudget = (data: unknown) =>
  optimizeBudgetSchema.safeParse(data);
export const validateChat = (data: unknown) => chatSchema.safeParse(data);
export const validatePackingList = (data: unknown) =>
  packingListSchema.safeParse(data);
