import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserById,
  logoutUser,
} from "@/services/auth.service.js";
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} from "@/validators/auth.validators.js";
import { sendSuccess } from "@/utils/apiResponse.js";
import { ValidationError, UnauthorizedError } from "@/utils/errors.js";
import { config } from "@/config/env.js";

// Cross-site deployments must explicitly opt into SameSite=None over HTTPS.
const refreshCookieOptions = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
  maxAge: config.jwt.refreshMaxAge,
  path: "/",
};

/**
 * Register endpoint handler
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Validate input
    const validation = validateRegister(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => ({
          ...acc,
          [err.path[0]]: err.message,
        }),
        {},
      );
      throw new ValidationError("Validation failed", errors);
    }

    // Register user
    const result = await registerUser(validation.data);

    // Set refresh token in HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    sendSuccess(
      res,
      { user: result.user, accessToken: result.accessToken },
      "User registered successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login endpoint handler
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Validate input
    const validation = validateLogin(req.body);
    if (!validation.success) {
      const errors = validation.error.errors.reduce(
        (acc, err) => ({
          ...acc,
          [err.path[0]]: err.message,
        }),
        {},
      );
      throw new ValidationError("Validation failed", errors);
    }

    // Login user
    const result = await loginUser(validation.data);

    // Set refresh token in HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    sendSuccess(
      res,
      { user: result.user, accessToken: result.accessToken },
      "Login successful",
      200,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token endpoint handler
 * POST /api/auth/refresh
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Refresh tokens are only accepted from the HttpOnly cookie.
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    // Validate input
    const validation = validateRefreshToken({ refreshToken });
    if (!validation.success) {
      throw new ValidationError("Invalid refresh token");
    }

    // Refresh access token
    const tokens = await refreshAccessToken(refreshToken);

    // Update refresh token in cookie
    res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions);

    sendSuccess(
      res,
      { accessToken: tokens.accessToken },
      "Token refreshed successfully",
      200,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user endpoint handler
 * GET /api/auth/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not found in request");
    }

    const user = await getUserById(req.user.id);
    sendSuccess(res, user, "User fetched successfully", 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout endpoint handler
 * POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new Error("User not found in request");
    }

    // Invalidate refresh token in database
    await logoutUser(req.user.id);

    // Clear refresh token cookie
    const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions;
    res.clearCookie("refreshToken", clearOptions);

    sendSuccess(res, null, "Logout successful", 200);
  } catch (error) {
    next(error);
  }
};
