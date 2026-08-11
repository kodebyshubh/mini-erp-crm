import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// Centralized error handler - every route uses asyncHandler so thrown
// errors land here and get converted into a consistent JSON error shape.
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: { message: `Duplicate value for unique field: ${(err.meta?.target as string[])?.join(", ")}` } });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { message: "Record not found" } });
    }
  }

  console.error(err);
  return res.status(500).json({ error: { message: "Internal server error" } });
}
