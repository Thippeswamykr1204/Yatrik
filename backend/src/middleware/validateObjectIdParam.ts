import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ValidationError } from "@/utils/errors.js";

/** Validates a named route parameter before it reaches a Mongoose query. */
export const validateObjectIdParam =
  (paramName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];

    if (!value || !mongoose.isObjectIdOrHexString(value)) {
      next(
        new ValidationError(`${paramName} must be a valid MongoDB ObjectId`),
      );
      return;
    }

    next();
  };
