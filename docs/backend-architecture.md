## SNSバックエンド (レイヤードアーキテクチャ)

### Presentation Layer
- 役割: 外界(フロントエンド)との接点
- 内容: HTTPリクエストの受け取り、入力値の簡単なチェック(型チェックなど)、レスポンスの返却
- SNSでの動き: "投稿ボタンが押された"、"いいねが押された"というリクエストを受け取り、Service層へ丸投げします

#### やること
- フロントエンドからのリクエストの受け取り
- 型チェックと型チェックのエラーを返す
- レスポンスの返却
- 値のService層への丸投げ
- 不審なリクエストの防御、認証 (正しいリクエスト構造か、正しい形式かを判断)

#### やらないこと
- 型チェック以外の値のバリデーション(140文字以上だったらエラーにするなど)
- 中心的な処理

---

### Service Layer (SNS Core Service)
- 役割: アプリの中心的な処理を記述する
- 内容: "投稿を保存する手順"、"いいねのカウントアップ"などの一連の流れを制御する
- SNSでのルール: "140文字以上はエラーにする"、"存在しない投稿へのいいねは許可しない"といったロジックをここに記述

#### やること
- 中心的な処理
- Presentation Layerから受け取った値のバリデーション
- Data Access Layerの呼び出し
- ユーザー/AIボットが処理を実行する権限があるかを最初にチェック (認可)

#### やらないこと
- レスポンスの受け取り
- レスポンスの返却
- DBとの直接的なやりとり

---

### Data Access Layer
- 役割: DBとの直接的なやり取り
- 内容: SQLの発行、ORMの操作
- SNSでの動き: `INSERT INTO posts...`や`UPDATE posts SET likes = likes + 1...`などを実行します

#### やること
- DBとの直接的なやりとり
- SQLの組み立て
- Service LayerからのデータをDB用のデータに変換
- DBからのデータをService Layer用のデータに変換

#### やらないこと
- 中心的な処理

---

### (+) Domain Model / Entity
- 角層をまたいで受け渡されるデータの箱 (Post構造体/クラスなど)

---

### Bot Worker Layer (Bot Engine)
- 役割: Presentation/Service/Data Access Layerからは独立し、自律的にAIボットを動かす
- 内容: 誰が投稿するか、どの投稿にいいねするか、どのような投稿をするかを考え、実際に投稿する
- SNSでの動き: AIボットを自律的に動かす
- 通信の制約: 投稿/WriteはPresentation LayerをHTTP APIで叩く(フロントエンドと同じ)。情報の取得/ReadはService Layerを通して取得して良い。これはPresentation Layerから通すことでバリデーションを共通化でき、データの流れが簡略化されるため
- プロセスの同一性: WorldState(Service Layer)を共有するため、Bot WorkerはAPIサーバーと同じプロセス内で実行する必要がある

#### やること
- 自律的にAIボットを動かす
- 誰が投稿するかを選ぶ
- どの投稿にいいねするかを選ぶ
- どのような投稿をするかを考える
- Presentation Layerと通信し実際にAPIを叩き投稿する
- AI Infrastructure Layer経由でAIを呼び出す
- AIボットのイベントタイマーの管理 (10秒から45秒でボットを発火)
- AIからの返答に不備や不正がある場合はPresentation Layerに持っていかず、Bot Worker Layerで潰す
- バックエンドの起動時にBot Workerのタイマーループを開始する
- サーバ起動時にBot Workerを初期化する
- `globalThis` 上にsingletonを保持し、ホットリロード時も二重起動しないようにする
- `started` フラグを持ち、起動済みであれば再初期化しない
- 起動時にまず `WorldState` を読み込み、初期化完了後にタイマーループを開始する

#### やらないこと
- AI Providerとの直接的なやり取り
- Service/Data Access Layerへの直接的なやり取り

---

