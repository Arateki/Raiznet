---
description: Raiznet 中的身份 —— 用户、服务器与设备的 Ed25519 密钥对、密钥层级、BIP-39 派生与种子备份。
---

# 身份

Raiznet 的每个参与者 —— 用户、服务器和设备 —— 都由一个 Ed25519 密钥对标识。没有中心权威。

## 密钥层级

```
用户种子短语（BIP-39,12 词）
  └─ 用户密钥对  (Ed25519)
       └─ DeviceClaim  (对设备 pubkey 签名)
            └─ 设备密钥对  (Ed25519,在配置时生成)
                  对每个遥测数据包签名
```

**用户密钥** 是权威之根。它对设备的所有权声明和网络清单签名。它从不用于对遥测签名 —— 那是设备的职责。

**设备密钥** 在配置时随硬件诞生,存在于 ESP32 的闪存中。若设备被销毁或丢失,密钥即消失。按设计没有恢复路径 —— 新设备作为新身份被配置。

## 用户密钥生成

```ts
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { keyPair } from 'hypercore-crypto';

const mnemonic = generateMnemonic(wordlist, 128); // 12 词
const seed = Buffer.from(mnemonicToSeedSync(mnemonic)).subarray(0, 32);
const { publicKey, secretKey } = keyPair(seed);
```

种子短语是确定性派生的：相同的 12 词总是产生相同的密钥对。这意味着：
- 恢复种子短语即恢复所有用户密钥。
- 设备的对称密钥可由用户种子 + 设备 pubkey 确定性派生,因此恢复种子也恢复了解密所有加密遥测字段的能力。

## 服务器身份

首次启动时,服务器生成一个新的 BIP-39 种子并以权限 `0600` 写入 `DATA_DIR/identity.mnemonic`。该文件是唯一的持久秘密。请备份 —— 它是节点的身份,在网络落地后,它就是对 `NetworkManifest` 事件、过滤器和目录签名的东西。

服务器的公钥在启动时记录到日志：

```json
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

## 设备配置

在设置时：

1. 设备从硬件 TRNG（32 个随机字节）生成其密钥对并存入闪存（NVS）。私钥从不离开设备。
2. 所有者身份在设备的强制门户中以 BIP-39 助记词的形式生成或导入 —— 参阅 [设备生命周期](/zh/protocol/device-lifecycle)。
3. **计划中：** 用户对一个 `DeviceClaim` 事件签名并发布到其公共事件日志,使任何读数都可针对所有权链进行验证。

::: info 参考固件中的所有者密钥派生
参考固件目前将所有者的 Ed25519 种子派生为 **助记词字符串的 SHA-256**,而非服务器（`@raiznet/crypto`）所用的完整 BIP-39/PBKDF2 派生。因此同一短语在两条路径上产生不同的密钥。在所有者种子导入进入应用之前,将由 ADR 确定一条规范规则 —— 在此之前,请将固件生成的所有者密钥视为仅限于设备内。
:::

## 所有权转移

出售或转移设备使用带双重签名（卖方 + 买方）的 `DeviceTransfer` 事件。双方对包含设备 pubkey、两个用户 pubkey 和一个时间戳的同一结构签名。网络在看到有效转移后更新其对 `owner_pubkey` 的认识。

## BIP-39 与备份

种子短语是主密钥。它应该：

- 写在纸上并保存于安全之处。
- 绝不存于云服务,也不通过未加密的通道发送。
- 仅在生成时向用户展示一次,并带确认步骤。

没有中心化恢复。这是根本的设计选择,而非局限。

## 质询-响应认证 <Badge type="warning" text="计划中" />

本地端点（`127.0.0.1:LOCAL_PORT`）将要求所有者证明拥有其用户私钥（尚未实现 —— 参阅 [本地 API](/zh/reference/local-api)）：

1. 客户端调用 `GET /v1/auth/challenge` → 收到 32 个随机字节。
2. 客户端用其用户私钥对这些字节签名。
3. 客户端将签名发送到 `POST /v1/auth/verify` → 收到一个会话令牌（或服务器按请求验证）。

这将防止对所有者私有数据的未授权访问,即便有人获得了服务器本地网络的访问权。在其落地前,本地端点依赖其 `127.0.0.1` 绑定 —— 请勿暴露。
