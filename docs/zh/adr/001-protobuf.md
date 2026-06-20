---
description: ADR 001 —— 作为 Raiznet 规范线缆格式的 Protobuf,在 Node.js 与 ESP32 间共享；已接受,实现延后（今日线缆为 JSON）。
---

# ADR 001 —— 作为线缆格式的 Protobuf

**状态：** 已接受 —— 实现延后  
**日期：** 2026-04

::: info 更新（2026-06）
生产中的线缆格式是带 [签名 raw 字符串](/zh/protocol/telemetry#raw-string) 的 **JSON**；`.proto` 模式已存在,但代码生成未启用。Protobuf 仍是目标规范格式,将与事件日志一起落地 —— JSON 将继续为当前固件世代提供支持。
:::

## 背景

Raiznet 需要一种在 ESP32 固件（C++,内存受限）和 Node.js 服务器（TypeScript）上都能工作的序列化格式。该格式必须紧凑、受模式强制,并在两个差异很大的运行时中可维护。

评估的候选：

| 格式 | Node.js | ESP32 | 模式 | 二进制 |
|---|---|---|---|---|
| JSON | 原生 | ArduinoJson | 无 | 无 |
| MessagePack | `msgpackr` | `msgpack-c` | 无 | 有 |
| CBOR | `cbor-x` | `tinycbor` | 无 | 有 |
| Protobuf | `@bufbuild/protobuf` | `nanopb` | 有 | 有 |

## 决定

**Protobuf（Protocol Buffers v3）**,配合：
- Node.js 上的 `@bufbuild/protobuf` + `@bufbuild/protoc-gen-es`
- ESP32 上的 `nanopb`

`.proto` 模式位于 `packages/protocol/proto/`,在两个运行时间共享。TypeScript 代码在构建时通过 `protoc-gen-es` 生成。

## 理由

- **共享模式**：一个 `.proto` 文件即唯一真相来源。对模式的更改反映在双方生成的代码中 —— 无需手工维护结构体。
- **二进制紧凑性**：比 JSON 更小的数据包,对通过 Wi-Fi 发送的电池供电 ESP32 很重要。
- **类型安全**：生成的 TypeScript 类型精确,消除手动解析的需要。
- **nanopb 的成熟度**：面向嵌入式 C 的成熟 Protobuf 实现,无动态内存分配,在 ESP32 约束内工作。
- **字段号稳定性**：Protobuf 的前向／后向兼容保证允许在不破坏运行旧固件的既有节点的情况下演进模式。

## 取舍

- Protobuf 不可人读。调试原始数据包需要解码器。
- nanopb 需要在编译时为重复字段和字符串字段定义最大大小。
- 添加新传感器类型需要更新 `.proto` 文件、重新生成代码,并部署服务器和固件双方的更新。

## 后果

- 规范二进制编码（ESP32 → 服务器,节点 → 事件日志）将使用 Protobuf。
- HTTP API 为浏览器、CLI 和当前固件兼容性保留 JSON。
- `packages/protocol` 包拥有所有 `.proto` 文件和（未来的）生成代码。没有其他包定义自己的线缆格式。
