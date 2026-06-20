---
description: Raiznet 公共 API —— health、设备注册、列表、遥测查询与签名摄取,附请求与响应格式。
---

# 公共 API

公共端点在 `0.0.0.0:PUBLIC_PORT`（默认 `3000`）监听。任何人都可访问 —— 无需认证。它的设备路由仅查询 `raiznet_public.db`,绝不返回私有数据。

本页记录 **按今日实现的** API。线缆格式是 JSON；规范的 Protobuf 编码在计划中（参阅 [路线图](/zh/guide/roadmap)）。

## 基础 URL

```
http://<host>:3000
```

---

## Health

### `GET /health`

返回服务器状态和当前时间戳。

**响应 `200`**
```json
{
  "status": "ok",
  "ts": 1776819068644
}
```

---

## 设备

### `POST /v1/devices`

注册设备。参考固件在设置期间自动调用此接口（“惰性注册”）。

**请求体**（`application/json`）
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

| 字段 | 类型 | 必填 | 备注 |
|---|---|---|---|
| `id` | string（64 hex） | 是 | 设备 Ed25519 pubkey |
| `mac` | string（12 hex） | 是 | 小写,无冒号 |
| `ownerPubkey` | string（64 hex） | 是 | 所有者的用户 pubkey |
| `ownerName` | string | 否 | 用于在 `users` 中 upsert 所有者 |
| `name` | string（最小 1） | 是 | 人类可读的设备名 |
| `type` | int `0..2` | 否（默认 `0`） | `0` sensor_mains · `1` sensor_battery · `2` gateway |
| `publishTo` | int `0..2` | 否（默认 `1`） | `0` local_only · `1` public · `2` both |
| `location` | int | 否 | H3 单元索引（64 位） |
| `networks` | string[] | 否（默认 `[]`） | 网络 topic |
| `localServers` | string[] | 否（默认 `[]`） | 本地服务器地址 |
| `privacyPolicy` | object | 否 | 按字段的 `FieldPolicy`；省略的字段默认为 `plain` |
| `hardware` | object | 否 | `{ model, firmware_version }` |

**响应 `201`**
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

**响应 `409`** —— pubkey 已注册。参考固件将其视为成功。
```json
{ "error": "device_already_exists" }
```

**响应 `400`** —— 请求体未通过模式校验。
```json
{ "error": "validation_error", "details": [ /* zod issues */ ] }
```

副作用：所有者以 `name = ownerName ?? ownerPubkey.slice(0, 12)` 被 upsert 到 `users`。

---

### `GET /v1/devices`

返回公共数据库中的所有设备。尚无分页。

**响应 `200`**
```json
{ "devices": [ /* 与注册响应相同的形状 */ ] }
```

---

### `GET /v1/devices/:id`

按 pubkey（hex）返回单个设备。

**响应 `200`** —— `{ "device": { ... } }`

**响应 `404`**
```json
{ "error": "Device not found" }
```

---

### `GET /v1/devices/:id/telemetry`

返回最近的读数,按 `timestamp DESC` 排序,固定 `LIMIT 500`。尚无查询参数。

**响应 `200`**
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

每个传感器字段是以下之一：

| 形状 | 含义 |
|---|---|
| `{ "value": <number> }` | 以明文存储 |
| `{ "encrypted": "<hex>" }` | 以加密存储 —— 密文+标签,**nonce 在此不暴露** |
| `null` | 此读数中缺失（被策略省略或未测量） |

---

## 遥测摄取

### `POST /v1/telemetry`

接收 1 到 100 个已签名遥测块的批次。

**请求体**（`application/json`）
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
      "raw": "<签名的 raw 字符串的 UTF-8 字节的 hex>"
    }
  ]
}
```

::: warning seq 与 timestamp 是字符串
`seq` 和 `timestamp` 序列化为 **字符串**（uint64 安全）,而非数字。`keyVersion` 是数字。
:::

传感器字段是可选的。每个要么是 `{ "plain": <number> }`,要么是 `{ "cipher": "<hex>", "nonce": "<hex>" }`。签名是对 `raw` 字符串字节的 Ed25519（分离）签名 —— `raw` 如何构建参阅 [遥测](/zh/protocol/telemetry)。服务器针对设备 **已注册** 的 pubkey 验证,而非载荷中的那个。

**响应 `200`** —— 所有块已接受
```json
{ "accepted": 1, "errors": [] }
```

**响应 `207`** —— 至少有一个块失败
```json
{
  "accepted": 0,
  "errors": [
    { "seq": "1", "error": "Device not found: c5785e1865…a2c66a" }
  ]
}
```

按块的错误消息（确切字符串）：

| 消息 | 原因 |
|---|---|
| `Device not found: <device_id_hex>` | 设备未在此端点的数据库中注册 |
| `Invalid signature for device <device_id_hex>` | 对 `raw` 的 Ed25519 验证失败 |

**响应 `400`** —— 请求体无 `blocks`、为空,或超过 100 项。

### 摄取语义

- **重复即成功。** 重发已存储的 `(deviceId, seq)` 返回 `200` 并计入 `accepted` —— 插入使用 `INSERT OR IGNORE`。期望客户端重发所有未以 `200` 确认的内容。
- **未知设备返回 `207`,绝不是 `404`。** 请先通过 `POST /v1/devices` 注册设备。
- **无单调性检查。** 从未确认过的旧 `seq` 值可在重连后重发；去重按主键 `(device_pubkey, seq)`。
- `publishTo: 0`（local_only）的设备向公共端点提交时会被校验并计为已接受,但公共数据库中 **不存储任何内容**。
