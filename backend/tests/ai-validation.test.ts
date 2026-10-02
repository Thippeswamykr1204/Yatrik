import mongoose from "mongoose";
import { vi } from "vitest";
import { Trip } from "@/models/Trip.js";
import { generateItinerary } from "@/services/ai.service.js";
import { validGeneration } from "./helpers/generation.js";

describe("AI response validation", () => {
  it("retries semantic day-count failures, then returns validated data", async () => {
    const response = (data: unknown) =>
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(data) }] } },
          ],
        }),
      );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ ...validGeneration, itinerary: [] }))
      .mockResolvedValueOnce(response(validGeneration));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      generateItinerary({
        destination: "Goa",
        durationDays: 1,
        budgetTier: "Low",
        interests: [],
      }),
    ).resolves.toEqual(validGeneration);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).not.toContain("key=");
  });
  it("does not expose provider error bodies or retry permanent credentials failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response("private provider payload", { status: 403 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      generateItinerary({
        destination: "Goa",
        durationDays: 1,
        budgetTier: "Low",
        interests: [],
      }),
    ).rejects.toThrow("AI provider unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("retries once, rejects malformed Gemini responses, and does not persist invalid itinerary data", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const trip = await Trip.create({
      userId,
      destination: "Goa, India",
      durationDays: 3,
      budgetTier: "Low",
      interests: ["Food"],
    });
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: JSON.stringify({ itinerary: "not-an-array" }) },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateItinerary({
        destination: trip.destination,
        durationDays: trip.durationDays,
        budgetTier: trip.budgetTier,
        interests: trip.interests,
      }),
    ).rejects.toThrow("AI returned an invalid response");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const persistedTrip = await Trip.findById(trip._id).lean();
    expect(persistedTrip).toMatchObject({
      status: "draft",
      itinerary: [],
      hotels: [],
      packingList: [],
      estimatedBudget: {
        transport: 0,
        accommodation: 0,
        food: 0,
        activities: 0,
        total: 0,
      },
    });
    expect(await Trip.countDocuments()).toBe(1);
  });
});
