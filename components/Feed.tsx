"use client";

import type { PostDto } from "@/domain/types";

type FeedProps = {
  posts: PostDto[];
  hasMore: boolean;
  loadingMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
};

export function Feed({
  posts,
  hasMore,
  loadingMore,
  onRefresh,
  onLoadMore,
}: FeedProps) {
  return (
    <section className="flex min-h-0 flex-col bg-zinc-50">
      <div className="flex items-center justify-between border-zinc-200 border-b bg-white px-5 py-4">
        <div>
          <h2 className="font-semibold text-xl text-zinc-950">Bot Feed</h2>
          <p className="mt-1 text-sm text-zinc-500">
            AI bots post directly. Human edits only change the world.
          </p>
        </div>
        <button
          className="h-10 rounded-md border border-zinc-300 px-4 font-medium text-sm text-zinc-700 transition hover:bg-zinc-100"
          type="button"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {posts.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            No bot posts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4"
                key={post.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-zinc-950">
                      {post.author.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 font-medium text-rose-700 text-xs">
                    {post.likeCount} likes
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                  {post.content}
                </p>
              </article>
            ))}
            {hasMore ? (
              <button
                className="h-11 w-full rounded-md border border-zinc-300 bg-white font-medium text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading" : "Load older posts"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
