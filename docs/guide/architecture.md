---
description: As três camadas da Raiznet — sensores ESP32 na borda, nós servidores na malha e clientes de visualização — e o que roda hoje versus o que está em design.
---

# Arquitetura

A Raiznet é organizada em três camadas. Esta página distingue o que roda **hoje** do que está **em design** — veja o [Roadmap](/guide/roadmap) para o quadro completo.

## Camada de borda — sensores ESP32

Todos os dispositivos rodam o mesmo firmware base. O modo é determinado por configuração, não por hardware:

| Modo | Energia | Comportamento |
|---|---|---|
| `sensor_mains` | Tomada | Sempre ligado, mantém o Wi-Fi ativo; futuro relay ESP-NOW para vizinhos |
| `sensor_battery` | Bateria | Dorme a maior parte do tempo, acorda no horário agendado |
| `gateway` | Tomada | Apenas relay — faz a ponte de dispositivos ESP-NOW para o Wi-Fi (planejado) |

Todo dispositivo tem o mesmo modelo de identidade: um par de chaves Ed25519 nascido no provisionamento (TRNG do hardware), guardado na flash, usado para assinar cada pacote de telemetria. O firmware de referência também gera a identidade do dono a partir de um mnemônico BIP-39 no seu portal cativo — veja [Ciclo de vida do dispositivo](/protocol/device-lifecycle).

## Camada de malha — nós servidores

Cada servidor é um par (peer). Não existe "servidor principal". O que um nó faz **hoje**:

- Recebe telemetria assinada via HTTP (`POST /v1/telemetry`) e valida cada assinatura
- Aplica a [política de privacidade](/protocol/privacy) por campo na ingestão
- Armazena as leituras em **dois bancos SQLite locais** (público / privado)
- Expõe a API HTTP em duas portas: uma pública, uma local

**Em design** ([ADR-004](/adr/004-raiznet-native-replication)): os nós passarão a persistir os dados públicos como um log de eventos assinado e somente-anexação, replicando-o ponto a ponto com outros nós da mesma [rede](/protocol/networks) — primeiro entre peers configurados via HTTP, depois por um transporte de discagem-por-pubkey com relays operados pela comunidade. A replicação ainda não está implementada — hoje, os nós são independentes.

Um servidor pode rodar em qualquer lugar onde o Node.js roda: VPS, Raspberry Pi, Mini PC, Android via Termux. Uma reimplementação do nó em Rust (`raiznetd`) está em andamento para mirar placas ARM muito pequenas com um binário estático — veja o [Roadmap](/guide/roadmap).

### Endpoints duplos em um processo

Um único processo de servidor expõe duas interfaces HTTP:

| Endpoint | Porta padrão | Bind | Rotas de devices acessam | Auth |
|---|---|---|---|---|
| Público | `:3000` | `0.0.0.0` | `raiznet_public.db` | Nenhuma (só dados públicos) |
| Local | `:3001` | `127.0.0.1` | `raiznet_private.db` | Ainda nenhuma — **planejado:** challenge-response do dono |

::: warning
Até a autenticação do dono entrar, a única proteção do endpoint local é o seu bind de loopback. Acesse-o remotamente via Tailscale/VPN — nunca o exponha diretamente.
:::

### Dois bancos de dados

| Banco | Alimentado por | Contém | Servido por |
|---|---|---|---|
| `raiznet_public.db` | Ingestão pública (replicação planejada) | Dispositivos e leituras publicáveis em redes | Endpoint público |
| `raiznet_private.db` | Apenas ingestão local | Dispositivos `local_only` + campos mantidos fora do lado público | Apenas endpoint local |

**Segurança por isolamento:** uma consulta no endpoint público não consegue retornar dados privados porque a conexão com o banco privado simplesmente não está disponível para ela. O isolamento é imposto no nível do banco, não na camada de API.

## Camada de cliente

| Cliente | Descrição | Status |
|---|---|---|
| CLI | Ferramenta de operação e depuração | No repositório |
| Dashboard web | Interface de visualização | No repositório |
| Gateway público | Um nó exposto na internet — apenas mais um peer, sem dados privilegiados | Planejado |
| App desktop (Tauri) | Empacota um nó completo + UI, funciona offline | Fase futura |
| App mobile | React Native ou Capacitor | Fase futura |
