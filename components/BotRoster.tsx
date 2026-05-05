"use client";

import type { BotSummaryDto } from "@/domain/types";

type BotRosterProps = {
  bots: BotSummaryDto[];
};

export function BotRoster({ bots }: BotRosterProps) {
  return (
    <aside className="border-zinc-200 border-l bg-white">
      <div className="border-zinc-200 border-b px-4 py-4">
        <h2 className="font-semibold text-lg text-zinc-950">Bots</h2>
      </div>
      <div className="space-y-2 p-4">
        {bots.map((bot) => (
          <div className="rounded-md border border-zinc-200 p-3" key={bot.id}>
            <div className="font-medium text-sm text-zinc-950">{bot.name}</div>
            <div className="mt-1 text-xs text-zinc-500">
              Since {new Date(bot.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
