# Design — SEO + i18n na documentação (VitePress), uniforme com raiznet.com

**Data:** 2026-06-17
**Escopo:** `docs/` (portal VitePress publicado em `raiznet.com/docs/`)
**Relacionado:** `apps/website/SEO_SPEC.md` (contrato de SEO do site), memórias `project-website-seo`, `project-docs-portal`.

## Objetivo

Dar à documentação o mesmo nível de SEO do site e um i18n que espelha a
estratégia do site (idioma padrão na raiz, demais em subpath), de modo que site
e docs pareçam um único domínio uniforme: mesmas cores (já feito), mesmos
idiomas, mesma convenção de URL, continuidade de idioma e de tema ao navegar
entre os dois.

## Decisões fixadas (com o Yan, 2026-06-17)

1. **PT na raiz**, espelhando o site. `/docs/` = PT canônico; demais idiomas em subpath.
2. **5 idiomas ativos**: PT, EN, ES, JA, ZH (os mesmos do site). Cada idioma só
   entra no config/seletor quando 100% traduzido (locale incompleto = 404).
3. **SEO com paridade total** ao `SEO_SPEC.md` (canonical, hreflang+x-default,
   og:image PNG, Twitter, JSON-LD, robots, validador que quebra o build).
4. **Integração completa de idioma** site ↔ docs via `localStorage` compartilhado
   (`raiznet-locale`) + cross-links que preservam idioma.
5. **Sincronizar também o tema** dark/light (`raiznet-theme`) entre site e docs.
6. **Detecção de idioma do navegador via banner de sugestão** (não auto-redirect),
   no site e na docs, quando nenhuma preferência foi salva.

## 1. Estrutura de URLs e arquivos (i18n nativo do VitePress)

PT é o locale **root** (sem prefixo); os demais ganham subpath:

| Idioma | URL | Locale (lang) | Arquivos |
|---|---|---|---|
| PT (root, canônico, `x-default`) | `/docs/` | `pt-BR` | `docs/guide/…` (atuais, traduzidos p/ PT) |
| EN | `/docs/en/` | `en` | `docs/en/guide/…` |
| ES | `/docs/es/` | `es` | `docs/es/…` |
| JA | `/docs/ja/` | `ja` | `docs/ja/…` |
| ZH | `/docs/zh/` | `zh-CN` | `docs/zh/…` |

Mapa locale↔lang idêntico ao do site (`apps/website/src/lib/i18n-routing.js`):
`pt→pt-BR`, `en→en`, `es→es`, `ja→ja-JP` (HTML lang `ja`), `zh→zh-CN`.

**Movimento inicial:** copiar a raiz atual (que hoje está em EN) para `docs/en/`
para preservar o EN pronto; depois traduzir a raiz para PT. Os 22 `.md`:
`index.md`, `guide/*` (6), `protocol/*` (6), `reference/*` (5), `adr/*` (4).

**Config:** `locales` no `config.ts` com `label`, `lang`, `link`, e **sidebar +
nav traduzidos por idioma** (os rótulos "Guide", "Protocol", "Reference", "ADR"
e os títulos dos itens). A sidebar atual vira uma função/factory parametrizada
por prefixo de locale para não duplicar a estrutura à mão.

## 2. SEO — paridade com o SEO_SPEC via `transformHead`

O VitePress já entrega HTML estático por página e `sitemap` (já configurado com
`hostname: https://raiznet.com/docs/`). O restante é injetado no hook
`transformHead(context)` do `config.ts`, que roda por página no build e tem
acesso a `pageData`, `siteData` e à URL relativa:

- **canonical** — `<link rel="canonical">` absoluto, host `https://raiznet.com`,
  caminho `/docs/<...>` normalizado (sem barra final inconsistente).
- **hreflang** — `<link rel="alternate" hreflang>` **auto-referente e
  bidirecional** para os 5 idiomas + `x-default`→PT. O path equivalente em cada
  locale é derivado da URL atual trocando o prefixo de locale (PT = sem prefixo).
