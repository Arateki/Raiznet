---
description: Raiznet 的技术栈 —— 今日为 Node.js、Fastify、SQLite、Ed25519、VitePress；计划中为 Protobuf、H3、Roaring Bitmaps —— 以及 SQLite 的角色。
---

# 技术栈

## 当前技术栈（已实现）

| 层 | 技术 | 版本 |
|---|---|---|
| 运行时 | Node.js | 24 LTS |
| 语言 | TypeScript（strict） | 5.x |
| HTTP | Fastify | 5.x |
| SQL 存储 | better-sqlite3 | 11.x |
| 校验 | zod | 3.x |
| 加密（Ed25519） | hypercore-crypto（libsodium） | 3.x |
| BIP-39 种子 | @scure/bip39 | 1.x |
| 日志 | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| 测试 | vitest | 3.x |
| 文档 | VitePress | 1.x |
| 固件 | PlatformIO + Arduino 框架（ESP32） | — |

## 计划中／评估中

| 层 | 技术 | 状态 |
|---|---|---|
| 规范序列化 | Protobuf（Node 用 `@bufbuild/protobuf`，ESP32 用 `nanopb`） | 模式已存在，codegen 未启用 —— 参阅 [ADR-001](/zh/adr/001-protobuf) |
| 地理定位 | h3-js | 随地图功能计划中 |
| 过滤器的集合运算 | Roaring Bitmaps | 随过滤器计划中 |
| 桌面应用 | Tauri 2.x | 未来阶段 |
| 节点复制 | 签名事件日志 + 对等同步 | 设计阶段 —— 参阅 [路线图](/zh/guide/roadmap) |

## 仓库结构

```
raiznet/
├── apps/
│   ├── server/          # Fastify 节点（公共 + 本地端点）
│   ├── cli/             # 运维与调试工具
│   ├── website/         # raiznet.com 落地页
│   ├── dashboard/       # Web 仪表盘
│   └── prototype/       # UI 设计画布（React + Vite）
├── packages/
│   ├── protocol/        # .proto 模式（规范格式，计划中）
│   ├── crypto/          # 密钥派生、签名、AES-256-GCM
│   └── core/            # 共享抽象
├── firmware/
│   ├── safraSense/      # 参考 ESP32 固件（完整传感器）
│   └── esp32-sensor/    # 最小示例
└── docs/                # 本站点
```

Arateki 的 SafraSense 硬件的生产固件位于单独的仓库；本仓库中的固件是该协议的开放参考实现。

## 设计决策

**未经讨论不引入：**
- NestJS —— 过重
- Express —— 相对 Fastify 已过时
- ORM —— 直接使用 better-sqlite3
- Redis —— 此阶段不合理
- 开发中的 Docker —— 本地运行
- Kafka —— 不必要

## SQLite 的角色

今日，SQLite 是节点的主要本地存储：摄取校验一个块并直接写入 `raiznet_public.db` / `raiznet_private.db`。

设计目标是让真相来源成为 **签名的仅追加事件日志**，SQLite 作为可删除并通过重放日志重建的派生索引（参阅 [ADR-002](/zh/adr/002-sqlite-cache)）。宽表模式已为此塑形：

- 快速的聚合查询（每个传感器的固定 `REAL` 列）
- 无 ORM —— 直接 SQL，带类型化结果
- 新传感器类型需要为每个字段添加三列（`_plain`、`_cipher`、`_nonce`）
