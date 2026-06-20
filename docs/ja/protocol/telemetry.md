---
description: Raiznetテレメトリのワイヤ契約 — JSONブロック、署名付きrawストリング、AES-256-GCM暗号化フィールド、SQLiteスキーマ、バッチ、バッファリング。
---

# テレメトリ

テレメトリはRaiznetの中核となるデータ型です。ESP32デバイスからサーバーへ流れるセンサー読み取りのストリームです。このページは **実装通りの** ワイヤ契約を仕様化します — Raiznet互換デバイスを作るために必要なものです。

## テレメトリブロック

1ブロックは、1つのデバイスのある時点での1組の読み取りです。

```json
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
  "raw": "633537383565..."
}
```

| フィールド | 型 | 注記 |
|---|---|---|
| `deviceId` | string, 64 hex | デバイスのEd25519 pubkey |
| `seq` | **string** | デバイスごとの単調カウンタ（uint64を文字列で） |
| `timestamp` | **string** | デバイスのベストエフォート時計、Unix ms（uint64を文字列で） |
| `keyVersion` | number | 暗号化フィールドの対称鍵バージョン（リファレンスファームウェアは `0` を送る） |
| センサーフィールド | object | 任意; `ph`, `ec`, `waterLevel`, `tempWater`, `tempAmbient`, `humidity` |
| `signature` | string, 128 hex | `raw` のバイトに対するEd25519デタッチ署名 |
| `raw` | string, hex | 署名されたrawストリング（下記）のUTF-8バイトのhex |

各センサーフィールドはplainまたはencryptedのいずれかです。

```json
"ph": { "plain": 6.2 }
"ph": { "cipher": "5731612f87cc0d953260cd9674bc34ffe5f3caea", "nonce": "222222222222222222222222" }
```

デバイスが測定しなかったフィールド（またはこの宛先に対する処分が `omit` のフィールド）は単に欠落します。

## 署名されたrawストリング {#raw-string}

Ed25519署名はJSONを **カバーしません** — デバイスがシリアライズ前に組み立てる、決定論的なパイプ区切りASCIIストリングをカバーします。

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

例（このストリングそのものが上のブロックの署名に対して検証されます）:

```
c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00
```

ルール:

- フィールド順は **固定** です: `ec`, `ph`, `waterLevel`, `tempAmbient`, `humidity`。欠落フィールドは完全にスキップされます。（`tempWater` はスキーマに存在しますがリファレンスファームウェアは出力しません。）
- 値は **固定小数桁** でレンダリングされます: `ec` 0、`ph` 2、`waterLevel` 0、`tempAmbient` 2、`humidity` 2。rawの `ph=6.20` はJSONでは数値 `6.2` になります — 比較は数値で行う必要があります。
- **plain** フィールドのみがrawストリングに現れます。暗号化フィールドはJSONの `cipher`/`nonce` としてのみ伝わります。
- 署名はストリングのUTF-8バイトに対するEd25519デタッチ（RFC 8032、決定論的）です。ワイヤ上、`raw` はそれらのバイトのhexエンコーディングです。
- サーバーは、ペイロードで主張された `deviceId` ではなく、デバイスの **登録済み** pubkeyに対して検証します。

::: warning rawとJSONを一致させる
今日サーバーは `raw` に対する署名のみを検証します。JSONの `plain` 値がrawストリングと一致することの厳格なクロスチェックはハードニングのロードマップの一部です — 準拠デバイスは常に両者を一致させて送る必要があります。
:::

## 暗号化フィールド（AES-256-GCM）

処分が `encrypted` のフィールドの場合:

- plaintext = 値を **float32ビッグエンディアン**（4バイト）として;
- nonce = 12バイトの乱数、フィールドごとに新規;
- `cipher` = `ciphertext ‖ tag`（16バイトのGCMタグを付加）;
- key = デバイスの32バイト対称鍵、`keyVersion` でバージョン管理。

サーバーは決して復号しません — `cipher`/`nonce` を不透明に保存します。復号は対称鍵リング（`{ version → key }`）を保持する所有者のアプリで行われます。暗号化された値はネットワーク集計に決して入りません。

## サーバー側の処理

各ブロックについて、順に:

