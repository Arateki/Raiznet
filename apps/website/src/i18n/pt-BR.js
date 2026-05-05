export const ptBR = {
  brand: {
    name: 'Raiznet',
  },
  nav: {
    label: 'Navegacao principal',
    home: 'Inicio da Raiznet',
    projects: 'Projetos',
    how: 'Como funciona',
    download: 'Baixar',
    docs: 'Documentacao',
    network: 'rede raiznet',
    safraSense: 'SafraSense',
    menu: 'Menu',
  },
  navSub: {
    docs: 'guia · protocolo · ADRs',
    network: 'dashboard · arateki:v1',
    download: 'Node 24 · pnpm',
    safraSense: 'firmware ESP32',
  },
  actions: {
    dashboard: 'Abrir dashboard',
    download: 'Baixar servidor',
    docs: 'Ler docs',
    themeDark: 'Ativar tema escuro',
    themeLight: 'Ativar tema claro',
    languageToggle: 'Mudar idioma',
  },
  topBand: {
    items: ['GRATUITO · SEMPRE', 'SEM MENSALIDADE', 'SEM CADASTRO', 'SEM CHAVE DE ATIVAÇÃO'],
    note: 'se a Arateki sumir amanhã, sua rede continua viva.',
  },
  card: {
    peerNote: 'peer-to-peer puro',
    noCentral: 'sem central',
    youNode: 'você',
    status: 'STATUS',
    info: 'INFO',
  },
  carousel: {
    previous: 'Slide anterior',
    next: 'Proximo slide',
    goTo: 'Ir para slide',
  },
  hero: {
    title: 'Raiznet',
    status: ['Sem mensalidade', 'Sem login tradicional', 'Funciona na rede local', 'Dados sob sua chave'],
    slides: [
      {
        eyebrow: 'Rede aberta da Arateki para agricultura conectada',
        title: 'Uma rede viva para quem planta, com dados sempre sob seu cuidado.',
        copy:
          'Uma malha local-first para sensores, servidores e pessoas que cultivam. Cada leitura pode ser assinada, replicada entre nos e lida sem depender de uma nuvem central.',
        visualTitle: 'raiznet:public:arateki:v1',
        visualMeta: '8 peers sincronizando · 124 dispositivos',
        metric: '99,4%',
        metricLabel: 'replicacao',
      },
      {
        eyebrow: 'Acesso local e remoto',
        title: 'Acompanhe sua rede pelo dashboard, API ou app.',
        copy:
          'O servidor expoe um endpoint publico para o que voce liberou e um endpoint local para os dados do dono. O dashboard da rede Arateki nasce dessa mesma estrutura.',
        visualTitle: 'GET /v1/devices',
        visualMeta: 'publico em :3000 · local em :3001',
        metric: '12s',
        metricLabel: 'ultima leitura',
      },
      {
        eyebrow: 'Privacidade por campo',
        title: 'Cada leitura decide o que sai, o que cifra e o que fica local.',
        copy:
          'pH, condutividade, temperatura, umidade e nivel de agua podem ter politicas diferentes por destino: claro, cifrado ou omitido.',
        visualTitle: 'policy.water_ph = plain',
        visualMeta: 'policy.air_humidity = encrypted',
        metric: '3',
        metricLabel: 'disposicoes',
      },
      {
        eyebrow: 'Mapa H3 e inteligencia coletiva',
        title: 'Dados de cultivo viram contexto regional sem expor a fazenda.',
        copy:
          'A localizacao usa celulas H3 com granularidade escolhida pelo dono. O resultado e uma base que ajuda LLMs, pesquisadores e cooperativas a encontrar padroes reais.',
        visualTitle: 'H3 8a2a107fffff',
        visualMeta: 'cluster regional · k-anon como regra de produto',
        metric: 'H3',
        metricLabel: 'mapa privado',
      },
      {
        eyebrow: 'IA · MCP · MATERIAIS',
        title: 'IA para transformar dados em guias, respostas e conhecimento de cultivo.',
        copy:
          'MCPs permitem que IAs consultem leituras, safras e estatisticas regionais para produzir recomendacoes, relatorios e materiais didaticos assinados, acessiveis pela propria rede.',
        visualTitle: '@raiznet/mcp',
        visualMeta: 'guias · relatorios · boas praticas',
        metric: 'IA',
        metricLabel: 'conhecimento aplicado',
      },
      {
        eyebrow: 'Identidade sem cadastro',
        title: 'Doze palavras recuperam a autoridade do usuario.',
        copy:
          'A identidade vem de chaves Ed25519 e seed phrase BIP-39. Nao existe servidor central de login, API key obrigatoria ou dependencia de uma conta custodial.',
        visualTitle: 'owner_pubkey',
        visualMeta: 'BIP-39 · Ed25519 · assinatura por dispositivo',
        metric: '12',
        metricLabel: 'palavras',
      },
    ],
  },
  events: {
    eyebrow: 'EFEMERIDES · AO VIVO',
    titleStart: 'o que a rede',
    titleEmphasis: 'esta vendo',
    titleEnd: 'agora.',
    items: [
      {
        title: 'pH despencando em 14 nos',
        body: 'na faixa do Cariri, choveu de madrugada e a acidez subiu junto.',
        tech: '14 nodes · cluster H3 · delta pH -0.6 / 4h',
      },
      {
        title: 'transito de calor anormal',
        body: 'sitios em Petrolina passaram dos 36C antes do meio-dia.',
        tech: '38 nodes · z-score +2.1 sigma',
      },
      {
        title: 'agora - leitura ao vivo',
        body: 'o ceu agricola do nordeste esta estavel. boa janela para rega da tarde.',
        tech: '124 devices · 18 cidades',
      },
    ],
  },
  projects: {
    eyebrow: 'Ecossistema',
    title: 'Uma rede, varios pontos de entrada.',
    copy:
      'A landing organiza o que ja existe no projeto: hardware SafraSense, servidor Raiznet, dashboard da rede Arateki e documentacao tecnica aberta.',
    items: [
      {
        icon: 'chip',
        title: 'SafraSense Aqua',
        copy: 'Firmware ESP32 para torres, bancadas e dispositivos que medem agua, ambiente e operacao de cultivo.',
        meta: 'ESP32 · identidade BIP-39 · telemetria assinada',
      },
      {
        icon: 'node',
        title: 'Servidor Raiznet',
        copy: 'No Node.js que recebe leituras, separa dados publicos e locais, indexa em SQLite e participa da malha P2P.',
        meta: 'Fastify · Hypercore · SQLite',
      },
      {
        icon: 'dashboard',
        title: 'Dashboard Arateki',
        copy: 'Visao de rede para acompanhar dispositivos, peers, filtros e saude de sincronizacao da rede oficial.',
        meta: 'raiznet:public:arateki:v1',
      },
      {
        icon: 'docs',
        title: 'Documentacao',
        copy: 'Guias, protocolo, modelo de privacidade, schemas e ADRs para quem quer rodar ou integrar um no.',
        meta: 'VitePress · protocolo aberto',
      },
    ],
  },
  how: {
    eyebrow: 'Do sensor a inteligencia',
    title: 'O fluxo permanece simples mesmo quando a rede cresce.',
    steps: [
      {
        title: 'Sensor mede e assina',
        copy: 'O ESP32 coleta pH, condutividade, temperatura, umidade e nivel de agua. O dispositivo assina o bloco antes de enviar.',
      },
      {
        title: 'No local recebe',
        copy: 'O servidor no notebook, Raspberry Pi ou VPS valida assinatura e guarda dados publicos e privados em bancos separados.',
      },
      {
        title: 'Rede replica',
        copy: 'O que pode ser publico entra em Hypercores append-only e se replica entre peers pelo topic da rede.',
      },
      {
        title: 'Dashboard interpreta',
        copy: 'A interface mostra leituras, filtros, mapa H3, saude da malha e o historico que ajuda a operar o cultivo.',
      },
      {
        title: 'Conhecimento retorna',
        copy: 'LLMs locais, pesquisadores e catalogos regionais podem extrair padroes sem tirar a soberania do produtor.',
      },
    ],
  },
  download: {
    eyebrow: 'Comece pelo no',
    title: 'Rode uma Raiznet valida em uma maquina comum.',
    copy:
      'O servidor e o ponto mais direto para testar a rede: ele expoe endpoints publicos e locais, gera identidade propria e prepara a base para receber sensores.',
    github: 'Abrir GitHub',
    guide: 'Guia de instalacao',
    terminalLabel: 'Comandos de instalacao',
    commands: [
      '$ git clone https://github.com/arateki/raiznet',
      '$ cd raiznet',
      '$ pnpm install',
      '$ pnpm build',
      '$ pnpm --filter @raiznet/server dev',
    ],
  },
  principles: {
    eyebrow: 'Principios',
    title: 'A rede nao depende de um dono para continuar viva.',
    copy:
      'Raiznet evita os pontos frageis de uma plataforma IoT tradicional: a identidade nasce no cliente, a escrita e assinada e o dado privado nao entra na malha publica.',
    items: [
      {
        title: 'Local-first',
        copy: 'Um sensor e um computador no mesmo Wi-Fi ja bastam para operar, mesmo sem internet.',
      },
      {
        title: 'Soberania de dados',
        copy: 'As chaves ficam com o usuario. Se a Arateki sair do caminho, os dados continuam no no dele.',
      },
      {
        title: 'Privacidade por campo',
        copy: 'Cada valor pode ser publico, cifrado ou omitido por destino. A existencia do dispositivo e publica; a leitura nao precisa ser.',
      },
    ],
  },
  footer: {
    madeBy: 'Raiznet · feita pela Arateki · protocolo aberto para quem planta',
    github: 'github.com/arateki/raiznet',
  },
};
