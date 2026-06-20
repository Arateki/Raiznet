---
description: ADR 004 —— 以 Raiznet 原生复制取代 Hypercore —— 自有的签名事件日志与分层连接性（sync v1 HTTP、sync v2 iroh）。
---

# ADR 004 —— 以 Raiznet 原生复制取代 Hypercore

**状态：** 已接受  
**日期：** 2026-06

## 背景

Raiznet 最初的设计采用 Holepunch 栈作为其复制基础：Hypercore（仅追加签名日志）、Hyperswarm（DHT 发现与打洞）、Autobase（多写者）、Hyperdrive（内容分发）。三个事实改变了局面：

1. **从未集成。** 阶段 1 的节点是 HTTP + SQLite；项目中不存在 Hypercore 代码。
2. **节点正迁移到 Rust**,面向小型 ARM 硬件（静态二进制,约 250 MB RAM 预算）。不存在受维护、协议完整的 Hypercore 10/11 的 Rust 实现,也完全没有可用的 Hyperswarm DHT 的 Rust 实现。从第二语言追踪一个移动的、以 JS 定义的协议会消耗项目而无产品收益。
3. **没有任何 Raiznet 节点需要与 JS Hypercore 生态互操作。** 网络由 Raiznet 节点构成；与 Holepunch 对等节点的兼容性没有用例。

Raiznet 实际需要的是三个属性,而非特定的栈：(a) 签名、仅追加、可验证的数据；(b) 对等发现；(c) 在 **没有强制中心网关** 的情况下穿越 NAT/CGNAT 的连接性。

## 决定

**第 1 部分 —— 数据：Raiznet 原生的签名事件日志。**
真相来源成为每个作者的仅追加事件日志,哈希链式,每个事件都签名（Ed25519）。SQLite 仍是派生索引（[ADR-002](/zh/adr/002-sqlite-cache)）；规范二进制编码在落地时仍为 Protobuf（[ADR-001](/zh/adr/001-protobuf)）。Hypercore 不被使用、移植或模拟。

**第 2 部分 —— 连接性：分层,构建于既有 Rust 基础之上。**

- **Sync v1 —— 已配置对等节点。** 已知对等节点间的 HTTP(S) 拉取（`heads` 摘要 + 按 `(author, seq)` 范围获取）。以零新依赖覆盖 LAN、VPN/Tailscale 和公共 IP 节点。它最先落地。
- **Sync v2 —— pubkey 拨号传输。** 构建于既有 P2P 基础之上,而非从零编写。**主要候选：[iroh](https://github.com/n0-computer/iroh)** —— Ed25519 节点 ID（与 Raiznet 的身份模型一致）、QUIC 连接、带 **可自托管中继** 的内置打洞,以及基于 topic 的 gossip。**后备候选：rust-libp2p**（Kademlia、mDNS、GossipSub、AutoNAT/DCUtR/Relay v2）。采用以一次 **现场尖刺测试** 为条件：两个节点在真实的乡村 4G/CGNAT 链路上建立连接,测量直接连接 vs 中继的比例。

## 理由

- **拥有数据格式,继承网络。** 事件日志是 Raiznet 的主权与研究级保证所在 —— 它必须是我们自己的,并且足够小,可以用一套 fixture 语料来规范和测试。NAT 穿越、连接迁移和中继协调则相反：最大的复杂度、零差异化,且已被受维护的 Rust 项目解决。
- **中继不是网关。** 打洞从来不是 100% —— 在对称 CGNAT（乡村 4G 常见）下,每个系统（包括 Hyperswarm）都会回退到中继。在此设计中,任何可达的社区节点都可充当中继；流量不依赖 Arateki 运营的基础设施。“无强制网关”的原则得以保持 —— 与 DHT 节点在 Hyperswarm 中扮演的角色相同。
- **本地优先不受影响。** `local_only` 节点从不触及发现或中继；LAN 上的 ESP32 加一台笔记本电脑仍是有效的 Raiznet。

## 取舍

- 我们失去了 Hyperswarm 现成的全球 DHT；发现以更简单的方式开始（已配置对等节点、mDNS,然后是 v2 传输的发现）。
- 与 JS Hypercore 对等节点无互操作（无已知用例）。
- iroh 处于 1.0 之前,其 API 仍在变动；风险被封闭在 `raiznet-sync` crate 边界之后,以 rust-libp2p 作为后备。对 v2 的最终承诺仅在 CGNAT 现场尖刺测试之后发生。

## 后果

- `CLAUDE.md`、`README.md` 和本文档不再将 Holepunch 栈描述为基础；存续的概念性术语（topic、过滤器、目录、全量复制、仅追加语义）与传输无关且保持不变。
- Rust 迁移计划分阶段实现这一点：事件日志（阶段 7）、sync v1 + v2（阶段 8）、Protobuf 规范编码（阶段 9）—— 每一项在执行前都有自己的详细计划。
- `Material` 内容分发（原 Hyperdrive）将在相同的事件日志 + 传输原语之上稍后规范化。
