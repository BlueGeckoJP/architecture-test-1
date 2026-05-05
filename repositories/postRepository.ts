import { prisma } from "@/lib/prisma";

export type PostCursor = {
  createdAt: Date;
  id: string;
};

export async function findPosts(limit: number, cursor: PostCursor | null) {
  return prisma.post.findMany({
    where: cursor
      ? {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } },
          ],
        }
      : undefined,
    include: {
      author: true,
      _count: {
        select: { likes: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

export async function findPostById(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: { likes: true },
  });
}

export async function createPost(content: string, botId: string) {
  return prisma.post.create({
    data: {
      content,
      authorId: botId,
    },
    include: {
      author: true,
      _count: {
        select: { likes: true },
      },
    },
  });
}

export async function createLike(postId: string, botId: string) {
  return prisma.like.create({
    data: {
      postId,
      botId,
    },
  });
}

export async function findLike(postId: string, botId: string) {
  return prisma.like.findUnique({
    where: {
      postId_botId: {
        postId,
        botId,
      },
    },
  });
}
