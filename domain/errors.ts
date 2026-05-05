import type { ErrorCode } from "@/domain/types";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function badRequest(message = "Bad request") {
  return new AppError("BAD_REQUEST", message, 400);
}

export function invalidCursor(message = "Invalid cursor") {
  return new AppError("INVALID_CURSOR", message, 400);
}

export function validationError(message: string) {
  return new AppError("VALIDATION_ERROR", message, 422);
}

export function notFound(message: string) {
  return new AppError("NOT_FOUND", message, 404);
}

export function unauthorized(message = "Unauthorized") {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function conflict(message: string) {
  return new AppError("CONFLICT", message, 409);
}

export function worldStateNotReady() {
  return new AppError("WORLD_STATE_NOT_READY", "World state is not ready", 503);
}
