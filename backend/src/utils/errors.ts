import { ERROR_CODES, HTTP_STATUS } from "@/config/constants.js";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code: string = ERROR_CODES.INTERNAL_ERROR,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      details,
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.DATABASE_ERROR,
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ExternalApiError extends AppError {
  constructor(
    message: string = "External API error",
    code: string = ERROR_CODES.EXTERNAL_API_ERROR,
  ) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code);
    Object.setPrototypeOf(this, ExternalApiError.prototype);
  }
}

export class AIInvalidResponseError extends ExternalApiError {
  constructor() {
    super(
      "AI returned an invalid response. Please try again.",
      ERROR_CODES.AI_INVALID_RESPONSE,
    );
    Object.setPrototypeOf(this, AIInvalidResponseError.prototype);
  }
}
