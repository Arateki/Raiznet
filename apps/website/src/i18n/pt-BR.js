export const ptBR = {
  brand: {
    name: 'Raiznet',
  },
  seo: {
    title: 'Raiznet | Rede descentralizada para agricultura conectada',
    description:
      'A Raiznet conecta sensores, servidores e produtores em uma rede local-first para monitoramento de cultivos e inteligência agrícola coletiva.',
  },
  nav: {
    label: 'Navegação principal',
    home: 'Início da Raiznet',
    projects: 'Projetos',
    how: 'Como funciona',
    download: 'Baixar',
    docs: 'Documentação',
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
    next: 'Próximo slide',
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
          'Uma malha local-first para sensores, servidores e pessoas que cultivam. Cada leitura pode ser assinada, replicada entre nós e lida sem depender de uma nuvem central.',
        visualTitle: 'raiznet:public:arateki:v1',
        visualMeta: '8 peers sincronizando · 124 dispositivos',
        metric: '99,4%',
        metricLabel: 'replicação',
      },
      {
        eyebrow: 'Acesso local e remoto',
        title: 'Acompanhe sua rede pelo dashboard, API ou app.',
        copy:
          'O servidor expõe um endpoint público para o que você liberou e um endpoint local para os dados do dono. O dashboard da rede Arateki nasce dessa mesma estrutura.',
        visualTitle: 'GET /v1/devices',
        visualMeta: 'público em :3000 · local em :3001',
        metric: '12s',
        metricLabel: 'última leitura',
      },
      {
        eyebrow: 'Privacidade por campo',
        title: 'Cada leitura decide o que sai, o que cifra e o que fica local.',
        copy:
          'pH, condutividade, temperatura, umidade e nível de água podem ter políticas diferentes por destino: claro, cifrado ou omitido.',
        visualTitle: 'policy.water_ph = plain',
        visualMeta: 'policy.air_humidity = encrypted',
        metric: '3',
        metricLabel: 'disposições',
      },
      {
        eyebrow: 'Mapa H3 e inteligência coletiva',
        title: 'Dados de cultivo viram contexto regional sem expor a fazenda.',
        copy:
          'A localização usa células H3 com granularidade escolhida pelo dono. O resultado é uma base que ajuda LLMs, pesquisadores e cooperativas a encontrar padrões reais.',
        visualTitle: 'H3 8a2a107fffff',
        visualMeta: 'cluster regional · k-anon como regra de produto',
        metric: 'H3',
        metricLabel: 'mapa privado',
      },
      {
        eyebrow: 'IA · MCP · MATERIAIS',
        title: 'IA para transformar dados em guias, respostas e conhecimento de cultivo.',
        copy:
          'MCPs permitem que IAs consultem leituras, safras e estatísticas regionais para produzir recomendações, relatórios e materiais didáticos assinados, acessíveis pela própria rede.',
        visualTitle: '@raiznet/mcp',
        visualMeta: 'guias · relatórios · boas práticas',
        metric: 'IA',
        metricLabel: 'conhecimento aplicado',
      },
      {
        eyebrow: 'Identidade sem cadastro',
        title: 'Doze palavras recuperam a autoridade do usuário.',
        copy:
          'A identidade vem de chaves Ed25519 e seed phrase BIP-39. Não existe servidor central de login, API key obrigatória ou dependência de uma conta custodial.',
        visualTitle: 'owner_pubkey',
        visualMeta: 'BIP-39 · Ed25519 · assinatura por dispositivo',
        metric: '12',
        metricLabel: 'palavras',
      },
    ],
  },
  events: {
    eyebrow: 'EFEMÉRIDES · AO VIVO',
    titleStart: 'o que a rede',
    titleEmphasis: 'está vendo',
    titleEnd: 'agora.',
    items: [
      {
        title: 'pH despencando em 14 nós',
        body: 'na faixa do Cariri, choveu de madrugada e a acidez subiu junto.',
        tech: '14 nodes · cluster H3 · delta pH -0.6 / 4h',
      },
      {
        title: 'trânsito de calor anormal',
        body: 'sítios em Petrolina passaram dos 36 °C antes do meio-dia.',
        tech: '38 nodes · z-score +2.1 sigma',
      },
      {
        title: 'agora - leitura ao vivo',
        body: 'o céu agrícola do nordeste está estável. boa janela para rega da tarde.',
        tech: '124 devices · 18 cidades',
      },
    ],
  },
  projects: {
    eyebrow: 'Ecossistema',
    title: 'Uma rede, vários pontos de entrada.',
    copy:
      'A landing organiza o que já existe no projeto: hardware SafraSense, servidor Raiznet, dashboard da rede Arateki e documentação técnica aberta.',
    items: [
      {
        icon: 'chip',
        title: 'SafraSense Aqua',
        copy: 'Firmware ESP32 para torres, bancadas e dispositivos que medem água, ambiente e operação de cultivo.',
        meta: 'ESP32 · identidade BIP-39 · telemetria assinada',
      },
      {
        icon: 'node',
        title: 'Servidor Raiznet',
        copy: 'Nó que recebe leituras, separa dados públicos e locais, indexa em SQLite e participa da malha P2P.',
        meta: 'HTTP assinado · SQLite · replicação própria',
      },
      {
        icon: 'dashboard',
        title: 'Dashboard Arateki',
        copy: 'Visão de rede para acompanhar dispositivos, peers, filtros e saúde de sincronização da rede oficial.',
        meta: 'raiznet:public:arateki:v1',
      },
      {
        icon: 'docs',
        title: 'Documentação',
        copy: 'Guias, protocolo, modelo de privacidade, schemas e ADRs para quem quer rodar ou integrar um nó.',
        meta: 'VitePress · protocolo aberto',
      },
    ],
  },
  how: {
    eyebrow: 'Do sensor à inteligência',
    title: 'O fluxo permanece simples mesmo quando a rede cresce.',
    steps: [
      {
        title: 'Sensor mede e assina',
        copy: 'O ESP32 coleta pH, condutividade, temperatura, umidade e nível de água. O dispositivo assina o bloco antes de enviar.',
      },
      {
        title: 'Nó local recebe',
        copy: 'O servidor no notebook, Raspberry Pi ou VPS valida a assinatura e guarda dados públicos e privados em bancos separados.',
      },
      {
        title: 'Rede replica',
        copy: 'O que pode ser público entra em logs de eventos assinados (append-only) e se replica entre peers pelo topic da rede.',
      },
      {
        title: 'Dashboard interpreta',
        copy: 'A interface mostra leituras, filtros, mapa H3, saúde da malha e o histórico que ajuda a operar o cultivo.',
      },
      {
        title: 'Conhecimento retorna',
        copy: 'LLMs locais, pesquisadores e catálogos regionais podem extrair padrões sem tirar a soberania do produtor.',
      },
    ],
  },
  download: {
    eyebrow: 'Comece pelo nó',
    title: 'Rode uma Raiznet válida em uma máquina comum.',
    copy:
      'O servidor é o ponto mais direto para testar a rede: ele expõe endpoints públicos e locais, gera identidade própria e prepara a base para receber sensores.',
    github: 'Abrir GitHub',
    guide: 'Guia de instalação',
    terminalLabel: 'Comandos de instalação',
    commands: [
      '$ git clone https://github.com/arateki/raiznet',
      '$ cd raiznet',
      '$ pnpm install',
      '$ pnpm build',
      '$ pnpm --filter @raiznet/server dev',
    ],
  },
  principles: {
    eyebrow: 'Princípios',
    title: 'A rede não depende de um dono para continuar viva.',
    copy:
      'A Raiznet evita os pontos frágeis de uma plataforma IoT tradicional: a identidade nasce no cliente, a escrita é assinada e o dado privado não entra na malha pública.',
    items: [
      {
        title: 'Local-first',
        copy: 'Um sensor e um computador no mesmo Wi-Fi já bastam para operar, mesmo sem internet.',
      },
      {
        title: 'Soberania de dados',
        copy: 'As chaves ficam com o usuário. Se a Arateki sair do caminho, os dados continuam no nó dele.',
      },
      {
        title: 'Privacidade por campo',
        copy: 'Cada valor pode ser público, cifrado ou omitido por destino. A existência do dispositivo é pública; a leitura não precisa ser.',
      },
    ],
  },
  footer: {
    madeBy: 'Raiznet · feita pela Arateki · protocolo aberto para quem planta',
    github: 'github.com/arateki/raiznet',
  },
};
