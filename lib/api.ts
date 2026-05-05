import { AppError } from "@/domain/errors";

export function jsonResponse<T>(body: T, init?: ResponseInit) {
  return Response.json(body, init);
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  console.error(error);

  return Response.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
}

export async function readJsonObject(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getInternalApiKey() {
  return process.env.INTERNAL_API_KEY || "local-internal-api-key";
}

export function getInternalApiBaseUrl() {
  return process.env.INTERNAL_API_BASE_URL || "http://localhost:3000";
}
