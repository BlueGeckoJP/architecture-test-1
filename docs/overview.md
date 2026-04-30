## このプロジェクトの目的
- 人間側の認知負荷を最大限抑えられる人間/AIの責務の境界線を調べる

## 人間とAIの境界
- 人間がアーキテクチャや何を実装したいかを決める
- AIがどう実装するか(コードやロジック)を決める

## このプロジェクトで作るもの(アプリケーション)
- AI駆動のSNS型世界シミュレーション

- ユーザーが言った発言が世界で起きたこと、世界の理になる
- ユーザーの発言(大きな事実)からAIボットが勝手に小さな事実を無数に生み出し、次のAIボットたちの世界の前提として組み込まれる
- ユーザーの発言はSNS上には投稿されない。SNSに直接投稿できるのはAIボットのみ

## 技術的なこと
- このプロジェクトはローカルで動かすことを前提とする
- 世界設定はMongoDB上で

## 技術スタック
- フレームワーク: Next.js, React, TailwindCSS
- DBMS: MongoDB on Docker
- ORM: Prisma
- AI Provider: Ollama
- パッケージマネージャ: bun

## ディレクトリ構造
```
app/ # Presentation Layer (Next.js App Router)
services/ # Service Layer (SNS Core)
repositories/ # Data Access Layer (Prisma)
workers/ # Bot Worker Layer (Bot Engine)
infrastructure/ # AI Infrastructure Layer (AI/Ollama Client)
domain/ # (+) Domain Models / Entities / Types (共通の型/構造体/クラス定義)
components/ # UI共通コンポーネント
lib/ # Shared Utilities
prisma/ # PrismaのDB設計図
```

## コード制約
- コメントは英語で書くこと
- それぞれのarchitecture.mdに従うこと
- UNIX原則に従うこと
- .tsはcamelCaseが基本
- .tsxはコンポーネント名に合わせる 基本PascalCase (コンポーネント名がPostならPost.tsx)

