import jwt from "jsonwebtoken";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "@/app.js";
import { config } from "@/config/env.js";

const validRegistration = {
  name: "Duplicate User",
  email: "duplicate@example.com",
  password: "SecurePass1!",
  confirmPassword: "SecurePass1!",
};

describe("authentication security", () => {
  it("returns 401 for an expired access token", async () => {
    const expiredToken = jwt.sign(
      {
        id: new mongoose.Types.ObjectId().toString(),
        email: "expired@example.com",
        name: "Expired",
      },
      config.jwt.secret,
      {
        expiresIn: "-1s",
        issuer: "ai-travel-planner-api",
        audience: "ai-travel-planner-frontend",
      },
    );

    const response = await request(createApp())
      .get("/api/trips")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it("returns 401 for a malformed access token", async () => {
    const response = await request(createApp())
      .get("/api/trips")
      .set("Authorization", "Bearer definitely-not-a-jwt");

    expect(response.status).toBe(401);
  });

  it("returns 409 when registering an email that already exists", async () => {
    const app = createApp();

    const first = await request(app)
      .post("/api/auth/register")
      .set("X-Forwarded-For", "198.51.100.43")
      .send(validRegistration);
    const duplicate = await request(app)
      .post("/api/auth/register")
      .set("X-Forwarded-For", "198.51.100.43")
      .send(validRegistration);

    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(409);
  });
});
