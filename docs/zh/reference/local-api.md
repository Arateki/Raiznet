---
description: 127.0.0.1 上的 Raiznet 本地 API —— 与公共 API 相同的路由但作用于私有数据库、经隧道的远程访问与计划中的所有者认证。
---

# 本地 API

本地端点在 `127.0.0.1:LOCAL_PORT`（默认 `3001`）监听。它与公共端点运行于同一进程,但仅绑定到回环 —— 面向同一机器上的所有者应用、CLI 和工具（或经 Tailscale、VPN 等隧道到达）。

::: danger 暂无认证
本地端点目前 **没有认证**。隔离完全依赖 `127.0.0.1` 绑定。请勿将此端口端口转发或反向代理到互联网。所有者质询-响应认证在计划中 —— 见下。
:::

## 基础 URL

```
http://127.0.0.1:3001
```

## 路由

本地端点暴露与 [公共 API](/zh/reference/public-api) **相同的路由**,有一个结构性差异：它们访问哪个数据库。

| 路由 | 公共端点 | 本地端点 |
|---|---|---|
| `GET /health` | — | 相同 |
| `POST /v1/devices` | 写入 `raiznet_public.db` | 写入 `raiznet_private.db` |
| `GET /v1/devices`, `GET /v1/devices/:id` | 读取 `raiznet_public.db` | 读取 `raiznet_private.db` |
| `GET /v1/devices/:id/telemetry` | 读取 `raiznet_public.db` | 读取 `raiznet_private.db` |
| `POST /v1/telemetry` | 摄取目的地 `public` | 摄取目的地 `local` |

这种不对称是刻意的：在本地端点注册设备会在私有数据库中将其创建为 **本地设备**,对公共侧不可见。

### 摄取目的地

当设备的 `publishTo` 为 `0`（local_only）或 `2`（both）时,本地端点上的 `POST /v1/telemetry` 将读数存储于 `raiznet_private.db`。`publishTo: 1`（仅公共）的设备在此提交会被校验并接受,但不存储任何内容。

`both` 设备向每个端点发送 **独立的请求** —— 一个给公共,一个给本地 —— 各自按该目的地的字段处置组装。

## 远程访问

要从 LAN 之外读取本地数据,请使用私有覆盖网络（Tailscale、WireGuard）到达服务器的 `127.0.0.1:3001`,或将字段标记为面向公共网络的 `encrypted` 并在你的应用中解密（参阅 [隐私模型](/zh/protocol/privacy)）。

---

## 计划中：所有者认证

使用所有者用户密钥的质询-响应认证已设计但 **尚未实现**：

1. 客户端调用 `GET /v1/auth/challenge` → 收到 32 个随机字节。
2. 客户端用用户私钥对质询签名。
3. 客户端将签名发送到 `POST /v1/auth/verify` → 收到会话令牌。

## 计划中：合并视图

本地端点最终将按 `(device_pubkey, seq)` 合并 `raiznet_public.db` + `raiznet_private.db`,使所有者看到每个设备一条连续序列,加密字段以 `cipher` + `nonce` 返回供本地解密。今日,每个端点仅返回其自身的数据库。
