---
description: O ciclo de vida de um dispositivo Raiznet — estados, provisionamento por portal cativo, DeviceClaim e DeviceTransfer, perda de hardware e rotação de chaves.
---

# Ciclo de vida do dispositivo

Um dispositivo na Raiznet é qualquer ESP32 que foi provisionado com um par de chaves Ed25519 e uma política de privacidade. Sua identidade é sua chave pública — não o MAC, não o nome.

## Estados

```
[fabricado] → [provisionado] → [active] → [inactive] → [lost]
                                   ↑            ↓
                                   └────────────┘
```

| Estado | Significado |
|---|---|
| `active` | O dispositivo está reportando telemetria normalmente |
| `inactive` | O dispositivo não reporta há um período configurado |
| `lost` | O dono marcou o dispositivo como irrecuperável (hardware destruído ou roubado) |

## Provisionamento (como implementado)

O firmware de referência provisiona a si mesmo por meio de um **portal cativo**:

1. No primeiro boot (ou após um reset), o ESP32 cria um ponto de acesso Wi-Fi temporário.
2. O dono se conecta a ele; o portal cativo abre um fluxo de **Identity Setup**:
   - O dispositivo gera seu próprio par de chaves Ed25519 a partir do TRNG do hardware e o armazena na NVS — a chave privada nunca sai do dispositivo.
   - O portal gera um novo mnemônico BIP-39 (12 palavras) para a **identidade do dono**, no idioma do dono (PT, EN, ES), ou importa um existente. O dono anota a frase.
3. O dono configura o `publish_to`, o(s) endereço(s) do servidor e as credenciais de Wi-Fi.
4. O ESP32 grava tudo na NVS e reinicia em modo de produção.
5. **Registro preguiçoso (lazy):** o dispositivo chama `POST /v1/devices` no servidor configurado durante o setup, enviando sua pubkey, MAC, pubkey do dono e política de privacidade inicial. Um `409` (já registrado) conta como sucesso.

## Provisionamento via app <Badge type="warning" text="planejado" />

O fluxo conduzido pelo app adiciona por cima: política de privacidade por campo, seleção de rede, escolha da localização H3 em um mapa e envio do Cultivo da Safra ativa para o dispositivo.

## DeviceClaim <Badge type="warning" text="design" />

Publicado no log de eventos público do dono quando um dispositivo é provisionado:

```
device_pubkey: bytes(32)
device_mac: bytes(6)
claimed_at: uint64
signature: bytes(64)   // assinado pela chave de Usuário do dono
```

Qualquer peer pode validar a cadeia de propriedade: a telemetria do dispositivo é assinada pela chave do dispositivo; a propriedade dessa chave é declarada no DeviceClaim assinado pela chave de Usuário.

## Transferência de propriedade (venda) <Badge type="warning" text="design" />

1. O vendedor abre "transferir dispositivo" no app e informa a pubkey de Usuário do comprador.
2. O vendedor assina um evento `DeviceTransfer`.
3. O comprador recebe a solicitação no seu app e assina confirmando a aceitação.
4. O evento final (ambas as assinaturas) é publicado no log de eventos público do comprador.
5. A rede reconhece o novo `owner_pubkey` e aceita mudanças de configuração apenas do novo dono.

```
device_pubkey: bytes(32)
from_user_pubkey: bytes(32)
to_user_pubkey: bytes(32)
transferred_at: uint64
signature_from: bytes(64)   // vendedor
signature_to: bytes(64)     // comprador
```

As leituras históricas permanecem assinadas pela chave do dispositivo. O antigo `DeviceClaim` do vendedor continua no log como um registro válido do período em que ele era o dono.

## Perda de hardware (dispositivo queimado)

Não há fluxo de revogação. Se o dispositivo for destruído:

1. O dono o marca como `lost` no app (apenas estado local).
2. Compra um novo ESP32 e o provisiona como um dispositivo totalmente novo (nova pubkey, novo MAC).
3. Se quiser continuidade visual nos gráficos, o app pode exibir o dispositivo antigo e o novo como uma série mesclada, com um marcador visual no ponto de transição.
4. Os dados históricos do dispositivo antigo permanecem no servidor do dono, consultáveis separadamente.

A chave privada do dispositivo foi perdida com o hardware — isso é desejável. Clonar um dispositivo exigiria duplicar a chave privada, o que é impossível sem acesso físico à flash.

## Rotação da chave simétrica

Cada dispositivo tem uma chave simétrica usada para campos `ENCRYPTED`. A versão da chave é rastreada em `Device.encryption_key_version` e em cada `TelemetryBlock`.

Fluxo de rotação:
1. O dono inicia a rotação no app.
2. O app gera uma nova chave simétrica e incrementa a versão.
3. Envia a nova chave para o ESP32 na próxima conexão.
4. O ESP32 usa a nova chave para todas as leituras subsequentes.
5. As chaves antigas ficam no chaveiro do app do dono para descriptografar dados históricos.

Peers que receberam blobs criptografados anteriormente não conseguem descriptografá-los com a nova chave — e vice-versa. A rotação limita a exposição se uma chave vazar, ao custo de perder o acesso de descriptografia para qualquer terceiro (ex.: um agrônomo) que tinha uma cópia da chave antiga.

## Atualizações de Cultivo

O ESP32 armazena o Cultivo ativo localmente na flash. O app envia atualizações quando o dispositivo se conecta ao servidor. Se estiver offline, o dispositivo continua usando a versão armazenada até reconectar.

Fluxo de atualização de Cultivo:
1. A rede ou o dono publica um Cultivo atualizado em um CropCatalog.
2. O servidor baixa a atualização do catálogo.
3. Na próxima conexão do dispositivo, o servidor envia o Cultivo atualizado ao ESP32.
4. O ESP32 grava na flash e usa os novos valores a partir do próximo ciclo de leitura.
