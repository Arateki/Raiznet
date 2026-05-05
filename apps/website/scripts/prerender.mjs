#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const distDir = join(appRoot, 'dist');
const templatePath = join(distDir, 'index.html');
const ssrOutDir = join(appRoot, `.seo-ssr-${process.pid}`);

const routeFile = (routePath) => {
  if (routePath === '/') return join(distDir, 'index.html');
  return join(distDir, routePath.replace(/^\/+/, ''), 'index.html');
};

const inject = (template, { html, head, htmlLang }) => template
  .replace(/<html[^>]*>/, `<html lang="${htmlLang}">`)
  .replace('</head>', `${head}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

try {
  await build({
    root: appRoot,
    mode: 'production',
    logLevel: 'error',
    build: {
      emptyOutDir: true,
      outDir: ssrOutDir,
      ssr: join(appRoot, 'src/prerender.jsx'),
      rollupOptions: {
        output: {
          entryFileNames: 'prerender.mjs',
          format: 'es',
        },
      },
    },
  });

  const template = await readFile(templatePath, 'utf8');
  const { PRERENDER_PATHS, renderPage, robotsTxt, sitemapXml } = await import(
    `${pathToFileURL(join(ssrOutDir, 'prerender.mjs')).href}?t=${Date.now()}`
  );

  for (const routePath of PRERENDER_PATHS) {
    const rendered = renderPage(routePath);
    const outputPath = routeFile(routePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, inject(template, rendered));
  }

  await writeFile(join(distDir, 'robots.txt'), robotsTxt());
  await writeFile(join(distDir, 'sitemap.xml'), sitemapXml());
} finally {
  await rm(ssrOutDir, { recursive: true, force: true });
}
