import { Router } from "express";
import {
  register,
  login,
  refresh,
  getCurrentUser,
  logout,
} from "@/controllers/auth.controller.js";
import { verifyAuth } from "@/middleware/auth.middleware.js";
import { asyncHandler } from "@/middleware/errorHandler.js";
import { protectAuthOrigin } from "@/middleware/cors.js";
import { authRateLimiter } from "@/middleware/rateLimit.js";

const router = Router();

router.use(protectAuthOrigin);
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/**
 * Public routes
 */

// Register endpoint
// POST /api/auth/register
// Body: { name, email, password, confirmPassword }
router.post("/register", authRateLimiter, asyncHandler(register));

// Login endpoint
// POST /api/auth/login
// Body: { email, password }
router.post("/login", authRateLimiter, asyncHandler(login));

// Refresh token endpoint
// POST /api/auth/refresh
// Cookie: refreshToken
router.post("/refresh", asyncHandler(refresh));

/**
 * Protected routes
 */

// Get current user
// GET /api/auth/me
// Headers: Authorization: Bearer <accessToken>
router.get("/me", verifyAuth, asyncHandler(getCurrentUser));

// Logout endpoint
// POST /api/auth/logout
// Headers: Authorization: Bearer <accessToken>
router.post("/logout", verifyAuth, asyncHandler(logout));

export default router;
