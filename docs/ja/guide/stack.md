---
description: Raiznetの技術スタック — 今日はNode.js、Fastify、SQLite、Ed25519、VitePress。計画中はProtobuf、H3、Roaring Bitmaps。そしてSQLiteの役割。
---

# 技術スタック

## 現在のスタック（実装済み）

| 層 | 技術 | バージョン |
|---|---|---|
| ランタイム | Node.js | 24 LTS |
| 言語 | TypeScript（strict） | 5.x |
| HTTP | Fastify | 5.x |
| SQLストレージ | better-sqlite3 | 11.x |
| バリデーション | zod | 3.x |
| 暗号（Ed25519） | hypercore-crypto（libsodium） | 3.x |
| BIP-39シード | @scure/bip39 | 1.x |
| ロガー | pino | 9.x |
| モノレポ | pnpm workspaces | 9.x |
| テスト | vitest | 3.x |
| ドキュメント | VitePress | 1.x |
| ファームウェア | PlatformIO + Arduinoフレームワーク（ESP32） | — |

## 計画中／評価中

| 層 | 技術 | 状態 |
|---|---|---|
| 正規シリアライズ | Protobuf（Nodeは `@bufbuild/protobuf`、ESP32は `nanopb`） | スキーマは存在、codegenは未稼働 — [ADR-001](/ja/adr/001-protobuf) を参照 |
| ジオロケーション | h3-js | 地図機能とともに計画中 |
| フィルターの集合演算 | Roaring Bitmaps | フィルターとともに計画中 |
| デスクトップアプリ | Tauri 2.x | 将来フェーズ |
| ノード複製 | 署名付きイベントログ + ピア同期 | 設計段階 — [ロードマップ](/ja/guide/roadmap) を参照 |

## リポジトリ構成

```
raiznet/
├── apps/
│   ├── server/          # Fastifyノード（公開 + ローカルエンドポイント）
│   ├── cli/             # 運用・デバッグツール
│   ├── website/         # raiznet.com ランディングページ
│   ├── dashboard/       # Webダッシュボード
│   └── prototype/       # UI設計キャンバス（React + Vite）
├── packages/
│   ├── protocol/        # .proto スキーマ（正規フォーマット、計画中）
│   ├── crypto/          # 鍵導出、署名、AES-256-GCM
│   └── core/            # 共有抽象
├── firmware/
│   ├── safraSense/      # リファレンスESP32ファームウェア（完全なセンサー）
│   └── esp32-sensor/    # 最小サンプル
└── docs/                # このサイト
```

AratekiのSafraSenseハードウェアの本番ファームウェアは別のリポジトリにあります。このリポジトリのファームウェアは、プロトコルのオープンなリファレンス実装です。

## 設計上の決定

**議論なしに導入しないもの:**
- NestJS — 重すぎる
- Express — Fastifyに対して時代遅れ
- ORM — better-sqlite3を直接
- Redis — この段階では正当化されない
- 開発でのDocker — ローカルで動く
- Kafka — 不要

## SQLiteの役割

今日、SQLiteはノードの主要なローカルストレージです。取り込みはブロックを検証し、`raiznet_public.db` / `raiznet_private.db` に直接書き込みます。

設計上のゴールは、ソースオブトゥルースを **署名付き追記専用イベントログ** にし、SQLiteをログの再生で削除・再構築できる派生インデックスにすることです（[ADR-002](/ja/adr/002-sqlite-cache) を参照）。ワイドテーブルのスキーマはすでにそのために形作られています。

- 高速な集計クエリ（センサーごとの固定 `REAL` カラム）
- ORMなし — 型付き結果の直接SQL
- 新しいセンサー型はフィールドごとに3カラム（`_plain`, `_cipher`, `_nonce`）の追加が必要
