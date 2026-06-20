---
description: Raiznet 协议术语表 —— BIP-39、Crop、Disposition、Ed25519、event log、FieldPolicy、H3、raw、Safra、seq、topic、User key 等术语。
---

# 术语表

贯穿 Raiznet 协议与文档使用的术语。标记 *(设计)* 的条目描述已规范但尚未实现的概念 —— 参阅 [路线图](/zh/guide/roadmap)。

---

**BIP-39**
一个用于生成人类可读种子短语（12 或 24 词）并确定性地产生加密密钥的标准。Raiznet 为用户身份和服务器节点身份使用 12 词短语。

**Crop（作物）**
作物档案：pH、EC、温度和湿度的理想范围,加上收获时间与声明式气候调整（`adjustments`）。存储于固件,用于 ESP32 上的本地告警评估。

**CropCatalog** *(设计)*
由服务器节点发布的、`Crop` 条目的仅追加目录。类似于过滤器,但面向作物知识。任何服务器或机构都可发布,用户选择启用哪个。

**DeviceClaim** *(设计)*
一个由用户密钥签名的事件,在配置时声明对设备的所有权,发布到所有者的公共事件日志中。

**DeviceTransfer** *(设计)*
一个由卖方和买方双方签名、转移设备所有权的事件。双重签名保证双方均已同意。

**Disposition（处置）**
单个传感器字段对特定目的地的可见性策略：`PLAIN`（明文）、`ENCRYPTED`（AES-256-GCM）或 `OMIT`（不发送）。线缆值：`1`、`2`、`0`。

**Ed25519**
用于 Raiznet 中所有身份与签名的椭圆曲线签名算法。快速,签名小（64 字节）,公钥小（32 字节）。

**EncryptedBlob**
传感器字段的加密载荷：附加 16 字节 AES-GCM 认证标签的密文,加上单独的 12 字节 nonce。在 JSON 线缆上表现为 `{ "cipher": "<hex>", "nonce": "<hex>" }`。

**ESP-NOW** *(计划中)*
Espressif 的、基于 Wi-Fi 的、无需路由器的设备间直接通信协议。为 ESP32 设备之间的本地传感器网格计划。

**Event log（事件日志）** *(设计)*
节点未来的真相来源：已签名事件（设备注册、遥测块、策展事件）的仅追加、哈希链式序列。SQLite 成为通过重放日志重建的派生索引。节点间复制在此日志上运作（[ADR-004](/zh/adr/004-raiznet-native-replication)）。

**FieldPolicy**
一个按字段的策略对象,包含一个 `default_disposition` 和一个 `per_destination` 映射（键：服务器 pubkey 的 hex 或网络 topic）。控制每个传感器字段对每个目的地如何处理。

**Filter（过滤器）** *(设计)*
由服务器节点发布的、MAC 策展事件（`mac_verified`、`mac_flagged`、`mac_banned`、`mac_unflagged`）的仅追加日志。在查询时应用以控制哪些设备出现在 API 响应和聚合中 —— 从不影响存储的内容。

**H3**
Uber 的分层六边形地理空间索引系统。每个 H3 单元是标识地球上某六边形区域的 64 位整数。Raiznet 将设备位置存储为所有者所选分辨率的 H3 单元（越粗略越私密）。

**identity.mnemonic**
`DATA_DIR/identity.mnemonic` 文件,包含服务器的 12 词 BIP-39 种子短语。首次启动时以权限 `0600` 创建。必须备份 —— 它是节点的身份。

**Lazy registration（惰性注册）**
参考固件通过在设置期间调用 `POST /v1/devices` 来注册自身。`409 device_already_exists` 响应计为成功,因此该调用可安全重复。

**local_servers**
配置时在设备上设置的服务器地址列表。决定 `local_only` 或 `both` 设备数据发往何处。若为空,具有私有处置的字段仅留在 ESP32 闪存中 —— 没有本地服务器接收它们。

**MCP（Model Context Protocol）** *(计划中)*
一个以标准化方式向 LLM 暴露数据和工具的开放协议。计划中的 `@raiznet/mcp` 包将把 Raiznet 数据暴露为 MCP 工具。

**nanopb** *(计划中)*
面向嵌入式系统的 Protocol Buffers 的轻量 C 实现。为规范二进制格式的 ESP32 侧计划。

**NetworkManifest** *(设计)*
由网络创始人的用户密钥签名的事件,声明网络的名称、topic 和默认过滤器。创始人的过滤器获得 UI 优先级 —— 这是创始人拥有的唯一区别。

**Protobuf（Protocol Buffers）**
Google 的二进制序列化格式。`packages/protocol/proto/` 中的 `.proto` 模式定义 Raiznet 计划中的规范编码（[ADR-001](/zh/adr/001-protobuf)）；当前线缆格式是 JSON。

**publish_to**
控制哪些目的地类别接收其数据的设备设置：`0` local_only（仅 `local_servers`）、`1` public（仅网络 topic）或 `2` both。

**raiznet_private.db**
仅由本地摄取供给的 SQLite 数据库。包含 `local_only` 设备的数据和具有私有处置的字段。仅由本地端点提供服务。从不离开节点。

**raiznet_public.db**
保存可公开的设备和读数的 SQLite 数据库。由公共端点提供服务；网络落地后将由事件日志复制供给。

**raw**
设备为每个遥测块组装并签名的、以竖线分隔的 ASCII 字符串：`pubkey|seq|timestamp|key_version|field=value|…`。Ed25519 签名覆盖 raw 字节,而非 JSON 信封。参阅 [遥测](/zh/protocol/telemetry#raw-string)。

**Relay** *(设计)*
一个可达节点,帮助两个位于 NAT 之后的对等节点建立直接连接 —— 并在打洞失败时（在乡村 4G 的对称 CGNAT 下常见）转发流量。任何社区节点都可充当中继；中继绝非特权网关（[ADR-004](/zh/adr/004-raiznet-native-replication)）。

**Roaring Bitmap** *(计划中)*
一种压缩位集数据结构,旨在表示过滤器中的 MAC 列表,使跨众多过滤器的快速集合运算成为可能。

**Safra**
一个活跃的种植批次：一个设备、一个 Crop、一个开始日期、一个可选的收获日期和一个可选的产量。将遥测数据与农业结果关联。

**seq**
按设备生成的单调递增序列号。以对闪存友好的块分配（参考固件在 NVS 中一次预留 100 个）,用于幂等去重 —— 服务器对每个 `(device_pubkey, seq)` 至多存储一条读数,重复计为成功。

**Sodium**
`sodium-universal` / libsodium —— 提供支撑 `hypercore-crypto` 的加密原语（Ed25519 签名、随机字节）,由 `@raiznet/crypto` 使用。

**TelemetryBlock**
某设备在某一时刻的一组传感器读数,由设备的 Ed25519 密钥签名。今日是一个 JSON 对象；在计划中的规范格式中是一个 Protobuf 消息。

**topic** *(设计)*
用作公共网络发现键的字符串（如 `raiznet:public:arateki:v1`）。任何知道某 topic 的服务器都可加入对应网络。topic 不是秘密 —— 真正的隐私来自以 `local_only` 模式运行。

**User key（用户密钥）**
从所有者的 BIP-39 种子短语派生的 Ed25519 密钥对。对所有者控制的所有设备和网络的权威之根。用于对 `DeviceClaim`、`DeviceTransfer`、`NetworkManifest` 和过滤器事件签名。从不用于对遥测签名。
