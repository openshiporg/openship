![openship](https://github.com/user-attachments/assets/75cba728-571e-4f6c-9c09-f3473d0f68b9)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenship-org%2Fopenship%2F&stores=[{"type"%3A"postgres"}])

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/openship)

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

Openship は、販売を行う場所とフルフィルメントを行う場所をつなぐ注文ルーターです。販売チャネルからフルフィルメントパートナーへ注文を自動的にルーティングし、注文フローを完全に制御できるようにします。

## デモ

<a href="https://os.openship.org"><img src="https://github.com/user-attachments/assets/2e3bf74b-74f3-4883-a267-8222044469e5" alt="Openship Demo" width="600"></a>

| | |
|---|---|
| **ダッシュボード** | [os.openship.org](https://os.openship.org) |
| **ユーザー** | `os@openship.org` |
| **パスワード** | `k54f5JaPI1gXze9IWD0%f!Sg@YQ*@ACyBv2` |

[YouTube で完全版デモを見る →](https://youtu.be/C55wxCMAX8E)

[詳細を見る →](https://openship.org/products/openship)

## Openfront エコシステム

Openship は、Shopify、Toast、MindBody などのプロプライエタリなコマースプラットフォームに代わる、モダンで柔軟な選択肢を提供するために設計されたオープンソースツール群の一部です。

- **[Openfront E-commerce](https://github.com/openshiporg/openfront)**：78 以上のデータモデル、マルチリージョン対応、高度なギフトカードおよび請求システムを備えた包括的なヘッドレス E コマースプラットフォームです。
- **[Openfront Restaurant](https://github.com/openshiporg/openfront-restaurant)**：POS、KDS、テーブル管理を備えた飲食業界向けの専用プラットフォームです。
- **Openship**：これらのプラットフォーム（およびその他のプラットフォーム）をフルフィルメントパートナーにつなぐ中央注文ルーターです。

私たちのビジョンは、企業が自社のデータと顧客体験を完全に所有できる、モジュール式で高性能なコマースインフラストラクチャを構築することです。

## コアコンセプト

### ショップ
ショップは、顧客が注文するオンラインストア（例：Shopify、WooCommerce、eBay、Amazon）を表します。接続すると、新しい注文を Openship にルーティングして履行できます。

### チャネル
チャネルは、注文をルーティングして履行できる宛先を表します。チャネルには、仕入先の Shopify ショップや 3PL フルフィルメントサービスのような既存のプラットフォームを指定できます。また、Google Sheet に行を追加したり、注文の詳細を記載したメールを送信したりするような、非常にシンプルなものでもかまいません。

### リンク
リンクは、ショップとチャネルの接続を表します。リンクを作成すると、新しいショップ注文がリンク先のチャネルに転送され、履行されます。

### マッチ
フルフィルメントプロセスをより細かく制御するため、商品レベルでマッチを作成できます。マッチは、ショップの商品とチャネルの商品との接続を表します。ショップ商品とチャネル商品の間にマッチを作成すると、Openship はその注文を自動的に処理します。

## アーキテクチャ

### 技術スタック
- **フロントエンド**：App Router を使用する Next.js 15
- **バックエンド**：GraphQL API を備えた KeystoneJS 6
- **データベース**：Prisma ORM を使用する PostgreSQL
- **スタイリング**：Tailwind CSS と shadcn/ui コンポーネント
- **認証**：ロールベースの権限を備えたセッションベース認証

### アプリケーション構成
```
openship/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Admin interface
│   ├── (storefront)/      # Customer-facing pages
│   └── api/              # API endpoints and webhooks
├── features/
│   ├── keystone/         # Backend models and GraphQL schema
│   ├── platform/         # Admin platform components
│   ├── storefront/       # Frontend components and screens
│   └── integrations/     # Shop and channel integrations
└── components/           # Shared UI components
```

## はじめに

### 前提条件
- Node.js 20+
- PostgreSQL データベース
- npm、yarn、pnpm、または bun

### セットアップ

1. **クローンして依存関係をインストールします：**
   ```bash
   git clone https://github.com/openship-org/openship.git
   cd openship
   npm install
   ```

2. **環境変数を設定します：**
   ```bash
   cp .env.example .env
   ```

   使用する設定で `.env` を更新します：
   ```env
   # Required - Database Connection
   DATABASE_URL="postgresql://username:password@localhost:5432/openship"

   # Required - Session Security (must be at least 32 characters)
   SESSION_SECRET="your-very-long-session-secret-key-here-32-chars-minimum"

   # Optional - SMTP configuration for email notifications
   SMTP_FROM="no-reply@yourdomain.com"
   SMTP_HOST="your-smtp-host"
   SMTP_PASSWORD="your-smtp-password"
   SMTP_PORT="587"
   SMTP_USER="your-smtp-user"

   # Optional - Shop Integrations
   SHOPIFY_APP_KEY="your-shopify-app-key"
   SHOPIFY_APP_SECRET="your-shopify-app-secret"

   # Optional - Channel Integrations
   SHIPPO_API_KEY="shippo_test_..."
   ```

3. **開発サーバーを起動します：**
   ```bash
   npm run dev
   ```

   このコマンドは次の処理を実行します：
   - KeystoneJS schema を構築する
   - データベースマイグレーションを実行する
   - Turbopack を使用して Next.js 開発サーバーを起動する

4. **アプリケーションにアクセスします：**
   - **ダッシュボード**：[http://localhost:3000](http://localhost:3000) - 注文ルーティングインターフェース
   - **GraphQL API**：[http://localhost:3000/api/graphql](http://localhost:3000/api/graphql) - インタラクティブな API エクスプローラー

5. **最初の管理者ユーザーを作成します：**
   初めてダッシュボードにアクセスすると、`/init` で管理者ユーザーアカウントを作成するよう求められます

6. **最初のショップとチャネルを接続します：**
   管理者アカウントを作成したら、まずショップ（注文元）とチャネル（注文の履行先）を接続します

## 開発コマンド

- `npm run dev` - Keystone を構築し、マイグレーションを実行して、Next.js 開発サーバーを起動する
- `npm run build` - Keystone を構築し、マイグレーションを実行して、本番環境向けに Next.js をビルドする
- `npm run migrate:gen` - 新しいデータベースマイグレーションを生成して適用する
- `npm run migrate` - 既存のマイグレーションをデータベースにデプロイする
- `npm run lint` - ESLint を実行する

## 主な機能

### 注文ルーティング
- ショップからチャネルへの注文の自動ルーティング
- マルチチャネルフルフィルメントのサポート
- リアルタイムの注文同期
- 柔軟なルーティングルールと条件

### ショップ連携
- **Shopify**：注文をインポートするためのネイティブ連携
- **WooCommerce**：WordPress E コマースのサポート
- **カスタム API**：カスタムショップコネクターの構築
- **Webhook サポート**：リアルタイムの注文通知

### チャネル連携
- **Shopify**：仕入先の Shopify ストアへ注文をルーティング
- **3PL サービス**：フルフィルメントパートナーとの連携
- **カスタムチャネル**：メール、Google Sheets、Webhook
- **ドロップシッピング**：仕入先との直接連携

### 商品マッチング
- ショップとチャネル間のインテリジェントな商品マッチング
- 一括マッチング機能
- バリアントレベルのマッチングをサポート
- 柔軟なマッチングルールと例外

### 注文管理
- リアルタイムの注文追跡とステータス更新
- 自動化されたフルフィルメントワークフロー
- エラー処理と再試行メカニズム
- 包括的な注文履歴と分析

## ドキュメント

包括的な技術ドキュメントについては、[docs.openship.org/docs/openship/ecommerce](https://docs.openship.org/docs/openship/ecommerce) を参照してください。以下の内容が含まれています：
- 完全な連携ガイド
- API リファレンスと操作
- カスタムショップおよびチャネルの開発
- Webhook の設定とセキュリティ
- 高度なルーティング設定

## デプロイ

### 本番環境へのデプロイ
Openship は本番環境で利用可能で、次の環境にデプロイできます：

- **Vercel**：上のボタンからワンクリックでデプロイ
- **Railway**：上のボタンからワンクリックでデプロイ
- **Docker**：同梱の Dockerfile を使用したコンテナ化デプロイ
- **セルフホスト**：任意の Node.js ホスティング環境にデプロイ

### スケーリングに関する考慮事項
- 大量の注文処理に向けたデータベースの最適化
- 注文ルーティングのためのバックグラウンドジョブ処理
- Webhook の信頼性と再試行メカニズム
- 失敗した注文の監視とアラート

## コントリビューション

コントリビューションを歓迎します！以下の詳細については、コントリビューションガイドラインを参照してください：
- コード標準と規約
- テスト要件
- Pull Request のプロセス
- Issue の報告

## サポート

- **ドキュメント**：[docs.openship.org/docs/openship/ecommerce](https://docs.openship.org/docs/openship/ecommerce) で包括的なドキュメントを確認してください
- **Issue**：GitHub Issues でバグや機能リクエストを報告してください
- **コミュニティ**：コミュニティディスカッションに参加してください
- **エンタープライズ**：エンタープライズサポートおよびカスタム連携についてはお問い合わせください

---

[next-keystone-starter](https://github.com/junaid33/next-keystone-starter) を基盤として構築されています
