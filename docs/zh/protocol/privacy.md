---
description: Raiznet 的按字段隐私模型 —— plain、encrypted 与 omit 处置、按目的地的 FieldPolicy、publish_to 与通过隔离实现的安全。
---

# 隐私模型

Raiznet 的隐私模型在字段层级运作。每条传感器读数（pH、EC、温度等）都有独立的可见性策略,决定什么传往何处。

## 处置（Disposition）

`Disposition` 定义某字段对某给定目的地如何处理：

| 值 | 含义 |
|---|---|
| `OMIT` | 字段不发送到此目的地。不存储。 |
| `PLAIN` | 字段以明文传输。对有权访问该目的地的所有对等节点可见。 |
| `ENCRYPTED` | 字段在传输前用设备的 AES-256-GCM 对称密钥加密。blob 正常传输,但只有持有密钥者能读取。 |

`ENCRYPTED` 值从不进入网络聚合或地图 —— 聚合器忽略不透明的 blob。

## FieldPolicy

每个传感器字段都有一个 `FieldPolicy`：

```protobuf
message FieldPolicy {
  Disposition default_disposition = 1;
  map<string, Disposition> per_destination = 2;
}
```

`default_disposition` 适用于任何未显式列出的目的地。`per_destination` 将目的地键映射到一个覆盖：

- **服务器 pubkey（hex）**：适用于该特定服务器。
- **网络 topic**（如 `raiznet:public:arateki:v1`）：适用于该网络的所有对等节点。

UI 呈现三个粒度级别,全部由同一映射支撑：

| UI 级别 | 配置 |
|---|---|
| 全部相同 | 设置 `default_disposition`,映射为空 |
| 公共 vs 本地 | 按类别分组的两个映射条目 |
| 按目的地（高级） | 每个服务器 pubkey 或 topic 一个条目 |

## publish_to

设备的 `publish_to` 设置控制哪些目的地类别处于活动状态：

| 值 | 活动目的地 |
|---|---|
| `LOCAL_ONLY` | 仅 `local_servers` 条目 |
| `PUBLIC` | 仅公共网络 topic |
| `BOTH` | 所有目的地 —— 各有自己的 FieldPolicy |

## local_servers 作为区分因素

设备的 `local_servers` 列表决定“本地”数据是否会到达任何服务器：

- **`local_servers` 为空** → 私有字段留在 ESP32 闪存中。所有者在近旁时通过本地 HTTP、BLE 或串口直接访问。
- **`local_servers` 已填充** → 私有字段发送到那些特定服务器并存储于 `raiznet_private.db`。每个服务器相互独立,不与其他服务器复制私有数据。

不运行节点的用户从不需要配置 `local_servers`。应用会清楚地传达这一点：本地数据留在设备上,直到应用直接连接。

## 通过隔离实现安全

服务器上的两个数据库在连接层而非查询层强制隔离：

- `raiznet_public.db` —— 由公共摄取供给（对等复制计划中）。公共端点只能访问此数据库。即便写得很差的查询也无法泄露私有数据,因为连接对象根本不可用。
- `raiznet_private.db` —— 仅由本地摄取供给。只有本地端点（`127.0.0.1`）可访问。它从不离开节点。

## 始终公开的内容

当设备为 `publish_to: PUBLIC | BOTH` 时,以下元数据无论 FieldPolicy 如何始终公开：

- `id`（设备 pubkey）
- `mac`
- `owner_pubkey`
- `type`（sensor_mains / sensor_battery / gateway）
- `location`（所有者所选分辨率的 H3 单元）
- `hardware`（型号、固件版本）

这些元数据是网络得知设备存在以及聚合得以运作所必需的。

## 更改策略

更改 `FieldPolicy` 仅影响未来的读数。已发布的数据（明文或加密）仍留在已收到者手中 —— 没有机制可以“取消发布”对等节点已下载的内容。这是仅追加、复制数据的后果。

## 加密字段与所有者的应用

`ENCRYPTED` 处置解决一个特定用例：所有者想从 LAN 之外（无需隧道）跟踪自己的传感器数据,而不向公共网络暴露数值。

流程：
1. 设备在发往公共目的地之前用其对称密钥加密字段。
2. 任何对等节点接收并存储加密的 blob —— 它们无法读取。
3. 持有对称密钥的所有者应用在本地解密该 blob。

这意味着所有者可以使用任何公共网关或对等节点来取回数据,而无需将明文值托付给它。
