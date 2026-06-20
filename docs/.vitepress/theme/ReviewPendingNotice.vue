<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// Aviso visível no topo das páginas JA/ZH: tradução automática, revisão por
// falante nativo pendente. Localizado no idioma da página. Removível por idioma
// quando a revisão for concluída (basta tirar a entrada de NOTICES).
const NOTICES: Record<string, string> = {
  ja: '⚠️ この翻訳は機械翻訳です。ネイティブによるレビューは保留中のため、訳文に誤りが含まれる場合があります。',
  'zh-CN': '⚠️ 本页面为机器翻译，母语者审校尚未完成，译文可能存在错误。',
}

const { lang } = useData()
const notice = computed(() => NOTICES[lang.value])
</script>

<template>
  <div v-if="notice" class="review-pending-notice" role="note">
    {{ notice }}
  </div>
</template>

<style scoped>
.review-pending-notice {
  margin: 0 0 1.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--vp-c-warning-1, #b07a1f);
  border-radius: 8px;
  background: var(--vp-c-warning-soft, rgba(232, 196, 122, 0.2));
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
