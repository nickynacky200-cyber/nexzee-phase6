import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new ApiError(400, firstIssue?.message ?? "Invalid request data");
    }

    req.body = result.data;
    next();
  };
}
