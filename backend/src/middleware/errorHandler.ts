import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "@/utils/errors.js";
import { sendError } from "@/utils/apiResponse.js";
import logger from "@/utils/logger.js";
import { ERROR_CODES } from "@/config/constants.js";

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }
  logger.error("Request failed", {
    errorType: error.name,
    method: req.method,
    requestId: req.id,
  });

  // Body-parser errors must be client errors, without echoing any submitted body.
  if ("type" in error && error.type === "entity.too.large") {
    sendError(
      res,
      "Request body exceeds 256 KB",
      413,
      ERROR_CODES.VALIDATION_ERROR,
    );
    return;
  }
  if (
    "type" in error &&
    [
      "entity.parse.failed",
      "request.aborted",
      "encoding.unsupported",
      "charset.unsupported",
    ].includes(String(error.type))
  ) {
    sendError(res, "Invalid request body", 400, ERROR_CODES.VALIDATION_ERROR);
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, error.code);
    return;
  }

  // Handle Mongoose validation errors
  if (error.name === "ValidationError") {
    const validationError = new ValidationError("Validation failed");
    sendError(
      res,
      validationError.message,
      validationError.statusCode,
      validationError.code,
    );
    return;
  }

  // Handle Mongoose duplicate key errors
  if (
    error.name === "MongoServerError" &&
    "code" in error &&
    error.code === 11000
  ) {
    sendError(res, "Record already exists", 409, ERROR_CODES.CONFLICT);
    return;
  }

  // Generic error handling
  sendError(res, "Internal server error", 500, ERROR_CODES.INTERNAL_ERROR);
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
