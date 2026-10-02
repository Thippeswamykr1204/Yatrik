import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "@/app.js";
import { Trip } from "@/models/Trip.js";
import { generateAccessToken } from "@/utils/tokens.js";

vi.mock("@/services/ai.service.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/ai.service.js")>();
  return {
    ...actual,
    regenerateDay: vi.fn(async () => ({
      dayNumber: 1,
      activities: [
        {
          title: "A quieter morning",
          description: "A local walk.",
          estimatedCostINR: 100,
          timeOfDay: "Morning",
          location: "Kochi",
        },
      ],
    })),
  };
});

it("regenerates a Mongoose itinerary day without losing its day number or other days", async () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const trip = await Trip.create({
    userId,
    destination: "Kochi",
    durationDays: 2,
    budgetTier: "Low",
    generationStatus: "completed",
    itinerary: [
      {
        dayNumber: 1,
        activities: [
          {
            title: "Old morning",
            description: "Old plan",
            estimatedCostINR: 200,
            timeOfDay: "Morning",
            completed: true,
          },
        ],
      },
      {
        dayNumber: 2,
        activities: [
          {
            title: "Keep this afternoon",
            description: "Still a good idea",
            estimatedCostINR: 300,
            timeOfDay: "Afternoon",
            completed: true,
          },
        ],
      },
    ],
  });
  const originalId = trip.itinerary[1].activities[0]._id?.toString();
  const token = generateAccessToken({
    id: userId,
    email: "regeneration@example.com",
    name: "Traveler",
  });
  const app = createApp();
  const response = await request(app)
    .post("/api/ai/regenerate-day")
    .set("Authorization", `Bearer ${token}`)
    .send({
      tripId: trip.id,
      dayNumber: 1,
      feedback: "A slower morning please",
    });
  expect(response.status).toBe(200);
  const readBack = await request(app)
    .get(`/api/trips/${trip.id}`)
    .set("Authorization", `Bearer ${token}`);
  expect(readBack.headers["cache-control"]).toBe("private, no-store");
  expect(readBack.body.data.itinerary[0]).toMatchObject({
    dayNumber: 1,
    activities: [{ title: "A quieter morning", completed: false }],
  });
  expect(readBack.body.data.itinerary[1]).toMatchObject({
    dayNumber: 2,
    activities: [
      { _id: originalId, title: "Keep this afternoon", completed: true },
    ],
  });
});
