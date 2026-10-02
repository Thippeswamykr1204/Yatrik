import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, extractTokenFromHeader } from "@/utils/tokens.js";
import { UnauthorizedError } from "@/utils/errors.js";
import logger from "@/utils/logger.js";

/**
 * Verify JWT access token and attach user to request
 */
export const verifyAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError(
        "Authorization token is required. Use: Authorization: Bearer <token>",
      );
    }

    // Verify and decode token
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return void res.status(401).json({
        success: false,
        status: 401,
        message: "Unauthorized",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof Error) {
      // Handle token expiration
      if (error.message.includes("expired")) {
        return void res.status(401).json({
          success: false,
          status: 401,
          message: "Token expired",
          error: "Access token has expired. Please refresh your token.",
          timestamp: new Date().toISOString(),
        });
      }

      // Handle invalid token
      if (error.message.includes("Invalid")) {
        return void res.status(401).json({
          success: false,
          status: 401,
          message: "Unauthorized",
          error: "Invalid access token",
          timestamp: new Date().toISOString(),
        });
      }
    }

    logger.error("Authentication error", { error });
    return void res.status(401).json({
      success: false,
      status: 401,
      message: "Unauthorized",
      error: "Failed to verify token",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if token is missing
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
