import {
  badRequest,
  conflict,
  invalidCursor,
  notFound,
  validationError,
} from "@/domain/errors";
import type { PostDto } from "@/domain/types";
import { findBotById } from "@/repositories/botRepository";
import {
  createLike,
  createPost,
  findLike,
  findPostById,
  findPosts,
  type PostCursor,
} from "@/repositories/postRepository";
import { toLikeDto, toPostDto } from "@/services/mappers";
import { worldStateService } from "@/services/worldStateService";

const objectIdPattern = /^[0-9a-f]{24}$/i;

export function assertObjectId(value: string, fieldName: string) {
  if (!objectIdPattern.test(value)) {
    throw badRequest(`${fieldName} must be a valid id`);
  }
}

export function parseLimit(rawLimit: string | null) {
  if (!rawLimit) {
    return 20;
  }

  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw badRequest("limit must be a positive integer");
  }

  return Math.min(limit, 50);
}

export function encodeCursor(post: PostDto) {
  return Buffer.from(
    JSON.stringify({
      createdAt: post.createdAt,
      id: post.id,
    }),
  ).toString("base64url");
}

export function decodeCursor(rawCursor: string | null): PostCursor | null {
  if (!rawCursor) {
    return null;
  }

  try {
    const value = JSON.parse(Buffer.from(rawCursor, "base64url").toString());
    if (
      !value ||
      typeof value !== "object" ||
      typeof value.createdAt !== "string" ||
      typeof value.id !== "string" ||
      !objectIdPattern.test(value.id)
    ) {
      throw new Error("Invalid cursor shape");
    }

    const createdAt = new Date(value.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor date");
    }

    return {
      createdAt,
      id: value.id,
    };
  } catch {
    throw invalidCursor();
  }
}

export async function getPosts(limit: number, cursor: PostCursor | null) {
  worldStateService.assertReady();

  const posts = await findPosts(limit + 1, cursor);
  const items = posts.slice(0, limit).map(toPostDto);
  const nextCursor =
    posts.length > limit && items.length > 0
      ? encodeCursor(items[items.length - 1])
      : null;

  return {
    posts: items,
    nextCursor,
  };
}

export async function addPost(content: string, botId: string) {
  worldStateService.assertReady();

  if (content.length < 1 || content.length > 140) {
    throw validationError("content must be 1 to 140 characters");
  }

  assertObjectId(botId, "botId");
  const bot = await findBotById(botId);
  if (!bot) {
    throw validationError("botId must reference an existing bot");
  }

  return toPostDto(await createPost(content, botId));
}

export async function addLike(postId: string, botId: string) {
  worldStateService.assertReady();

  assertObjectId(postId, "postId");
  assertObjectId(botId, "botId");

  const [post, bot, existingLike] = await Promise.all([
    findPostById(postId),
    findBotById(botId),
    findLike(postId, botId),
  ]);

  if (!post) {
    throw notFound("Post not found");
  }
  if (!bot) {
    throw validationError("botId must reference an existing bot");
  }
  if (post.authorId === botId) {
    throw validationError("Bots cannot like their own posts");
  }
  if (existingLike) {
    throw conflict("Bot already liked this post");
  }

  return toLikeDto(await createLike(postId, botId));
}
