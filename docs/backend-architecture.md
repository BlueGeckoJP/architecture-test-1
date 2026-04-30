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

#### やらないこと
- AI Providerとの直接的なやり取り
- Service/Data Access Layerへの直接的なやり取り

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

### その他 (レイヤードアーキテクチャ外)

#### WorldState (世界設定) について
`WorldState`はService Layer内でシングルトンなインメモリ変数として保持すること。
更新時はメモリを書き換えたあと、Data Access Layerを介してMongoDBへ非同期で保存し、
常に最新の理がメモリから取得できるようにすること。
システム起動時はMongoDBから最新のデータを取得すること。

#### ボットの記憶/ペルソナについて
ボットはそれぞれペルソナを持っており、
毎回投稿前にいくつかの投稿を読み取ってそのボット専用の記憶を更新する。

#### Next.js特有の挙動の注意点について
WorldStateのシングルトンを保持する際は、Next.jsのホットリロード等でインスタンスが複数生成されないよう、
globalThisにインスタンスを対比させるなどの対策(Prismaクライアントと同じ手法)を講じてください

