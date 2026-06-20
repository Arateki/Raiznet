import { targetDocsUrlForSavedLocale, themeFromRaiznet } from '../lib/continuity'

const LOCALE_KEY = 'raiznet-locale'
const THEME_KEY = 'raiznet-theme'
const VP_APPEARANCE_KEY = 'vitepress-theme-appearance'

// Re-localiza pela preferência salva (nunca por navigator). Roda só no client.
export function applyLanguageContinuity(): void {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (!saved) return
  const target = targetDocsUrlForSavedLocale(saved, location.pathname)
  if (target && target !== location.pathname) {
    location.replace(`${target}${location.search}${location.hash}`)
  }
}

// Aplica o tema salvo pelo site na chave nativa do VitePress antes da hidratação.
export function applyThemeContinuity(): void {
  const theme = themeFromRaiznet(localStorage.getItem(THEME_KEY))
  if (theme) localStorage.setItem(VP_APPEARANCE_KEY, theme)
}

// Mantém raiznet-theme em sincronia quando o usuário alterna na docs.
export function watchThemeChanges(): void {
  const sync = () => {
    const isDark = document.documentElement.classList.contains('dark')
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

// Grava raiznet-locale quando a URL muda de locale (troca pelo seletor nativo).
export function watchLocaleChanges(localeOfPath: (p: string) => string): void {
  let last = location.pathname
  const check = () => {
    if (location.pathname !== last) {
      last = location.pathname
      localStorage.setItem(LOCALE_KEY, localeOfPath(location.pathname))
    }
  }
  setInterval(check, 400)
}