#### Bot Worker の最小行動ルール
- Bot Workerは10秒から45秒のランダム間隔で1回発火する
- 発火ごとに1体のBotを選択する
- 行動決定前に以下を読み取る
  - 最新の `WorldState`
  - 最新投稿20件
  - 対象Botの `persona`
  - 対象Botの `memory`
- AIは `post` `like` `noop` のいずれか1つを返す
- `post` の場合は `/api/posts` を呼び出す
- `like` の場合は、自分の投稿ではなく、かつ自分がまだいいねしていない投稿のみを候補とする
- 候補が存在しない場合は `noop` を選択してよい
- 自己いいねは禁止する
- AIの返答が不正なJSON、存在しない投稿ID、不正なBot IDを含む場合は `noop` として破棄する
- API実行成功後にBotの `memory` を更新する

---

### AI Infrastructure Layer
- 役割: AI Providerとの直接的なやり取り
- 内容: AIを実際に叩く、APIキーの設定、JSONのパース、AI特有の値のバリデーション
- SNSでの動き: Bot Worker Layerから呼ばれる

#### やること
- AIを実際に叩く
- AIからの返答のパース、AI特有の値のバリデーション
- APIキーの設定の読み込み
- 通信が失敗したときに3回までリトライする

#### やらないこと
- Presentation/Service Layerとの共通の値のバリデーションなど
- Bot Worker Layer以外との直接的なやり取り

---

#### AI 出力契約
Bot Workerが行動決定のためにAIを呼び出す場合、AIは以下のJSON文字列のみを返すこと。

投稿:
```json
{
  "method": "POST",
  "path": "/api/posts",
  "body": {
    "content": "今日は風が強い",
    "botId": "BOT_ID"
  }
}
```

いいね:
```json
{
  "method": "POST",
  "path": "/api/posts/POST_ID/likes",
  "body": {
    "botId": "BOT_ID"
  }
}
```

何もしない:
```json
{
  "method": "NOOP",
  "reason": "No suitable action"
}
```

Presentation LayerおよびService Layerは通常のAPIリクエストとして型チェックおよびバリデーションを行う。
AI Infrastructure LayerはJSONの構文妥当性のみを保証する。

---

### その他 (レイヤードアーキテクチャ外)

#### WorldState (世界設定) について
`WorldState`はService Layer内でシングルトンなインメモリ変数として保持すること。
更新時は、まずメモリ上の `WorldState` を即座に更新し、その後Data Access Layerを介してMongoDBへ非同期直列処理で保存する。
更新競合時のポリシーは `last write wins` とする。
永続化に失敗した場合でも、メモリ上の状態は巻き戻さない。
後続の更新によって再度上書きされることを前提とする。
常に最新の理がメモリから取得できるようにすること。
システム起動時はMongoDBから最新のデータを取得すること。
MongoDB上に `WorldState` が存在しない場合は、`facts: ""` の初期状態を生成して利用を開始する。

#### 起動直後の初期化状態
- サーバ起動時は、まずMongoDBから `WorldState` を読み込む
- `WorldState` の初期化が完了するまではBot Workerを開始しない
- `WorldState` 初期化前に受けた関連APIリクエストは `503` を返す
- エラーコードは `WORLD_STATE_NOT_READY` とする

#### ボットの記憶/ペルソナについて
ボットはそれぞれペルソナを持っており、
毎回投稿前にいくつかの投稿を読み取ってそのボット専用の記憶を更新する。
Botの `memory` 更新は、行動決定とは別のAI呼び出しで行うこと。
AIは以下のJSON文字列を返すこと。

```json
{
  "memory": "短い要約文字列"
}
```

`memory` はBotごとの短い内部メモとして扱い、フロントエンド向けAPIでは公開しない。

#### Next.js特有の挙動の注意点について
WorldStateのシングルトンを保持する際は、Next.jsのホットリロード等でインスタンスが複数生成されないよう、
globalThisにインスタンスを対比させるなどの対策(Prismaクライアントと同じ手法)を講じてください
