# HANDOFF — Rastreamento de trabalho entre agentes

Este arquivo é o ponto de entrada para qualquer agente (Claude, Codex, ou
humano) que vá continuar o trabalho neste repositório. Ele complementa o
`CLAUDE.md` (regras do projeto) com **estado de sessão**: o que está em
andamento, o que falta, e quem fez o quê.

## Protocolo de manutenção (obrigatório)

1. **Leia este arquivo inteiro antes de começar.** Depois leia os documentos
   listados em "Documentos-chave" da frente de trabalho que for tocar.
2. **Antes de encerrar a sessão**, atualize:
   - a seção **Estado atual** (sobrescrever — é um snapshot, não histórico);
   - a seção **Próximos passos** (remover o que concluiu, adicionar o que
     descobriu);
   - o **Log de trabalho** (append-only, entrada nova **no topo**, nunca
     editar entradas anteriores).
3. Formato da entrada de log:
   `### AAAA-MM-DD — <agente/modelo> — <resumo de uma linha>` seguido de
   bullets: o que fez, decisões tomadas (com porquê), o que ficou pela metade.
4. Se abandonar trabalho no meio, diga **exatamente onde parou** (arquivo,
   fase, passo) e o que estava quebrado.
5. Não commitar nada sem o Yan pedir. Registrar no log o que ficou
   uncommitted.

---

## Frente de trabalho ativa: migração do nó para Rust (`raiznetd`)

> **Fluxo de git desta frente (desde 2026-06-12):** o trabalho da migração
> acontece na branch **`rust-migration`**, no worktree
> **`~/Projects/Raiznet-rust`** — a `main` fica livre para as outras frentes
> (site, dashboard, docs). As fases 0–5 já estavam na main antes dessa
> decisão (são aditivas, nada quebra) e a branch nasceu desse ponto.
> Ao fechar um marco (ex.: Fase 6+10 validadas), merge na main.
> Sessões desta frente: trabalhar em `~/Projects/Raiznet-rust`, commitar na
> branch; nunca commitar trabalho Rust direto na main.

### Estado atual (snapshot de 2026-06-12)

- **Fases 0–5 do plano CONCLUÍDAS e commitadas.** O `raiznetd` existe e tem
  paridade de comportamento com o servidor TS, provada pelo corpus:
  - Fase 0: `test-fixtures/` gerados pelo código TS real e validados contra
    o servidor TS rodando (6 casos HTTP + estado SQLite).
  - Fase 1: workspace Cargo (edition 2024), `raiznetd` com `/health`.
  - Fase 2: `raiznet-crypto` — derivações (a) e (b), assinatura Ed25519
    **byte a byte igual ao TS** (vetor), AES-GCM; `identity.mnemonic`
    compatível (migrar TS→Rust preserva a pubkey).
  - Fase 3: `raiznet-store` — DDL verbatim, dedupe idempotente, FK ativa.
  - Fase 4: API HTTP completa, dois listeners com destino explícito,
    corpus de integração (tests/corpus.rs) + replay e2e via curl no
    binário real.
  - Fase 5: regras de domínio (§7.6) + endurecimento `RAIZNET_STRICT_RAW`
    (default ligado; fixture novo post-tampered-plain.json, extensão Rust).
  - **31 testes verdes, clippy -D warnings limpo, cargo fmt aplicado.**
- ADR-004 aceito (2026-06-11): replicação Raiznet-native; Fase 8 = sync v1
  HTTP + sync v2 iroh (gated por spike 4G/CGNAT).
- O servidor TypeScript (`apps/server`) e o firmware (`firmware/safraSense`)
  seguem **congelados** como referência — não editar.
- `estudo-rust/` (raiz): material didático de Rust em PT para o Yan,
  ancorado no código do projeto — manter atualizado quando novos conceitos
  entrarem (ex.: hash chain na Fase 7).
- Divergências aceitas novas registradas na §7.7 do plano: item 10
  (serde_json serializa f64 inteiro como `1800.0`; semântica idêntica).

### Próximos passos (em ordem)

