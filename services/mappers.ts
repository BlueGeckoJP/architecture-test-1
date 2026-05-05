import type { Bot, Like, Post } from "@/app/generated/prisma/client";
import type {
  BotDetailDto,
  BotSummaryDto,
  LikeDto,
  PostDto,
} from "@/domain/types";

type PostWithAuthorAndCount = Post & {
  author: Bot;
  _count: {
    likes: number;
  };
};

export function toPostDto(post: PostWithAuthorAndCount): PostDto {
  return {
    id: post.id,
    content: post.content,
    author: {
      id: post.author.id,
      name: post.author.name,
    },
    likeCount: post._count.likes,
    createdAt: post.createdAt.toISOString(),
  };
}

export function toBotSummaryDto(bot: Bot): BotSummaryDto {
  return {
    id: bot.id,
    name: bot.name,
    createdAt: bot.createdAt.toISOString(),
  };
}

export function toBotDetailDto(bot: Bot): BotDetailDto {
  return {
    ...toBotSummaryDto(bot),
    persona: bot.persona,
  };
}

export function toLikeDto(like: Like): LikeDto {
  return {
    id: like.id,
    postId: like.postId,
    botId: like.botId,
  };
}
