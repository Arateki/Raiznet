# SEO Portable Spec — SPA React/Vite com i18n e prerender

Spec para replicar a estratégia de SEO dos sites da Arateki em outro repositório com tecnologias semelhantes. Assume uma SPA React/Vite com i18n, rotas públicas e deploy estático atrás de Nginx ou CDN. A implementação de referência é `apps/website` deste repo (raiznet.com).

## Objetivo

Entregar HTML rastreável e compartilhável para buscadores, redes sociais e crawlers de IA sem migrar para SSR completo, com **um idioma padrão dono da raiz do domínio** (aqui: PT) e os demais idiomas em subpaths.

O resultado esperado:

- O idioma padrão na raiz: `/` é a página PT canônica.
- Demais idiomas por subpath: `/en`, `/es`, `/zh`, `/ja`.
- Metadata por rota: title, description, canonical, hreflang, Open Graph e Twitter.
- HTML prerenderizado em `dist/` (SSG em build, sem browser).
- Sitemap e robots coerentes com o host canônico.
- JSON-LD básico quando houver conteúdo compatível.
- Deploy servindo arquivos prerenderizados antes do fallback SPA.

## Decisões centrais

**1. Fonte única de metadata.** O template `index.html` é um shell mínimo; cada página React renderiza seu componente `Seo`; o prerender grava o HTML final. Nunca colocar title/description/OG/canonical/hreflang ricos no template base — gera metadata duplicada quando o React injeta as tags.

**2. O idioma padrão mora na raiz — sem redirect.** `/` serve o conteúdo PT diretamente, com `canonical` para si mesma. Não existe `/<default-lang>` como URL canônica (aqui, `/pt` não existe no sitemap; se acessada, normaliza para `/`). Isso concentra todos os sinais do idioma principal na URL mais forte do domínio.

**3. A raiz nunca troca de idioma sozinha.** Proibido auto-redirect/auto-render por `navigator.language` na raiz: o Googlebot renderiza páginas como `en-US` e veria a raiz "virar" outro idioma, conflitando com o canonical PT prerenderizado. O Google desaconselha redirect por locale. O visitante troca pelo seletor de idioma; a escolha vai para `localStorage` e só ela re-localiza visitas futuras.

**4. O host canônico é configuração crítica.** Canonical, hreflang, og:url, sitemap e robots derivam todos de `SITE_URL`. Um host errado aqui sabota a indexação inteira (o site declara que a versão canônica vive em outro domínio). Ver "Host canônico" abaixo.

## Escopo

Obrigatório:

- `Seo` component (uma fonte para head tags).
- Helpers de URL/canonical/i18n (`langPath` com default-na-raiz).
- i18n na URL (exceto idioma padrão).
- `robots.txt` e `sitemap.xml` gerados no build.
- Prerender SSG (vite build --ssr + renderToString).
- Validação do HTML gerado (falha o CI em regressão).
- OG image **PNG** 1200×630.
- Ajuste de deploy.

Opcional:

- JSON-LD `Organization`, `WebSite`, `FAQPage`, `BreadcrumbList`.
- Preload da fonte principal (peso regular, `font-display: swap`).
- Prerender dinâmico de páginas vindas de API/CMS.

Fora de escopo:

- Migração para Next.js, Remix ou Vike; SSR por request.
- Preview social dinâmico por usuário.

## Rotas e i18n

```ts
export const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'] as const;
export type LangCode = typeof SUPPORTED_LANGS[number];
export const DEFAULT_LANG: LangCode = 'pt';
```

O helper central — o idioma padrão NÃO ganha prefixo:

```ts
export function langPath(lang: LangCode, path = '/'): string {
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return cleaned;        // PT: '/' e '/about'
  if (cleaned === '/') return `/${lang}`;           // outros: '/en'
  return `/${lang}${cleaned}`;                      //         '/en/about'
}
```

Routing resultante:

```txt
/                  -> Home PT (canônica do idioma padrão)
/about             -> página PT
/en, /en/about     -> EN
/es, /zh, /ja      -> idem
/pt, /pt/...       -> LEGADO: normalizar para a versão sem prefixo
                      (301 no servidor; client-side replaceState como fallback —
                      e o canonical já aponta para a raiz de qualquer forma)
/admin, /manage    -> sem prefixo de idioma e noindex
```

