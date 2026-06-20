---
description: Identidade na Raiznet — pares de chaves Ed25519 para usuários, servidores e dispositivos, hierarquia de chaves, derivação BIP-39 e backup da seed.
---

# Identidade

Todo participante da Raiznet — usuários, servidores e dispositivos — é identificado por um par de chaves Ed25519. Não há autoridade central.

## Hierarquia de chaves

```
Seed phrase do Usuário (BIP-39, 12 palavras)
  └─ Par de chaves do Usuário  (Ed25519)
       └─ DeviceClaim  (assina pubkeys de dispositivos)
            └─ Par de chaves do Dispositivo  (Ed25519, nasce no provisionamento)
                  assina cada pacote de telemetria
```

A **chave de Usuário** é a raiz de autoridade. Ela assina reivindicações de propriedade sobre dispositivos e manifestos de rede. Nunca é usada para assinar telemetria — esse é o papel do dispositivo.

A **chave de Dispositivo** nasce com o hardware no provisionamento e vive na flash do ESP32. Se o dispositivo for destruído ou perdido, a chave se vai. Não há caminho de recuperação por design — um novo dispositivo é provisionado como uma nova identidade.

## Geração da chave de Usuário

```ts
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { keyPair } from 'hypercore-crypto';

const mnemonic = generateMnemonic(wordlist, 128); // 12 palavras
const seed = Buffer.from(mnemonicToSeedSync(mnemonic)).subarray(0, 32);
const { publicKey, secretKey } = keyPair(seed);
```

A seed phrase é derivada deterministicamente: as mesmas 12 palavras sempre produzem o mesmo par de chaves. Isso significa:
- Recuperar a seed phrase recupera todas as chaves de Usuário.
- As chaves simétricas dos dispositivos podem ser derivadas deterministicamente da seed do Usuário + pubkey do dispositivo, então recuperar a seed também recupera a capacidade de descriptografar todos os campos de telemetria criptografados.

## Identidade do servidor

No primeiro boot, o servidor gera uma nova seed BIP-39 e a grava em `DATA_DIR/identity.mnemonic` com permissões `0600`. O arquivo é o único segredo persistente. Faça backup dele — é a identidade do nó, e quando as redes entrarem é o que assina eventos `NetworkManifest`, filtros e catálogos.

A chave pública do servidor é registrada no log na inicialização:

```json
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

## Provisionamento do dispositivo

No setup:

1. O dispositivo gera seu par de chaves a partir do TRNG do hardware (32 bytes aleatórios) e o armazena na flash (NVS). A chave privada nunca sai do dispositivo.
2. A identidade do dono é gerada ou importada no portal cativo do dispositivo como um mnemônico BIP-39 — veja [Ciclo de vida do dispositivo](/protocol/device-lifecycle).
3. **Planejado:** o Usuário assina um evento `DeviceClaim` publicado no seu log de eventos público, para que qualquer leitura possa ser validada contra a cadeia de propriedade.

::: info Derivação da chave do dono no firmware de referência
O firmware de referência hoje deriva a seed Ed25519 do dono como **SHA-256 da string do mnemônico**, e não pela derivação BIP-39/PBKDF2 completa usada pelo servidor (`@raiznet/crypto`). A mesma frase, portanto, produz chaves diferentes nos dois caminhos. Uma regra canônica será fixada por ADR antes de a importação de seed do dono entrar nos apps — até lá, trate a chave de dono gerada pelo firmware como restrita ao dispositivo.
:::

## Transferência de propriedade

Vender ou transferir um dispositivo usa um evento `DeviceTransfer` com assinaturas duplas (vendedor + comprador). Ambos assinam a mesma estrutura contendo a pubkey do dispositivo, as duas pubkeys de usuário e um timestamp. A rede atualiza sua visão de `owner_pubkey` após ver uma transferência válida.

## BIP-39 e backup

A seed phrase é o segredo mestre. Ela deve ser:

- Escrita em papel e guardada em local seguro.
- Nunca armazenada em serviço de nuvem nem enviada por canais não criptografados.
- Mostrada ao usuário apenas uma vez, no momento da geração, com uma etapa de confirmação.

Não há recuperação centralizada. Esta é uma escolha fundamental de design, não uma limitação.

## Autenticação por challenge-response <Badge type="warning" text="planejado" />

O endpoint local (`127.0.0.1:LOCAL_PORT`) exigirá que o dono prove a posse da sua chave privada de Usuário (ainda não implementado — veja [API local](/reference/local-api)):

1. O cliente chama `GET /v1/auth/challenge` → recebe 32 bytes aleatórios.
2. O cliente assina esses bytes com sua chave secreta de Usuário.
3. O cliente envia a assinatura para `POST /v1/auth/verify` → recebe um token de sessão (ou o servidor valida por requisição).

Isso impedirá o acesso não autorizado aos dados privados do dono mesmo que alguém ganhe acesso à rede local do servidor. Até entrar, o endpoint local depende do seu bind em `127.0.0.1` — não o exponha.
