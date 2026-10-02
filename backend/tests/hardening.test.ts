import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "@/app.js";
import { User } from "@/models/User.js";
import { Trip } from "@/models/Trip.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "@/utils/tokens.js";
import {
  registerUser,
  refreshAccessToken,
  logoutUser,
} from "@/services/auth.service.js";
import { envSchema } from "@/config/env.schema.js";
import { generatedTripForDurationSchema } from "@/validators/ai-response.validators.js";
import { validGeneration } from "./helpers/generation.js";

const input = {
  name: "Security User",
  email: "security@example.com",
  password: "SecurePass1!",
};

describe("single-use refresh sessions", () => {
  it("issues unique refresh tokens within the same second", () => {
    const payload = {
      id: new mongoose.Types.ObjectId().toString(),
      name: input.name,
      email: input.email,
    };
    expect(generateRefreshToken(payload)).not.toBe(
      generateRefreshToken(payload),
    );
  });
  it("stores only a hash and atomically rejects replay/concurrent rotation", async () => {
    const session = await registerUser(input);
    const stored = await User.findById(session.user.id).select("+refreshToken");
    expect(stored?.refreshToken).toBe(hashRefreshToken(session.refreshToken));
    const outcomes = await Promise.allSettled([
      refreshAccessToken(session.refreshToken),
      refreshAccessToken(session.refreshToken),
    ]);
    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === "rejected"),
    ).toHaveLength(1);
    await expect(refreshAccessToken(session.refreshToken)).rejects.toThrow();
  });
  it("uses HttpOnly cookies without exposing refresh values in JSON and revokes on logout", async () => {
    const app = createApp();
    const login = await request(app)
      .post("/api/auth/register")
      .set("X-Forwarded-For", "198.51.100.80")
      .send({ ...input, confirmPassword: input.password });
    expect(login.status).toBe(201);
    expect(login.body.data.refreshToken).toBeUndefined();
    const cookie = login.headers["set-cookie"][0];
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    const refresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie.split(";")[0]);
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.refreshToken).toBeUndefined();
    expect(refresh.headers["set-cookie"][0]).not.toBe(cookie);
    expect(refresh.headers["cache-control"]).toBe("no-store");
    const raw = decodeURIComponent(
      refresh.headers["set-cookie"][0]
        .split(";")[0]
        .slice("refreshToken=".length),
    );
    await logoutUser(login.body.data.user.id);
    await expect(refreshAccessToken(raw)).rejects.toThrow();
  });
  it("rejects refresh tokens supplied only through JSON and blocks untrusted origins", async () => {
    const app = createApp();
    const session = await registerUser(input);
    expect(
      (
        await request(app)
          .post("/api/auth/refresh")
          .send({ refreshToken: session.refreshToken })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/auth/refresh")
          .set("Origin", "https://evil.example")
          .set("Cookie", `refreshToken=${session.refreshToken}`)
      ).status,
    ).toBe(403);
  });
});

describe("production configuration", () => {
  const production = {
    NODE_ENV: "production",
    MONGODB_URI: "mongodb://mongo:27017/yatrik",
    JWT_SECRET: "a".repeat(64),
    JWT_REFRESH_SECRET: "b".repeat(64),
    GEMINI_API_KEY: "provider-key",
    REDIS_URL: "redis://redis:6379",
    FRONTEND_URL_PROD: "https://travel.example.org",
  };
  it("requires explicit Redis, distinct secrets, and an HTTPS origin", () => {
    expect(envSchema.safeParse(production).success).toBe(true);
    expect(
      envSchema.safeParse({
        ...production,
        FRONTEND_URLS:
          "https://travel.example.org,https://www.travel.example.org",
        COOKIE_SAME_SITE: "none",
        COOKIE_SECURE: "true",
      }).success,
    ).toBe(true);
    for (const invalid of [
      { REDIS_URL: undefined },
      { FRONTEND_URL_PROD: undefined },
      { FRONTEND_URLS: "http://travel.example.org" },
      { FRONTEND_URL_PROD: "http://travel.example.org" },
      { COOKIE_SAME_SITE: "none", COOKIE_SECURE: "false" },
      { JWT_REFRESH_SECRET: production.JWT_SECRET },
      { RATE_LIMIT_MAX_REQUESTS: 0 },
      { TRUST_PROXY: -1 },
      { JWT_EXPIRY: "forever" },
    ])
      expect(envSchema.safeParse({ ...production, ...invalid }).success).toBe(
        false,
      );
  });
});

describe("request boundaries", () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const token = generateAccessToken({
    id: userId,
    name: input.name,
    email: input.email,
  });
  it("rejects invalid JSON, oversized bodies, and malformed cookies as client errors", async () => {
    const app = createApp();
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Content-Type", "application/json")
          .send("{broken")
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ password: "a".repeat(270_000) })
      ).status,
    ).toBe(413);
    expect(
      (await request(app).get("/health").set("Cookie", "refreshToken=%E0%A4%A"))
        .status,
    ).toBe(400);
  });
  it.each([
    { durationDays: 1.5 },
    { startDate: "not-a-date" },
    { destination: "  " },
    { startDate: "2025-02-31" },
  ])("rejects invalid trip fields %j", async (override) => {
    const response = await request(createApp())
      .post("/api/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({
        destination: "Goa",
        durationDays: 2,
        budgetTier: "Low",
        ...override,
      });
    expect(response.status).toBe(400);
  });
  it("validates dates against persisted values on a partial update", async () => {
    const trip = await Trip.create({
      userId,
      destination: "Goa",
      durationDays: 2,
      budgetTier: "Low",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-11"),
    });
    const response = await request(createApp())
      .put(`/api/trips/${trip.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ endDate: "2026-10-01" });
    expect(response.status).toBe(400);
  });
  it("rejects malformed trip IDs in AI request bodies before database access", async () => {
    const response = await request(createApp())
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ tripId: "not-an-id", message: "Help" });
    expect(response.status).toBe(400);
  });
});

describe("AI semantic schema", () => {
  it("enforces day count, ordering, nonnegative costs, totals, and hotel rating", () => {
    const schema = generatedTripForDurationSchema(1);
    expect(schema.safeParse(validGeneration).success).toBe(true);
    expect(
      generatedTripForDurationSchema(2).safeParse(validGeneration).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validGeneration,
        itinerary: [{ ...validGeneration.itinerary[0], dayNumber: 2 }],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validGeneration,
        estimatedBudget: { ...validGeneration.estimatedBudget, total: 999 },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validGeneration,
        hotels: [{ ...validGeneration.hotels[0], rating: 6 }],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...validGeneration,
        estimatedBudget: {
          transport: -1,
          accommodation: 1,
          food: 0,
          activities: 0,
          total: 0,
        },
      }).success,
    ).toBe(false);
  });
});
