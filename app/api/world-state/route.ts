import { badRequest } from "@/domain/errors";
import { errorResponse, jsonResponse, readJsonObject } from "@/lib/api";
import { ensureRuntimeStarted } from "@/services/runtimeService";
import { worldStateService } from "@/services/worldStateService";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureRuntimeStarted();
    return jsonResponse({
      worldState: worldStateService.getWorldState(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await ensureRuntimeStarted();

    const body = await readJsonObject(request);
    if (!body || typeof body.facts !== "string") {
      throw badRequest("facts must be a string");
    }

    return jsonResponse({
      worldState: worldStateService.updateWorldState(body.facts),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
