import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "@/app.js";
import { Trip } from "@/models/Trip.js";
import { generateAccessToken } from "@/utils/tokens.js";

const userId = new mongoose.Types.ObjectId().toString();
const accessToken = generateAccessToken({
  id: userId,
  email: "duration-test@example.com",
  name: "Duration Test",
});

const validTripInput = {
  destination: "Goa, India",
  budgetTier: "Medium",
  interests: ["Food"],
};

describe("durationDays enforcement", () => {
  it("Trip model rejects durationDays over the enforced max at the schema level, independent of API validation", async () => {
    const trip = new Trip({
      ...validTripInput,
      userId,
      durationDays: 31,
    });

    await expect(trip.validate()).rejects.toThrow(
      "Duration cannot exceed 30 days",
    );
  });

  it("POST /api/trips rejects durationDays over 30 through HTTP validation", async () => {
    const response = await request(createApp())
      .post("/api/trips")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validTripInput, durationDays: 31 });

    expect(response.status).toBe(400);
  });
});
