"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BotSummaryDto, PostDto, WorldStateDto } from "@/domain/types";

type LoadState = "idle" | "loading" | "ready" | "error";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function useSnsData() {
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [worldState, setWorldState] = useState<WorldStateDto | null>(null);
  const [draftFacts, setDraftFacts] = useState("");
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [bots, setBots] = useState<BotSummaryDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitialData = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const [worldStateResponse, postsResponse, botsResponse] =
        await Promise.all([
          fetchJson<{ worldState: WorldStateDto }>("/api/world-state"),
          fetchJson<{ posts: PostDto[]; nextCursor: string | null }>(
            "/api/posts?limit=20",
          ),
          fetchJson<{ bots: BotSummaryDto[] }>("/api/bots"),
        ]);

      setWorldState(worldStateResponse.worldState);
      setDraftFacts(worldStateResponse.worldState.facts);
      setPosts(postsResponse.posts);
      setNextCursor(postsResponse.nextCursor);
      setBots(botsResponse.bots);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const applyWorldState = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetchJson<{ worldState: WorldStateDto }>(
        "/api/world-state",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ facts: draftFacts }),
        },
      );
      setWorldState(response.worldState);
      setDraftFacts(response.worldState.facts);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [draftFacts]);

  const cancelWorldState = useCallback(() => {
    setDraftFacts(worldState?.facts ?? "");
  }, [worldState]);

  const refreshPosts = useCallback(async () => {
    setError(null);

    try {
      const response = await fetchJson<{
        posts: PostDto[];
        nextCursor: string | null;
      }>("/api/posts?limit=20");
      setPosts(response.posts);
      setNextCursor(response.nextCursor);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : "Refresh failed",
      );
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await fetchJson<{
        posts: PostDto[];
        nextCursor: string | null;
      }>(`/api/posts?limit=20&cursor=${encodeURIComponent(nextCursor)}`);
      setPosts((current) => [...current, ...response.posts]);
      setNextCursor(response.nextCursor);
    } catch (loadMoreError) {
      setError(
        loadMoreError instanceof Error
          ? loadMoreError.message
          : "Load more failed",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor]);

  return useMemo(
    () => ({
      status,
      error,
      worldState,
      draftFacts,
      posts,
      nextCursor,
      bots,
      saving,
      loadingMore,
      setDraftFacts,
      applyWorldState,
      cancelWorldState,
      refreshPosts,
      loadMorePosts,
      loadInitialData,
    }),
    [
      status,
      error,
      worldState,
      draftFacts,
      posts,
      nextCursor,
      bots,
      saving,
      loadingMore,
      applyWorldState,
      cancelWorldState,
      refreshPosts,
      loadMorePosts,
      loadInitialData,
    ],
  );
}
