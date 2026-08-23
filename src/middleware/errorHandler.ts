import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unexpected error — log full detail server-side, return a safe generic
  // message to the client. Never send err.stack or err.message from
  // unknown errors (could contain DB/API internals).
  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    ...(env.NODE_ENV === "development" && err instanceof Error
      ? { debug: err.message }
      : {}),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}
