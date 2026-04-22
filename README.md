<p align="center">
  <!-- logo -->
  <img src="docs/assets/raiznet-logo.svg" alt="Raiznet" width="160" />
</p>

<h1 align="center">raiznet</h1>

<p align="center">
  <strong>Português</strong> ·
  <a href="README.en.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a>
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

Sensores ESP32 instalados em torres, estufas ou canteiros enviam leituras de pH, condutividade elétrica, umidade, temperatura e nível de água para servidores locais. Esses servidores se comunicam entre si via protocolo Hypercore, formando uma malha P2P onde cada nó mantém cópias dos dados públicos da rede. Quando a internet cai, a rede continua funcionando localmente. Quando volta, tudo se sincroniza sozinho.

Além do monitoramento, a Raiznet é projetada como infraestrutura de dados de qualidade científica: cada leitura é assinada, imutável, geolocalizada e vinculada ao resultado real da safra. Isso cria as condições para que LLMs — inclusive modelos locais rodando no próprio servidor do agricultor — extraiam conhecimento acionável diretamente dos dados da rede, sem intermediários e sem que os dados saiam do controle do dono.

---

## Princípios

**Local-first.** A rede funciona sem internet. Um sensor e um notebook no mesmo Wi-Fi já formam uma Raiznet válida.

**Soberania de dados.** Cada produtor possui suas próprias chaves criptográficas. Se a Arateki deixar de existir amanhã, os dados do agricultor continuam vivos no nó dele.

**Sem login tradicional.** A identidade é um par de chaves Ed25519 derivado de uma seed phrase BIP-39 gerada localmente. Não há servidor central de autenticação.

**ID público, valor com política própria.** A única informação garantida como pública é a existência do dispositivo na rede — pubkey, MAC e metadados básicos. Cada campo de cada leitura tem uma política de visibilidade individual: publicar em claro, publicar cifrado, ou omitir completamente.

**Dados privados ficam locais.** O que é marcado como privado não entra no swarm — fica no servidor local do dono ou no próprio ESP32, acessível apenas por quem tem acesso físico ou a chave privada.

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
│  Malha P2P — servidores Node.js federados             │
│  Hypercore + Hyperswarm · SQLite · Fastify            │
│  (Raspberry Pi · VPS · Android/Termux · Tauri)        │
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
| Local | `:3001` | Dono autenticado | `raiznet_public.db` + `raiznet_private.db` |

O isolamento é no nível da conexão: uma query no endpoint público simplesmente não tem acesso ao banco privado.

### Filtros composáveis

Qualquer servidor pode publicar um filtro de MACs — uma lista de dispositivos verificados, sinalizados ou banidos. Os filtros são Hypercores append-only, descobertos automaticamente no handshake da rede. Clientes combinam os filtros que escolherem (união, interseção, negação) para definir quais dispositivos aparecem em mapas e agregações.

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

A Raiznet é projetada para ser infraestrutura de pesquisa de qualidade científica. Está planejada a disponibilização de conjuntos de dados agregados e anonimizados para universidades e instituições (como a Embrapa), publicação de estudos em periódicos revisados por pares, e distribuição de materiais técnicos e guias de cultivo diretamente pela rede via Hyperdrive — assinados pelos autores, acessíveis offline.

---

## Tecnologias

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 24 LTS |
| Linguagem | TypeScript | 5.x |
| HTTP | Fastify | 5.x |
| Log P2P | hypercore | 11.x |
| Descoberta de peers | hyperswarm | 4.x |
| Índice P2P | hyperbee | 2.x |
| Sistema de arquivos P2P | hyperdrive | 11.x |
| Multi-writer | autobase | 7.x |
| Criptografia | hypercore-crypto + sodium-universal | — |
| Serialização (Node.js) | @bufbuild/protobuf | — |
| Serialização (ESP32) | nanopb | — |
| Índice SQL | better-sqlite3 | — |
| Validação | zod | 3.x |
| Logger | pino | 9.x |
| Monorepo | pnpm workspaces | 9.x |
| Desktop | Tauri | 2.x (futuro) |
| Geolocalização | h3-js | — |
| Seeds BIP-39 | @scure/bip39 | — |
| Firmware | PlatformIO + Arduino framework | — |

---

## Estrutura do repositório

```
raiznet/
├── apps/
│   ├── server/          # Nó completo Fastify
│   └── cli/             # Ferramenta de operação e debug
├── packages/
│   ├── protocol/        # Schemas .proto + TS gerado + validadores Zod
│   ├── crypto/          # Geração de chaves, assinatura, AES-256-GCM
│   └── core/            # Abstrações sobre hypercore/autobase (futuro)
├── firmware/
│   └── esp32-sample/    # Implementação de referência (firmware de produção fica no repo SafraSense)
└── docs/                # Documentação VitePress
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

Consulte [Running a Node](https://raiznet.arateki.com/guide/running-a-node) para a lista completa de variáveis de ambiente.

---

## Roadmap

- [x] **Fase 1** — Monorepo, TypeScript estrito, identidade Ed25519/BIP-39, protocolo Protobuf, ingestão de telemetria, dual endpoints (público + local), testes unitários e de integração.
- [ ] **Fase 2** — Integração Hypercore/Hyperswarm: replicação P2P real, indexador Hypercore → SQLite, filtros de MAC como Hypercores, CropCatalog publicados por servidores.
- [ ] **Fase 3** — Firmware ESP32: sensor real enviando telemetria assinada, avaliação offline de Cultura, alertas físicos (LED/buzzer), buffer circular.
- [ ] **Fase 4** — Mesh ESP-NOW: gateways, janelas de sincronização para sensores a bateria, relay entre dispositivos sem Wi-Fi direto.
- [ ] **Fase 5** — App e conteúdo: Tauri desktop, Hyperdrive para materiais instrutivos, app mobile.
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
