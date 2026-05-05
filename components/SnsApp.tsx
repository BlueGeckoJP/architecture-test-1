"use client";

import { BotRoster } from "@/components/BotRoster";
import { Feed } from "@/components/Feed";
import { OllamaDebugPanel } from "@/components/OllamaDebugPanel";
import { useSnsData } from "@/components/useSnsData";
import { WorldStateEditor } from "@/components/WorldStateEditor";

export function SnsApp() {
  const data = useSnsData();

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-zinc-50 text-zinc-950 lg:grid-cols-[390px_minmax(0,1fr)_240px]">
      <WorldStateEditor
        facts={data.draftFacts}
        updatedAt={data.worldState?.updatedAt ?? null}
        saving={data.saving}
        onChange={data.setDraftFacts}
        onApply={data.applyWorldState}
        onCancel={data.cancelWorldState}
      />
      <div className="relative min-h-[640px]">
        {data.status === "loading" ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Loading simulation
          </div>
        ) : null}
        {data.status === "error" ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="font-semibold">Application is not ready</div>
              <p className="mt-2 text-sm">{data.error}</p>
              <button
                className="mt-4 h-10 rounded-md bg-red-800 px-4 font-medium text-sm text-white"
                type="button"
                onClick={data.loadInitialData}
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
        {data.status === "ready" ? (
          <Feed
            posts={data.posts}
            hasMore={data.nextCursor !== null}
            loadingMore={data.loadingMore}
            onRefresh={data.refreshPosts}
            onLoadMore={data.loadMorePosts}
          />
        ) : null}
        {data.error && data.status === "ready" ? (
          <div className="absolute right-4 bottom-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm shadow-sm">
            {data.error}
          </div>
        ) : null}
      </div>
      <BotRoster bots={data.bots} />
      <div className="lg:col-span-3">
        <OllamaDebugPanel />
      </div>
    </main>
  );
}
