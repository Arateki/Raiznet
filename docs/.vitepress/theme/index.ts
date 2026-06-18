import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

// Inter self-hosted (sem CDN) — mesma fonte do website. Subsets latin +
// latin-ext cobrem os acentos do português; pesos 400/500/600/700 são os
// usados pelo tema do VitePress.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-ext-600.css'
import '@fontsource/inter/latin-ext-700.css'

import './custom.css'

// Tema padrão do VitePress + override de cores em custom.css (paleta do website)
// + continuidade de idioma/tema com raiznet.com via localStorage compartilhado.
const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp() {
    if (import.meta.env.SSR) return
    import('./continuity.client').then((m) => {
      m.applyThemeContinuity()
      m.applyLanguageContinuity()
      m.watchThemeChanges()
      // locale de um path vivo -> valor armazenado em raiznet-locale
      m.watchLocaleChanges((path) => {
        const seg = path.replace('/docs/', '').split('/')[0]
        const map: Record<string, string> = {
          en: 'en-US',
          es: 'es-ES',
          ja: 'ja-JP',
          zh: 'zh-CN',
        }
        return map[seg] ?? 'pt-BR'
      })
    })
  },
}

export default theme
