import { defineConfig } from 'vitepress'
import { buildSeoHead } from './seo'

type Lang = 'pt' | 'en' | 'es' | 'ja' | 'zh'

// Sidebar rótulos por idioma. Itens novos: traduzir aqui ao adicionar locale.
const T: Record<Lang, Record<string, string>> = {
  pt: {
    guide: 'Guia', protocol: 'Protocolo', reference: 'Referência', adr: 'ADR',
    introduction: 'Introdução', architecture: 'Arquitetura',
    'running-a-node': 'Rodando um nó', stack: 'Stack', roadmap: 'Roadmap',
    intelligence: 'Inteligência coletiva', overview: 'Visão geral',
    identity: 'Identidade e chaves', telemetry: 'Telemetria',
    privacy: 'Modelo de privacidade', networks: 'Redes e filtros',
    'device-lifecycle': 'Ciclo de vida do dispositivo',
    'public-api': 'API pública', 'local-api': 'API local',
    'proto-schemas': 'Schemas Protobuf', errors: 'Códigos de erro',
    glossary: 'Glossário', editLink: 'Editar esta página no GitHub',
  },
  en: {
    guide: 'Guide', protocol: 'Protocol', reference: 'Reference', adr: 'ADR',
    introduction: 'Introduction', architecture: 'Architecture',
    'running-a-node': 'Running a Node', stack: 'Tech Stack', roadmap: 'Roadmap',
    intelligence: 'Collective Intelligence', overview: 'Overview',
    identity: 'Identity & Keys', telemetry: 'Telemetry',
    privacy: 'Privacy Model', networks: 'Networks & Filters',
    'device-lifecycle': 'Device Lifecycle',
    'public-api': 'Public API', 'local-api': 'Local API',
    'proto-schemas': 'Protobuf Schemas', errors: 'Error Codes',
    glossary: 'Glossary', editLink: 'Edit this page on GitHub',
  },
  es: {
    guide: 'Guía', protocol: 'Protocolo', reference: 'Referencia', adr: 'ADR',
    introduction: 'Introducción', architecture: 'Arquitectura',
    'running-a-node': 'Ejecutar un nodo', stack: 'Stack técnico', roadmap: 'Hoja de ruta',
    intelligence: 'Inteligencia colectiva', overview: 'Visión general',
    identity: 'Identidad y claves', telemetry: 'Telemetría',
    privacy: 'Modelo de privacidad', networks: 'Redes y filtros',
    'device-lifecycle': 'Ciclo de vida del dispositivo',
    'public-api': 'API pública', 'local-api': 'API local',
    'proto-schemas': 'Esquemas Protobuf', errors: 'Códigos de error',
    glossary: 'Glosario', editLink: 'Editar esta página en GitHub',
  },
  ja: {
    guide: 'ガイド', protocol: 'プロトコル', reference: 'リファレンス', adr: 'ADR',
    introduction: 'はじめに', architecture: 'アーキテクチャ',
    'running-a-node': 'ノードを実行する', stack: '技術スタック', roadmap: 'ロードマップ',
    intelligence: '集団的インテリジェンス', overview: '概要',
    identity: 'アイデンティティと鍵', telemetry: 'テレメトリ',
    privacy: 'プライバシーモデル', networks: 'ネットワークとフィルター',
    'device-lifecycle': 'デバイスのライフサイクル',
    'public-api': '公開API', 'local-api': 'ローカルAPI',
    'proto-schemas': 'Protobufスキーマ', errors: 'エラーコード',
    glossary: '用語集', editLink: 'GitHubでこのページを編集',
  },
  zh: {
    guide: '指南', protocol: '协议', reference: '参考', adr: 'ADR',
    introduction: '简介', architecture: '架构',
    'running-a-node': '运行节点', stack: '技术栈', roadmap: '路线图',
    intelligence: '集体智能', overview: '概览',
    identity: '身份与密钥', telemetry: '遥测',
    privacy: '隐私模型', networks: '网络与过滤器',
    'device-lifecycle': '设备生命周期',
    'public-api': '公共 API', 'local-api': '本地 API',
    'proto-schemas': 'Protobuf 模式', errors: '错误代码',
    glossary: '术语表', editLink: '在 GitHub 上编辑此页',
  },
}

