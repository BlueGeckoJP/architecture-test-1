import { errorResponse, jsonResponse } from "@/lib/api";
import { getBots } from "@/services/botService";
import { ensureRuntimeStarted } from "@/services/runtimeService";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureRuntimeStarted();
    return jsonResponse({
      bots: await getBots(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
