<p align="center">
  <!-- logo -->
  <img src="apps/website/public/raiznet-wordmark.svg" alt="Raiznet" width="220" />
</p>

<h1 align="center">raiznet</h1>

<p align="center">
  <a href="https://raiznet.com/docs/">Documentação</a> ·
  <a href="https://raiznet.com">raiznet.com</a>
</p>

<p align="center">
  <em>Rede descentralizada para monitoramento de cultivos e inteligência agrícola coletiva.<br/>
  Local-first. Soberania de dados. Pronta para LLMs.</em>
</p>

<p align="center">
  <a href="#licença"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen" alt="Node" />
  <img src="https://img.shields.io/badge/status-alpha-orange" alt="Status" />
</p>

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Princípios](#princípios)
- [Como funciona](#como-funciona)
- [Inteligência coletiva](#inteligência-coletiva)
- [Tecnologias](#tecnologias)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Começando](#começando)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## Sobre o projeto

A Raiznet é uma rede descentralizada para monitoramento de cultivos e geração de inteligência agrícola coletiva. É parte do ecossistema **SafraSense**, desenvolvido pela [Arateki](https://arateki.com).

Sensores ESP32 instalados em torres, estufas ou canteiros enviam leituras de pH, condutividade elétrica, umidade, temperatura e nível de água para servidores locais. Esses servidores são projetados para se comunicar entre si por um protocolo de replicação próprio — logs de eventos assinados e append-only ([ADR-004](docs/adr/004-raiznet-native-replication.md)) — formando uma malha P2P onde cada nó mantém cópias dos dados públicos da rede. Quando a internet cai, a rede continua funcionando localmente. Quando volta, tudo se sincroniza sozinho. (A camada de replicação está em desenvolvimento — veja o [Roadmap](#roadmap).)

Além do monitoramento, a Raiznet é projetada como infraestrutura de dados de qualidade científica: cada leitura é assinada, imutável, geolocalizada e vinculada ao resultado real da safra. Isso cria as condições para que LLMs — inclusive modelos locais rodando no próprio servidor do agricultor — extraiam conhecimento acionável diretamente dos dados da rede, sem intermediários e sem que os dados saiam do controle do dono.

---

## Princípios

**Local-first.** A rede funciona sem internet. Um sensor e um notebook no mesmo Wi-Fi já formam uma Raiznet válida.

**Soberania de dados.** Cada produtor possui suas próprias chaves criptográficas. Se a Arateki deixar de existir amanhã, os dados do agricultor continuam vivos no nó dele.

**Sem login tradicional.** A identidade é um par de chaves Ed25519 derivado de uma seed phrase BIP-39 gerada localmente. Não há servidor central de autenticação.

**ID público, valor com política própria.** A única informação garantida como pública é a existência do dispositivo na rede — pubkey, MAC e metadados básicos. Cada campo de cada leitura tem uma política de visibilidade individual: publicar em claro, publicar cifrado, ou omitir completamente.

**Dados privados ficam locais.** O que é marcado como privado nunca sai da infraestrutura do dono — fica no servidor local ou no próprio ESP32, acessível apenas por quem tem acesso físico ou a chave privada.

**Escrita sempre assinada.** Ler é consequência de estar na rede. Escrever exige a chave privada do dispositivo que gerou o dado — impede spam sem depender de permissão central.

**Servidor é opcional.** Ninguém é obrigado a rodar um nó. Mas quem roda fortalece a rede.

---

## Como funciona

### Três camadas

```
┌──────────────────────────────────────────────────────┐
│  Borda — ESP32 com sensores (tomada ou bateria)       │
│          Mesh ESP-NOW entre dispositivos              │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│  Malha P2P — nós federados                            │
│  Log de eventos assinado · SQLite · HTTP              │
│  (Raspberry Pi · VPS · Android/Termux · ARM pequeno)  │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│  Visualização — app mobile, web, desktop, CLI         │
└──────────────────────────────────────────────────────┘
```

### Redes federadas por topic

Cada rede pública é identificada por uma string de topic (ex: `raiznet:public:arateki:v1`). Qualquer servidor pode criar uma rede nova ou ingressar em uma existente. A Arateki mantém a rede oficial inicial, mas cooperativas, universidades e coletivos podem criar as suas sem pedir permissão.

Quem cria uma rede é o fundador: publica um `NetworkManifest` assinado com sua chave de User, declarando nome, descrição e qual filtro de curadoria é ativado por padrão para novos membros.

### Privacidade por campo

Cada campo do sensor (pH, EC, temperatura, etc.) tem uma política independente com três disposições possíveis:

- **`PLAIN`** — viaja em claro, visível a todos os pares.
- **`ENCRYPTED`** — cifrado com AES-256-GCM antes de entrar na rede. Só o dono, com sua chave simétrica, consegue ler. Útil para acompanhar à distância sem expor os valores.
- **`OMIT`** — não sai do dispositivo para aquele destino.

A política pode ser diferente por destino: um servidor específico pode ver em claro o que a rede pública vê apenas cifrado.

### Dois endpoints, dois bancos

Um único processo `raiznet-server` expõe duas APIs simultâneas:

| Endpoint | Porta padrão | Acesso | Banco |
|---|---|---|---|
| Público | `:3000` | Qualquer um | `raiznet_public.db` |
| Local | `:3001` | Loopback (auth do dono planejada) | `raiznet_private.db` (visão combinada planejada) |

O isolamento é no nível da conexão: uma query no endpoint público simplesmente não tem acesso ao banco privado.

### Filtros composáveis

Qualquer servidor pode publicar um filtro de MACs — uma lista de dispositivos verificados, sinalizados ou banidos. Os filtros são logs de eventos append-only, descobertos automaticamente no handshake da rede. Clientes combinam os filtros que escolherem (união, interseção, negação) para definir quais dispositivos aparecem em mapas e agregações.

A Arateki mantém o filtro padrão da rede oficial por ser a fundadora. Qualquer outra rede tem a mesma relação com seu fundador. Ninguém tem monopólio de curadoria.

---

## Inteligência coletiva

Cada leitura na rede carrega contexto: qual cultura está plantada, qual a localização H3 do dispositivo, quais foram os parâmetros ajustados, e — ao final da safra — qual foi o resultado real (`yield_kg`). Ao longo do tempo, esse acumulado vira uma memória coletiva do que funciona em cada região e para cada cultura.

### Inferência local com LLMs

Um agricultor com servidor próprio pode apontar qualquer LLM compatível com MCP — inclusive modelos locais como os servidos pelo [Ollama](https://ollama.com) — diretamente no endpoint local do seu nó. O modelo tem acesso ao histórico completo de telemetria, safra ativa, cultura com ranges ideais e resultados anteriores. Toda a inferência acontece offline, sem que nenhum dado saia da rede local.

### Inteligência regional

Nós em rede pública podem consultar dados agregados de dispositivos na mesma célula H3 e mesma cultura — benchmarking contextual, detecção de anomalias, refinamento de estimativa de colheita a partir de resultados reais de outros produtores na mesma região.

### Calibração coletiva de cultura

Se produtores de uma região consistentemente operam fora dos ranges ideais de uma cultura e ainda assim obtêm bom resultado, os ranges estão errados para aquela região. Esse sinal alimenta os `CropCatalog` publicados por servidores: cooperativas e instituições de pesquisa publicam catálogos calibrados a partir de dados observados. A rede gera o conhecimento; os curadores publicam; os produtores ativam.

### Pesquisa acadêmica e publicação

A Raiznet é projetada para ser infraestrutura de pesquisa de qualidade científica. Está planejada a disponibilização de conjuntos de dados agregados e anonimizados para universidades e instituições (como a Embrapa), publicação de estudos em periódicos revisados por pares, e distribuição de materiais técnicos e guias de cultivo diretamente pela camada de conteúdo da rede — assinados pelos autores, acessíveis offline.

---

## Tecnologias

**Nó atual (TypeScript — congelado como referência de comportamento):**

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Linguagem | TypeScript | 5.x |
| HTTP | Fastify | 5.x |
| Armazenamento SQL | better-sqlite3 | 11.x |
| Criptografia | hypercore-crypto (libsodium) | 3.x |
| Seeds BIP-39 | @scure/bip39 | 1.x |
| Validação | zod | 3.x |
| Logger | pino | 9.x |

**Nó alvo (`raiznetd`, Rust — em migração):**

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime / HTTP | tokio + axum | 1.x / 0.8 |
| SQLite | rusqlite (`bundled`) | 0.32+ |
| Criptografia | ed25519-dalek + aes-gcm + bip39 | 2.x / 0.10 / 2.x |
| Conectividade P2P (Fase 8) | iroh (candidato primário) / rust-libp2p (alternativa) | [ADR-004](docs/adr/004-raiznet-native-replication.md) |

**Comum / planejado:**

| Camada | Tecnologia | Status |
|---|---|---|
| Serialização canônica | Protobuf (@bufbuild · prost · nanopb) | planejado, ADR-001 |
| Monorepo | pnpm workspaces | 9.x |
| Geolocalização | h3-js | planejado |
| Desktop | Tauri | 2.x (futuro) |
| Firmware | PlatformIO + Arduino framework | — |

---

## Estrutura do repositório

```
raiznet/
├── apps/
│   ├── server/          # Nó Fastify (TS) — congelado como referência
│   ├── raiznetd/        # Nó Rust (criado na migração)
│   ├── cli/             # Ferramenta de operação e debug
│   ├── website/         # Landing page raiznet.com
│   ├── dashboard/       # Dashboard web
│   └── prototype/       # Design canvas (React + Vite)
├── crates/              # Bibliotecas Rust (criadas na migração)
├── packages/
│   ├── protocol/        # Schemas .proto (formato canônico planejado)
│   ├── crypto/          # Geração de chaves, assinatura, AES-256-GCM
│   └── core/            # Abstrações compartilhadas
├── firmware/
│   ├── safraSense/      # Sensor de referência completo
│   └── esp32-sensor/    # Exemplo mínimo (firmware de produção fica no repo SafraSense)
└── docs/                # Documentação VitePress → raiznet.com/docs
```

---

## Começando

### Requisitos

- Node.js 24 LTS
- pnpm 9+

### Instalação

```bash
git clone https://github.com/arateki/raiznet
cd raiznet
pnpm install
pnpm build
```

### Rodando um nó

```bash
cp apps/server/.env.example apps/server/.env
cd apps/server
node dist/index.js
```

Na primeira execução, o servidor gera um par de chaves Ed25519 a partir de uma seed phrase BIP-39, salva em `DATA_DIR/identity.mnemonic` com permissão `0600`, e imprime a chave pública:

```json
{"pubkey":"641ffb278dc6...","msg":"raiznet server started"}
```

Verificação de saúde:

```bash
curl http://localhost:3000/health
# {"status":"ok","ts":1776819068644}
```

Modo desenvolvimento (reinicia em mudanças de arquivo):

```bash
pnpm --filter @raiznet/server dev
```

Consulte [Running a Node](https://raiznet.com/docs/guide/running-a-node) para a lista completa de variáveis de ambiente.

---

## Roadmap

- [x] **Fase 1** — Monorepo, TypeScript estrito, identidade Ed25519/BIP-39, ingestão de telemetria assinada (JSON + string `raw` assinada), dual endpoints (público + local), dois bancos SQLite, testes unitários e de integração, firmware de referência (captive portal, registro lazy, retransmissão até confirmação).
- [ ] **Fase 2** — Nó Rust (`raiznetd`): paridade de comportamento com o nó TS provada por corpus de fixtures, binário estático para ARM pequeno, perfil `small-node` (ver `RUST_MIGRATION_PLAN.md`).
- [ ] **Fase 3** — Replicação Raiznet-native ([ADR-004](docs/adr/004-raiznet-native-replication.md)): log de eventos assinado como fonte de verdade, sync v1 entre peers configurados, sync v2 dial-by-pubkey (iroh como candidato primário), redes/filtros/CropCatalog.
- [ ] **Fase 4** — Mesh ESP-NOW: gateways, janelas de sincronização para sensores a bateria, relay entre dispositivos sem Wi-Fi direto; Protobuf como formato canônico.
- [ ] **Fase 5** — App e conteúdo: Tauri desktop, materiais instrutivos pela camada de conteúdo da rede, app mobile.
- [ ] **Fase 6** — Camada de inteligência: MCP server (`@raiznet/mcp`), agregações regionais por H3, calibração coletiva de Cultura, parcerias de pesquisa acadêmica.

---

## Contribuindo

A Raiznet está em estágio alpha e contribuições são bem-vindas. Antes de abrir um PR:

1. Leia o [CLAUDE.md](CLAUDE.md) — contém as convenções de arquitetura e código.
2. Para mudanças grandes de arquitetura, abra primeiro um ADR em `docs/adr/`.
3. Use Conventional Commits (`feat:`, `fix:`, `refactor:`).
4. Rode `pnpm test` antes de enviar.

Dúvidas e ideias nas [Issues](https://github.com/arateki/raiznet/issues).

---

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Feito com ciência, terra e código aberto por <a href="https://arateki.com">Arateki</a>.
</p>