## Host canônico (`SITE_URL`)

```ts
export const SITE_URL = (
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? 'https://raiznet.com'
).replace(/\/+$/, '');
```

Regras aprendidas a ferro:

- O default no código deve ser o **domínio real de produção**, nunca um placeholder.
- Atenção à precedência do Vite: env do processo > `.env.production` > default no código. **Um `.env.production` trackeado com host antigo silenciosamente envenena todos os builds** — se o arquivo existir, ele é parte do contrato e entra na revisão de qualquer mudança de domínio.
- Defina a env também no workflow de deploy (cinto e suspensório).
- A validação de build (abaixo) compara o canonical gerado com o host esperado — mudança acidental de host quebra o CI, não a indexação.

## Metadata

`Seo` component emite, por rota:

- `<title>` (≤ 60 caracteres) e `meta name="description"` (140–160 caracteres, frase completa — o Google trunca além disso). **Ortografia perfeita, com acentos**: é o snippet que aparece na busca.
- `link rel="canonical"` — sempre a URL normalizada por `langPath` (PT cai na raiz mesmo se a URL visitada for `/pt`).
- `link rel="alternate" hreflang="..."` para **todos** os idiomas + `x-default`:
  - hreflang é **auto-referente e bidirecional**: cada página lista a si mesma e todas as alternativas; o conjunto é idêntico em todas.
  - `x-default` aponta para a **versão do idioma padrão** (a raiz) — é o que buscadores mostram a quem não casa com nenhum idioma listado.
  - Códigos: `pt-BR`, `en`, `es`, `zh-CN`, `ja`.
- `meta name="robots"`: `index, follow, max-image-preview:large` ou `noindex, nofollow`.
- OG: `og:title`, `og:description`, `og:url` (= canonical), `og:type`, `og:site_name`, `og:locale` (`pt_BR`...), `og:image` + `og:image:type/width/height/alt`.
- Twitter: `twitter:card` (`summary_large_image`), `twitter:title/description/image`.
- Páginas `noindex` não precisam de hreflang.

## Template HTML

Shell mínimo (charset, viewport, theme-color, favicon, manifest). `lang` do `<html>` é trocado pelo prerender por rota. Nada de metadata variável aqui.

## OG image — PNG obrigatório

Redes sociais (WhatsApp, Facebook, X, LinkedIn, Telegram, Discord) **não renderizam SVG** como `og:image`. Manter o SVG como fonte editável e gerar o PNG 1200×630:

```bash
rsvg-convert -w 1200 -h 630 public/og-image.svg -o public/og-image.png
```

(Alternativas: `sharp` num script de build, ou screenshot via Playwright se o SVG depender de fontes externas.) O PNG pode ser commitado se a arte muda raramente — zero dependência no CI. Emitir `og:image:width/height` acelera o primeiro fetch do Facebook.

## JSON-LD

`JsonLd` component com `JSON.stringify(data).replaceAll('<', '\\u003c')`. Builders: `Organization` (com `logo` PNG ≥112×112 se houver), `WebSite` (com `inLanguage` por rota), `FAQPage`/`BreadcrumbList`/`Article` quando o conteúdo corresponder. Nunca declarar o que não está visível na página.

## Prerender (SSG, sem browser)

Estratégia da implementação de referência — mais rápida e determinística que abrir browser:

1. `vite build` normal gera a SPA em `dist/`.
2. Um segundo `vite build --ssr src/prerender.jsx` gera um bundle Node com:
   - `PRERENDER_PATHS` — `['/', '/en', '/es', '/zh', '/ja']` (o Set deduplica a raiz, já que `langPath(DEFAULT_LANG) === '/'`);
   - `renderPage(path)` — `renderToStaticMarkup` do `<App/>` + das head tags;
   - `robotsTxt()` e `sitemapXml()`.
3. O script `scripts/prerender.mjs` injeta cada página no template (`<html lang>`, `</head>`, `#root`) e grava `dist/<route>/index.html`, `dist/robots.txt` e `dist/sitemap.xml`.

Requisito do app: renderizável em Node (sem `window` no caminho do primeiro render — efeitos client-only vão para `useEffect`). Playwright só se isso for impossível.

Conteúdo dinâmico estável de API/CMS: buscar slugs antes do loop e adicionar `langPath(lang, slug)` às rotas.