1. **デバイス検索** を宛先データベース（`public` エンドポイント → `raiznet_public.db`、`local` エンドポイント → `raiznet_private.db`）で行う。未知のデバイス → ブロックごとのエラー `Device not found: <hex>`。
2. **署名検証** を `raw` バイトに対して登録済みpubkeyで行う。失敗 → `Invalid signature for device <hex>`。
3. **処分の解決** をデバイスのプライバシーポリシーからフィールドごとに: `per_destination[<server_pubkey_hex>] ?? default_disposition`。ポリシーにないフィールドは `omit` に解決されます。
4. **カラムへの投影**: 処分 `plain` の `plain` 値 → `_plain` カラム; 処分 `encrypted` の `cipher`/`nonce` → `_cipher`/`_nonce` カラム; デバイスが送ったものとポリシーが許すものの不一致 → NULLとして黙って保存。
5. **挿入** を `(device_pubkey, seq)` をキーとする `INSERT OR IGNORE` で行い、`received_at` をサーバーの時計で設定。行が公開／プライベートのどちらに入るかはエンドポイントとデバイスの `publishTo` に依存します — [ローカルAPI](/ja/reference/local-api) を参照してください。

## SQLiteスキーマ

両方のデータベースは同じワイドテーブルスキーマを使います。各センサーは3カラムを持ちます; `_plain` と `_cipher` の両方がNULLなら、その読み取りでフィールドが欠落していたことを意味します。

```sql
CREATE TABLE telemetry (
  device_pubkey    BLOB    NOT NULL,
  seq              INTEGER NOT NULL,
  timestamp        INTEGER NOT NULL,
  received_at      INTEGER NOT NULL,
  key_version      INTEGER,

  ph_plain         REAL,   ph_cipher         BLOB,   ph_nonce         BLOB,
  ec_plain         REAL,   ec_cipher         BLOB,   ec_nonce         BLOB,
  water_level_plain REAL,  water_level_cipher BLOB,  water_level_nonce BLOB,
  temp_water_plain REAL,   temp_water_cipher  BLOB,  temp_water_nonce  BLOB,
  temp_ambient_plain REAL, temp_ambient_cipher BLOB, temp_ambient_nonce BLOB,
  humidity_plain   REAL,   humidity_cipher    BLOB,  humidity_nonce    BLOB,

  PRIMARY KEY (device_pubkey, seq)
);
CREATE INDEX idx_telemetry_time ON telemetry (device_pubkey, timestamp);
```

固定カラムにより、JSONをパースせずに高速な集計SQLクエリが可能です。新しいセンサー型の追加にはスキーマ移行（3つの新カラム）が必要です — クエリ性能のために受け入れたトレードオフです。

## バッチング

`POST /v1/telemetry` はリクエストあたり1〜100ブロックを受け付けます。各ブロックは独立に処理されます。

- すべてのブロックがOK → `200 { "accepted": N, "errors": [] }`;
- いずれかのブロックが失敗 → `207`、ブロックごとのエラー付き（元の `seq` 文字列がエコーバックされます）;
- 不正なボディ（`blocks` なし、空、または > 100） → `400`。

**重複は成功**: `(deviceId, seq)` がすでに存在するブロックは受理済みとしてカウントされます。デバイスは `200` で確認されなかったものをすべて再送し、冪等な挿入がそれを安全にします。

## デバイス側のバッファリング

リファレンスファームウェア（`firmware/safraSense`）は:

- センサーを **60秒** ごとに読みます（`TELEMETRY_INTERVAL_MS`、デバッグに優しい既定値）;
- 最新 **50** 件の読み取りをRAMのリングバッファに保持します（`TELEMETRY_BUFFER_SIZE`）;
- `seq` を **100** 単位のブロックで予約し（`TELEMETRY_SEQ_BLOCK_SIZE`）、NVSには次ブロックの開始のみを永続化します — 再起動は `seq` に小さなギャップを残すことがありますが重複しません;
- セットアップ中に `POST /v1/devices` で自身を登録します（`409` 応答は成功としてカウント）;
- サーバーが `200` を返すまで、毎サイクル未確認の読み取りを再送します。

バッファをフラッシュに移すこと（ディープスリープと停電を生き延びるため）はロードマップにあります。

## 計画中: 正規バイナリフォーマット

[Protobufスキーマ](/ja/reference/proto-schemas) のスキーマは、イベントとテレメトリのための計画中の正規エンコーディングを定義します。JSONは現行ファームウェア世代とデバッグのためにサポートされ続けます。
