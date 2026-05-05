import {
  decideBotAction,
  summarizeBotMemory,
} from "@/infrastructure/ollamaClient";
import { getInternalApiBaseUrl, getInternalApiKey } from "@/lib/api";
import { getInternalBots, updateBotMemory } from "@/services/botService";
import { getPosts } from "@/services/postService";
import { worldStateService } from "@/services/worldStateService";

class BotWorker {
  private started = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  start() {
    if (this.started) {
      return;
    }

    this.started = true;
    this.scheduleNext();
  }

  private scheduleNext() {
    const delay = 10_000 + Math.floor(Math.random() * 10_000);
    this.timer = setTimeout(() => {
      void this.tick();
    }, delay);

    if (typeof this.timer === "object" && "unref" in this.timer) {
      this.timer.unref();
    }
  }

  private async tick() {
    if (this.running) {
      this.scheduleNext();
      return;
    }

    this.running = true;

    try {
      await this.runOnce();
    } catch (error) {
      console.error("Bot worker tick failed", error);
    } finally {
      this.running = false;
      this.scheduleNext();
    }
  }

  private async runOnce() {
    const [worldState, feed, bots] = await Promise.all([
      Promise.resolve(worldStateService.getWorldState()),
      getPosts(20, null),
      getInternalBots(),
    ]);

    if (bots.length === 0) {
      return;
    }

    const bot = bots[Math.floor(Math.random() * bots.length)];
    const likeablePostIds = feed.posts
      .filter((post) => post.author.id !== bot.id)
      .map((post) => post.id);

    const action = await decideBotAction({
      bot,
      worldState,
      posts: feed.posts,
      likeablePostIds,
    });

    if (action.method === "POST") {
      if (action.path === "/api/posts") {
        await this.callInternalApi(action.path, action.body);
      } else {
        const postId = action.path.split("/")[3];
        if (likeablePostIds.includes(postId)) {
          await this.callInternalApi(action.path, action.body);
        }
      }
    }

    const memory = await summarizeBotMemory({
      bot,
      worldState,
      posts: feed.posts,
      action,
    });
    await updateBotMemory(bot.id, memory);
  }

  private async callInternalApi(path: string, body: unknown) {
    const response = await fetch(`${getInternalApiBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${getInternalApiKey()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Internal bot API call failed", path, response.status);
    }
  }
}

const globalForBotWorker = globalThis as typeof globalThis & {
  botWorker?: BotWorker;
};

const botWorker = globalForBotWorker.botWorker ?? new BotWorker();
globalForBotWorker.botWorker = botWorker;

export function ensureBotWorkerStarted() {
  botWorker.start();
}