## robots.txt

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /api

Sitemap: https://raiznet.com/sitemap.xml
```

Permissivo para conteúdo público — inclui crawlers de IA (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) se o objetivo é aparecer em respostas de assistentes. `llms.txt` só se houver documentação longa que mereça índice.

## sitemap.xml

- Lista **apenas URLs canônicas**: a raiz (PT) e os subpaths dos outros idiomas. `/pt` não entra.
- Cada `<url>` carrega o conjunto completo de `<xhtml:link rel="alternate" hreflang>` incluindo `x-default` → raiz.
- `lastmod` apenas se for confiável (data real de mudança de conteúdo).

## Deploy Nginx

```nginx
root /var/www/project;
index index.html;

# Redirects 301 do prefixo legado do idioma padrão para a raiz
location = /pt { return 301 /; }
location ^~ /pt/ { rewrite ^/pt(/.*)$ $1 permanent; }

# Assets com hash no nome: cache imutável
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}

location / {
    # $uri/index.html ANTES de $uri/: serve /en com 200 direto.
    # Sem isso, o nginx emite 301 /en -> /en/ (redirect de diretório),
    # e o canonical sem barra fica apontando para uma URL que redireciona.
    try_files $uri $uri/index.html $uri/ /index.html;
}
```

Notas:

- `www` e variações de host redirecionam 301 para o host canônico.
- `/en` e `/en/` resolvem para o mesmo arquivo; o canonical resolve a duplicidade — não precisa de redirect, mas seja consistente nos links internos (sem barra final).
- O fallback SPA devolve 200 para qualquer rota inexistente (soft-404). Mitigação: todas as rotas públicas são prerenderizadas, então bots raramente caem no fallback; se houver orçamento, prerenderizar uma página 404 real e usá-la como fallback de rotas desconhecidas.

## CI/CD

1. Checkout, pnpm, Node, `pnpm install --frozen-lockfile`.
2. `VITE_PUBLIC_SITE_URL=https://raiznet.com pnpm --filter web build` (build → prerender → validate, no mesmo script).
3. Copiar `dist/` para o diretório servido (rsync `--delete`).

A validação roda **dentro do build** e falha o pipeline. Mínimos que ela cobre (ver `scripts/validate-seo.mjs` de referência):

- HTML prerenderizado existe para cada rota canônica.
- Exatamente 1 title, 1 description, 1 canonical por página.
- Canonical **exato** por rota, com o host esperado (pega mudança acidental de domínio).
- hreflang completo em todas as rotas; `pt-BR` e `x-default` apontando para a raiz.
- `og:image` é o PNG (e width/height presentes); twitter:card presente; JSON-LD presente.
- `robots.txt` permite as rotas públicas e aponta o sitemap no host certo.
- Sitemap contém todas as canônicas e **não** contém o prefixo do idioma padrão.
- Texto útil presente no body (o prerender não regrediu para shell vazio).

## Pós-deploy

- `curl -s https://raiznet.com/ | grep -E 'canonical|hreflang|og:image'` — conferir host e PNG.
- Conferir uma rota por idioma e `robots.txt`/`sitemap.xml` servidos.
- Google Search Console: enviar sitemap, inspecionar a raiz e pedir indexação das principais.
- Validar Rich Results / Schema.org; rodar Lighthouse.
- Compartilhar a raiz no WhatsApp/X para conferir o preview (og:image PNG).

## IA e crawlers

- HTML prerenderizado com conteúdo em texto visível e links `<a href>` reais.
- robots permissivo, sitemap atualizado, canonical coerente, JSON-LD fiel.
- Evitar conteúdo essencial só em canvas/imagem/interação client-only.

## Acceptance criteria

- Build (com prerender + validação) passa no CI.
- A raiz serve o idioma padrão com canonical para si mesma; nenhum redirect automático por navigator.
- `x-default` e o hreflang do idioma padrão apontam para a raiz em todas as páginas.
- O prefixo do idioma padrão (`/pt`) não aparece em sitemap nem em canonical de nenhuma página.
- `og:image` é PNG 1200×630 acessível por URL absoluta no host canônico.
- Nenhuma URL gerada (canonical/hreflang/og:url/sitemap/robots) usa host diferente do canônico.
- Search Console recebe o sitemap após o deploy.
