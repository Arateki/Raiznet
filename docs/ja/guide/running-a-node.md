---
description: Node.jsでRaiznetノードをインストール・設定・実行する方法 — 初回起動、BIP-39アイデンティティ、ヘルスチェック、ノードを安全に公開する方法。
---

# ノードを実行する

## 要件

- Node.js 24 LTS
- pnpm 9+

## インストール

```bash
git clone https://github.com/arateki/raiznet
cd raiznet
pnpm install
pnpm build
```

## 設定

サンプルの環境ファイルをコピーし、必要に応じて調整します。

```bash
cp apps/server/.env.example apps/server/.env
```

| 変数 | 既定値 | 説明 |
|---|---|---|
| `PUBLIC_PORT` | `3000` | 公開エンドポイントのポート（バインド `0.0.0.0`） |
| `LOCAL_PORT` | `3001` | ローカル認証エンドポイントのポート（バインド `127.0.0.1`） |
| `DATA_DIR` | `./data` | SQLiteデータベースとサーバーアイデンティティのディレクトリ |
| `LOG_LEVEL` | `info` | Pinoのログレベル（`trace`, `debug`, `info`, `warn`, `error`） |
| `NODE_ENV` | `development` | 環境 |

## 初回起動

```bash
cd apps/server
node dist/index.js
```

初回起動時、サーバーは次を行います。
1. 新しいBIP-39シードフレーズからEd25519鍵ペアを生成します
2. シードを `DATA_DIR/identity.mnemonic` に書き込みます（権限 `0600`）
3. `DATA_DIR` に `raiznet_public.db` と `raiznet_private.db` を作成します
4. 両方のポートで待ち受けを開始します
5. サーバーの公開鍵をログに記録します

```
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

::: warning シードフレーズをバックアップしてください
ファイル `DATA_DIR/identity.mnemonic` には、サーバーのアイデンティティを制御する12語のシードフレーズが含まれます。バックアップしてください。失うと、ノードのアイデンティティ（そのpubkey）が失われ — ネットワークが入った後は、NetworkManifest、フィルター、カタログへの署名能力も失われます。
:::

## ヘルスチェック

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":1776819068644}
```

## ノードを公開する

公開エンドポイント（`:3000`）は公開しても安全です — 公開データのみを提供します。ローカルエンドポイント（`:3001`）には **まだ認証がありません**。`127.0.0.1` にバインドされ、外部から到達不能のままでなければなりません。リモートアクセスにはTailscaleまたはVPNを使用してください。[ローカルAPI](/ja/reference/local-api) を参照してください。

## 開発モード（watch）

```bash
pnpm --filter @raiznet/server dev
```

`node --watch` を使用し、ファイル変更時に再起動します。先にビルド済みの `dist/` が必要です。
