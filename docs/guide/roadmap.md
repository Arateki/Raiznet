---
description: O mapa honesto da Raiznet — o que está implementado hoje, o que está em design e o que é futuro, da ingestão de telemetria à replicação entre nós.
---

# Roadmap

A Raiznet é pré-1.0. Esta página é o mapa honesto do que existe versus o que está projetado — todas as outras páginas destes docs marcam os recursos em estágio de design conforme o caso.

## Implementado hoje

- **Ingestão de telemetria assinada** — assinatura Ed25519 sobre uma [string raw](/protocol/telemetry#a-string-raw-assinada) determinística, verificada contra a chave registrada do dispositivo; ingestão em lote idempotente.
- **Registro de dispositivos** — `POST /v1/devices` com registro preguiçoso (lazy) feito pelo firmware.
- **Privacidade por campo** — disposições `plain` / `encrypted` / `omit` com overrides por destino, aplicadas na ingestão ([Modelo de privacidade](/protocol/privacy)).
- **Endpoints duplos, bancos duplos** — público (`:3000`, `raiznet_public.db`) e local (`:3001`, `raiznet_private.db`) em um processo, isolados no nível do banco.
- **Identidade do nó** — mnemônico BIP-39 em `DATA_DIR/identity.mnemonic`, par de chaves Ed25519 derivado deterministicamente.
- **Firmware de referência** — provisionamento por portal cativo no ESP32, identidade do dono BIP-39, gestão de `seq` consciente do desgaste da flash, retransmissão até confirmação.

## Em design

Estes estão especificados (nesta documentação e em ADRs) mas não implementados. Detalhes podem mudar:

- **Nó em Rust (`raiznetd`)** — reimplementação do nó com paridade de comportamento, como um único binário estático, mirando placas ARM muito pequenas sem dependências de runtime.
- **Log de eventos assinado** — log somente-anexação, encadeado por hash, por nó, como fonte da verdade, com o SQLite reconstruído a partir dele como índice derivado ([ADR-002](/adr/002-sqlite-cache)).
- **Replicação nó a nó** ([ADR-004](/adr/004-raiznet-native-replication)) — sync v1: pull HTTP entre peers configurados (LAN, VPN, IP público); sync v2: transporte de discagem-por-pubkey construído sobre uma base P2P em Rust já existente (iroh como candidato principal, validado em links reais de 4G/CGNAT rural antes da adoção), com relays operados pela comunidade — nunca um gateway privilegiado.
- **Redes, filtros e catálogos** — topics, `NetworkManifest`, filtros de MAC componíveis, `CropCatalog` ([Redes e filtros](/protocol/networks)).
- **Autenticação do endpoint local** — challenge-response do dono com a chave de Usuário ([API local](/reference/local-api)).
- **Visão combinada do dono** — fusão das leituras pública + privada por `(device_pubkey, seq)` no endpoint local.
- **Codificação canônica em Protobuf** — formato de fio binário a partir dos schemas em [Schemas Protobuf](/reference/proto-schemas); o JSON permanece por compatibilidade ([ADR-001](/adr/001-protobuf)).
- **Endurecimento da ingestão** — verificação cruzada estrita entre a string raw assinada e os campos de conveniência do JSON.
- **Malha de dispositivos ESP-NOW** — sensores a bateria fazendo relay através de vizinhos alimentados pela tomada.

## Futuro

- **DeviceClaim / DeviceTransfer** — eventos da cadeia de propriedade ([Ciclo de vida do dispositivo](/protocol/device-lifecycle)).
- **App desktop (Tauri)** empacotando um nó completo, e um app mobile.
- **Camada de inteligência** — servidor MCP sobre o endpoint local, agregações regionais, calibração coletiva de cultivos ([Inteligência coletiva](/guide/intelligence)).

## Política de compatibilidade

Os contratos documentados nas páginas [API pública](/reference/public-api) e [Telemetria](/protocol/telemetry) são tratados como congelados para a geração atual de firmware: mudanças que quebrariam um dispositivo em campo (códigos de status, semântica de duplicatas, a gramática da string raw) só são feitas atrás de versionamento explícito.
