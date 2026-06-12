export const enUS = {
  brand: {
    name: 'Raiznet',
  },
  seo: {
    title: 'Raiznet | Decentralized network for connected agriculture',
    description:
      'Raiznet connects sensors, servers, and growers in a local-first network for crop monitoring and collective agricultural intelligence.',
  },
  nav: {
    label: 'Main navigation',
    home: 'Raiznet home',
    projects: 'Projects',
    how: 'How it works',
    download: 'Download',
    docs: 'Documentation',
    network: 'raiznet network',
    safraSense: 'SafraSense',
    menu: 'Menu',
  },
  navSub: {
    docs: 'guide · protocol · ADRs',
    network: 'dashboard · arateki:v1',
    download: 'Node 24 · pnpm',
    safraSense: 'ESP32 firmware',
  },
  actions: {
    dashboard: 'Open dashboard',
    download: 'Download server',
    docs: 'Read docs',
    themeDark: 'Enable dark theme',
    themeLight: 'Enable light theme',
    languageToggle: 'Change language',
  },
  topBand: {
    items: ['FREE · ALWAYS', 'NO SUBSCRIPTION', 'NO SIGN-UP', 'NO ACTIVATION KEY'],
    note: 'if Arateki disappears tomorrow, your network stays alive.',
  },
  card: {
    peerNote: 'pure peer-to-peer',
    noCentral: 'no central server',
    youNode: 'you',
    status: 'STATUS',
    info: 'INFO',
  },
  carousel: {
    previous: 'Previous slide',
    next: 'Next slide',
    goTo: 'Go to slide',
  },
  hero: {
    title: 'Raiznet',
    status: ['No subscription', 'No traditional login', 'Works on the local network', 'Data under your key'],
    slides: [
      {
        eyebrow: 'Arateki open network for connected agriculture',
        title: 'A living network for growers, with data always under their care.',
        copy:
          'A local-first mesh for sensors, servers, and growers. Each reading can be signed, replicated between nodes, and read without depending on a central cloud.',
        visualTitle: 'raiznet:public:arateki:v1',
        visualMeta: '8 peers syncing · 124 devices',
        metric: '99.4%',
        metricLabel: 'replication',
      },
      {
        eyebrow: 'Local and remote access',
        title: 'Track your network through the dashboard, API, or app.',
        copy:
          'The server exposes a public endpoint for what you choose to release and a local endpoint for owner data. The Arateki network dashboard is built on that same structure.',
        visualTitle: 'GET /v1/devices',
        visualMeta: 'public on :3000 · local on :3001',
        metric: '12s',
        metricLabel: 'last reading',
      },
      {
        eyebrow: 'Privacy per field',
        title: 'Each reading decides what leaves, what is encrypted, and what stays local.',
        copy:
          'pH, conductivity, temperature, humidity, and water level can have different policies per destination: plain, encrypted, or omitted.',
        visualTitle: 'policy.water_ph = plain',
        visualMeta: 'policy.air_humidity = encrypted',
        metric: '3',
        metricLabel: 'dispositions',
      },
      {
        eyebrow: 'H3 map and collective intelligence',
        title: 'Crop data becomes regional context without exposing the farm.',
        copy:
          'Location uses H3 cells with the granularity chosen by the owner. The result is a base that helps local LLMs, researchers, and cooperatives find real patterns.',
        visualTitle: 'H3 8a2a107fffff',
        visualMeta: 'regional cluster · k-anon as product rule',
        metric: 'H3',
        metricLabel: 'private map',
      },
      {
        eyebrow: 'AI · MCP · MATERIALS',
        title: 'AI turns data into guides, answers, and crop knowledge.',
        copy:
          'MCPs let AI tools query readings, growing cycles, and regional stats to produce recommendations, reports, and signed educational materials available through the network itself.',
        visualTitle: '@raiznet/mcp',
        visualMeta: 'guides · reports · best practices',
        metric: 'AI',
        metricLabel: 'applied knowledge',
      },
      {
        eyebrow: 'Identity without sign-up',
        title: 'Twelve words recover the user authority.',
        copy:
          'Identity comes from Ed25519 keys and a BIP-39 seed phrase. There is no central login server, required API key, or custodial account dependency.',
        visualTitle: 'owner_pubkey',
        visualMeta: 'BIP-39 · Ed25519 · device signatures',
        metric: '12',
        metricLabel: 'words',
      },
    ],
  },
  events: {
    eyebrow: 'EPHEMERIS · LIVE',
    titleStart: 'what the network',
    titleEmphasis: 'is seeing',
    titleEnd: 'now.',
    items: [
      {
        title: 'pH dropping across 14 nodes',
        body: 'in the Cariri region, rain arrived overnight and acidity rose with it.',
        tech: '14 nodes · H3 cluster · pH delta -0.6 / 4h',
      },
      {
        title: 'unusual heat movement',
        body: 'sites in Petrolina crossed 36C before noon.',
        tech: '38 nodes · z-score +2.1 sigma',
      },
      {
        title: 'now - live reading',
        body: 'the agricultural sky in the northeast is stable. a good window for afternoon irrigation.',
        tech: '124 devices · 18 cities',
      },
    ],
  },
  projects: {
    eyebrow: 'Ecosystem',
    title: 'One network, several entry points.',
    copy:
      'The landing page organizes what already exists in the project: SafraSense hardware, the Raiznet server, the Arateki network dashboard, and open technical documentation.',
    items: [
      {
        icon: 'chip',
        title: 'SafraSense Aqua',
        copy: 'ESP32 firmware for towers, benches, and devices that measure water, environment, and crop operation.',
        meta: 'ESP32 · BIP-39 identity · signed telemetry',
      },
      {
        icon: 'node',
        title: 'Raiznet Server',
        copy: 'A node that receives readings, separates public and local data, indexes into SQLite, and joins the P2P mesh.',
        meta: 'Signed HTTP · SQLite · native replication',
      },
      {
        icon: 'dashboard',
        title: 'Arateki Dashboard',
        copy: 'A network view for tracking devices, peers, filters, and sync health in the official network.',
        meta: 'raiznet:public:arateki:v1',
      },
      {
        icon: 'docs',
        title: 'Documentation',
        copy: 'Guides, protocol, privacy model, schemas, and ADRs for anyone running or integrating a node.',
        meta: 'VitePress · open protocol',
      },
    ],
  },
  how: {
    eyebrow: 'From sensor to intelligence',
    title: 'The flow stays simple even as the network grows.',
    steps: [
      {
        title: 'Sensor measures and signs',
        copy: 'The ESP32 collects pH, conductivity, temperature, humidity, and water level. The device signs the block before sending it.',
      },
      {
        title: 'Local node receives it',
        copy: 'The server on a laptop, Raspberry Pi, or VPS validates the signature and stores public and private data in separate databases.',
      },
      {
        title: 'Network replicates',
        copy: 'What can be public enters append-only signed event logs and replicates between peers through the network topic.',
      },
      {
        title: 'Dashboard interprets',
        copy: 'The interface shows readings, filters, H3 map, mesh health, and history that helps operate the crop.',
      },
      {
        title: 'Knowledge returns',
        copy: 'Local LLMs, researchers, and regional catalogs can extract patterns without taking sovereignty away from the grower.',
      },
    ],
  },
  download: {
    eyebrow: 'Start with the node',
    title: 'Run a valid Raiznet on a common machine.',
    copy:
      'The server is the most direct way to test the network: it exposes public and local endpoints, generates its own identity, and prepares the base for receiving sensors.',
    github: 'Open GitHub',
    guide: 'Installation guide',
    terminalLabel: 'Installation commands',
    commands: [
      '$ git clone https://github.com/arateki/raiznet',
      '$ cd raiznet',
      '$ pnpm install',
      '$ pnpm build',
      '$ pnpm --filter @raiznet/server dev',
    ],
  },
  principles: {
    eyebrow: 'Principles',
    title: 'The network does not depend on an owner to stay alive.',
    copy:
      'Raiznet avoids the fragile points of a traditional IoT platform: identity is born on the client, writes are signed, and private data does not enter the public mesh.',
    items: [
      {
        title: 'Local-first',
        copy: 'A sensor and a computer on the same Wi-Fi are enough to operate, even without internet.',
      },
      {
        title: 'Data sovereignty',
        copy: 'Keys stay with the user. If Arateki leaves the path, the data continues in the user node.',
      },
      {
        title: 'Privacy per field',
        copy: 'Each value can be public, encrypted, or omitted per destination. Device existence is public; readings do not have to be.',
      },
    ],
  },
  footer: {
    madeBy: 'raiznet · a network for growers · made by Arateki',
    github: 'github.com/arateki/raiznet',
  },
};
