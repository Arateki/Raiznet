---
description: ADR 001 — Protobuf como formato de fio canônico da Raiznet, compartilhado entre Node.js e ESP32; aceito, com implementação adiada (hoje o fio é JSON).
---

# ADR 001 — Protobuf como formato de fio

**Status:** Aceito — implementação adiada  
**Data:** 2026-04

::: info Atualização (2026-06)
O formato de fio em produção é **JSON** com uma [string raw assinada](/protocol/telemetry#a-string-raw-assinada); os schemas `.proto` existem mas a geração de código não está ativa. O Protobuf continua sendo o formato canônico-alvo e entrará junto com o log de eventos — o JSON permanece suportado para a geração atual de firmware.
:::

## Contexto

A Raiznet precisa de um formato de serialização que funcione tanto no firmware ESP32 (C++, com restrição de memória) quanto nos servidores Node.js (TypeScript). O formato precisa ser compacto, com schema imposto e mantível em dois runtimes muito diferentes.

Candidatos avaliados:

| Formato | Node.js | ESP32 | Schema | Binário |
|---|---|---|---|---|
| JSON | Nativo | ArduinoJson | Não | Não |
| MessagePack | `msgpackr` | `msgpack-c` | Não | Sim |
| CBOR | `cbor-x` | `tinycbor` | Não | Sim |
| Protobuf | `@bufbuild/protobuf` | `nanopb` | Sim | Sim |

## Decisão

**Protobuf (Protocol Buffers v3)** com:
- `@bufbuild/protobuf` + `@bufbuild/protoc-gen-es` no Node.js
- `nanopb` no ESP32

Os schemas `.proto` vivem em `packages/protocol/proto/` e são compartilhados entre os dois runtimes. O código TypeScript é gerado em tempo de build via `protoc-gen-es`.

## Justificativa

- **Schema compartilhado**: um arquivo `.proto` é a única fonte da verdade. Mudanças no schema se refletem no código gerado dos dois lados — sem structs mantidas à mão.
- **Compactação binária**: pacotes menores que JSON, importante para ESP32s a bateria enviando por Wi-Fi.
- **Segurança de tipos**: os tipos TypeScript gerados são precisos e eliminam a necessidade de parsing manual.
- **Maturidade do nanopb**: implementação Protobuf bem estabelecida para C embarcado, sem alocação dinâmica de memória, funcionando dentro das restrições do ESP32.
- **Estabilidade dos números de campo**: as garantias de compatibilidade para frente/para trás do Protobuf permitem a evolução do schema sem quebrar nós existentes rodando firmware mais antigo.

## Trade-offs

- O Protobuf não é legível por humanos. Depurar pacotes crus exige um decodificador.
- O nanopb exige definir tamanhos máximos para campos repetidos e de string em tempo de compilação.
- Adicionar um novo tipo de sensor exige atualizar o arquivo `.proto`, regenerar o código e implantar atualizações tanto do servidor quanto do firmware.

## Consequências

- A codificação binária canônica (ESP32 → servidor, nó → log de eventos) usará Protobuf.
- A API HTTP mantém JSON para compatibilidade com navegador, CLI e firmware atual.
- O pacote `packages/protocol` é dono de todos os arquivos `.proto` e do (futuro) código gerado. Nenhum outro pacote define seu próprio formato de fio.
