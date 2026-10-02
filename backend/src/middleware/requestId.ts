import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";

export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const id = randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
