export const zhCN = {
  brand: {
    name: 'Raiznet',
  },
  nav: {
    label: '主导航',
    home: 'Raiznet 首页',
    projects: '项目',
    how: '工作方式',
    download: '下载',
    docs: '文档',
    network: 'raiznet 网络',
    safraSense: 'SafraSense',
    menu: '菜单',
  },
  navSub: {
    docs: '指南 · 协议 · ADR',
    network: '仪表盘 · arateki:v1',
    download: 'Node 24 · pnpm',
    safraSense: 'ESP32 固件',
  },
  actions: {
    dashboard: '打开仪表盘',
    download: '下载服务器',
    docs: '阅读文档',
    themeDark: '启用深色主题',
    themeLight: '启用浅色主题',
    languageToggle: '切换语言',
  },
  topBand: {
    items: ['免费 · 永远', '无订阅', '无需注册', '无需激活码'],
    note: '即使 Arateki 明天消失，你的网络仍会继续运行。',
  },
  card: {
    peerNote: '纯 peer-to-peer',
    noCentral: '无中心服务器',
    youNode: '你',
    status: '状态',
    info: '信息',
  },
  carousel: {
    previous: '上一张幻灯片',
    next: '下一张幻灯片',
    goTo: '转到幻灯片',
  },
  hero: {
    title: 'Raiznet',
    status: ['无订阅', '无传统登录', '在本地网络运行', '数据由你的密钥掌控'],
    slides: [
      {
        eyebrow: '面向互联农业的 Arateki 开放网络',
        title: '一个没有所有者、由种植者共同构建的网络。',
        copy:
          '面向传感器、服务器和种植者的 local-first 网状网络。每条读数都可以签名、在节点之间复制，并且无需依赖中心云即可读取。',
        visualTitle: 'raiznet:public:arateki:v1',
        visualMeta: '8 peers 同步中 · 124 台设备',
        metric: '99.4%',
        metricLabel: '复制',
      },
      {
        eyebrow: '本地和远程访问',
        title: '通过仪表盘、API 或应用跟踪你的网络。',
        copy:
          '服务器为你选择公开的数据提供公共端点，也为所有者数据提供本地端点。Arateki 网络仪表盘也建立在同一套结构之上。',
        visualTitle: 'GET /v1/devices',
        visualMeta: '公共端口 :3000 · 本地端口 :3001',
        metric: '12s',
        metricLabel: '最后读数',
      },
      {
        eyebrow: '按字段控制隐私',
        title: '每条读数都决定什么离开、什么加密、什么留在本地。',
        copy:
          'pH、电导率、温度、湿度和水位可以按目标设置不同策略：明文、加密或省略。',
        visualTitle: 'policy.water_ph = plain',
        visualMeta: 'policy.air_humidity = encrypted',
        metric: '3',
        metricLabel: '处理方式',
      },
      {
        eyebrow: 'H3 地图与集体智能',
        title: '种植数据成为区域背景，而不暴露农场。',
        copy:
          '位置使用由所有者选择粒度的 H3 单元格。结果是一套基础数据，帮助本地 LLM、研究者和合作社发现真实模式。',
        visualTitle: 'H3 8a2a107fffff',
        visualMeta: '区域集群 · k-anon 作为产品规则',
        metric: 'H3',
        metricLabel: '私有地图',
      },
      {
        eyebrow: '无需注册的身份',
        title: '十二个词恢复用户权限。',
        copy:
          '身份来自 Ed25519 密钥和 BIP-39 助记词。没有中心登录服务器、强制 API key，也不依赖托管账户。',
        visualTitle: 'owner_pubkey',
        visualMeta: 'BIP-39 · Ed25519 · 设备签名',
        metric: '12',
        metricLabel: '词',
      },
    ],
  },
  events: {
    eyebrow: '星历 · 实时',
    titleStart: '网络',
    titleEmphasis: '正在看到',
    titleEnd: '什么。',
    items: [
      {
        title: '14 个节点的 pH 正在下降',
        body: '在 Cariri 地区，夜间降雨到来，酸度也随之上升。',
        tech: '14 个节点 · H3 集群 · pH delta -0.6 / 4h',
      },
      {
        title: '异常热量移动',
        body: 'Petrolina 的站点在中午前超过 36C。',
        tech: '38 个节点 · z-score +2.1 sigma',
      },
      {
        title: '现在 - 实时读数',
        body: '东北部的农业环境稳定。下午灌溉窗口良好。',
        tech: '124 台设备 · 18 个城市',
      },
    ],
  },
  projects: {
    eyebrow: '生态系统',
    title: '一个网络，多个入口。',
    copy:
      '这个落地页整理了项目中已经存在的内容：SafraSense 硬件、Raiznet 服务器、Arateki 网络仪表盘和开放技术文档。',
    items: [
      {
        icon: 'chip',
        title: 'SafraSense Aqua',
        copy: '用于塔架、栽培台和设备的 ESP32 固件，可测量水、环境和种植运行状态。',
        meta: 'ESP32 · BIP-39 身份 · 签名遥测',
      },
      {
        icon: 'node',
        title: 'Raiznet 服务器',
        copy: '接收读数、分离公共和本地数据、索引到 SQLite 并加入 P2P 网状网络的 Node.js 节点。',
        meta: 'Fastify · Hypercore · SQLite',
      },
      {
        icon: 'dashboard',
        title: 'Arateki 仪表盘',
        copy: '用于跟踪官方网络中的设备、peer、过滤器和同步健康状态的网络视图。',
        meta: 'raiznet:public:arateki:v1',
      },
      {
        icon: 'docs',
        title: '文档',
        copy: '面向运行或集成节点的人提供指南、协议、隐私模型、schema 和 ADR。',
        meta: 'VitePress · 开放协议',
      },
    ],
  },
  how: {
    eyebrow: '从传感器到智能',
    title: '即使网络增长，流程依然简单。',
    steps: [
      {
        title: '传感器测量并签名',
        copy: 'ESP32 收集 pH、电导率、温度、湿度和水位。设备在发送前对数据块签名。',
      },
      {
        title: '本地节点接收',
        copy: '运行在笔记本、Raspberry Pi 或 VPS 上的服务器验证签名，并将公共数据和私有数据存储在不同数据库中。',
      },
      {
        title: '网络复制',
        copy: '可公开的数据进入 append-only Hypercore，并通过网络 topic 在 peer 之间复制。',
      },
      {
        title: '仪表盘解释',
        copy: '界面显示读数、过滤器、H3 地图、网状网络健康状态和帮助运营种植的历史记录。',
      },
      {
        title: '知识回流',
        copy: '本地 LLM、研究者和区域目录可以提取模式，而不会夺走种植者的数据主权。',
      },
    ],
  },
  download: {
    eyebrow: '从节点开始',
    title: '在普通机器上运行一个有效的 Raiznet。',
    copy:
      '服务器是测试网络最直接的方式：它公开公共和本地端点，生成自己的身份，并准备接收传感器的基础环境。',
    github: '打开 GitHub',
    guide: '安装指南',
    terminalLabel: '安装命令',
    commands: [
      '$ git clone https://github.com/arateki/raiznet',
      '$ cd raiznet',
      '$ pnpm install',
      '$ pnpm build',
      '$ pnpm --filter @raiznet/server dev',
    ],
  },
  principles: {
    eyebrow: '原则',
    title: '网络不依赖某个所有者才能继续运行。',
    copy:
      'Raiznet 避开传统 IoT 平台的脆弱点：身份在客户端生成，写入经过签名，私有数据不会进入公共网状网络。',
    items: [
      {
        title: 'Local-first',
        copy: '同一 Wi-Fi 下的一台传感器和一台电脑就足够运行，即使没有互联网。',
      },
      {
        title: '数据主权',
        copy: '密钥留在用户手中。即使 Arateki 离开，数据仍继续存在于用户自己的节点中。',
      },
      {
        title: '按字段控制隐私',
        copy: '每个值都可以按目标设置为公开、加密或省略。设备存在可以公开，但读数不必公开。',
      },
    ],
  },
  footer: {
    madeBy: 'Raiznet · 由 Arateki 制作 · 面向种植者的开放协议',
    github: 'github.com/arateki/raiznet',
  },
};
