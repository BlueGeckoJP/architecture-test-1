import { getOllamaDebugState } from "@/infrastructure/ollamaClient";
import { jsonResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  return jsonResponse({
    debug: getOllamaDebugState(),
  });
}
