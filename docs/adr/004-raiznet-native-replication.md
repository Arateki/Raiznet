---
description: ADR 004 — replicação nativa da Raiznet no lugar do Hypercore — log de eventos assinado próprio e conectividade em camadas (sync v1 HTTP, sync v2 iroh).
---

# ADR 004 — Replicação nativa da Raiznet no lugar do Hypercore

**Status:** Aceito  
**Data:** 2026-06

## Contexto

O design original da Raiznet adotava a stack Holepunch como base de replicação: Hypercore (logs assinados somente-anexação), Hyperswarm (descoberta por DHT e hole punching), Autobase (multi-escritor), Hyperdrive (distribuição de conteúdo). Três fatos mudaram o quadro:

1. **Nunca foi integrada.** O nó da Fase 1 é HTTP + SQLite; não existe código Hypercore no projeto.
2. **O nó está migrando para Rust**, mirando hardware ARM pequeno (binário estático, orçamento de ~250 MB de RAM). Não há implementação Rust mantida e protocol-complete do Hypercore 10/11, e não há implementação Rust utilizável do DHT do Hyperswarm. Rastrear um protocolo móvel, definido em JS, a partir de uma segunda linguagem consumiria o projeto sem benefício de produto.
3. **Nenhum nó Raiznet precisa interoperar com o ecossistema JS do Hypercore.** A rede é feita de nós Raiznet; compatibilidade com peers Holepunch não tem caso de uso.

O que a Raiznet de fato exige são três propriedades, não uma stack específica: (a) dados assinados, somente-anexação e verificáveis; (b) descoberta de peers; (c) conectividade através de NAT/CGNAT **sem um gateway central obrigatório**.

## Decisão

**Parte 1 — Dados: log de eventos assinado nativo da Raiznet.**
A fonte da verdade passa a ser um log de eventos somente-anexação por autor, encadeado por hash, com cada evento assinado (Ed25519). O SQLite permanece como índice derivado ([ADR-002](/adr/002-sqlite-cache)); a codificação binária canônica permanece Protobuf quando entrar ([ADR-001](/adr/001-protobuf)). O Hypercore não é usado, portado nem emulado.

**Parte 2 — Conectividade: em camadas, construída sobre uma base Rust existente.**

- **Sync v1 — peers configurados.** Pull HTTP(S) entre peers conhecidos (resumo de `heads` + busca por faixas de `(author, seq)`). Cobre LAN, VPN/Tailscale e nós de IP público com zero dependências novas. Entra primeiro.
- **Sync v2 — transporte de discagem-por-pubkey.** Construído sobre uma base P2P existente em vez de escrito do zero. **Candidato principal: [iroh](https://github.com/n0-computer/iroh)** — IDs de nó Ed25519 (casando com o modelo de identidade da Raiznet), conexões QUIC, hole punching embutido com **relays auto-hospedáveis** e gossip por topic. **Candidato de fallback: rust-libp2p** (Kademlia, mDNS, GossipSub, AutoNAT/DCUtR/Relay v2). A adoção é condicionada a um **spike de campo**: dois nós estabelecendo conectividade sobre links reais de 4G/CGNAT rural, medindo as taxas de conexão direta vs relay.

## Justificativa

- **Ser dono do formato de dados, herdar a rede.** O log de eventos é onde vivem a soberania e as garantias de qualidade científica da Raiznet — ele precisa ser nosso, e é pequeno o suficiente para especificar e testar com um corpus de fixtures. Travessia de NAT, migração de conexão e coordenação de relays são o oposto: complexidade máxima, diferenciação zero, e já resolvidas por projetos Rust mantidos.
- **Relays não são gateways.** O hole punching nunca é 100% — sob CGNAT simétrico (comum em 4G rural), todo sistema (Hyperswarm incluído) recai em relays. Neste design, qualquer nó alcançável da comunidade pode atuar como relay; o tráfego não depende de infraestrutura operada pela Arateki. O princípio do "sem gateway obrigatório" é preservado — o mesmo papel que os nós DHT exercem no Hyperswarm.
- **O local-first não é afetado.** Um nó `local_only` nunca toca em descoberta ou relays; um ESP32 mais um notebook na LAN continua sendo uma Raiznet válida.

## Trade-offs

- Perdemos o DHT global pronto do Hyperswarm; a descoberta começa mais simples (peers configurados, mDNS, depois a descoberta do transporte v2).
- Sem interoperabilidade com peers JS do Hypercore (sem caso de uso conhecido).
- O iroh é pré-1.0 e sua API ainda muda; o risco está contido atrás da fronteira do crate `raiznet-sync`, com rust-libp2p como fallback. O compromisso final com o v2 só acontece após o spike de campo de CGNAT.

## Consequências

- `CLAUDE.md`, `README.md` e estes docs não descrevem mais a stack Holepunch como base; os termos conceituais que sobrevivem (topics, filtros, catálogos, replicação total, semântica somente-anexação) são independentes de transporte e permanecem inalterados.
- O plano de migração Rust implementa isto em fases: log de eventos (Fase 7), sync v1 + v2 (Fase 8), codificação canônica Protobuf (Fase 9) — cada uma com seu próprio plano detalhado antes da execução.
- A distribuição de conteúdo `Material` (antes Hyperdrive) será especificada depois, sobre as mesmas primitivas de log de eventos + transferência.