- **Open Graph** — `og:title`, `og:description`, `og:url` (= canonical),
  `og:type`, `og:site_name` ("Raiznet Docs"), `og:locale` (`pt_BR`, `en_US`, …),
  `og:image` (+ `:type/:width/:height/:alt`).
- **Twitter** — `summary_large_image` + title/description/image.
- **JSON-LD** — `WebSite` (com `inLanguage` por página) e `BreadcrumbList`
  derivado da hierarquia da sidebar. Nunca declarar o que não está na página.
- **og:image PNG 1200×630** — `docs/public/og-image.png`, gerado de um SVG
  (`docs/public/og-image.svg`) com `rsvg-convert`, mesma identidade visual do
  site. SVG não renderiza em redes sociais (regra do SEO_SPEC).

`title`/`description` por página: usar frontmatter quando existir; senão derivar
do H1 + descrição padrão do site. Limites do SEO_SPEC (title ≤60, description
140–160) verificados pelo validador.

**robots.txt** — vive na **raiz do domínio**, servida pelo *site*, não pela docs
(bots leem `raiznet.com/robots.txt`). Portanto: a docs gera só seu
`sitemap.xml` (nativo, já configurado) e adiciona-se ao `robots.txt` do site a
linha `Sitemap: https://raiznet.com/docs/sitemap.xml`. (Ação no `apps/website`.)

**Validador** — `docs/scripts/validate-seo.mjs`, espelhando
`apps/website/scripts/validate-seo.mjs`. Roda após `vitepress build`, varre
`docs/.vitepress/dist/**/*.html` e **falha o build** se:
- não houver exatamente 1 canonical / 1 title / 1 description por página;
- o host do canonical/og:url não for `https://raiznet.com`;
- o hreflang não for completo (5 idiomas + x-default, x-default e pt-BR → raiz);
- `og:image` não for o PNG (com width/height) ou faltar `twitter:card`/JSON-LD;
- o sitemap contiver o prefixo do idioma padrão (`/docs/pt/`) ou faltar canônica.

Plugado no script `build` da docs: `vitepress build && node scripts/validate-seo.mjs`.

## 3. Continuidade de idioma e tema site ↔ docs

Ambos vivem em `raiznet.com`, então compartilham `localStorage`. Reaproveita-se
o que o site já usa (`apps/website/src/main.jsx`):

- **`raiznet-locale`** (valor = locale completo, ex. `en-US`). Script client-only
  no tema da docs (`docs/.vitepress/theme/index.ts`): ao montar, lê a chave; se o
  locale salvo ≠ locale da página, faz `history.replaceState` para o equivalente
  na docs. **Mesma regra do site:** nunca auto-troca por `navigator`, só
  re-localiza pela preferência salva; sem preferência fica em PT (root canônico).
- **Seletor da docs grava a mesma chave:** hook que, ao trocar idioma no seletor
  nativo do VitePress, grava `raiznet-locale` para o site respeitar na volta.
- **`raiznet-theme`** (valor `light`|`dark`): ponte client-only entre essa chave e
  a chave nativa do VitePress (`vitepress-theme-appearance`). Ao carregar, aplica
  o tema salvo; ao alternar na docs, grava `raiznet-theme`. Mantém dark/light
  uniforme entre os dois.
- **Cross-links preservam idioma:** o nav de cada locale aponta para o site no
  idioma certo (`https://raiznet.com/en` no EN, `https://raiznet.com/` no PT). No
  sentido site→docs, ajustar `docsUrl` (`apps/website/src/main.jsx:36`, hoje fixo
  `/docs/`) para resolver `/docs/<lang>/` conforme o locale ativo (PT → `/docs/`).

## 3.5. Detecção de idioma do navegador (banner de sugestão)

Atende o pedido de "detectar o idioma quando nada foi salvo" **sem violar a regra
de SEO** (nada de auto-redirect/auto-render por `navigator` — a raiz serve PT
canônico e determinístico para o crawler). Em vez de redirecionar, **sugere**:

