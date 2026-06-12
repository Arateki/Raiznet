# SEO Portable Spec — SPA React/Vite com i18n e prerender

Spec para replicar a estratégia de SEO do Arateki em outro repositório com tecnologias semelhantes. Assume uma SPA React/Vite com i18n, rotas públicas e deploy estático atrás de Nginx ou CDN. Não assume página de venda.

## Objetivo

Entregar HTML rastreável e compartilhável para buscadores, redes sociais e crawlers de IA sem migrar para SSR completo.

O resultado esperado:

- URLs por idioma, por exemplo `/pt`, `/en`, `/es`.
- Metadata por rota: title, description, canonical, hreflang, Open Graph e Twitter.
- HTML prerenderizado em `dist/`.
- Sitemap e robots coerentes.
- JSON-LD básico quando houver conteúdo compatível.
- Deploy servindo arquivos prerenderizados antes do fallback SPA.

## Decisão central

Usar uma fonte única de metadata.

- O template `index.html` deve ser mínimo.
- Cada página React deve renderizar seu próprio componente `Seo`.
- O prerender executa a SPA, espera a hidratação e grava o HTML final.

Não colocar title/description/OG/canonical/hreflang ricos diretamente no template base. Isso cria metadata duplicada quando React também injeta tags no `<head>`.

## Escopo

Obrigatório:

- `Seo` component.
- Helpers de URL/canonical/i18n.
- i18n na URL.
- `robots.txt`.
- `sitemap.xml`.
- Script de prerender.
- Validação de HTML gerado.
- Ajuste de deploy.

Opcional:

- JSON-LD `Organization`.
- JSON-LD `WebSite`.
- JSON-LD `FAQPage`.
- JSON-LD `BreadcrumbList`.
- OG image PNG gerada no build.
- Preload da fonte principal.
- Prerender dinâmico de páginas vindas de API/CMS.

Fora de escopo:

- Migração para Next.js, Remix ou Vike.
- SSR por request.
- Geração dinâmica de preview social por usuário.

## Rotas e i18n

Definir idiomas suportados:

```ts
export const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'] as const;
export type LangCode = typeof SUPPORTED_LANGS[number];
export const DEFAULT_LANG: LangCode = 'pt';
```

Criar helpers:

```ts
export function langPath(lang: LangCode, path = '/'): string {
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  if (cleaned === '/') return `/${lang}`;
  return `/${lang}${cleaned}`;
}

export function stripLangFromPath(pathname: string): string {
  const match = pathname.match(/^\/(pt|en|es|zh|ja)(\/|$)/);
  if (!match) return pathname || '/';
  const remainder = pathname.slice(match[0].length - (match[2] === '/' ? 1 : 0));
  return remainder.startsWith('/') ? remainder : `/${remainder}`;
}
```

Routing recomendado:

```txt
/                         -> redirect para /<preferred-lang>
/:lang                    -> Home
/:lang/about              -> About
/:lang/docs               -> Docs ou página equivalente
/:lang/<content-slug>     -> conteúdo público, se houver
/admin ou /manage         -> sem prefixo de idioma e noindex
```

Rotas legadas sem idioma devem redirecionar para o idioma padrão ou preferido.

## Metadata

Criar `src/lib/seo.ts`:

```ts
export const SITE_URL = (
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? 'https://example.com'
).replace(/\/+$/, '');

export const HTML_LANG = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  zh: 'zh-CN',
  ja: 'ja',
} satisfies Record<LangCode, string>;

export const DEFAULT_OG_IMAGE = '/og-image.png';

export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const canonical = (path: string): string => absoluteUrl(path);
```

Criar `Seo` component:

```tsx
interface SeoProps {
  title: string;
  description: string;
  path: string;
  lang: LangCode;
  noindex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
}
```

O componente deve emitir:

- `<title>`.
- `meta name="description"`.
- `link rel="canonical"`.
- `link rel="alternate" hreflang="...">` para todos os idiomas.
- `x-default`.
- `meta name="robots"` com `index, follow...` ou `noindex, nofollow`.
- `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`, `og:image`.
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.

