import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "@/config/env.js";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
}
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}
const claimsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  email: z.string().email(),
  name: z.string().min(1),
  iat: z.number(),
  exp: z.number(),
});
const claims = {
  issuer: "ai-travel-planner-api",
  audience: "ai-travel-planner-frontend",
};

export const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
export const generateAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, config.jwt.secret, {
    ...claims,
    algorithm: "HS256",
    expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });
export const generateRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, config.jwt.refreshSecret, {
    ...claims,
    algorithm: "HS256",
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });
export const generateTokens = (payload: TokenPayload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
});

function verify(token: string, secret: string, kind: string): DecodedToken {
  try {
    return claimsSchema.parse(
      jwt.verify(token, secret, { ...claims, algorithms: ["HS256"] }),
    );
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError)
      throw new Error(`${kind} token expired`);
    throw new Error(`Invalid ${kind.toLowerCase()} token`);
  }
}
export const verifyAccessToken = (token: string): DecodedToken =>
  verify(token, config.jwt.secret, "Access");
export const verifyRefreshToken = (token: string): DecodedToken =>
  verify(token, config.jwt.refreshSecret, "Refresh");
export const extractTokenFromHeader = (header?: string): string | null =>
  header?.startsWith("Bearer ") ? header.substring(7) : null;