- Dispara apenas quando **não há `raiznet-locale` salvo** E o melhor casamento de
  `navigator.languages` ≠ idioma da página atual.
- Mostra um banner discreto, dispensável, do tipo *"Esta página também está em
  Español — ver?"* (texto no idioma detectado + no idioma da página). Aceitar
  navega para o equivalente e grava `raiznet-locale`; dispensar grava um flag para
  não reaparecer.
- **Client-only**, renderizado após a hidratação — não altera o HTML
  prerenderizado nem o canonical; o Googlebot vê a página inalterada.
- Reaproveita `preferredLocaleFromNavigator` (já existe em
  `apps/website/src/lib/i18n-routing.js`) no site; a docs usa a mesma lógica de
  casamento `navigator → locale`.

**Toca os dois apps:** componente de banner no site (`apps/website`) e equivalente
no tema da docs (`docs/.vitepress/theme/`). Como `raiznet-locale` é compartilhado,
aceitar/dispensar em um vale para o outro.

## 4. Estratégia de tradução (88 arquivos: 22 × PT/ES/JA/ZH)

Cada locale entra no config/seletor **somente quando 100% traduzido** — nunca
404. Execução em ondas, cada uma com commits atômicos próprios:

1. **Onda 0 — infra:** mover EN→`/docs/en/`, configurar locales (só EN ativo),
   SEO completo, continuidade idioma+tema, validador, og:image. Entregável e
   testável sem nenhuma tradução nova.
2. **Onda 1 — PT** (Yan revisa; idioma do projeto) → ativa o root.
3. **Onda 2 — ES.**
4. **Onda 3 — JA e ZH** (técnico). **Publicados ativos**, mas com um **aviso
   visível no topo de cada página** desses locales (custom container / banner do
   tema): "Tradução automática — revisão por falante nativo pendente." O aviso é
   localizado (texto em JA/ZH) e some quando a revisão for concluída.

Traduções feitas por mim, arquivo a arquivo, preservando blocos de código,
frontmatter e marcações "implemented × design" intactos.

## 5. Deploy e Nginx

`deploy-docs.yml` não muda (build → rsync de `dist/`). Ajuste **manual** no Nginx
do servidor (mesma natureza dos pendentes já registrados na memória): garantir
que `/docs/en/`, `/docs/es/`, etc. resolvam sob `location /docs/` com
`try_files $uri $uri.html $uri/index.html`. Snippet documentado no spec/HANDOFF.

## 6. Testes / verificação

- `pnpm --filter @raiznet/docs build` passa **com o validador** acoplado.
- `grep` de canonical/hreflang/og em páginas de amostra por idioma no `dist/`.
- Sem `raiznet-locale` → docs em PT; com `en-US` salvo → redireciona `/docs/en/`.
- `raiznet-theme=dark` salvo no site → docs abre em dark.

## Não-objetivos (YAGNI)

- **Auto-redirect por `navigator`** na raiz ou em páginas canônicas: proibido pelo
  SEO_SPEC. A detecção de idioma é só sugestão via banner (§3.5).
- Fundir site e docs sob um mesmo prefixo de idioma (`/en/docs/`): inviável (apps
  e deploys separados). A uniformidade é por convenção e cross-links, não por
  rota compartilhada.
- SSR por request; preview social dinâmico; tradução de termos por glossário
  automatizado.

## Riscos / pontos de atenção

- **Volume de tradução** é a maior fatia; ondas isolam o risco e evitam 404.
- **JA/ZH** difíceis de o Yan revisar — marcar como provisórios.
- **Host canônico** é crítico (lição do site): o validador trava o build se o host
  sair errado.
- **srcExclude:** este spec mora em `docs/superpowers/` — adicionar
  `srcExclude: ['superpowers/**']` no `config.ts` para o VitePress não publicá-lo.
