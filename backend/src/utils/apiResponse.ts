import { Response } from "express";
import { ApiResponse } from "@/types/index.js";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
): Response => {
  return res.status(statusCode).json({
    success: true,
    status: statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  } as ApiResponse<T>);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errorCode: string = message,
): Response => {
  return res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    error: errorCode,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Success",
): Response => {
  return res.status(200).json({
    success: true,
    status: 200,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  });
};
