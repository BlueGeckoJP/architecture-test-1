"use client";

import { useCallback, useEffect, useState } from "react";
import type { OllamaDebugDto } from "@/domain/types";

type OllamaDebugResponse = {
  debug: OllamaDebugDto;
};

async function fetchOllamaDebug(): Promise<OllamaDebugDto> {
  const response = await fetch("/api/ollama-debug", { cache: "no-store" });
  const data = (await response.json()) as OllamaDebugResponse;

  if (!response.ok) {
    throw new Error(`Debug request failed with ${response.status}`);
  }

  return data.debug;
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatDuration(value: number | null) {
  return typeof value === "number" ? `${value} ms` : "-";
}

function statusClassName(status: OllamaDebugDto["status"]) {
  switch (status) {
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "error":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

function DebugTextBlock({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 font-semibold text-xs uppercase tracking-normal text-zinc-500">
        {label}
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-950 p-3 font-mono text-zinc-50 text-xs leading-5">
        {value || "-"}
      </pre>
    </div>
  );
}

export function OllamaDebugPanel() {
  const [debug, setDebug] = useState<OllamaDebugDto | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const loadDebug = useCallback(async () => {
    try {
      const nextDebug = await fetchOllamaDebug();
      setDebug(nextDebug);
      setPanelError(null);
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Debug request failed",
      );
    }
  }, []);

  useEffect(() => {
    void loadDebug();
    const intervalId = window.setInterval(() => {
      void loadDebug();
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [loadDebug]);

  const status = debug?.status ?? "idle";

  return (
    <section className="border-zinc-200 border-t bg-white">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg text-zinc-950">
              Ollama Debug
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Latest prompt and response
            </p>
          </div>
          <div
            className={`rounded-md border px-3 py-1.5 font-medium text-sm ${statusClassName(status)}`}
          >
            {status}
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="text-zinc-500 text-xs">Started</div>
            <div className="mt-1 text-zinc-900">
              {formatDateTime(debug?.startedAt ?? null)}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs">Finished</div>
            <div className="mt-1 text-zinc-900">
              {formatDateTime(debug?.finishedAt ?? null)}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs">Duration</div>
            <div className="mt-1 text-zinc-900">
              {formatDuration(debug?.durationMs ?? null)}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs">Model</div>
            <div className="mt-1 break-words text-zinc-900">
              {debug?.model ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs">URL</div>
            <div className="mt-1 break-words text-zinc-900">
              {debug?.ollamaUrl ?? "-"}
            </div>
          </div>
        </div>

        {panelError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
            {panelError}
          </div>
        ) : null}

        {debug?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
            {debug.error}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DebugTextBlock label="Prompt" value={debug?.prompt ?? null} />
          <DebugTextBlock label="Response" value={debug?.response ?? null} />
        </div>
      </div>
    </section>
  );
}
