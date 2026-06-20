---
description: Raiznet公開API — health、デバイス登録、一覧、テレメトリ照会、署名付き取り込み。リクエストとレスポンスの形式付き。
---

# 公開API

公開エンドポイントは `0.0.0.0:PUBLIC_PORT`（既定 `3000`）で待ち受けます。誰でもアクセス可能で — 認証不要です。そのデバイスルートは `raiznet_public.db` のみを照会し、プライベートデータを決して返しません。

このページはAPIを **今日実装されている通りに** 記載します。ワイヤフォーマットはJSONです; 正規のProtobufエンコーディングは計画中です（[ロードマップ](/ja/guide/roadmap) を参照）。

## ベースURL

```
http://<host>:3000
```

---

## Health

### `GET /health`

サーバーの状態と現在のタイムスタンプを返します。

**レスポンス `200`**
```json
{
  "status": "ok",
  "ts": 1776819068644
}
```

---

## デバイス

### `POST /v1/devices`

デバイスを登録します。リファレンスファームウェアはセットアップ中にこれを自動的に呼びます（「遅延登録」）。

**リクエストボディ**（`application/json`）
```json
{
  "id": "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a",
  "mac": "aabbccddeeff",
  "ownerPubkey": "93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7",
  "ownerName": "Yan",
  "name": "Tower 01 - Lettuce",
  "type": 0,
  "publishTo": 2,
  "location": 613916942794711039,
  "networks": [],
  "localServers": [],
  "privacyPolicy": {
    "ph": { "default_disposition": 1, "per_destination": {} },
    "ec": { "default_disposition": 1, "per_destination": {} }
  },
  "hardware": { "model": "Safrasense Aqua ESP32 v1", "firmware_version": "0.2.0" }
}
```

| フィールド | 型 | 必須 | 注記 |
|---|---|---|---|
| `id` | string（64 hex） | はい | デバイスのEd25519 pubkey |
| `mac` | string（12 hex） | はい | 小文字、コロンなし |
| `ownerPubkey` | string（64 hex） | はい | 所有者のユーザーpubkey |
| `ownerName` | string | いいえ | `users` への所有者upsertに使用 |
| `name` | string（最小1） | はい | 人間が読めるデバイス名 |
| `type` | int `0..2` | いいえ（既定 `0`） | `0` sensor_mains · `1` sensor_battery · `2` gateway |
| `publishTo` | int `0..2` | いいえ（既定 `1`） | `0` local_only · `1` public · `2` both |
| `location` | int | いいえ | H3セルのインデックス（64ビット） |
| `networks` | string[] | いいえ（既定 `[]`） | ネットワークtopic |
| `localServers` | string[] | いいえ（既定 `[]`） | ローカルサーバーアドレス |
| `privacyPolicy` | object | いいえ | フィールドごとの `FieldPolicy`; 省略フィールドは `plain` が既定 |
| `hardware` | object | いいえ | `{ model, firmware_version }` |

**レスポンス `201`**
```json
{
  "device": {
    "id": "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a",
    "mac": "aabbccddeeff",
    "ownerPubkey": "93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7",
    "name": "Tower 01 - Lettuce",
    "type": 0,
    "location": 613916942794711039,
    "status": 0,
    "hardware": { "model": "Safrasense Aqua ESP32 v1", "firmware_version": "0.2.0" },
    "createdAt": 1776819068644
  }
}
```

**レスポンス `409`** — pubkeyは既に登録済み。リファレンスファームウェアはこれを成功として扱います。
```json
{ "error": "device_already_exists" }
```

**レスポンス `400`** — ボディがスキーマ検証に失敗。
```json
{ "error": "validation_error", "details": [ /* zod issues */ ] }
```

副作用: 所有者は `name = ownerName ?? ownerPubkey.slice(0, 12)` で `users` にupsertされます。

---

### `GET /v1/devices`

公開データベースのすべてのデバイスを返します。ページネーションはまだありません。

**レスポンス `200`**
```json
{ "devices": [ /* 登録レスポンスと同じ形 */ ] }
```

---

### `GET /v1/devices/:id`

pubkey（hex）で単一のデバイスを返します。