> **Spec de execução:** `RUST_MIGRATION_TASKS.md` (raiz, criada 2026-06-12)
> quebra todo o trabalho restante em 18 tasks com código, verificação, gates
> e mapa de dependências. Os itens abaixo mapeiam para as tasks T9, T2–T7,
> T8, T1 e T10–T17, respectivamente. Agentes executores: partir dela.

1. **Validação com hardware real**: apontar um ESP32 com o firmware atual
   para o `raiznetd` (`cargo run -p raiznetd`, porta 3000) e observar
   registro + telemetria — é o critério final do marco de paridade que não
   dá para cumprir sem o dispositivo físico.
2. **Fase 6** (`small-node`): body limit, batch menor, retenção, paginação
   opcional, PRAGMAs de cache — tudo via env `RAIZNET_*`.
3. **Fase 10** (deploy ARM): build `aarch64-unknown-linux-musl` com
   `cargo-zigbuild` (requer zig instalado), systemd unit, validação no
   OpenStick.
4. CI Rust (`rust-ci.yml`: test + clippy + fmt) — recomendado antes da
   Fase 6.
5. Fases 7–9 exigem plano detalhado próprio antes de executar (event log,
   sync, Protobuf).

### Documentos-chave

| Documento | Papel |
|---|---|
| `RUST_MIGRATION_PLAN.md` | Plano de execução. A **seção 0** tem as regras do executor; a **seção 7** é o contrato normativo (wire format, derivações de chave, API, DDL, vetores). Não implemente nada de memória — confira na seção 7. |
| `CLAUDE.md` | Visão e regras gerais do projeto. ⚠️ Diverge do código em alguns pontos — a seção 7.7 do plano lista as divergências; **o código manda**. |
| `apps/server/src/` | Oráculo de comportamento (TS). Congelado. |
| `firmware/safraSense/src/` | Cliente real. Congelado. `telemetry.cpp buildRaw` define o formato assinado. |

### Avisos críticos (resumo — lista completa na seção 0 do plano)

- A mensagem assinada (`raw`) é uma **string ASCII pipe-delimited**, não
  JSON nem Protobuf. A assinatura cobre só o `raw`; os valores JSON não são
  verificados contra ele (vulnerabilidade conhecida; endurecimento na Fase 5).
- Duplicata de `(device_pubkey, seq)` é **sucesso** (200), não erro. O
  firmware depende disso.
- Telemetria de device desconhecido retorna **207**, nunca 404.
- Derivação de chave do owner no firmware = SHA-256 da string do mnemonic
  (não é BIP-39 padrão). O servidor usa BIP-39/PBKDF2. São incompatíveis;
  ambas devem ser implementadas (seção 7.1 do plano).
- Endpoint local usa `raiznet_private.db` para rotas de devices; o público
  usa `raiznet_public.db`. É assimétrico de propósito.
- Os vetores de teste da seção 7 do plano foram gerados pelo código TS real;
  se um teste com vetor falhar, o erro está na implementação nova, **não no
  vetor**. Para regenerar: rodar Node de dentro de `packages/crypto`
  importando `./dist/keys.js` e `./dist/signing.js` (requer
  `pnpm -C packages/crypto build`).

---

## Frente de trabalho: documentação pública (`docs/` → raiznet.com/docs)

### Estado atual (snapshot de 2026-06-11)

- `docs/` é um site VitePress completo (guide/protocol/reference/ADRs),
  **revisado para refletir o código real**: wire format JSON + `raw` assinado,
  contratos HTTP exatos (200/207/409, duplicata=sucesso), auth local marcada
  como planejada. Tudo que é design (redes, filtros, claims, Protobuf) está
  marcado como "design/planned"; nova página `guide/roadmap.md` separa
  implementado × em design.