Cada página pública chama `Seo` com strings do i18n.

## Template HTML

Manter `index.html` como shell mínimo:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="Project Name" />
    <meta name="theme-color" content="#F5F5F5" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.webmanifest" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Não colocar metadata variável por rota nesse arquivo.

## JSON-LD

Criar `JsonLd` component:

```tsx
export const JsonLd = ({ data }: { data: unknown | unknown[] }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replaceAll('<', '\\u003c'),
    }}
  />
);
```

Builders recomendados:

- `Organization`.
- `WebSite`.
- `FAQPage`, se a home tiver FAQ.
- `BreadcrumbList`, se houver páginas internas.
- `Article`, se o outro repo tiver posts ou docs editoriais.

Não adicionar JSON-LD que não corresponde ao conteúdo visível da página.

## OG image PNG

Manter um SVG editável e gerar PNG no build.

Arquivos:

```txt
public/og-image.svg
scripts/generate-og-image.mjs
```

Script com Playwright:

```js
#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const svgPath = join(projectRoot, 'public', 'og-image.svg');
const pngPath = join(projectRoot, 'public', 'og-image.png');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

try {
  await page.goto(pathToFileURL(svgPath).href, { waitUntil: 'load' });
  await mkdir(dirname(pngPath), { recursive: true });
  await page.screenshot({ path: pngPath, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
} finally {
  await browser.close().catch(() => {});
}
```

Adicionar `public/og-image.png` ao `.gitignore` se for gerado no build.

## Fonte principal

Se a fonte principal existir localmente, importar a variante regular e emitir preload no React.

Exemplo:

```tsx
import fontRegularUrl from './assets/fonts/Font-Regular.ttf';

<link
  rel="preload"
  href={fontRegularUrl}
  as="font"
  type="font/ttf"
  crossOrigin=""
/>
```

Critério:

- preload apenas da fonte mais usada acima da dobra;
- geralmente peso `400 regular`;
- manter `font-display: swap` no CSS.

## Prerender

Criar `scripts/prerender.mjs`.

Requisitos:

- Rodar depois de `vite build`.
- Subir `vite preview`.
- Usar porta livre automaticamente.
- Abrir cada rota pública com Playwright.
- Esperar `networkidle` e um pequeno settle.
- Salvar HTML em `dist/<route>/index.html`.
- Gerar `/` por último, para não contaminar fallback durante snapshots.

Rotas base:

```js
const SUPPORTED_LANGS = ['pt', 'en', 'es', 'zh', 'ja'];
const PUBLIC_PATHS = ['', '/about', '/docs']; // adaptar ao outro repo
```

Se houver conteúdo dinâmico estável vindo de API/CMS:

- setar `PRERENDER_API_BASE`;
- buscar lista de slugs antes do loop;
- adicionar `/<lang>/<slug>` às rotas;
- interceptar chamadas internas de API para manter snapshots determinísticos.

Se não houver API:

- prerenderizar apenas as rotas estáticas públicas.

## Package scripts

Exemplo:

```json
{
  "scripts": {
    "build": "pnpm generate:og && tsc -b && vite build && pnpm prerender",
    "build:no-prerender": "pnpm generate:og && tsc -b && vite build",
    "generate:og": "node scripts/generate-og-image.mjs",
    "prerender": "node scripts/prerender.mjs"
  }
}
```

No monorepo, preferir build sequencial se API e web dependem um do outro:

```json
{
  "scripts": {
    "build": "pnpm --filter @project/api build && pnpm --filter @project/web build"
  }
}
```

## robots.txt

Exemplo:

```txt
User-agent: *
Allow: /
Disallow: /manage
Disallow: /manage/
Disallow: /admin
Disallow: /admin/
Disallow: /checkout
Disallow: /api/
Disallow: /api

Sitemap: https://example.com/sitemap.xml
```

