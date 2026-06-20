---
description: A pilha de comunicação da Raiznet do sensor ESP32 ao servidor — formato de fio JSON com raw assinado, transporte por salto e ciclo de vida do pacote.
---

# Visão geral do protocolo

A Raiznet define um protocolo em camadas para monitoramento de cultivo descentralizado. Esta página descreve a pilha de comunicação do sensor ESP32 até o servidor — como está implementada hoje — e para onde o protocolo está indo.

## Camadas

```
┌──────────────────────────────────────────┐
│        Aplicação  (API HTTP JSON)        │
├──────────────────────────────────────────┤
│  Formato de fio  (JSON + raw assinado)   │
├──────────────────────────────────────────┤
│        Transporte  (HTTP POST)           │
├──────────────────────────────────────────┤
│          Identidade  (Ed25519)           │
└──────────────────────────────────────────┘
```

Adições planejadas: uma codificação canônica em Protobuf ([ADR-001](/adr/001-protobuf)), malha dispositivo-a-dispositivo via ESP-NOW e replicação servidor-a-servidor de um log de eventos assinado ([ADR-004](/adr/004-raiznet-native-replication) — veja o [Roadmap](/guide/roadmap)).

## Formato de fio

O formato de fio atual é **JSON sobre HTTP**, com um detalhe crucial: o JSON é um envelope de transporte, e a **mensagem assinada é uma string ASCII separada, delimitada por pipe**, chamada `raw`.

```
<device_pubkey_hex>|<seq>|<timestamp_ms>|<key_version>[|ec=<v>][|ph=<v>][|waterLevel=<v>][|tempAmbient=<v>][|humidity=<v>]
```

O dispositivo assina os bytes UTF-8 dessa string com sua chave Ed25519 e envia tanto o `raw` codificado em hex quanto a `signature` dentro do bloco JSON. O servidor verifica a assinatura contra a pubkey **registrada** do dispositivo. Veja [Telemetria](/protocol/telemetry) para a gramática completa.

Schemas Protobuf para uma codificação binária canônica já existem em `packages/protocol/proto/` mas ainda não são usados no fio — veja [Schemas Protobuf](/reference/proto-schemas).

## Transporte por salto

| Salto | Protocolo | Status |
|---|---|---|
| ESP32 → Servidor | HTTP POST (`/v1/telemetry`, JSON) | **Implementado** |
| ESP32 → ESP32 (malha) | ESP-NOW no canal do Wi-Fi | Planejado |
| Servidor → Servidor | Replicação de log de eventos assinado | Em design ([ADR-004](/adr/004-raiznet-native-replication)) |

O HTTP foi escolhido para o salto ESP32 → Servidor porque os sensores enviam com pouca frequência (o firmware de referência usa por padrão uma leitura por minuto; dispositivos a bateria dormirão por muito mais tempo). Uma conexão persistente (WebSocket, MQTT) ficaria aberta à toa e drenaria a bateria. O HTTP POST sem estado é o modelo correto para ingestão infrequente do tipo fire-and-forget.

## Ciclo de vida do pacote

O que acontece com uma leitura hoje:

```
ESP32 lê os sensores
  → monta a string raw e a assina (Ed25519, chave do dispositivo)
  → envelopa raw + signature + campos plain/encrypted em um bloco JSON
  → POST /v1/telemetry (em lote, 1..100 blocos)

O servidor recebe o lote, por bloco:
  → busca o dispositivo no banco de destino
  → verifica a assinatura sobre os bytes do raw
  → resolve a disposição de cada campo (plain / encrypted / omit)
  → insere em raiznet_public.db ou raiznet_private.db
     (INSERT OR IGNORE — duplicatas são idempotentes)
```

A etapa de replicação (anexar blocos públicos a um log assinado e sincronizá-lo entre nós) é a próxima fase do protocolo e ainda não está implementada.

## Identificadores

Cada entidade é identificada por sua **chave pública Ed25519** (32 bytes), serializada como hex minúsculo no JSON. Não há inteiros auto-incrementados no protocolo.

| Entidade | Origem do ID | Status |
|---|---|---|
| Usuário | Pubkey derivada de uma seed BIP-39 | Implementado |
| Servidor | Pubkey gerada no primeiro boot (`identity.mnemonic`) | Implementado |
| Dispositivo | Pubkey gerada no provisionamento (TRNG do hardware) | Implementado |
| Filtro / Catálogo | Pubkey do seu log publicado | Design |

## Números de sequência

Cada dispositivo mantém um contador `seq` monotonicamente crescente:

- Para proteger a flash do desgaste, o firmware de referência reserva `seq` em **blocos de 100**: persiste na NVS apenas o início do próximo bloco. Após um reboot, o dispositivo retoma do próximo bloco reservado — pequenas lacunas no `seq` são normais e esperadas.
- O dispositivo mantém as leituras recentes num ring buffer de RAM e **reenvia tudo que ainda não foi confirmado com um HTTP `200`**. O servidor deduplica por `(device_pubkey, seq)`, então a retransmissão é sempre segura.
- O servidor **não** impõe monotonicidade — rejeitar seqs antigos quebraria a recuperação após uma reconexão.

Leituras que saem do buffer do dispositivo antes de sincronizar são perdidas pela rede — a menos que o dono as puxe diretamente do dispositivo via HTTP local, BLE ou serial.
