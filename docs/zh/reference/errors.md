---
description: Raiznet 服务器错误参考 —— HTTP 状态码、顶层错误形状、按块的遥测错误与类型化错误类。
---

# 错误参考

本页列出服务器 **今日** 返回的错误及其确切形状 —— 它们是兼容性契约的一部分（参考固件依赖其中一些）。

## HTTP 状态码

| 状态 | 何时 |
|---|---|
| `200` | 请求完全成功 —— 包括每个块都被接受的遥测批次（重复计为已接受） |
| `201` | 设备已注册 |
| `207` | 至少有一个块失败的遥测批次 —— 检查 `errors[]` |
| `400` | 请求体未通过模式校验 |
| `404` | 对未知设备的 `GET /v1/devices/:id` |
| `409` | 对已注册 pubkey 的 `POST /v1/devices` |
| `500` | 意外的服务器错误 |

::: warning 集成者常弄错的两种行为
- **未知设备** 的遥测返回 `207`,带按块错误 —— 绝不是 `404`。
- **重复块**（相同的 `deviceId` + `seq`）返回 `200` 并计为已接受。重复是成功,不是错误。
:::

## 顶层错误形状

**校验失败**（`400`）—— `details` 包含原始的 Zod issues：

```json
{
  "error": "validation_error",
  "details": [
    { "code": "too_small", "path": ["name"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

**设备已存在**（`409`）：

```json
{ "error": "device_already_exists" }
```

**设备未找到**（`404`,`GET /v1/devices/:id`）：

```json
{ "error": "Device not found" }
```

## 按块的遥测错误（`207`）

每个失败的块都会出现在 `errors[]` 中,带其原始的 `seq`（字符串）和人类可读的消息：

```json
{
  "accepted": 0,
  "errors": [
    { "seq": "42", "error": "Invalid signature for device c5785e…a2c66a" }
  ]
}
```

| 消息模板 | 含义 |
|---|---|
| `Device not found: <device_id_hex>` | 设备 pubkey 未在此端点的数据库中注册 |
| `Invalid signature for device <device_id_hex>` | 对 `raw` 字节的 `signature` 的 Ed25519 验证针对已注册 pubkey 失败 |

## 服务器代码中的类型化错误

域错误是 `apps/server/src/domain/errors.ts` 中的类型化类。HTTP 层将它们映射为按块条目；其他任何情况都成为 `500`：

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

`code` 属性是内部的；线缆携带 `message`。为所有错误提供稳定的机器可读代码词汇表在路线图上,但上面的字符串是当前的契约。
