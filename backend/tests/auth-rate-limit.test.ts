import request from "supertest";
import { createApp } from "@/app.js";

const registration = (suffix: number) => ({
  name: `Rate Limit ${suffix}`,
  email: `rate-limit-${suffix}@example.com`,
  password: "SecurePass1!",
  confirmPassword: "SecurePass1!",
});

describe("auth rate limiting", () => {
  it("returns 429 after the test-only three-attempt threshold", async () => {
    const app = createApp();
    const clientIp = "198.51.100.42";

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await request(app)
        .post("/api/auth/register")
        .set("X-Forwarded-For", clientIp)
        .send(registration(attempt));

      expect(response.status).toBe(201);
    }

    const limitedResponse = await request(app)
      .post("/api/auth/register")
      .set("X-Forwarded-For", clientIp)
      .send(registration(4));

    expect(limitedResponse.status).toBe(429);
  });
});
