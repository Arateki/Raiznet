<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  type LangCode,
  langFromLocale,
  preferredLocaleFromNavigator,
} from '../lib/i18n-routing'

const LOCALE_KEY = 'raiznet-locale'
const DISMISS_KEY = 'raiznet-locale-suggest-dismissed'

// "Ver em X?" no idioma sugerido.
const CTA: Record<LangCode, string> = {
  pt: 'Ver em Português?',
  en: 'View in English?',
  es: '¿Ver en Español?',
  ja: '日本語で表示しますか？',
  zh: '查看中文版？',
}

const show = ref(false)
const targetUrl = ref('')
const cta = ref('')

function localeOfPath(path: string): LangCode {
  const seg = path.replace('/docs/', '').split('/')[0]
  return (['en', 'es', 'ja', 'zh'].includes(seg) ? seg : 'pt') as LangCode
}

onMounted(() => {
  if (localStorage.getItem(LOCALE_KEY) || localStorage.getItem(DISMISS_KEY)) return
  const suggested = langFromLocale(preferredLocaleFromNavigator(navigator.languages))
  const current = localeOfPath(location.pathname)
  if (suggested === current) return
  // monta o path equivalente na língua sugerida
  const rest = location.pathname.replace('/docs/', '').replace(/^(en|es|ja|zh)\//, '')
  targetUrl.value = suggested === 'pt' ? `/docs/${rest}` : `/docs/${suggested}/${rest}`
  cta.value = CTA[suggested]
  show.value = true
})

function accept() {
  localStorage.setItem(LOCALE_KEY, preferredLocaleFromNavigator(navigator.languages))
  location.assign(targetUrl.value)
}
function dismiss() {
  localStorage.setItem(DISMISS_KEY, '1')
  show.value = false
}
</script>

<template>
  <div v-if="show" class="lang-suggest">
    <span>{{ cta }}</span>
    <button class="lang-suggest__yes" @click="accept">OK</button>
    <button class="lang-suggest__no" @click="dismiss" aria-label="dismiss">✕</button>
  </div>
</template>

<style scoped>
.lang-suggest {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 0.9rem;
}
.lang-suggest__yes {
  background: var(--vp-c-brand-3);
  color: var(--vp-button-brand-text);
  border: 0;
  border-radius: 6px;
  padding: 0.25rem 0.7rem;
  cursor: pointer;
}
.lang-suggest__no {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: var(--vp-c-text-2);
}
</style>
