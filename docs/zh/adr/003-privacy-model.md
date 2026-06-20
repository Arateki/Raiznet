---
description: ADR 003 —— 采用基于映射的策略（default_disposition + per_destination）与 OMIT、PLAIN、ENCRYPTED 处置的按字段隐私模型。
---

# ADR 003 —— 采用基于映射策略的按字段隐私模型

**状态：** 已接受  
**日期：** 2026-04

## 背景

Raiznet 设备可能拥有读数敏感的传感器（如种植者不想被竞争对手看到的作物健康数据），而同一设备的其他读数是有意公开的（如用于区域地图的环境温度）。

两个需求驱动了设计：
1. 隐私必须在 **字段层级** 可配置,而不仅是按设备。
2. 策略必须支持 **按目的地覆盖**,而无需用户配置两个独立的逻辑设备。

## 决定

每个传感器字段都有一个 `FieldPolicy`：

```protobuf
message FieldPolicy {
  Disposition              default_disposition = 1;
  map<string, Disposition> per_destination     = 2;
}
```

`default_disposition` 适用于 `per_destination` 中未显式列出的任何目的地。映射的键是服务器 pubkey（hex）或网络 topic 字符串。

三种处置：

| 处置 | 效果 |
|---|---|
| `OMIT` | 字段不发送到此目的地 |
| `PLAIN` | 字段以明文传输 |
| `ENCRYPTED` | 字段用设备的对称密钥进行 AES-256-GCM 加密 |

## 理由

**一个设备,多种策略。** 映射方式避免了将“两个逻辑设备”作为变通的需要。一个设备可以在本地服务器为 `PLAIN`、在公共网络为 `ENCRYPTED`、对某特定第三方服务器为 `OMIT` —— 全部来自一份配置。

**UI 分层。** 映射模型支持三个面向用户的粒度级别,全部由同一数据结构支撑：
- *全部相同*：设置 `default_disposition`,映射为空。
- *公共 vs 本地*：按目的地类别分组的两个条目。
- *按目的地（高级）*：每个服务器 pubkey 或 topic 一个条目。

**用于远程所有者访问的 `ENCRYPTED`。** `ENCRYPTED` 处置解决一个特定情形：所有者想从 LAN 之外跟踪自己的传感器,而不向公共网络暴露数值。密文 blob 正常通过公共网络传输；对等节点存储它但无法读取。所有者的应用使用设备的对称密钥（由 BIP-39 种子派生）在本地解密。

**通过隔离而非查询实现安全。** 双数据库架构（`raiznet_public.db` / `raiznet_private.db`）在连接层强制隔离。`OMIT` / `PLAIN` / `ENCRYPTED` 模型是策略层；数据库分离是强制层。两者都必需。

**复制始终是全量的。** 过滤器（MAC 策展列表）从不影响存储的内容 —— 它们控制出现在 API 响应中的内容。这让网络保持稳健并避免碎片化。

## 取舍

- `per_destination` 映射随配置的目的地数量增长。实践中,多数用户使用默认（映射为空）或至多两个条目。
- 更改策略不影响已发布的数据。已下载明文读数的对等节点会保留它们 —— 在仅追加日志上没有“取消发布”机制。
- `ENCRYPTED` 字段对聚合不透明。网络级指标（按 H3 单元的平均值、区域图表）只能使用 `PLAIN` 字段。这是有意的隐私保证,而非缺陷。

## 后果

- `packages/protocol/proto/device.proto` 定义 `FieldPolicy`、`Disposition` 和 `PrivacyPolicy`。
- `apps/server/src/domain/telemetry.ts` 按字段解析有效处置：`per_destination[serverPubkeyHex] ?? default_disposition`（topic 级覆盖随网络落地）。
- `packages/crypto/src/symmetric.ts` 拥有 AES-256-GCM 字段加密与解密。
- 所有者的应用负责维护设备的对称密钥环（`{ version → key }`）,并解密从任何端点收到的 `ENCRYPTED` 字段。
