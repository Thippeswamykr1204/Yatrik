import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "@/app.js";
import { Trip } from "@/models/Trip.js";
import { generateAccessToken } from "@/utils/tokens.js";

const userA = new mongoose.Types.ObjectId().toString();
const userB = new mongoose.Types.ObjectId().toString();
const userAToken = generateAccessToken({
  id: userA,
  email: "a@example.com",
  name: "User A",
});

describe("trip ownership", () => {
  it.each([
    [
      "get",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app).get(`/api/trips/${tripId}`),
    ],
    [
      "put",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app)
          .put(`/api/trips/${tripId}`)
          .send({ destination: "Changed" }),
    ],
    [
      "delete",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app).delete(`/api/trips/${tripId}`),
    ],
    [
      "patch metadata",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app)
          .patch(`/api/trips/${tripId}/metadata`)
          .send({ destination: "Changed" }),
    ],
    [
      "generate",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app).post(`/api/trips/${tripId}/generate`),
    ],
    [
      "read generation status",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app).get(`/api/trips/${tripId}/generation-status`),
    ],
    [
      "chat",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app).post("/api/ai/chat").send({ tripId, message: "Help" }),
    ],
    [
      "regenerate day",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app)
          .post("/api/ai/regenerate-day")
          .send({ tripId, dayNumber: 1 }),
    ],
    [
      "optimize budget",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app)
          .post("/api/ai/optimize-budget")
          .send({ tripId, targetBudgetINR: 1000 }),
    ],
    [
      "generate packing list",
      (app: ReturnType<typeof createApp>, tripId: string) =>
        request(app).post(`/api/ai/packing-list/${tripId}`),
    ],
  ] as const)(
    "returns 403 when user A tries to %s user B's trip",
    async (_method, send) => {
      const trip = await Trip.create({
        userId: userB,
        destination: "Kerala, India",
        durationDays: 5,
        budgetTier: "Medium",
      });

      const response = await send(createApp(), trip._id.toString()).set(
        "Authorization",
        `Bearer ${userAToken}`,
      );

      expect(response.status).toBe(403);
    },
  );
});