Se houver feeds públicos úteis, permitir apenas esses paths:

```txt
Allow: /api/feeds/
```

Não bloquear `OAI-SearchBot` se o objetivo é aparecer em ChatGPT Search.

## sitemap.xml

Gerar sitemap estático para rotas públicas.

Cada URL deve ter alternates:

```xml
<xhtml:link rel="alternate" hreflang="pt-BR" href="https://example.com/pt" />
<xhtml:link rel="alternate" hreflang="en" href="https://example.com/en" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/" />
```

Se houver API/CMS com conteúdo estável, gerar sitemap dinâmico também.

## Deploy Nginx

Servidor deve servir arquivo existente antes do fallback:

```nginx
root /var/www/project;
index index.html;

location /api/ {
    proxy_pass http://127.0.0.1:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

Adicionar redirects para rotas antigas sem idioma:

```nginx
location = /about {
    return 301 /pt/about;
}
```

Se houver `www`, redirecionar para o host canônico.

## CI/CD

Pipeline recomendado:

1. Checkout.
2. Instalar pnpm.
3. Instalar Node.
4. `pnpm install --frozen-lockfile`.
5. `pnpm --filter web exec playwright install chromium`.
6. Build da API, se houver.
7. Subir API temporariamente se o prerender depende dela.
8. `PRERENDER_API_BASE=http://127.0.0.1:3333 pnpm --filter web build`.
9. Validar `dist`.
10. Copiar `dist/` para o diretório servido pelo Nginx.

Validações mínimas:

```bash
test -f dist/index.html
test -f dist/pt/index.html
test -f dist/en/index.html
test -f dist/robots.txt
test -f dist/sitemap.xml
test -f dist/og-image.png
test "$(grep -o '<title>' dist/index.html | wc -l)" -eq 1
test "$(grep -o 'name="description"' dist/index.html | wc -l)" -eq 1
```

Se houver slugs vindos de API/CMS, validar dinamicamente:

```js
import { access } from 'node:fs/promises';

const langs = ['pt', 'en', 'es', 'zh', 'ja'];
const response = await fetch('http://127.0.0.1:3333/api/pages?lang=pt');
const { pages } = await response.json();

for (const page of pages) {
  for (const lang of langs) {
    await access(`dist/${lang}/${page.slug}/index.html`);
  }
}
```

## Pós-deploy

Checklist:

- `curl -I https://example.com/`.
- `curl -I https://example.com/pt`.
- `curl -I https://example.com/robots.txt`.
- `curl -I https://example.com/sitemap.xml`.
- Verificar HTML bruto com `curl -s`.
- Conferir uma rota por idioma.
- Conferir uma rota de conteúdo interna.
- Enviar sitemap no Google Search Console.
- Inspecionar URL e solicitar indexação das páginas principais.
- Validar Rich Results e Schema.org.
- Rodar Lighthouse.

## IA e crawlers

Para facilitar consumo por IAs:

- manter HTML prerenderizado;
- manter conteúdo importante em texto visível;
- usar links `<a href="...">`;
- manter `robots.txt` permissivo para conteúdo público;
- manter sitemap atualizado;
- manter canonical coerente;
- usar JSON-LD compatível com o conteúdo;
- evitar conteúdo essencial apenas em canvas, imagem ou interações client-only.

`llms.txt` não é requisito. Considerar só se o projeto tiver documentação longa ou páginas editoriais que mereçam um índice humano/LLM-friendly.

## Acceptance criteria

Antes de considerar concluído:

- Build passa.
- Testes unitários passam.
- `dist/index.html` tem metadata rica.
- Cada rota pública prerenderizada tem exatamente um title, description e canonical.
- `hreflang` existe em todas as rotas indexáveis.
- `robots.txt` não bloqueia páginas públicas.
- `sitemap.xml` lista rotas públicas canônicas.
- HTML bruto contém texto útil.
- Nginx serve pastas prerenderizadas antes do fallback SPA.
- Search Console recebe sitemap após deploy.
