import { badRequest } from "@/domain/errors";
import { errorResponse, jsonResponse, readJsonObject } from "@/lib/api";
import { assertInternalAuthorization } from "@/lib/auth";
import { addLike } from "@/services/postService";
import { ensureRuntimeStarted } from "@/services/runtimeService";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    await ensureRuntimeStarted();
    assertInternalAuthorization(request);

    const { postId } = await params;
    const body = await readJsonObject(request);
    if (!body || typeof body.botId !== "string") {
      throw badRequest("botId must be a string");
    }

    return jsonResponse(
      {
        like: await addLike(postId, body.botId),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