- Referências a Hypercore/Hyperswarm como presente/compromisso foram
  removidas; a replicação é descrita de forma agnóstica ("signed event log,
  in design") — compatível com a direção do `RUST_MIGRATION_PLAN.md` sem
  cravar a decisão antes do ADR.
- Config pronta para `raiznet.com/docs`: `base: '/docs/'`, cleanUrls,
  sitemap, favicon/logo copiados de `apps/website/public`. Locales vazios
  (pt/es/zh/ja) removidos do config; `docs/ja/index.md` (única página JA)
  deletado — volta quando houver tradução completa.
- **Bug corrigido**: `.gitignore` ignorava `docs/.vitepress` inteiro — a
  config do site não estava no git e um build de CI sairia sem sidebar/tema.
  Agora ignora só `docs/.vitepress/cache` e `docs/.vitepress/dist`.
- Criado `.github/workflows/deploy-docs.yml` (runner self-hosted, espelha o
  deploy do website; build `@raiznet/docs` + rsync para
  `/opt/home-server/websites/raiznet/docs/dist`). Só roda após commit+push.
- Build validado: `pnpm --filter @raiznet/docs build` verde, sem dead links.
- **Commitado e na `main`** (`docs/`, `deploy-docs.yml`, fix do `.gitignore`).
  O trabalho posterior de SEO + i18n está na frente abaixo.

### Próximos passos (em ordem)

1. No servidor (mesma máquina do runner): adicionar o `location /docs/` no
   nginx apontando para o `DEPLOY_DIR` (precisa de `try_files` com
   `$uri.html` por causa do `cleanUrls`). Snippet registrado na sessão de
   2026-06-11.
2. Push na main (ou `workflow_dispatch`) → deploy automático.
3. Conferir `https://raiznet.com/docs/` (assets, busca local, navegação).

---

## Frente de trabalho: documentação — SEO + i18n (`docs/`, branch `docs-seo-i18n`)

> **Fluxo de git:** branch dedicada **`docs-seo-i18n`** (nasceu de `main`).
> Spec: `docs/superpowers/specs/2026-06-17-docs-seo-i18n-design.md`; plano de
> execução: `docs/superpowers/plans/2026-06-17-docs-seo-i18n.md`.

### Estado atual (snapshot de 2026-06-19)

Plano em ondas. **Onda 0 (infra) concluída e commitada na branch; Ondas 1–3
(traduções) pendentes.**

- **Onda 0 — infra (✅ feita):**
  - SEO com paridade ao `apps/website/SEO_SPEC.md`: `docs/.vitepress/seo.ts`
    (canonical, hreflang + x-default, OG, Twitter, JSON-LD) via `transformHead`;
    `docs/scripts/validate-seo.mjs` que **quebra o build** em regressão;
    og:image PNG 1200×630 (`docs/public/og-image.png`).
  - i18n nativo VitePress: `lib/i18n-routing.ts` (PT na raiz, demais em
    subpath), sidebar/nav como factory por locale; locales **`pt` (root) +
    `en`** ativos. EN preservado em `docs/en/` (22 `.md`).
  - Continuidade site↔docs: `theme/continuity.client.ts` (ponte
    `raiznet-locale` + `raiznet-theme` via localStorage compartilhado) e banner
    `theme/LangSuggestion.vue` (sugestão de idioma sem auto-redirect).
  - Cores alinhadas ao website: `theme/custom.css` (paleta papel/verde-folha).
  - Lado website: `apps/website/src/main.jsx` com links de docs cientes de
    idioma; `robots.txt` do site aponta `Sitemap: …/docs/sitemap.xml`; banner.
  - Build verde: `pnpm --filter @raiznet/docs build` passa com o validador.
- **⚠️ A raiz canônica (`pt-BR`) ainda serve conteúdo em INGLÊS** — os 22
  arquivos da raiz não foram traduzidos. É exatamente o que a Onda 1 resolve.

### Próximos passos (em ordem)

1. **Onda 1 — PT (raiz):** traduzir os 22 `.md` da raiz para português
   (EN já preservado em `docs/en/`). Preservar blocos de código, frontmatter e
   marcações "implemented × design". Yan revisa.
2. **Onda 2 — ES:** criar `docs/es/`, ativar locale `es`.
3. **Onda 3 — JA/ZH:** criar `docs/ja/` e `docs/zh/` com aviso visível de
   "tradução automática — revisão pendente"; ativar locales.
4. Cada onda: rodar o build com validador, commit atômico por onda.
5. Publicar a branch e abrir PR para a `main`.
6. **Pendente manual (Nginx, no merge):** `try_files $uri $uri.html
   $uri/index.html` sob `location /docs/` para os subpaths de idioma
   (`/docs/en/`, etc.) resolverem.

### Avisos

- `theme/index.ts` importa `./custom.css` — manter o arquivo versionado
  (já corrigido; estava untracked e quebraria CI).
- Nada de auto-redirect por `navigator` na raiz (proibido pelo SEO_SPEC); a
  detecção de idioma é só o banner de sugestão.

---

## Log de trabalho (append-only, mais recente primeiro)

### 2026-06-19 — Claude (Opus 4.8, Claude Code) — saneamento da frente docs SEO + i18n

- Auditou o estado da branch `docs-seo-i18n` (13 commits acima da `main`, não
  publicada). Onda 0 (infra SEO + i18n) concluída e commitada; Ondas 1–3
  (traduções PT/ES/JA/ZH) pendentes — a raiz canônica `pt-BR` ainda serve
  conteúdo EN.
- **Correção crítica:** `docs/.vitepress/theme/custom.css` estava **untracked**
  mas é importado por `theme/index.ts` (commitado) → build limpo de CI quebraria
  com módulo ausente. Versionado (`002aa8e`).
- `chore` (`46f3bce`): `apps/website/*.tar.gz` ao `.gitignore` (tarball de build
  do website estava untracked).
- HANDOFF atualizado: nova seção da frente docs SEO + i18n (estado + próximos
  passos por onda + pendente Nginx) e correção da seção "documentação pública"
  (estava "Nada commitado", mas `docs/` e `deploy-docs.yml` já estão na `main`).
- Pendência fora desta frente (deixada uncommitted): `README.md` (remoção de um
  `---`) e a entrada de log "2026-06-12 (3)" + `RUST_MIGRATION_TASKS.md` são da
  frente Rust — decisão do Yan onde commitar.

### 2026-06-12 (3) — Claude (Fable 5, Claude Code) — spec de tarefas da migração restante

- Criado `RUST_MIGRATION_TASKS.md` (raiz): quebra todo o trabalho restante
  da migração em 18 tasks executáveis por outro agente — T1 CI rust-ci.yml,
  T2–T7 Fase 6 (config do profile, body+batch configuráveis, PRAGMAs,
  retenção, paginação, validação de memória/durabilidade), T8 Fase 10
  (deploy ARM/OpenStick), T9 gate ESP32 real, T10–T17 Fases 7–9 (tasks de
  planejamento ADR/plano + implementação, gated), T18 aposentadoria do TS.
  Inclui estado verificado (fases 0–5, hashes) e mapa de dependências.
- Decisões de spec (registradas nela): retenção poda com lock POR LOTE
  (`prune_telemetry_batch`) para não monopolizar o Mutex; paginação com
  cursor exclusivo `?before=` sobre timestamp + `?limit=` clampado 1..=500,
  default intacto (LIMIT 500); defaults sem profile preservam paridade
  (batch 100); CI em ubuntu-latest (self-hosted fica só para deploy); spike
  CGNAT fora do workspace (`spikes/`); Fase 7 propõe ADR-005 com envelope
  canônico binário (não JSON-ordenado) a ratificar.
- Spec conferida contra o código real do worktree (`fresh_state`/`send` do
  corpus.rs, Config/AppState atuais, teto 100 hardcoded em http/telemetry.rs,
  open_db) — tasks referenciam helpers e arquivos existentes, não inventados.
- **Nada commitado.** Arquivo novo está na worktree da main
  (`~/Projects/Raiznet`); decisão do Yan: commitar na main ou mover para a
  branch `rust-migration`.

### 2026-06-12 (2) — Claude (Fable 5, Claude Code) — SEO do website corrigido e verificado em produção

- Bugs achados na análise da `apps/website/SEO_SPEC.md` e corrigidos
  (`48b4a7d`): host canônico era o legado `raiznet.arateki.com` (fallback
  do seo.jsx + `.env.production` trackeado + workflow sem env) → agora
  `https://raiznet.com` nos três níveis, com o validador travando o build
  se o host divergir; PT virou dono da raiz (`/` canônica PT, pt-BR e
  x-default → `/`, `/pt` fora do sitemap, sem auto-troca por navigator);
  og:image SVG → PNG 1200×630.
- Spec reescrita (`e224be9`) para o modelo real: SSG renderToString (sem
  Playwright), PT na raiz, precedência de env do Vite documentada.
- Verificado em produção pós-deploy: canonical/hreflang/sitemap/robots/
  og-image todos em raiznet.com, zero menções ao domínio antigo.
- **Pendência (1 linha, manual no servidor)**: nginx responde
  `301 /en → /en/`; trocar o try_files do site para
  `try_files $uri $uri/index.html $uri/ /index.html;` para servir as URLs
  canônicas sem barra com 200 direto. Snippet também na SEO_SPEC.
- Pendência menor: copy PT do site quase todo sem acentos (pt-BR.js) —
  corrigido só o bloco seo; revisão completa aguarda ok do Yan.
- Pós-deploy manual: enviar sitemap no Google Search Console.

### 2026-06-12 — Claude (Fable 5, Claude Code) — Fases 0–5 da migração Rust executadas

- Executou o plano fase a fase, com commit por fase (Conventional Commits):
  `56572e9` fixtures (Fase 0), `d2fd703` workspace (Fase 1), `d6103cc`
  crypto (Fase 2), `21f067c` store (Fase 3), `494733b` HTTP+domínio
  (Fases 4+5.1), `54d228f` strict raw (Fase 5.2), `74c3a2c` estudo-rust/.
- Verificações: corpus validado contra o servidor TS rodando ANTES de
  escrever Rust; assinatura Rust = TS byte a byte; replay e2e dos fixtures
  contra o binário real (todos os status/bodies idênticos); 31 testes;
  clippy -D warnings limpo.
- Decisões/desvios registrados:
  - raiznetd dividido em lib.rs + main.rs (testes de integração só enxergam
    libs) — padrão idiomático, sem efeito observável.
  - Handlers recebem `Json<Value>` e parseiam com `from_value` para retornar
    400 (paridade com zod/Fastify) em vez do 422 default do axum.
  - Strict check roda APÓS a verificação de assinatura (mensagem de
    assinatura inválida tem prioridade — preserva o corpus).
  - dev-deps novas registradas: `tempfile` (testes de identidade), `tower`
    (oneshot nos testes de integração — exceção já prevista no plano).
  - §7.7 item 10 novo: f64 inteiro serializado como `1800.0` (cosmético).
- Nomenclatura mantida: `apps/server` (TS congelado) + `apps/raiznetd`;
  rename para "server" só na aposentadoria do TS (decisão com o Yan).
- Pendência: validação com ESP32 físico (passo 4.7 parcial — feita via
  replay de fixtures reais, falta o hardware).

### 2026-06-11 (2) — Claude (Fable 5, Claude Code) — ADR-004 aceito; repo inteiro alinhado à decisão

- Yan bateu o martelo: **formato Raiznet-native** (event log assinado
  próprio, Hypercore descartado) e **Fase 8 em duas partes** (sync v1 HTTP
  entre peers configurados; sync v2 dial-by-pubkey com iroh primário /
  rust-libp2p fallback, gated por spike 4G/CGNAT).
- Criado `docs/adr/004-raiznet-native-replication.md` + entrada na sidebar.
- `CLAUDE.md` corrigido em todas as divergências conhecidas (lista da seção
  7.7 do plano incluída): wire format JSON+`raw` (não Protobuf), política
  `default_disposition`/`per_destination` (não `in_local_network`), 60 s,
  lazy registration sem 404, endpoint local sem auth (planejada), stack em
  três tabelas (TS congelado / Rust alvo / comum), árvore real do repo,
  fluxos de ingestão/discovery/sync reescritos, novo item "Decided".
- `README.md`: links quebrados removidos (READMEs traduzidos e logo
  inexistentes), seções Hypercore→Raiznet-native, tabela de tecnologias e
  estrutura atualizadas, roadmap refeito (Fase 2 = `raiznetd`, Fase 3 =
  replicação ADR-004), link de docs → raiznet.com/docs.
- `RUST_MIGRATION_PLAN.md`: Fase 8 formalizada (v1/v2 + gate de spike),
  tabelas das seções 4 e 6 atualizadas (`iroh` registrado, confinado a
  `raiznet-sync`).
- Doc pública religada ao ADR-004 (roadmap, architecture, networks,
  glossary com nova entrada "Relay", overview, ADR-002). Build VitePress
  verde, sem dead links.
- **Nada commitado.**

### 2026-06-11 — Claude (Fable 5, Claude Code) — parecer do plano Rust + doc pública pronta para publicar

- Avaliou o `RUST_MIGRATION_PLAN.md` a pedido do Yan: **viável e pronto para
  execução nas fases 0–6/10**. Ressalvas registradas: a decisão de abandonar
  Holepunch precisa virar ADR + atualização de CLAUDE.md/README; fases 7–9
  exigem planos próprios (o plano já diz); falta job de CI Rust; CGNAT rural
  (4G) torna relays praticamente obrigatórios na Fase 8.
- Auditou `docs/` contra o código congelado e corrigiu todas as páginas
  divergentes (reescritas: public-api, local-api, errors, overview,
  telemetry, stack, architecture, glossary; ajustes: introduction,
  running-a-node, intelligence, identity, privacy, networks,
  device-lifecycle, proto-schemas, ADRs 001–003; nova: guide/roadmap.md).
  Contratos conferidos em `apps/server/src/` e `firmware/safraSense`
  (`buildRaw`: ordem/decimais dos campos).
- Infra de publicação: fix do `.gitignore`, config VitePress com
  `base: '/docs/'`, `deploy-docs.yml` novo, assets de marca em
  `docs/public/`. Build local verde.
- **Nada foi commitado.** Migração Rust não foi iniciada (decisão do Yan
  pendente sobre o parecer).

### 2026-06-09 — Claude (Fable 5, Claude Code) — revisão do plano de migração Rust

- Analisou o `RUST_MIGRATION_PLAN.md` original do Codex e o reescreveu por
  completo, mantendo a estrutura de 10 fases.
- Extraiu do código real os contratos que faltavam: formato do `raw`
  assinado (`firmware/safraSense/src/telemetry/telemetry.cpp:61-76`),
  derivações de chave (`packages/crypto/src/keys.ts`,
  `firmware/.../identity.cpp:221-243`), contratos HTTP exatos
  (`apps/server/src/http/`), DDL SQLite (`apps/server/src/storage/`), regras
  de ingestão (`apps/server/src/domain/telemetry.ts`).
- Gerou vetores de teste executando o código TS real (mnemonic
  "abandon…about" → pubkey `c5785e…`, assinatura Ed25519 determinística,
  vetor AES-256-GCM). Embutidos na seção 7 do plano.
- Descobertas registradas na seção 7.7 do plano: vulnerabilidade raw↔JSON,
  divergência 207-vs-404, derivação de owner não-BIP-39, intervalo de
  telemetria 60 s no código vs 30 s no CLAUDE.md.
- Decisões: alvo de build `aarch64-unknown-linux-musl` estático com
  `cargo-zigbuild` (era `-gnu` no plano original); crates `raiznet-events` e
  `raiznet-sync` só nascem nas suas fases; fases 7–9 exigem plano próprio.
- **Nada foi commitado.** Nenhum código Rust foi escrito. Próximo passo:
  Fase 0 (fixtures).

### 2026-06-09 (anterior) — Codex — versão inicial do plano

- Escreveu a primeira versão do `RUST_MIGRATION_PLAN.md`: estrutura de 10
  fases, stack Rust sugerida, perfil `small-node`, deploy OpenStick.
- Não commitado; sem contratos detalhados nem vetores (adicionados na
  revisão acima).
