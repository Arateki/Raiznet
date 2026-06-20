---
description: Raiznetサーバーのエラーリファレンス — HTTPステータスコード、トップレベルのエラー形状、ブロックごとのテレメトリエラー、型付きエラークラス。
---

# エラーリファレンス

このページは、サーバーが **今日** 返すエラーを正確な形状とともに列挙します — これらは互換性契約の一部です（リファレンスファームウェアの一部はこれらに依存します）。

## HTTPステータスコード

| ステータス | いつ |
|---|---|
| `200` | リクエストが完全に成功 — すべてのブロックが受理されたテレメトリバッチを含む（重複は受理としてカウント） |
| `201` | デバイス登録済み |
| `207` | 少なくとも1ブロックが失敗したテレメトリバッチ — `errors[]` を確認 |
| `400` | リクエストボディがスキーマ検証に失敗 |
| `404` | 未知のデバイスに対する `GET /v1/devices/:id` |
| `409` | 既登録のpubkeyに対する `POST /v1/devices` |
| `500` | 予期しないサーバーエラー |

::: warning 統合者がよく間違える2つの挙動
- **未知のデバイス** のテレメトリは、ブロックごとのエラー付きで `207` を返します — 決して `404` ではありません。
- **重複ブロック**（同じ `deviceId` + `seq`）は `200` を返し、受理としてカウントされます。重複は成功であり、エラーではありません。
:::

## トップレベルのエラー形状

**検証失敗**（`400`）— `details` には生のZod issuesが入ります。

```json
{
  "error": "validation_error",
  "details": [
    { "code": "too_small", "path": ["name"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

**デバイスは既に存在**（`409`）:

```json
{ "error": "device_already_exists" }
```

**デバイスが見つからない**（`404`、`GET /v1/devices/:id`）:

```json
{ "error": "Device not found" }
```

## ブロックごとのテレメトリエラー（`207`）

失敗した各ブロックは、元の `seq`（文字列）と人間が読めるメッセージとともに `errors[]` に現れます。

```json
{
  "accepted": 0,
  "errors": [
    { "seq": "42", "error": "Invalid signature for device c5785e…a2c66a" }
  ]
}
```

| メッセージのテンプレート | 意味 |
|---|---|
| `Device not found: <device_id_hex>` | デバイスのpubkeyがこのエンドポイントのデータベースに登録されていない |
| `Invalid signature for device <device_id_hex>` | `raw` バイトに対する `signature` のEd25519検証が登録済みpubkeyに対して失敗 |

## サーバーコード内の型付きエラー

ドメインエラーは `apps/server/src/domain/errors.ts` の型付きクラスです。HTTP層はそれらをブロックごとのエントリにマップします; それ以外は `500` になります。

```ts
export class InvalidSignatureError extends Error {
  readonly code = 'INVALID_SIGNATURE'
  constructor(deviceId: string) {
    super(`Invalid signature for device ${deviceId}`)
  }
}

export class DeviceNotFoundError extends Error {
  readonly code = 'DEVICE_NOT_FOUND'
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`)
  }
}
```

`code` プロパティは内部用です; ワイヤは `message` を運びます。すべてのエラーに対する安定した機械可読コードの語彙はロードマップにありますが、上の文字列が現在の契約です。