**レスポンス `200`** — `{ "device": { ... } }`

**レスポンス `404`**
```json
{ "error": "Device not found" }
```

---

### `GET /v1/devices/:id/telemetry`

最新の読み取りを `timestamp DESC` 順、固定 `LIMIT 500` で返します。クエリパラメータはまだありません。

**レスポンス `200`**
```json
{
  "readings": [
    {
      "seq": 1,
      "timestamp": 1700000000000,
      "receivedAt": 1700000000123,
      "ph": { "value": 6.2 },
      "ec": { "encrypted": "5731612f87cc0d953260cd9674bc34ffe5f3caea" },
      "waterLevel": { "value": 80 },
      "tempWater": null,
      "tempAmbient": { "value": 24.5 },
      "humidity": { "value": 60 }
    }
  ]
}
```

各センサーフィールドは次のいずれかです。

| 形 | 意味 |
|---|---|
| `{ "value": <number> }` | 平文で保存 |
| `{ "encrypted": "<hex>" }` | 暗号化して保存 — ciphertext+tag、**nonceはここでは公開されない** |
| `null` | この読み取りで欠落（ポリシーで省略、または未測定） |

---

## テレメトリの取り込み

### `POST /v1/telemetry`

1〜100個の署名付きテレメトリブロックのバッチを受け取ります。

**リクエストボディ**（`application/json`）
```json
{
  "blocks": [
    {
      "deviceId": "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a",
      "seq": "1",
      "timestamp": "1700000000000",
      "keyVersion": 0,
      "ec": { "plain": 1800 },
      "ph": { "plain": 6.2 },
      "waterLevel": { "plain": 80 },
      "tempAmbient": { "plain": 24.5 },
      "humidity": { "plain": 60 },
      "signature": "2199c52836b4e4a314c1a051ca1f799624e9553ff6ae768d23d0f8287f68cc8c3405dc01f105a297769ff2a9fedc045ff0afefec3f47951cae2e87f059c71c08",
      "raw": "<署名されたrawストリングのUTF-8バイトのhex>"
    }
  ]
}
```

::: warning seqとtimestampは文字列
`seq` と `timestamp` は **文字列**（uint64安全）としてシリアライズされ、数値ではありません。`keyVersion` は数値です。
:::

センサーフィールドは任意です。各々は `{ "plain": <number> }` または `{ "cipher": "<hex>", "nonce": "<hex>" }` です。署名は `raw` ストリングのバイトに対するEd25519（デタッチ）です — `raw` の構築方法は [テレメトリ](/ja/protocol/telemetry) を参照。サーバーはペイロード内のものではなく、デバイスの **登録済み** pubkeyに対して検証します。

**レスポンス `200`** — すべてのブロックが受理
```json
{ "accepted": 1, "errors": [] }
```

**レスポンス `207`** — 少なくとも1ブロックが失敗
```json
{
  "accepted": 0,
  "errors": [
    { "seq": "1", "error": "Device not found: c5785e1865…a2c66a" }
  ]
}
```

ブロックごとのエラーメッセージ（正確な文字列）:

| メッセージ | 原因 |
|---|---|
| `Device not found: <device_id_hex>` | デバイスがこのエンドポイントのデータベースに登録されていない |
| `Invalid signature for device <device_id_hex>` | `raw` に対するEd25519検証が失敗 |

**レスポンス `400`** — `blocks` がない、空、または100項目超のボディ。

### 取り込みのセマンティクス

- **重複は成功。** すでに保存済みの `(deviceId, seq)` を再送すると `200` を返し、`accepted` にカウントされます — 挿入は `INSERT OR IGNORE` を使います。クライアントは `200` で確認されなかったものをすべて再送することが期待されます。
- **未知のデバイスは `207` を返し、決して `404` ではない。** 先に `POST /v1/devices` でデバイスを登録してください。
- **単調性チェックなし。** 一度も確認されなかった古い `seq` 値は再接続後に再送できます; 重複排除は主キー `(device_pubkey, seq)` によります。
- `publishTo: 0`（local_only）のデバイスが公開エンドポイントにポストすると、検証され受理としてカウントされますが、公開データベースには **何も保存されません**。
