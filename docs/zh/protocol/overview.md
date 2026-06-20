---
description: 从 ESP32 传感器到服务器的 Raiznet 通信栈 —— 带签名 raw 的 JSON 线缆格式、逐跳传输、数据包生命周期。
---

# 协议概览

Raiznet 为去中心化作物监测定义了一个分层协议。本页描述从 ESP32 传感器到服务器的通信栈 —— 按今日实现的样子 —— 并指出协议的走向。

## 各层

```
┌──────────────────────────────────────────┐
│        应用层  (HTTP JSON API)           │
├──────────────────────────────────────────┤
│  线缆格式  (JSON + 签名 raw)             │
├──────────────────────────────────────────┤
│        传输层  (HTTP POST)               │
├──────────────────────────────────────────┤
│          身份  (Ed25519)                 │
└──────────────────────────────────────────┘
```

计划中的补充：规范的 Protobuf 编码（[ADR-001](/zh/adr/001-protobuf)）、ESP-NOW 设备间网格,以及签名事件日志的服务器间复制（[ADR-004](/zh/adr/004-raiznet-native-replication) —— 参阅 [路线图](/zh/guide/roadmap)）。

## 线缆格式

当前线缆格式是 **HTTP 之上的 JSON**,有一个关键细节：JSON 是传输信封,而 **被签名的消息是一个独立的、以竖线分隔的 ASCII 字符串**,称为 `raw`。

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

设备用其 Ed25519 密钥对该字符串的 UTF-8 字节签名,并在 JSON 块内同时发送十六进制编码的 `raw` 与 `signature`。服务器针对设备 **已注册** 的 pubkey 验证签名。完整语法见 [遥测](/zh/protocol/telemetry)。

用于规范二进制编码的 Protobuf 模式已存在于 `packages/protocol/proto/`,但尚未在线缆上使用 —— 参阅 [Protobuf 模式](/zh/reference/proto-schemas)。

## 逐跳传输

| 跳 | 协议 | 状态 |
|---|---|---|
| ESP32 → 服务器 | HTTP POST（`/v1/telemetry`,JSON） | **已实现** |
| ESP32 → ESP32（网格） | Wi-Fi 信道上的 ESP-NOW | 计划中 |
| 服务器 → 服务器 | 签名事件日志复制 | 设计阶段（[ADR-004](/zh/adr/004-raiznet-native-replication)） |

ESP32 → 服务器这一跳选择 HTTP,是因为传感器发送不频繁（参考固件默认每分钟一次读数；电池设备会休眠更久）。持久连接（WebSocket、MQTT）会白白保持打开并耗尽电池。无状态的 HTTP POST 是对不频繁的、即发即忘式摄取的正确模型。

## 数据包生命周期

今日一条读数会经历什么：

```
ESP32 读取传感器
  → 组装 raw 字符串并签名（Ed25519,设备密钥）
  → 将 raw + signature + plain/encrypted 字段包入一个 JSON 块
  → POST /v1/telemetry（批量,1..100 块）

服务器接收批次,逐块：
  → 在目的地数据库中查找设备
  → 对 raw 字节验证签名
  → 解析每个字段的处置（plain / encrypted / omit）
  → 插入 raiznet_public.db 或 raiznet_private.db
     （INSERT OR IGNORE —— 重复是幂等的）
```

复制步骤（将公共块追加到签名日志并在节点间同步）是下一个协议阶段,尚未实现。

## 标识符

每个实体由其 **Ed25519 公钥**（32 字节）标识,在 JSON 中序列化为小写十六进制。协议中没有自增整数。

| 实体 | ID 来源 | 状态 |
|---|---|---|
| 用户 | 从 BIP-39 种子派生的 pubkey | 已实现 |
| 服务器 | 首次启动时生成的 pubkey（`identity.mnemonic`） | 已实现 |
| 设备 | 配置时生成的 pubkey（硬件 TRNG） | 已实现 |
| 过滤器／目录 | 其已发布日志的 pubkey | 设计 |

## 序列号

每个设备维护一个单调递增的 `seq` 计数器：

- 为保护闪存免于磨损,参考固件以 **100 为单位的块** 预留 `seq`：仅将下一块的起点持久化到 NVS。重启后,设备从下一个预留块恢复 —— `seq` 中的小空缺是正常且预期的。
- 设备在 RAM 环形缓冲区中保留近期读数,并 **重发所有尚未以 HTTP `200` 确认的内容**。服务器按 `(device_pubkey, seq)` 去重,因此重传始终安全。
- 服务器 **不** 强制单调性 —— 拒绝旧的 seq 会破坏重连后的恢复。

在同步前从设备缓冲区中老化淘汰的读数会从网络中丢失 —— 除非所有者先通过本地 HTTP、BLE 或串口直接从设备取出。
