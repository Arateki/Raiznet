---
description: 如何用 Node.js 安装、配置并运行 Raiznet 节点 —— 首次运行、BIP-39 身份、健康检查，以及如何安全地暴露节点。
---

# 运行节点

## 要求

- Node.js 24 LTS
- pnpm 9+

## 安装

```bash
git clone https://github.com/arateki/raiznet
cd raiznet
pnpm install
pnpm build
```

## 配置

复制示例环境文件并按需调整：

```bash
cp apps/server/.env.example apps/server/.env
```

| 变量 | 默认值 | 描述 |
|---|---|---|
| `PUBLIC_PORT` | `3000` | 公共端点端口（绑定 `0.0.0.0`） |
| `LOCAL_PORT` | `3001` | 本地认证端点端口（绑定 `127.0.0.1`） |
| `DATA_DIR` | `./data` | SQLite 数据库与服务器身份的目录 |
| `LOG_LEVEL` | `info` | Pino 日志级别（`trace`、`debug`、`info`、`warn`、`error`） |
| `NODE_ENV` | `development` | 环境 |

## 首次运行

```bash
cd apps/server
node dist/index.js
```

首次运行时，服务器会：
1. 从一个新的 BIP-39 种子短语生成 Ed25519 密钥对
2. 将种子写入 `DATA_DIR/identity.mnemonic`（权限 `0600`）
3. 在 `DATA_DIR` 中创建 `raiznet_public.db` 与 `raiznet_private.db`
4. 在两个端口上开始监听
5. 在日志中记录服务器的公钥

```
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

::: warning 备份你的种子短语
文件 `DATA_DIR/identity.mnemonic` 包含控制服务器身份的 12 词种子短语。请备份。一旦丢失，你节点的身份（其 pubkey）就消失了 —— 并且在网络落地后，签署 NetworkManifest、过滤器和目录的能力也随之消失。
:::

## 健康检查

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":1776819068644}
```

## 暴露节点

公共端点（`:3000`）可安全暴露 —— 它只提供公共数据。本地端点（`:3001`）**暂无认证**：它绑定到 `127.0.0.1`，必须对外部不可达。远程访问请使用 Tailscale 或 VPN。参阅 [本地 API](/zh/reference/local-api)。

## 开发模式（watch）

```bash
pnpm --filter @raiznet/server dev
```

使用 `node --watch` 在文件变更时重启。需要先有已构建的 `dist/`。
