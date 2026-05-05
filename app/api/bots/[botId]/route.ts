import { errorResponse, jsonResponse } from "@/lib/api";
import { getBot } from "@/services/botService";
import { ensureRuntimeStarted } from "@/services/runtimeService";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    await ensureRuntimeStarted();
    const { botId } = await params;
    return jsonResponse({
      bot: await getBot(botId),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
