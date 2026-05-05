import { badRequest } from "@/domain/errors";
import { errorResponse, jsonResponse, readJsonObject } from "@/lib/api";
import { assertInternalAuthorization } from "@/lib/auth";
import {
  addPost,
  decodeCursor,
  getPosts,
  parseLimit,
} from "@/services/postService";
import { ensureRuntimeStarted } from "@/services/runtimeService";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await ensureRuntimeStarted();

    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const cursor = decodeCursor(url.searchParams.get("cursor"));

    return jsonResponse(await getPosts(limit, cursor));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureRuntimeStarted();
    assertInternalAuthorization(request);

    const body = await readJsonObject(request);
    if (
      !body ||
      typeof body.content !== "string" ||
      typeof body.botId !== "string"
    ) {
      throw badRequest("content and botId must be strings");
    }

    return jsonResponse(
      {
        post: await addPost(body.content, body.botId),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
