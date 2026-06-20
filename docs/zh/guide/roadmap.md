---
description: Raiznet 的诚实地图 —— 今日已实现、设计阶段与未来的内容，从遥测摄取到节点间复制。
---

# 路线图

Raiznet 仍处于 1.0 之前。本页是关于已有内容与已设计内容的诚实地图 —— 本文档的其余每一页都会相应标注设计阶段的功能。

## 今日已实现

- **签名遥测摄取** —— 对确定性 [raw 字符串](/zh/protocol/telemetry#raw-string) 的 Ed25519 签名，针对已注册的设备密钥进行验证；幂等的批量摄取。
- **设备注册** —— 由固件进行惰性（lazy）注册的 `POST /v1/devices`。
- **按字段隐私** —— `plain` / `encrypted` / `omit` 处置，带按目的地覆盖，在摄取时应用（[隐私模型](/zh/protocol/privacy)）。
- **双端点、双数据库** —— 公共（`:3000`、`raiznet_public.db`）与本地（`:3001`、`raiznet_private.db`）在单进程中，在数据库层隔离。
- **节点身份** —— `DATA_DIR/identity.mnemonic` 中的 BIP-39 助记词，确定性派生的 Ed25519 密钥对。
- **参考固件** —— ESP32 强制门户配置、BIP-39 所有者身份、考虑闪存磨损的 `seq` 管理、直至确认的重传。

## 设计阶段

这些内容（在本文档与 ADR 中）已有规范但尚未实现。细节可能变化：

- **Rust 节点（`raiznetd`）** —— 行为对等的节点重新实现，作为单一静态二进制，面向无运行时依赖的极小 ARM 主板。
- **签名事件日志** —— 每个节点的仅追加、哈希链式日志作为真相来源，SQLite 由其重建为派生索引（[ADR-002](/zh/adr/002-sqlite-cache)）。
- **节点间复制** ([ADR-004](/zh/adr/004-raiznet-native-replication)) —— sync v1：已配置对等节点间的 HTTP 拉取（LAN、VPN、公共 IP）；sync v2：构建于既有 Rust P2P 基础之上的 pubkey 拨号传输（iroh 为主要候选，在采用前于真实的乡村 4G/CGNAT 链路上验证），使用社区运行的中继 —— 绝非特权网关。
- **网络、过滤器与目录** —— topic、`NetworkManifest`、可组合的 MAC 过滤器、`CropCatalog`（[网络与过滤器](/zh/protocol/networks)）。
- **本地端点认证** —— 使用用户密钥的所有者质询-响应（[本地 API](/zh/reference/local-api)）。
- **所有者合并视图** —— 在本地端点按 `(device_pubkey, seq)` 合并公共 + 私有读数。
- **规范的 Protobuf 编码** —— 来自 [Protobuf 模式](/zh/reference/proto-schemas) 的二进制线缆格式；JSON 为兼容性保留（[ADR-001](/zh/adr/001-protobuf)）。
- **摄取加固** —— 已签名 raw 字符串与 JSON 便利字段之间的严格交叉校验。
- **ESP-NOW 设备网格** —— 电池传感器通过市电邻居中继。

## 未来

- **DeviceClaim / DeviceTransfer** —— 所有权链事件（[设备生命周期](/zh/protocol/device-lifecycle)）。
- **桌面应用（Tauri）** 捆绑完整节点，以及移动应用。
- **智能层** —— 本地端点之上的 MCP 服务器、区域聚合、作物的集体校准（[集体智能](/zh/guide/intelligence)）。

## 兼容性策略

[公共 API](/zh/reference/public-api) 与 [遥测](/zh/protocol/telemetry) 页面中记录的契约，对当前固件世代视为冻结：会破坏现场设备的更改（状态码、重复语义、raw 字符串语法）仅在显式版本控制之后进行。
