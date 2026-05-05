export const esES = {
  brand: {
    name: 'Raiznet',
  },
  nav: {
    label: 'Navegación principal',
    home: 'Inicio de Raiznet',
    projects: 'Proyectos',
    how: 'Cómo funciona',
    download: 'Descargar',
    docs: 'Documentación',
    network: 'red raiznet',
    safraSense: 'SafraSense',
    menu: 'Menú',
  },
  navSub: {
    docs: 'guía · protocolo · ADRs',
    network: 'dashboard · arateki:v1',
    download: 'Node 24 · pnpm',
    safraSense: 'firmware ESP32',
  },
  actions: {
    dashboard: 'Abrir dashboard',
    download: 'Descargar servidor',
    docs: 'Leer docs',
    themeDark: 'Activar tema oscuro',
    themeLight: 'Activar tema claro',
    languageToggle: 'Cambiar idioma',
  },
  topBand: {
    items: ['GRATIS · SIEMPRE', 'SIN SUSCRIPCIÓN', 'SIN REGISTRO', 'SIN CLAVE DE ACTIVACIÓN'],
    note: 'si Arateki desaparece mañana, tu red sigue viva.',
  },
  card: {
    peerNote: 'peer-to-peer puro',
    noCentral: 'sin central',
    youNode: 'tú',
    status: 'ESTADO',
    info: 'INFO',
  },
  carousel: {
    previous: 'Slide anterior',
    next: 'Siguiente slide',
    goTo: 'Ir al slide',
  },
  hero: {
    title: 'Raiznet',
    status: ['Sin suscripción', 'Sin login tradicional', 'Funciona en la red local', 'Datos bajo tu clave'],
    slides: [
      {
        eyebrow: 'Red abierta de Arateki para agricultura conectada',
        title: 'Una red viva para quienes cultivan, con datos siempre bajo su cuidado.',
        copy:
          'Una malla local-first para sensores, servidores y personas que cultivan. Cada lectura puede firmarse, replicarse entre nodos y leerse sin depender de una nube central.',
        visualTitle: 'raiznet:public:arateki:v1',
        visualMeta: '8 peers sincronizando · 124 dispositivos',
        metric: '99,4%',
        metricLabel: 'replicación',
      },
      {
        eyebrow: 'Acceso local y remoto',
        title: 'Acompaña tu red desde el dashboard, la API o la app.',
        copy:
          'El servidor expone un endpoint público para lo que decidas liberar y un endpoint local para los datos del dueño. El dashboard de la red Arateki nace de esa misma estructura.',
        visualTitle: 'GET /v1/devices',
        visualMeta: 'público en :3000 · local en :3001',
        metric: '12s',
        metricLabel: 'última lectura',
      },
      {
        eyebrow: 'Privacidad por campo',
        title: 'Cada lectura decide qué sale, qué se cifra y qué queda local.',
        copy:
          'pH, conductividad, temperatura, humedad y nivel de agua pueden tener políticas diferentes por destino: claro, cifrado u omitido.',
        visualTitle: 'policy.water_ph = plain',
        visualMeta: 'policy.air_humidity = encrypted',
        metric: '3',
        metricLabel: 'disposiciones',
      },
      {
        eyebrow: 'Mapa H3 e inteligencia colectiva',
        title: 'Los datos de cultivo se vuelven contexto regional sin exponer la finca.',
        copy:
          'La ubicación usa celdas H3 con granularidad elegida por el dueño. El resultado es una base que ayuda a LLMs locales, investigadores y cooperativas a encontrar patrones reales.',
        visualTitle: 'H3 8a2a107fffff',
        visualMeta: 'cluster regional · k-anon como regla de producto',
        metric: 'H3',
        metricLabel: 'mapa privado',
      },
      {
        eyebrow: 'IA · MCP · MATERIALES',
        title: 'IA para convertir datos en guias, respuestas y conocimiento de cultivo.',
        copy:
          'Los MCP permiten que IAs consulten lecturas, ciclos de cultivo y estadisticas regionales para producir recomendaciones, informes y materiales educativos firmados, disponibles en la propia red.',
        visualTitle: '@raiznet/mcp',
        visualMeta: 'guias · informes · buenas practicas',
        metric: 'IA',
        metricLabel: 'conocimiento aplicado',
      },
      {
        eyebrow: 'Identidad sin registro',
        title: 'Doce palabras recuperan la autoridad del usuario.',
        copy:
          'La identidad viene de claves Ed25519 y una frase semilla BIP-39. No existe servidor central de login, API key obligatoria ni dependencia de una cuenta custodiada.',
        visualTitle: 'owner_pubkey',
        visualMeta: 'BIP-39 · Ed25519 · firmas de dispositivo',
        metric: '12',
        metricLabel: 'palabras',
      },
    ],
  },
  events: {
    eyebrow: 'EFEMÉRIDES · EN VIVO',
    titleStart: 'lo que la red',
    titleEmphasis: 'está viendo',
    titleEnd: 'ahora.',
    items: [
      {
        title: 'pH cayendo en 14 nodos',
        body: 'en la región de Cariri, llovió de madrugada y la acidez subió con la lluvia.',
        tech: '14 nodos · cluster H3 · delta pH -0.6 / 4h',
      },
      {
        title: 'movimiento de calor inusual',
        body: 'sitios en Petrolina superaron los 36C antes del mediodía.',
        tech: '38 nodos · z-score +2.1 sigma',
      },
      {
        title: 'ahora - lectura en vivo',
        body: 'el cielo agrícola del nordeste está estable. buena ventana para riego por la tarde.',
        tech: '124 dispositivos · 18 ciudades',
      },
    ],
  },
  projects: {
    eyebrow: 'Ecosistema',
    title: 'Una red, varios puntos de entrada.',
    copy:
      'La landing organiza lo que ya existe en el proyecto: hardware SafraSense, servidor Raiznet, dashboard de la red Arateki y documentación técnica abierta.',
    items: [
      {
        icon: 'chip',
        title: 'SafraSense Aqua',
        copy: 'Firmware ESP32 para torres, bancadas y dispositivos que miden agua, ambiente y operación del cultivo.',
        meta: 'ESP32 · identidad BIP-39 · telemetría firmada',
      },
      {
        icon: 'node',
        title: 'Servidor Raiznet',
        copy: 'Nodo Node.js que recibe lecturas, separa datos públicos y locales, indexa en SQLite y participa en la malla P2P.',
        meta: 'Fastify · Hypercore · SQLite',
      },
      {
        icon: 'dashboard',
        title: 'Dashboard Arateki',
        copy: 'Vista de red para seguir dispositivos, peers, filtros y salud de sincronización en la red oficial.',
        meta: 'raiznet:public:arateki:v1',
      },
      {
        icon: 'docs',
        title: 'Documentación',
        copy: 'Guías, protocolo, modelo de privacidad, schemas y ADRs para quien quiera ejecutar o integrar un nodo.',
        meta: 'VitePress · protocolo abierto',
      },
    ],
  },
  how: {
    eyebrow: 'Del sensor a la inteligencia',
    title: 'El flujo sigue siendo simple aunque la red crezca.',
    steps: [
      {
        title: 'El sensor mide y firma',
        copy: 'El ESP32 recoge pH, conductividad, temperatura, humedad y nivel de agua. El dispositivo firma el bloque antes de enviarlo.',
      },
      {
        title: 'El nodo local recibe',
        copy: 'El servidor en una notebook, Raspberry Pi o VPS valida la firma y guarda datos públicos y privados en bases separadas.',
      },
      {
        title: 'La red replica',
        copy: 'Lo que puede ser público entra en Hypercores append-only y se replica entre peers por el topic de la red.',
      },
      {
        title: 'El dashboard interpreta',
        copy: 'La interfaz muestra lecturas, filtros, mapa H3, salud de la malla e historial que ayuda a operar el cultivo.',
      },
      {
        title: 'El conocimiento vuelve',
        copy: 'LLMs locales, investigadores y catálogos regionales pueden extraer patrones sin quitar soberanía al productor.',
      },
    ],
  },
  download: {
    eyebrow: 'Empieza por el nodo',
    title: 'Ejecuta una Raiznet válida en una máquina común.',
    copy:
      'El servidor es la forma más directa de probar la red: expone endpoints públicos y locales, genera su propia identidad y prepara la base para recibir sensores.',
    github: 'Abrir GitHub',
    guide: 'Guía de instalación',
    terminalLabel: 'Comandos de instalación',
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
    title: 'La red no depende de un dueño para seguir viva.',
    copy:
      'Raiznet evita los puntos frágiles de una plataforma IoT tradicional: la identidad nace en el cliente, las escrituras se firman y el dato privado no entra en la malla pública.',
    items: [
      {
        title: 'Local-first',
        copy: 'Un sensor y una computadora en el mismo Wi-Fi bastan para operar, incluso sin internet.',
      },
      {
        title: 'Soberanía de datos',
        copy: 'Las claves quedan con el usuario. Si Arateki sale del camino, los datos continúan en su nodo.',
      },
      {
        title: 'Privacidad por campo',
        copy: 'Cada valor puede ser público, cifrado u omitido por destino. La existencia del dispositivo es pública; las lecturas no tienen que serlo.',
      },
    ],
  },
  footer: {
    madeBy: 'Raiznet · hecha por Arateki · protocolo abierto para quienes cultivan',
    github: 'github.com/arateki/raiznet',
  },
};
