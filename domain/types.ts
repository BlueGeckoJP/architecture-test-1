export type ErrorCode =
  | "BAD_REQUEST"
  | "INVALID_CURSOR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "WORLD_STATE_NOT_READY"
  | "INTERNAL_SERVER_ERROR";

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export type WorldStateDto = {
  facts: string;
  updatedAt: string;
};

export type BotSummaryDto = {
  id: string;
  name: string;
  createdAt: string;
};

export type BotDetailDto = BotSummaryDto & {
  persona: string | null;
};

export type PostDto = {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  likeCount: number;
  createdAt: string;
};

export type LikeDto = {
  id: string;
  postId: string;
  botId: string;
};

export type OllamaDebugStatus = "idle" | "running" | "success" | "error";

export type OllamaDebugDto = {
  status: OllamaDebugStatus;
  ollamaUrl: string | null;
  model: string | null;
  prompt: string | null;
  response: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
};

export type BotInternal = BotDetailDto & {
  memory: string | null;
};

export type BotAction =
  | {
      method: "POST";
      path: "/api/posts";
      body: {
        content: string;
        botId: string;
      };
    }
  | {
      method: "POST";
      path: `/api/posts/${string}/likes`;
      body: {
        botId: string;
      };
    }
  | {
      method: "NOOP";
      reason: string;
    };
