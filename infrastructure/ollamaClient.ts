import type {
  BotAction,
  BotInternal,
  OllamaDebugDto,
  PostDto,
  WorldStateDto,
} from "@/domain/types";

type OllamaGenerateResponse = {
  response?: string;
};

const noopAction: BotAction = {
  method: "NOOP",
  reason: "No suitable action",
};

const emptyDebugState: OllamaDebugDto = {
  status: "idle",
  ollamaUrl: null,
  model: null,
  prompt: null,
  response: null,
  error: null,
  startedAt: null,
  finishedAt: null,
  durationMs: null,
};

const globalForOllamaDebug = globalThis as typeof globalThis & {
  ollamaDebugState?: OllamaDebugDto;
};

globalForOllamaDebug.ollamaDebugState ??= emptyDebugState;

function getOllamaUrl() {
  return process.env.OLLAMA_URL || "http://localhost:11434";
}

function getOllamaModel() {
  return process.env.OLLAMA_MODEL || "llama3.2";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function updateOllamaDebugState(nextState: OllamaDebugDto) {
  globalForOllamaDebug.ollamaDebugState = nextState;
}

export function getOllamaDebugState(): OllamaDebugDto {
  return globalForOllamaDebug.ollamaDebugState ?? emptyDebugState;
}

async function generate(prompt: string) {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const ollamaUrl = getOllamaUrl();
  const model = getOllamaModel();
  const body = {
    model,
    prompt,
    stream: false,
  };

  updateOllamaDebugState({
    status: "running",
    ollamaUrl,
    model,
    prompt,
    response: null,
    error: null,
    startedAt,
    finishedAt: null,
    durationMs: null,
  });

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data = (await response.json()) as OllamaGenerateResponse;
      const responseText = data.response ?? "";
      const finishedAtDate = new Date();
      updateOllamaDebugState({
        status: "success",
        ollamaUrl,
        model,
        prompt,
        response: responseText,
        error: null,
        startedAt,
        finishedAt: finishedAtDate.toISOString(),
        durationMs: finishedAtDate.getTime() - startedAtDate.getTime(),
      });
      return responseText;
    } catch (error) {
      lastError = error;
    }
  }

  const finishedAtDate = new Date();
  updateOllamaDebugState({
    status: "error",
    ollamaUrl,
    model,
    prompt,
    response: null,
    error: getErrorMessage(lastError),
    startedAt,
    finishedAt: finishedAtDate.toISOString(),
    durationMs: finishedAtDate.getTime() - startedAtDate.getTime(),
  });

  throw lastError;
}

function parseJsonObject(raw: string) {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end < start) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toAction(value: Record<string, unknown>, botId: string): BotAction {
  if (value.method === "NOOP") {
    return {
      method: "NOOP",
      reason:
        typeof value.reason === "string" ? value.reason : "No suitable action",
    };
  }

  if (value.method !== "POST" || typeof value.path !== "string") {
    return noopAction;
  }

  if (
    !value.body ||
    typeof value.body !== "object" ||
    Array.isArray(value.body)
  ) {
    return noopAction;
  }

  const body = value.body as Record<string, unknown>;
  if (body.botId !== botId) {
    return noopAction;
  }

  if (value.path === "/api/posts" && typeof body.content === "string") {
    return {
      method: "POST",
      path: "/api/posts",
      body: {
        botId,
        content: body.content.slice(0, 140),
      },
    };
  }

  if (/^\/api\/posts\/[0-9a-f]{24}\/likes$/i.test(value.path)) {
    return {
      method: "POST",
      path: value.path as `/api/posts/${string}/likes`,
      body: { botId },
    };
  }

  return noopAction;
}

export async function decideBotAction(input: {
  bot: BotInternal;
  worldState: WorldStateDto;
  posts: PostDto[];
  likeablePostIds: string[];
}): Promise<BotAction> {
  const prompt = [
    "Return only one JSON object. No markdown.",
    "Choose exactly one action for an AI SNS bot in this simulated world.",
    `Bot ID: ${input.bot.id}`,
    `Bot name: ${input.bot.name}`,
    `Persona: ${input.bot.persona ?? ""}`,
    `Memory: ${input.bot.memory ?? ""}`,
    `World facts: ${input.worldState.facts}`,
    `Latest posts: ${JSON.stringify(input.posts)}`,
    `Likeable post IDs: ${JSON.stringify(input.likeablePostIds)}`,
    'Post JSON: {"method":"POST","path":"/api/posts","body":{"content":"text","botId":"BOT_ID"}}',
    'Like JSON: {"method":"POST","path":"/api/posts/POST_ID/likes","body":{"botId":"BOT_ID"}}',
    'Noop JSON: {"method":"NOOP","reason":"No suitable action"}',
  ].join("\n");

  try {
    const raw = await generate(prompt);
    const parsed = parseJsonObject(raw);
    return parsed ? toAction(parsed, input.bot.id) : noopAction;
  } catch (error) {
    console.error("Failed to decide bot action", error);
    return noopAction;
  }
}

export async function summarizeBotMemory(input: {
  bot: BotInternal;
  worldState: WorldStateDto;
  posts: PostDto[];
  action: BotAction;
}) {
  const prompt = [
    "Return only one JSON object. No markdown.",
    "Update the bot memory as a short private summary under 500 characters.",
    `Bot name: ${input.bot.name}`,
    `Persona: ${input.bot.persona ?? ""}`,
    `Previous memory: ${input.bot.memory ?? ""}`,
    `World facts: ${input.worldState.facts}`,
    `Latest posts: ${JSON.stringify(input.posts)}`,
    `Chosen action: ${JSON.stringify(input.action)}`,
    'Required JSON: {"memory":"short summary"}',
  ].join("\n");

  try {
    const raw = await generate(prompt);
    const parsed = parseJsonObject(raw);
    if (parsed && typeof parsed.memory === "string") {
      return parsed.memory.slice(0, 1000);
    }
  } catch (error) {
    console.error("Failed to summarize bot memory", error);
  }

  return input.bot.memory ?? "";
}
