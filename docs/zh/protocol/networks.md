---
description: Raiznet 的联邦网络层（设计阶段）—— topic、NetworkManifest、全量复制、服务器模式与可组合的 MAC 过滤器。
---

# 网络

::: warning 设计规范
本页规范联邦网络层 —— topic、清单、过滤器与全量复制。它 **尚未实现**：今日节点彼此独立,复制处于设计阶段（[ADR-004](/zh/adr/004-raiznet-native-replication)）。参阅 [路线图](/zh/guide/roadmap)。
:::

一个 Raiznet 网络由一个 **topic** 标识 —— 一个用作对等发现键的、人类可读的字符串。任何人都可以通过选择一个新 topic 来创建网络。任何人都可以通过连接到既有网络的 topic 来加入它。

## Topic

topic 字符串没有强制格式,但约定是：

```
raiznet:public:<组织>:<版本>
```

示例：
- `raiznet:public:arateki:v1` —— Arateki 官方网络
- `raiznet:public:coop-verdao:v1` —— 某合作社的网络
- `raiznet:public:embrapa-nordeste:v1` —— 某研究机构的网络

topic **不是秘密**。知道一个 topic 就足以加入该网络。真正的隐私意味着以 `local_only` 模式运行,而非依赖 topic 的隐蔽。

## NetworkManifest

创建网络者是创始人。创始人在其公共事件日志中发布一个 `NetworkManifest` 事件,以其用户密钥签名：

```
name: string
topic: string
description: string?
default_filter_pubkey: bytes(32)?
created_at: uint64
signature: bytes(64)
```

清单可随时间更新（新的仅追加事件覆盖投影状态）。若用户不同意清单或想要不同规则,他们就用另一个 topic 创建自己的网络 —— 一次无需许可的轻量分叉。

创始人除了撰写清单之外没有技术特权。其 `default_filter_pubkey` 在加入网络的新服务器上默认启用,并在过滤器列表中排在最前 —— 仅是 UI 优先级。

## 复制

**复制始终是全量的。** 每个服务器复制它在网络中发现的所有设备日志。过滤器从不影响存储的内容 —— 它们是查询时的镜头,控制出现在 API 响应、地图和聚合中的内容。这让网络保持稳健：数据广泛分布,不存在只有某些节点持有某些数据的碎片化。

## 服务器模式

| 模式 | swarm 发现 | 对外可见 |
|---|---|---|
| `public` | 在所有已配置 topic 上通告 | 是 |
| `local_only` | 完全不连接 swarm | 否 |
| `hybrid` | 在 topic 上通告；每个设备单独控制 `publish_to` | 部分 |

`local_only` 服务器对全球网格不可见。它只为本地 Wi-Fi 网络上的设备和所有者的应用提供服务。

## 过滤器

过滤器是由服务器节点发布的、可组合的 MAC 策展列表。每个过滤器是一份策展事件的仅追加日志：

```
type: mac_verified | mac_flagged | mac_banned | mac_unflagged
mac: bytes(6)
reason: string?
created_at: uint64
signature: bytes(64)  // 由过滤器作者的用户密钥签名
```

过滤器的当前状态是迄今所有事件的投影。添加和移除始终是仅追加的 —— 没有破坏性编辑。

客户端使用由 **Roaring Bitmaps** 支撑的集合运算来组合多个过滤器：

| 组合 | 效果 |
|---|---|
| 并集 | 被任一所选过滤器验证的 MAC 被接受 —— 最大覆盖 |
| 交集 | MAC 必须出现在所有过滤器中 —— 最大严格度 |
| 差集 | 排除在否定过滤器中被标记的 MAC |

Arateki 的过滤器作为 `raiznet:public:arateki:v1` 的默认,因为 Arateki 是该网络的创始人。任何其他网络创始人与自己的过滤器有相同关系。没有人拥有垄断 —— 任何服务器都可以发布过滤器,任何客户端都可以选择信任哪些。

## 加入网络

1. 服务器通过对等发现层连接到 topic。
2. 对等节点交换已知设备的列表（pubkey、MAC、H3 单元）。
3. 对等节点也交换可用的过滤器与目录。
4. 服务器启用 `NetworkManifest` 的 `default_filter_pubkey`（若已设置）。
5. 服务器复制它在网络中看到的所有设备日志。
6. 过滤器在查询时应用 —— 它们决定 API 返回什么,而非存储什么。

## 多个网络

单个服务器可同时参与多个网络。对它加入的每个 topic,它发现一组独立的对等节点,并复制在 `Device.networks` 中列出该 topic 的设备的日志。

设备可以通过在其 `networks` 字段中列出多个 topic 来向多个网络发布。

## 为合作社创建网络

1. 选择一个唯一的 topic：`raiznet:public:my-coop:v1`。
2. 发布带有人类可读名称和描述的 `NetworkManifest`。
3. 可选地创建一个列出合作社已验证设备 MAC 的过滤器。
4. 在清单中将 `default_filter_pubkey` 设为该过滤器。
5. 与成员共享 topic 字符串 —— 他们配置自己的服务器连接到它。

成员默认只看到通过其活动过滤器的内容。技术上任何人都能连接到 topic,但对使用默认过滤器的成员而言,未被过滤的设备不会出现在聚合或地图中。
