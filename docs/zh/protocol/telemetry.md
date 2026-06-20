---
description: Raiznet 遥测的线缆契约 —— JSON 块、签名的 raw 字符串、AES-256-GCM 加密字段、SQLite 模式、批处理与缓冲。
---

# 遥测

遥测是 Raiznet 的核心数据类型：从 ESP32 设备流向服务器的传感器读数流。本页规范了 **按实现的** 线缆契约 —— 这是构建兼容 Raiznet 的设备所需要的。

## 遥测块

一个块是某设备在某一时刻的一组读数：

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

| 字段 | 类型 | 备注 |
|---|---|---|
| `deviceId` | string,64 hex | 设备的 Ed25519 pubkey |
| `seq` | **string** | 每设备的单调计数器（uint64 以字符串表示） |
| `timestamp` | **string** | 设备尽力而为的时钟,Unix 毫秒（uint64 以字符串表示） |
| `keyVersion` | number | 加密字段的对称密钥版本（参考固件发送 `0`） |
| 传感器字段 | object | 可选；`ph`、`ec`、`waterLevel`、`tempWater`、`tempAmbient`、`humidity` |
| `signature` | string,128 hex | 对 `raw` 字节的 Ed25519 分离签名 |
| `raw` | string,hex | 签名的 raw 字符串（见下）UTF-8 字节的十六进制 |

每个传感器字段要么是 plain,要么是 encrypted：

```json
"ph": { "plain": 6.2 }
"ph": { "cipher": "5731612f87cc0d953260cd9674bc34ffe5f3caea", "nonce": "222222222222222222222222" }
```

设备未测量的字段（或对此目的地的处置为 `omit` 的字段）会直接缺失。

## 签名的 raw 字符串 {#raw-string}

Ed25519 签名 **不** 覆盖 JSON —— 它覆盖设备在序列化前组装的、确定性的、以竖线分隔的 ASCII 字符串：

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

示例（这个确切的字符串可针对上面块中的签名验证通过）：

```
c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00
```

规则：

- 字段顺序是 **固定的**：`ec`、`ph`、`waterLevel`、`tempAmbient`、`humidity`。缺失字段被完全跳过。（`tempWater` 存在于模式中,但参考固件不发出。）
- 值以 **固定小数位** 呈现：`ec` 0、`ph` 2、`waterLevel` 0、`tempAmbient` 2、`humidity` 2。注意 raw 中的 `ph=6.20` 在 JSON 中变为数字 `6.2` —— 比较必须按数值进行。
- 只有 **plain** 字段出现在 raw 字符串中。加密字段仅作为 JSON 中的 `cipher`/`nonce` 传输。
- 签名是对字符串 UTF-8 字节的 Ed25519 分离签名（RFC 8032,确定性）。在线缆上,`raw` 是这些字节的十六进制编码。
- 服务器针对设备 **已注册** 的 pubkey 验证,而非载荷中声称的 `deviceId`。

::: warning 保持 raw 与 JSON 一致
今日服务器只验证对 `raw` 的签名。对 JSON `plain` 值与 raw 字符串相符的严格交叉校验是加固路线图的一部分 —— 合规设备必须始终发送两者一致。
:::

## 加密字段（AES-256-GCM）

对于处置为 `encrypted` 的字段：

- plaintext = 值以 **float32 大端**（4 字节）表示；
- nonce = 12 个随机字节,每字段新生成；
- `cipher` = `ciphertext ‖ tag`（附加 16 字节的 GCM 标签）；
- key = 设备的 32 字节对称密钥,由 `keyVersion` 版本化。

服务器从不解密 —— 它以不透明方式存储 `cipher`/`nonce`。解密发生在所有者的应用中,后者持有对称密钥环（`{ version → key }`）。加密值从不进入网络聚合。

## 服务器端处理

对每个块,按顺序：

1. **设备查找** 于目的地数据库（`public` 端点 → `raiznet_public.db`,`local` 端点 → `raiznet_private.db`）。未知设备 → 按块错误 `Device not found: <hex>`。
2. **签名验证** 对 `raw` 字节,针对已注册 pubkey。失败 → `Invalid signature for device <hex>`。
3. **处置解析** 按字段,来自设备的隐私策略：`per_destination[<server_pubkey_hex>] ?? default_disposition`。策略中缺失的字段解析为 `omit`。
4. **投影到列**：处置为 `plain` 的 `plain` 值 → `_plain` 列；处置为 `encrypted` 的 `cipher`/`nonce` → `_cipher`/`_nonce` 列；设备所发与策略所允许之间的任何不匹配 → 静默存为 NULL。
5. **插入** 以 `(device_pubkey, seq)` 为键的 `INSERT OR IGNORE`,`received_at` 由服务器时钟设置。行进入公共还是私有数据库取决于端点与设备的 `publishTo` —— 参阅 [本地 API](/zh/reference/local-api)。

## SQLite 模式

两个数据库都使用相同的宽表模式。每个传感器有三列；`_plain` 与 `_cipher` 都为 NULL 表示该读数中字段缺失。

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

固定列允许无需解析 JSON 的快速聚合 SQL 查询。添加新传感器类型需要模式迁移（三个新列）—— 这是为查询性能而接受的取舍。

## 批处理

`POST /v1/telemetry` 每次请求接受 1 到 100 个块。每个块独立处理：

- 所有块 OK → `200 { "accepted": N, "errors": [] }`；
- 任一块失败 → `207`,带按块错误（原始的 `seq` 字符串会回显）；
- 格式错误的请求体（无 `blocks`、为空,或 > 100） → `400`。

**重复即成功**：`(deviceId, seq)` 已存在的块计为已接受。设备会重发所有未以 `200` 确认的内容,而幂等插入使之安全。

## 设备端缓冲

参考固件（`firmware/safraSense`）：

- 每 **60 秒** 读取传感器（`TELEMETRY_INTERVAL_MS`,便于调试的默认值）；
- 在 RAM 环形缓冲区中保留最近 **50** 条读数（`TELEMETRY_BUFFER_SIZE`）；
- 以 **100** 为单位的块预留 `seq`（`TELEMETRY_SEQ_BLOCK_SIZE`）,仅将下一块起点持久化到 NVS —— 重启可能在 `seq` 中留下小空缺但绝不重复；
- 在设置期间通过 `POST /v1/devices` 注册自身（`409` 响应计为成功）；
- 每个周期重发未确认的读数,直到服务器返回 `200`。

将缓冲区移至闪存（以在深度睡眠和断电中存活）在路线图上。

## 计划中：规范二进制格式

[Protobuf 模式](/zh/reference/proto-schemas) 中的模式定义了用于事件与遥测的、计划中的规范编码。JSON 将继续为当前固件世代和调试提供支持。