const p = (lang: Lang, path: string) => (lang === 'pt' ? path : `/${lang}${path}`)

const sidebar = (lang: Lang) => {
  const t = T[lang]
  return [
    { text: t.guide, items: [
      { text: t.introduction, link: p(lang, '/guide/introduction') },
      { text: t.architecture, link: p(lang, '/guide/architecture') },
      { text: t['running-a-node'], link: p(lang, '/guide/running-a-node') },
      { text: t.stack, link: p(lang, '/guide/stack') },
      { text: t.roadmap, link: p(lang, '/guide/roadmap') },
      { text: t.intelligence, link: p(lang, '/guide/intelligence') },
    ] },
    { text: t.protocol, items: [
      { text: t.overview, link: p(lang, '/protocol/overview') },
      { text: t.identity, link: p(lang, '/protocol/identity') },
      { text: t.telemetry, link: p(lang, '/protocol/telemetry') },
      { text: t.privacy, link: p(lang, '/protocol/privacy') },
      { text: t.networks, link: p(lang, '/protocol/networks') },
      { text: t['device-lifecycle'], link: p(lang, '/protocol/device-lifecycle') },
    ] },
    { text: t.reference, items: [
      { text: t['public-api'], link: p(lang, '/reference/public-api') },
      { text: t['local-api'], link: p(lang, '/reference/local-api') },
      { text: t['proto-schemas'], link: p(lang, '/reference/proto-schemas') },
      { text: t.errors, link: p(lang, '/reference/errors') },
      { text: t.glossary, link: p(lang, '/reference/glossary') },
    ] },
    { text: t.adr, items: [
      { text: '001 — Protobuf over CBOR', link: p(lang, '/adr/001-protobuf') },
      { text: '002 — SQLite as derived cache', link: p(lang, '/adr/002-sqlite-cache') },
      { text: '003 — Privacy model', link: p(lang, '/adr/003-privacy-model') },
      { text: '004 — Raiznet-native replication', link: p(lang, '/adr/004-raiznet-native-replication') },
    ] },
  ]
}

const nav = (lang: Lang) => {
  const t = T[lang]
  const siteHome = lang === 'pt' ? 'https://raiznet.com/' : `https://raiznet.com/${lang}`
  return [
    { text: t.guide, link: p(lang, '/guide/introduction') },
    { text: t.protocol, link: p(lang, '/protocol/overview') },
    { text: t.reference, link: p(lang, '/reference/public-api') },
    { text: 'raiznet.com', link: siteHome },
  ]
}

const editLink = (lang: Lang) => ({
  pattern: 'https://github.com/arateki/raiznet/edit/main/docs/:path',
  text: T[lang].editLink,
})

export default defineConfig({
  title: 'Raiznet',
  description:
    'Decentralized crop monitoring network. Local-first, data sovereign, LLM-ready.',
  base: '/docs/',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['superpowers/**'],

  sitemap: { hostname: 'https://raiznet.com/docs/' },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#1b1b1f' }],
  ],

  transformHead: ({ pageData }) => {
    const fm = pageData.frontmatter ?? {}
    const title = (fm.title as string) ?? pageData.title ?? 'Raiznet Docs'
    const description =
      (fm.description as string) ??
      'Decentralized crop monitoring network. Local-first, data sovereign, LLM-ready.'
    return buildSeoHead({
      relativePath: pageData.relativePath,
      title,
      description,
    })
  },

  locales: {
    root: {
      label: 'Português',
      lang: 'pt-BR',
      themeConfig: { nav: nav('pt'), sidebar: sidebar('pt'), editLink: editLink('pt') },
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: { nav: nav('en'), sidebar: sidebar('en'), editLink: editLink('en') },
    },
    es: {
      label: 'Español',
      lang: 'es',
      link: '/es/',
      themeConfig: { nav: nav('es'), sidebar: sidebar('es'), editLink: editLink('es') },
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      link: '/ja/',
      themeConfig: { nav: nav('ja'), sidebar: sidebar('ja'), editLink: editLink('ja') },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: { nav: nav('zh'), sidebar: sidebar('zh'), editLink: editLink('zh') },
    },
  },

  themeConfig: {
    logo: '/root-mark.svg',
    socialLinks: [{ icon: 'github', link: 'https://github.com/arateki/raiznet' }],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
  },
})
