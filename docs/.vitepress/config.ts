import { defineConfig } from 'vitepress'

// Sidebar única em inglês. Locales pt/es/zh/ja foram removidos do build até
// existirem traduções completas — um locale sem conteúdo gera 404 em todos os
// links do seletor de idioma.
const sidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Introduction', link: '/guide/introduction' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Running a Node', link: '/guide/running-a-node' },
      { text: 'Tech Stack', link: '/guide/stack' },
      { text: 'Roadmap', link: '/guide/roadmap' },
      { text: 'Collective Intelligence', link: '/guide/intelligence' },
    ],
  },
  {
    text: 'Protocol',
    items: [
      { text: 'Overview', link: '/protocol/overview' },
      { text: 'Identity & Keys', link: '/protocol/identity' },
      { text: 'Telemetry', link: '/protocol/telemetry' },
      { text: 'Privacy Model', link: '/protocol/privacy' },
      { text: 'Networks & Filters', link: '/protocol/networks' },
      { text: 'Device Lifecycle', link: '/protocol/device-lifecycle' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Public API', link: '/reference/public-api' },
      { text: 'Local API', link: '/reference/local-api' },
      { text: 'Protobuf Schemas', link: '/reference/proto-schemas' },
      { text: 'Error Codes', link: '/reference/errors' },
      { text: 'Glossary', link: '/reference/glossary' },
    ],
  },
  {
    text: 'ADR',
    items: [
      { text: '001 — Protobuf over CBOR', link: '/adr/001-protobuf' },
      { text: '002 — SQLite as derived cache', link: '/adr/002-sqlite-cache' },
      { text: '003 — Privacy model', link: '/adr/003-privacy-model' },
      { text: '004 — Raiznet-native replication', link: '/adr/004-raiznet-native-replication' },
    ],
  },
]

export default defineConfig({
  title: 'Raiznet',
  description:
    'Decentralized crop monitoring network. Local-first, data sovereign, LLM-ready.',
  lang: 'en-US',

  // Servido em https://raiznet.com/docs/
  base: '/docs/',
  cleanUrls: true,
  lastUpdated: true,

  sitemap: {
    hostname: 'https://raiznet.com/docs/',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#1b1b1f' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Raiznet Docs' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Decentralized crop monitoring network. Local-first, data sovereign, LLM-ready.',
      },
    ],
  ],

  themeConfig: {
    logo: '/root-mark.svg',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Protocol', link: '/protocol/overview' },
      { text: 'Reference', link: '/reference/public-api' },
      { text: 'raiznet.com', link: 'https://raiznet.com' },
    ],
    sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/arateki/raiznet' },
    ],
    editLink: {
      pattern: 'https://github.com/arateki/raiznet/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Open protocol. Data sovereignty.',
    },
    search: {
      provider: 'local',
    },
    outline: { level: [2, 3] },
  },
})
