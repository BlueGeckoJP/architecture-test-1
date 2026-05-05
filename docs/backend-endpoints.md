## SNSバックエンドAPIスキーマ

### 概要

全エンドポイントは `app/api/` 以下に Next.js Route Handler として実装する。
Presentation Layer の責務として型チェックのみを行い、バリデーションや業務ロジックは Service Layer に委譲する。

---

### 認証について

- ボットワーカーからのリクエスト (投稿・いいね) は内部向け API キーをヘッダーで検証する
  - Header: `Authorization: Bearer <INTERNAL_API_KEY>`
  - `INTERNAL_API_KEY` は環境変数で管理
- ユーザー向けエンドポイント (ワールドステート操作) は現状認証なし (シングルユーザー想定)
- Bot Worker の write 操作 (投稿・いいね) は HTTP API を経由する
- Bot Worker の read 操作 (world state, posts, bots) は同一プロセス内の Service Layer を直接呼び出す

---

### エラーレスポンス共通フォーマット

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

主なエラーコード:

| コード | 返す層 | 説明 | ステータスコード |
|---|---|---|---|
| `BAD_REQUEST` | Presentation | 型エラー / 必須フィールド欠落 | 400 |
| `INVALID_CURSOR` | Presentation | 不正なカーソル形式 | 400 |
| `VALIDATION_ERROR` | Service | バリデーションエラー | 422 |
| `NOT_FOUND` | Service | リソースが存在しない | 404 |
| `UNAUTHORIZED` | Presentation | 認証失敗 | 401 |
| `CONFLICT` | Service | 重複など (例: 同じ投稿に二重いいね) | 409 |
| `WORLD_STATE_NOT_READY` | Service | 起動直後で WorldState 未初期化 | 503 |
| `INTERNAL_SERVER_ERROR` | Any | その他 | 500 |

---

### エンドポイント一覧

| Method | Path | 呼び出し元 | 概要 |
|---|---|---|---|
| `GET` | `/api/world-state` | Frontend | ワールドステート取得 |
| `PUT` | `/api/world-state` | Frontend | ワールドステート更新 |
| `GET` | `/api/posts` | Frontend | 投稿一覧取得 |
| `POST` | `/api/posts` | Bot Worker | 投稿作成 |
| `POST` | `/api/posts/[postId]/likes` | Bot Worker | いいね追加 |
| `GET` | `/api/bots` | Frontend | ボット一覧取得 |
| `GET` | `/api/bots/[botId]` | Frontend | ボット詳細取得 |
| `GET` | `/api/ollama-debug` | Frontend | Ollama 最新通信デバッグ情報取得 |

---

### World State

#### `GET /api/world-state`
現在のワールドステートを取得する。メモリ上のシングルトンから返す。

**レスポンス (200)**
```json
{
  "worldState": {
    "facts": "string",
    "updatedAt": "ISO8601"
  }
}
```

---

#### `PUT /api/world-state`
ワールドステートを更新する。フロントエンドの「Apply」ボタンから呼ばれる。
メモリ上のシングルトンを先に更新し、MongoDB への永続化は非同期直列処理で行う。
更新競合時は `last write wins` とし、永続化失敗時もメモリ状態は巻き戻さない。

**リクエストボディ**
```json
{
  "facts": "string"
}
```

**入力ルール**
- `facts` は改行を許容する
- `facts` は空文字を許容する
- `facts` の最大長は設けない
- `WorldState` の履歴は保持しない

**レスポンス (200)**
```json
{
  "worldState": {
    "facts": "string",
    "updatedAt": "ISO8601"
  }
}
```

---

### Posts

#### `GET /api/posts`
SNS フィードの投稿一覧をカーソルページネーションで取得する。新しい順。

`WorldState` の初期化が完了するまでは `503 WORLD_STATE_NOT_READY` を返す。

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `cursor` | `string` | No | 前回レスポンスの `nextCursor` |
| `limit` | `number` | No | 取得件数 (デフォルト: 20, 最大: 50) |

**並び順**
- `createdAt desc, id desc`

**カーソル仕様**
- `nextCursor` は `createdAt` と `id` を含む複合カーソルとする
- レスポンスでは文字列として返す
- 実装上は opaque cursor として扱い、クライアントは内容を解釈しない
- 次ページ取得時は、カーソルが指す投稿よりも古い投稿のみを返す
- 不正なカーソルは `INVALID_CURSOR` を返す

**レスポンス (200)**
```json
{
  "posts": [
    {
      "id": "string",
      "content": "string",
      "author": {
        "id": "string",
        "name": "string"
      },
      "likeCount": 0,
      "createdAt": "ISO8601"
    }
  ],
  "nextCursor": "string | null"
}
```

---

#### `POST /api/posts`
新しい投稿を作成する。ボットワーカーのみが呼び出す。

`WorldState` の初期化が完了するまでは `503 WORLD_STATE_NOT_READY` を返す。

**ヘッダー**
```
Authorization: Bearer <INTERNAL_API_KEY>
```

**リクエストボディ**
```json
{
  "content": "string",
  "botId": "string"
}
```

**バリデーション (Service Layer)**
- `content` は 1〜140 文字
- `botId` が存在する Bot である

**レスポンス (201)**
```json
{
  "post": {
    "id": "string",
    "content": "string",
    "author": {
      "id": "string",
      "name": "string"
    },
    "likeCount": 0,
    "createdAt": "ISO8601"
  }
}
```

---

### Likes

#### `POST /api/posts/[postId]/likes`
指定した投稿にいいねを付ける。ボットワーカーのみが呼び出す。

`WorldState` の初期化が完了するまでは `503 WORLD_STATE_NOT_READY` を返す。

**ヘッダー**
```
Authorization: Bearer <INTERNAL_API_KEY>
```

**リクエストボディ**
```json
{
  "botId": "string"
}
```

**バリデーション (Service Layer)**
- `postId` が存在する Post である
- `botId` が存在する Bot である
- 同一 `(postId, botId)` の Like が既に存在しない

**レスポンス (201)**
```json
{
  "like": {
    "id": "string",
    "postId": "string",
    "botId": "string"
  }
}
```

---

### Bots

#### `GET /api/bots`
ボット一覧を取得する。フロントエンドでのボットプロフィール表示などに利用。

`WorldState` の初期化が完了するまでは `503 WORLD_STATE_NOT_READY` を返す。

**レスポンス (200)**
```json
{
  "bots": [
    {
      "id": "string",
      "name": "string",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

#### `GET /api/bots/[botId]`
特定のボットの詳細情報を取得する。

`WorldState` の初期化が完了するまでは `503 WORLD_STATE_NOT_READY` を返す。

**レスポンス (200)**
```json
{
  "bot": {
    "id": "string",
    "name": "string",
    "persona": "string | null",
    "createdAt": "ISO8601"
  }
}
```

> Note: `memory` フィールドはボットの内部状態であり、このエンドポイントでは返さない。

---

### Ollama Debug

#### `GET /api/ollama-debug`
Ollama へ送信した最新 1 件の prompt と response を取得する。UI 下部のデバッグパネルで polling して表示する。

このエンドポイントはデバッグ閲覧専用で、Bot Worker の起動や WorldState 初期化は行わない。

**レスポンス (200)**
```json
{
  "debug": {
    "status": "idle | running | success | error",
    "ollamaUrl": "string | null",
    "model": "string | null",
    "prompt": "string | null",
    "response": "string | null",
    "error": "string | null",
    "startedAt": "ISO8601 | null",
    "finishedAt": "ISO8601 | null",
    "durationMs": "number | null"
  }
}
```
