import React from 'react';

// Raiznet — Landing principal com Hero em carrossel.
// Estética: card torto + sombra dura sólida (vinda de M·Feira), fundo granulado
// fino tipo papel reciclado (vinda de G·Risográfico, mas grão menor),
// efemérides ao vivo (vinda de O·Estrelas).
//
// Cada slide do carrossel destaca uma característica da rede:
//   1 · Utilidade da rede (visão de campo + P2P)
//   2 · Acesso remoto aos dados (app/web/CLI)
//   3 · Inteligência conectada (LLM local + insights úteis)
//   4 · Mapa e localização H3 (anonimização)
//   5 · Identidade e soberania (BIP-39 + chaves)
//
// Autocontido: aceita props (theme · primary · displayFont) e, no protótipo,
// ainda acompanha os tweaks globais quando eles existem.

function getLandingCssVar(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.documentElement) return fallback;
  const v = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function useLandingThemeMode(theme) {
  const get = () => {
    if (theme) return theme;
    if (typeof document === 'undefined' || !document.documentElement) return 'light';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  };
  const [mode, setMode] = React.useState(get);
  React.useEffect(() => {
    if (theme) {
      setMode(theme);
      return undefined;
    }
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.documentElement) return undefined;
    const obs = new MutationObserver(() => setMode(get()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [theme]);
  return mode;
}

function landingPalette(mode, primary, displayFont) {
  const dark = mode === 'dark';
  const primaryColor = primary || getLandingCssVar('--primary', '#3a7d44');
  const fontName = displayFont || getLandingCssVar('--f-serif', 'Cormorant Garamond, Georgia, serif');
  const serif = fontName.includes(',') ? fontName : `"${fontName}", "Cormorant Garamond", Georgia, serif`;
  const mix = (pct, toward = 'white') => `color-mix(in oklab, ${primaryColor} ${100 - pct}%, ${toward} ${pct}%)`;
  return {
    bg:        dark ? '#0f1612' : '#f4ecd8',
    surface:   dark ? '#161e19' : '#ffffff',
    panel:     dark ? '#1c2620' : '#e8dcc0',
    sand:      dark ? '#222d26' : '#e8dcc0',
    cream:     dark ? '#1c2620' : '#f7f1de',
    ink:       dark ? '#e6ead0' : '#1d231e',
    dim:       dark ? '#8c9388' : '#5b5e52',
    line:      dark ? '#2c3a31' : '#1d231e',
    soft:      dark ? '#2c3a31' : '#d8d2bf',
    forest:    dark ? mix(55) : primaryColor,
    leaf:      dark ? mix(45) : mix(30),
    moss:      dark ? mix(35) : mix(45),
    sage:      dark ? mix(25) : mix(60),
    terracotta:dark ? '#e88863' : '#c2613a',
    wheat:     dark ? '#f0d68b' : '#e8c47a',
    sun:       dark ? '#f0d68b' : '#e8c47a',
    sky:       dark ? '#9cc4dc' : '#7aa6c2',
    skyLight:  dark ? '#1f2c33' : '#cfd9dc',
    onForest:  dark ? '#0f1612' : '#f4ecd8',
    primary:   primaryColor,
    primarySoft: `color-mix(in oklab, ${primaryColor} 18%, transparent)`,
    primaryLine: `color-mix(in oklab, ${primaryColor} 35%, transparent)`,
    serif,
  };
}

function LCGRoot({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 3v8"/>
      <path d="M12 11c-2 2-5 3-6 6"/>
      <path d="M12 11c2 2 5 3 6 6"/>
      <path d="M12 11v8"/>
      <path d="M9 21h6"/>
    </svg>
  );
}

function LCIcon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}

const LCI = {
  cpu:    <><rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>,
  book:   <><path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/></>,
  globe:  <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18"/></>,
  download:<><path d="M12 4v12M6 12l6 6 6-6"/><path d="M4 20h16"/></>,
};

function LandingCarousel({ theme, primary, displayFont } = {}) {
  const mode = useLandingThemeMode(theme);
  const C = landingPalette(mode, primary, displayFont);
  const dark = mode === 'dark';

  // ── Papel reciclado: noise preto + 3 camadas de grão colorido sutil ───────
  // Cada camada de cor simula uma "fibra" do papel reciclado: terracotta,
  // verde-musgo, e azul-céu desbotado. Opacidade muito baixa (≤ 0.05) para
  // parecer falha de impressão / fibra residual, não pixelização.
  const grainSm   = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.085 0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>`;
  const grainLg   = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0'/></filter><rect width='600' height='600' filter='url(%23n)'/></svg>`;
  const grainTerra= `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2.4' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.76  0 0 0 0 0.38  0 0 0 0 0.23  0 0 0 0.05 0'/></filter><rect width='320' height='320' filter='url(%23n)'/></svg>`;
  const grainGreen= `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2.6' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.23  0 0 0 0 0.49  0 0 0 0 0.27  0 0 0 0.045 0'/></filter><rect width='360' height='360' filter='url(%23n)'/></svg>`;
  const grainSky  = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 280'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2.8' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.48  0 0 0 0 0.65  0 0 0 0 0.76  0 0 0 0.035 0'/></filter><rect width='280' height='280' filter='url(%23n)'/></svg>`;
  const paperBg = dark
    ? `url("${grainTerra}"), url("${grainGreen}"), url("${grainSky}"), url("${grainLg}"), url("${grainSm}"), linear-gradient(180deg, #16201a 0%, #121a14 100%)`
    : `url("${grainTerra}"), url("${grainGreen}"), url("${grainSky}"), url("${grainLg}"), url("${grainSm}"), linear-gradient(180deg, #f4ecd8 0%, #ede2c4 100%)`;

  // Paleta de feira: terracotta + wheat + leaf, com tons que reagem ao tweak
  const inkSolid = dark ? C.ink : '#1d231e';
  // Card torto: cor clara FIXA em ambos os modos (papel amarelado).
  // O texto dentro do card também é fixo (preto) para legibilidade no dark.
  const cardWheat = '#f1d99a';
  const cardCream = '#fbf6e8';
  const cardInk   = '#1d231e';

  // ── Carrossel state ───────────────────────────────────────────────────────
  const [slide, setSlide] = React.useState(0);
  const slides = [
    {
      eyebrow: 'A REDE · DESCENTRALIZADA POR DESIGN',
      titleParts: [
        { t: 'uma rede ', s: false }, { t: 'sem dono', s: true, color: C.terracotta },
        { t: ', ', s: false, br: true }, { t: 'feita ', s: false }, { t: 'por quem planta', s: true, color: C.leaf },
        { t: '.', s: false },
      ],
      paragraph: <>Cada nó é seu. Cada leitura é assinada. Não há servidor central — os dados saem do ESP32 da sua horta direto pra rede de vizinhos via Hyperswarm. <strong style={{ color: inkSolid }}>Funciona até sem internet.</strong></>,
      ctaPrimary: 'baixar o servidor →',
      ctaSecondary: 'ver as redes ativas',
      card: <SlideNetwork C={C} dark={dark} cardWheat={cardWheat} cardInk={cardInk}/>,
    },
    {
      eyebrow: 'ACESSO · DE QUALQUER LUGAR',
      titleParts: [
        { t: 'os dados ', s: false }, { t: 'da sua horta', s: true, color: C.leaf },
        { t: ', ', s: false, br: true }, { t: 'no ', s: false }, { t: 'celular, no laptop, no MCP', s: true, color: C.terracotta },
        { t: '.', s: false },
      ],
      paragraph: <>O servidor expõe dois endpoints: um público (qualquer um lê o que você liberou) e um local autenticado (só você, com tudo). Acesse pelo navegador, pelo app, ou aponte um <strong style={{ color: inkSolid }}>LLM via MCP</strong>.</>,
      ctaPrimary: 'abrir minha rede →',
      ctaSecondary: 'docs do endpoint',
      card: <SlideAccess C={C} dark={dark} cardWheat={cardWheat} cardInk={cardInk}/>,
    },
    {
      eyebrow: 'INTELIGÊNCIA · INFERÊNCIA LOCAL',
      titleParts: [
        { t: 'um ', s: false }, { t: 'observador atento', s: true, color: C.leaf },
        { t: ' que ', s: false, br: true }, { t: 'roda na sua casa', s: true, color: C.terracotta },
        { t: '.', s: false },
      ],
      paragraph: <>Aponte qualquer modelo (inclusive open-source via Ollama) ao endpoint MCP. Ele cruza sensores, clima, calendário e detecta padrões — <em>"sítios em Petrolina passaram dos 36°C antes do meio-dia"</em> — sem nada sair do seu wifi.</>,
      ctaPrimary: 'instalar @raiznet/mcp →',
      ctaSecondary: 'ver insights de exemplo',
      card: <SlideAI C={C} dark={dark} cardWheat={cardWheat} cardInk={cardInk}/>,
    },
    {
      eyebrow: 'MAPA · CÉLULAS H3 · K-ANON',
      titleParts: [
        { t: 'sua ', s: false }, { t: 'localização', s: true, color: C.leaf },
        { t: ', ', s: false, br: true }, { t: 'no ', s: false }, { t: 'tamanho que você quiser', s: true, color: C.terracotta },
        { t: '.', s: false },
      ],
      paragraph: <>O sistema H3 (Uber) divide o mundo em hexágonos hierárquicos. Você escolhe a resolução: do <strong>continente</strong> (res 5) ao <strong>canteiro</strong> (res 11). Mais largo = mais privado. <em>k-anon ≥ 5</em> por padrão.</>,
      ctaPrimary: 'explorar o atlas →',
      ctaSecondary: 'como anonimiza',
      card: <SlideMap C={C} dark={dark} cardWheat={cardWheat} cardInk={cardInk}/>,
    },
    {
      eyebrow: 'IDENTIDADE · BIP-39 · ED25519',
      titleParts: [
        { t: 'doze ', s: false }, { t: 'palavras', s: true, color: C.terracotta },
        { t: ' que ', s: false, br: true }, { t: 'cabem na sua mão', s: true, color: C.leaf },
        { t: '.', s: false },
      ],
      paragraph: <>Sua identidade na rede é uma chave Ed25519 derivada de 12 palavras BIP-39. Não há cadastro, senha, "esqueci" ou cartório — só você guarda. Se a Arateki sumir amanhã, sua rede continua viva no seu nó.</>,
      ctaPrimary: 'gerar minha semente →',
      ctaSecondary: 'manual de guarda',
      card: <SlideIdentity C={C} dark={dark} cardWheat={cardWheat} cardInk={cardInk}/>,
    },
  ];
  const cur = slides[slide];

  const prev = () => setSlide((s) => (s - 1 + slides.length) % slides.length);
  const next = () => setSlide((s) => (s + 1) % slides.length);

  // auto-advance suave (8s) — pausa em hover do hero
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 9000);
    return () => clearTimeout(t);
  }, [slide, paused]);

  return (
    <div style={{
      width: 1440, minHeight: 2300, background: paperBg, color: inkSolid,
      fontFamily: 'Montserrat, sans-serif', overflow: 'hidden',
    }}>
      {/* HEADER ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 56px', borderBottom: `1.5px solid ${inkSolid}`,
        background: dark ? 'rgba(15,22,18,0.65)' : 'rgba(244,236,216,0.65)',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LCGRoot size={22}/>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.22em' }}>R A I Z N E T</span>
          <span style={{ fontSize: 10, color: C.dim, marginLeft: 4, fontStyle: 'italic', fontFamily: C.serif }}>· por Arateki</span>
        </div>
        <div style={{ display: 'flex', gap: 26, fontSize: 12, alignItems: 'center' }}>
          {[
            { l: 'documentação', sub: 'guia · protocolo · ADRs' },
            { l: 'rede raiznet', sub: 'gateway público · app' },
            { l: 'baixar servidor', sub: 'npx raiznet-server' },
            { l: 'SafraSense', sub: 'firmware ESP32 · loja' },
            { l: 'GitHub', sub: 'arateki/raiznet' },
          ].map((m) => (
            <div key={m.l} style={{ position: 'relative', cursor: 'default' }}>
              <span style={{ color: inkSolid, fontWeight: 500 }}>{m.l}</span>
              <div style={{ fontSize: 9, color: C.dim, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
        <button style={{
          background: C.primary, color: C.onForest, border: `1.5px solid ${inkSolid}`,
          padding: '10px 18px', fontSize: 12, fontWeight: 600,
          boxShadow: `4px 4px 0 ${inkSolid}`, cursor: 'default',
        }}>baixar →</button>
      </nav>

      {/* FAIXA GRATUITO ─────────────────────────────────────────────────────── */}
      <div style={{
        background: inkSolid, color: dark ? '#f4ecd8' : '#f4ecd8',
        padding: '8px 56px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.18em', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.leaf }}/>
            GRATUITO · SEMPRE
          </span>
          <span style={{ opacity: 0.55 }}>·</span>
          <span>SEM MENSALIDADE</span>
          <span style={{ opacity: 0.55 }}>·</span>
          <span>SEM CADASTRO</span>
          <span style={{ opacity: 0.55 }}>·</span>
          <span>SEM CHAVE DE ATIVAÇÃO</span>
          <span style={{ opacity: 0.55 }}>·</span>
          <span>OPEN-SOURCE (MIT + CERN-OHL + CC BY-SA)</span>
        </span>
        <span style={{ opacity: 0.65, fontStyle: 'italic', fontFamily: C.serif, textTransform: 'none', letterSpacing: 0 }}>
          ↳ se a Arateki sumir amanhã, sua rede continua viva.
        </span>
      </div>

      {/* HERO COM CARROSSEL ─────────────────────────────────────────────────── */}
      <section
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ padding: '48px 56px 36px', position: 'relative' }}
      >
        {/* indicador slide / total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 11, color: C.terracotta, fontWeight: 700, letterSpacing: '0.22em', fontFamily: 'JetBrains Mono, monospace' }}>{cur.eyebrow}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.dim }}>
            <span>{String(slide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
            <button onClick={prev} style={navBtn(inkSolid, dark)}>←</button>
            <button onClick={next} style={navBtn(inkSolid, dark)}>→</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 50, alignItems: 'center', minHeight: 540 }}>
          {/* Lado esquerdo — texto */}
          <div key={`text-${slide}`} style={{ animation: 'rzFade 420ms ease' }}>
            <h1 style={{
              fontSize: 78, fontWeight: 400, lineHeight: 0.94, margin: 0,
              fontFamily: C.serif, letterSpacing: '-0.02em',
            }}>
              {cur.titleParts.map((p, i) => (
                <React.Fragment key={i}>
                  <span style={{
                    fontStyle: p.s ? 'italic' : 'normal',
                    color: p.color || 'inherit',
                  }}>{p.t}</span>
                  {p.br && <br/>}
                </React.Fragment>
              ))}
            </h1>
            <p style={{ fontSize: 16, color: C.dim, lineHeight: 1.65, marginTop: 24, maxWidth: 540 }}>
              {cur.paragraph}
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 28, alignItems: 'center' }}>
              <button style={ctaPrimary(inkSolid, C.primary)}>{cur.ctaPrimary}</button>
              <button style={ctaSecondary(inkSolid)}>{cur.ctaSecondary}</button>
            </div>
          </div>

          {/* Lado direito — card torto (varia por slide) */}
          <div key={`card-${slide}`} style={{ animation: 'rzFadeUp 480ms ease', position: 'relative' }}>
            {cur.card}
          </div>
        </div>

        {/* bullets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 36 }}>
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`ir para slide ${i + 1}`}
              style={{
                width: i === slide ? 32 : 10, height: 10,
                background: i === slide ? inkSolid : 'transparent',
                border: `1.5px solid ${inkSolid}`,
                cursor: 'default', padding: 0,
                transition: 'width 280ms ease, background 280ms ease',
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes rzFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes rzFadeUp {
            from { opacity: 0; transform: translateY(14px) rotate(-0.6deg); }
            to   { opacity: 1; transform: translateY(0) rotate(0deg); }
          }
        `}</style>
      </section>

      {/* EFEMÉRIDES AO VIVO ─────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 56px', borderTop: `1.5px dashed ${inkSolid}`, borderBottom: `1.5px dashed ${inkSolid}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: C.terracotta, letterSpacing: '0.22em', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>EFEMÉRIDES · AO VIVO · 14·ABR·2026</div>
            <h2 style={{ fontSize: 46, fontFamily: C.serif, fontWeight: 400, margin: '8px 0 0', lineHeight: 1.02 }}>
              o que a rede <span style={{ fontStyle: 'italic', color: C.leaf }}>está vendo</span> agora.
            </h2>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.dim, textAlign: 'right' }}>
            <div>1.284 nós ativos · 218 cidades</div>
            <div>μ pH 6.18 · μ EC 1.42 ms/cm</div>
            <div>uplink médio: 12s atrás</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            {
              dot: C.leaf, when: '03·ABR · 06h12',
              t: 'pH despencando em 14 nós',
              simple: 'na faixa do Cariri, choveu de madrugada e a acidez subiu junto. assistente sugere bicarbonato de potássio.',
              tech: '14 nodes · cluster H3 8835eb96fffffff · Δ pH = -0.6 / 4h',
            },
            {
              dot: C.terracotta, when: '03·ABR · 11h08',
              t: 'trânsito de calor anormal',
              simple: 'sítios em Petrolina passaram dos 36°C antes do meio-dia. cooperativa local emitiu aviso na rede.',
              tech: '38 nodes · z-score +2.1σ vs. baseline 30 dias',
            },
            {
              dot: C.sky, when: '03·ABR · 14h32',
              t: 'agora — leitura ao vivo',
              simple: 'o céu agrícola do nordeste está estável. ventos calmos. boa janela pra rega da tarde.',
              tech: '1.284 nodes · 218 cidades · 2.1M leituras / dia',
            },
          ].map((e, i) => (
            <div key={i} style={{ borderTop: `2px solid ${e.dot}`, paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.dim, letterSpacing: '0.12em', marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.dot, display: 'inline-block' }}/>
                {e.when}
              </div>
              <div style={{ fontSize: 24, fontFamily: C.serif, fontStyle: 'italic', lineHeight: 1.1, color: inkSolid }}>{e.t}</div>
              <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 10 }}>{e.simple}</p>
              <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: e.dot, lineHeight: 1.5 }}>↳ {e.tech}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DO DISPOSITIVO À INTELIGÊNCIA ──────────────────────────────────────── */}
      <section style={{ padding: '56px 56px' }}>
        <div style={{ fontSize: 11, color: C.terracotta, letterSpacing: '0.22em', fontWeight: 700, marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>DO FIO À INTELIGÊNCIA · 5 PASSOS</div>
        <h2 style={{ fontSize: 50, fontFamily: C.serif, fontWeight: 400, margin: '0 0 36px', lineHeight: 1 }}>
          o caminho <span style={{ fontStyle: 'italic', color: C.leaf }}>completo</span>.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 }}>
          {[
            { n: '01', t: 'sensor', d: 'ESP32 lê pH, EC, temp, umidade. assina cada pacote com Ed25519.', tech: '~R$ 113 em peças', tilt: -1.2, color: C.leaf },
            { n: '02', t: 'servidor', d: 'roda em casa (Pi/notebook). 2 endpoints: público + local.', tech: 'Fastify + Hypercore', tilt: 0.8, color: C.terracotta },
            { n: '03', t: 'rede', d: 'descobre vizinhos via Hyperswarm DHT. replica sob demanda.', tech: 'NAT holepunching', tilt: -0.6, color: C.sky },
            { n: '04', t: 'mapa', d: 'localização via H3. resolução escolhida pelo dono.', tech: 'k-anon ≥ 5', tilt: 1.4, color: C.wheat },
            { n: '05', t: 'IA local', d: 'qualquer LLM com MCP responde sobre sua horta.', tech: 'Ollama compatível', tilt: -1, color: C.moss },
          ].map((s, i) => (
            <div key={i} style={{
              background: cardCream, border: `2px solid ${inkSolid}`, padding: 18,
              transform: `rotate(${s.tilt}deg)`, boxShadow: `5px 5px 0 ${s.color}`,
              minHeight: 200, position: 'relative',
            }}>
              <div style={{ fontSize: 32, fontStyle: 'italic', fontFamily: C.serif, color: s.color, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 22, fontFamily: C.serif, fontStyle: 'italic', marginTop: 6, lineHeight: 1.05 }}>{s.t}</div>
              <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, marginTop: 10 }}>{s.d}</p>
              <div style={{ position: 'absolute', bottom: 14, left: 18, right: 18, fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: s.color, borderTop: `1px dashed ${C.dim}`, paddingTop: 6 }}>↳ {s.tech}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 56px', background: dark ? '#0c130f' : C.primary, color: dark ? C.ink : C.onForest, position: 'relative', borderTop: `1.5px solid ${inkSolid}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 64, fontFamily: C.serif, fontWeight: 400, lineHeight: 1, margin: 0 }}>
              comece em <span style={{ fontStyle: 'italic', color: C.wheat }}>uma tarde</span>.<br/>
              cresça <span style={{ fontStyle: 'italic', color: C.wheat }}>a vida toda</span>.
            </h2>
            <p style={{ fontSize: 15, opacity: 0.78, marginTop: 22, maxWidth: 560, lineHeight: 1.65 }}>
              Você pode começar como leitor (visite app.arateki.com), como nó solitário (sobe o servidor no notebook velho), ou como cooperativa (publica um NetworkManifest). A rede acolhe nas três escalas.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { t: 'baixar o servidor', sub: 'npx raiznet-server · 1 linha · Node 24', icon: <LCIcon d={LCI.download} size={16}/>, primary: true },
              { t: 'gravar firmware ESP32', sub: 'firmware/esp32-sample · PlatformIO', icon: <LCIcon d={LCI.cpu} size={16}/> },
              { t: 'visitar o gateway público', sub: 'app.arateki.com · sem cadastro', icon: <LCIcon d={LCI.globe} size={16}/> },
              { t: 'ler a documentação', sub: 'docs · protocolo · ADRs', icon: <LCIcon d={LCI.book} size={16}/> },
            ].map((c, i) => (
              <button key={i} style={{
                background: c.primary ? C.wheat : 'transparent', color: c.primary ? '#1d231e' : 'currentColor',
                border: `1.5px solid ${c.primary ? C.wheat : 'currentColor'}`, padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                fontFamily: 'inherit', cursor: 'default', textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {c.icon}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.t}</div>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', opacity: 0.65, marginTop: 2 }}>{c.sub}</div>
                  </div>
                </div>
                <span style={{ fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: '24px 56px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim, borderTop: `1.5px solid ${inkSolid}` }}>
        <span>raiznet · uma rede para quem planta · 2026 · feita pela Arateki</span>
        <span>MIT + CERN-OHL + CC BY-SA · github.com/Arateki/Raiznet</span>
      </footer>
    </div>
  );
}

// ── Helpers de estilo ──────────────────────────────────────────────────────
function navBtn(ink, dark) {
  return {
    width: 32, height: 32, border: `1.5px solid ${ink}`,
    background: dark ? 'rgba(15,22,18,0.4)' : 'rgba(244,236,216,0.4)',
    color: ink, fontSize: 14, cursor: 'default', padding: 0,
    fontFamily: 'inherit',
  };
}
function ctaPrimary(ink, primary) {
  return {
    background: primary, color: '#f4ecd8', border: `1.5px solid ${ink}`,
    padding: '14px 22px', fontSize: 13, fontWeight: 600,
    boxShadow: `5px 5px 0 ${ink}`, cursor: 'default', fontFamily: 'inherit',
  };
}
function ctaSecondary(ink) {
  return {
    background: 'transparent', color: ink, border: `1.5px solid ${ink}`,
    padding: '14px 22px', fontSize: 13, fontWeight: 500,
    cursor: 'default', fontFamily: 'inherit',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// CARDS DOS SLIDES — cada um com elementos gráficos diferentes,
// mas o mesmo "esqueleto" (card torto + borda preta + sombra dura)
// ═════════════════════════════════════════════════════════════════════════════

// helper: container de card torto com borda + sombra dura
function TiltCard({ tilt = 1, shadowColor, bg, ink, label, sub, children, h = 480, serif = 'Georgia, serif' }) {
  return (
    <div style={{
      background: bg, color: ink, padding: 24, position: 'relative',
      transform: `rotate(${tilt}deg)`, boxShadow: `12px 12px 0 ${shadowColor}`,
      border: `2px solid ${ink}`, minHeight: h,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1.5px dashed ${ink}`, paddingBottom: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
        <span style={{ fontSize: 10, opacity: 0.65, fontStyle: 'italic', fontFamily: serif }}>{sub}</span>
      </div>
      {children}
    </div>
  );
}

// ── 1 · NETWORK — diagrama de rede de nós ─────────────────────────────────
function SlideNetwork({ C, dark, cardWheat, cardInk }) {
  return (
    <TiltCard tilt={1.2} shadowColor={C.terracotta} bg={cardWheat} ink={cardInk} serif={C.serif}
      label="DIAGRAMA · 1.284 NÓS · 14·ABR·14h32"
      sub="raiznet:public:arateki:v1">
      <svg viewBox="0 0 440 360" style={{ width: '100%', height: 320, display: 'block' }}>
        {/* conexões P2P */}
        <g stroke={cardInk} strokeWidth="1" opacity="0.35" fill="none">
          <path d="M80 70 Q 200 50 360 80"/>
          <path d="M80 70 Q 100 200 220 280"/>
          <path d="M80 70 Q 200 150 360 240"/>
          <path d="M360 80 Q 380 200 220 280"/>
          <path d="M360 80 Q 340 150 360 240"/>
          <path d="M220 280 Q 260 200 360 240"/>
          <path d="M150 180 Q 200 200 250 200"/>
          <path d="M150 180 Q 220 240 220 280"/>
          <path d="M250 200 Q 300 220 360 240"/>
          <path d="M150 180 Q 100 100 80 70"/>
        </g>
        {/* nós */}
        {[
          { x: 80, y: 70, r: 14, label: 'arateki', color: C.primary },
          { x: 360, y: 80, r: 12, label: 'coop-pe', color: C.terracotta },
          { x: 150, y: 180, r: 10, label: 'sítio-bem', color: C.sky },
          { x: 250, y: 200, r: 10, label: 'horta-ce', color: C.wheat },
          { x: 220, y: 280, r: 16, label: 'você', color: C.terracotta, you: true },
          { x: 360, y: 240, r: 9, label: 'ufce', color: C.dim },
        ].map((n, i) => (
          <g key={i}>
            {n.you && <circle cx={n.x} cy={n.y} r={n.r + 8} fill="none" stroke={cardInk} strokeWidth="1.2" strokeDasharray="3 3"/>}
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} stroke={cardInk} strokeWidth="1.5"/>
            <text x={n.x} y={n.y + n.r + 14} fontSize="10" fill={cardInk} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{n.label}</text>
          </g>
        ))}
        {/* anotações manuais */}
        <g fontFamily={C.serif} fontSize="11" fill={cardInk} fontStyle="italic">
          <text x="20" y="40">→ peer-to-peer puro</text>
          <text x="280" y="350">↑ sem central</text>
        </g>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
        <div style={{ borderLeft: `3px solid ${C.leaf}`, paddingLeft: 8 }}>
          <div style={{ color: C.dim, fontSize: 9 }}>TRANSPORTE</div>
          <div>Hyperswarm + UDP</div>
        </div>
        <div style={{ borderLeft: `3px solid ${C.terracotta}`, paddingLeft: 8 }}>
          <div style={{ color: C.dim, fontSize: 9 }}>REPLICAÇÃO</div>
          <div>Hypercore append-only</div>
        </div>
      </div>
    </TiltCard>
  );
}

// ── 2 · ACCESS — composição empilhada (sem card torto) ────────────────────
// Janela de navegador grande ao fundo, celular sobreposto na frente em ângulo,
// chip de "endpoint" flutuando. Layout editorial / colagem.
function SlideAccess({ C, dark, cardWheat, cardInk }) {
  return (
    <div style={{ position: 'relative', minHeight: 520, padding: '8px 0' }}>
      {/* Janela de navegador grande, plana, no fundo */}
      <div style={{
        background: '#0e1614', border: `2px solid ${cardInk}`,
        boxShadow: `8px 8px 0 ${C.leaf}`,
        position: 'relative', zIndex: 1,
      }}>
        {/* barra do navegador */}
        <div style={{ background: '#1a221f', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${cardInk}` }}>
          <span style={{ display: 'flex', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e88863' }}/>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f0d68b' }}/>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7fe084' }}/>
          </span>
          <div style={{ flex: 1, background: '#0e1614', border: '1px solid #2c3a31', padding: '4px 10px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#9aa897' }}>
            🔒 app.arateki.com/v1/devices
          </div>
        </div>
        {/* corpo do "site" */}
        <div style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.65, color: '#d8e3d4' }}>
          <div><span style={{ color: '#7fbf7f' }}>GET</span> /v1/devices  <span style={{ color: '#6c7869' }}>// público — sem auth</span></div>
          <div style={{ marginTop: 6, marginLeft: 8, color: '#9aa897' }}>{`[`}</div>
          <div style={{ marginLeft: 18, color: '#d8e3d4' }}>{`{ "id": "4b8f...c2a1", "crop": "alface",`}</div>
          <div style={{ marginLeft: 18, color: '#d8e3d4' }}>{`  "h3": "8a2a107fffff", "owner": "...arateki" }`}</div>
          <div style={{ marginLeft: 8, color: '#9aa897' }}>{`]`}</div>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dashed #2c3a31` }}>
            <span style={{ color: '#7fbf7f' }}>GET</span> :3001/v1/devices/4b8f.../telemetry
          </div>
          <div style={{ color: '#6c7869', marginLeft: 8 }}>// local — Authorization: ed25519 challenge</div>
          <div style={{ marginLeft: 18, color: '#f0d68b', fontStyle: 'italic' }}>↳ public + private fields combinados</div>
        </div>
      </div>

      {/* Mini-celular sobreposto na frente, em ângulo */}
      <div style={{
        position: 'absolute', right: -6, bottom: -22, width: 168,
        background: cardWheat, color: cardInk, border: `2px solid ${cardInk}`,
        boxShadow: `6px 6px 0 ${C.terracotta}`, transform: 'rotate(4deg)',
        padding: 10, zIndex: 3,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: cardInk, opacity: 0.7, marginBottom: 6 }}>
          <span>14:32</span><span>● ao vivo</span>
        </div>
        <div style={{ fontSize: 9, color: cardInk, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', opacity: 0.75 }}>TORRE-01 · ALFACE</div>
        <div style={{ fontSize: 32, fontFamily: C.serif, fontStyle: 'italic', lineHeight: 1, marginTop: 4 }}>pH 6.4</div>
        <div style={{ fontSize: 10, color: cardInk, opacity: 0.6, marginTop: 2 }}>↑ 0.2 nas últimas 6h</div>
        <svg viewBox="0 0 148 36" style={{ marginTop: 8, height: 36, width: '100%' }}>
          <path d="M0 26 L 18 22 L 36 24 L 54 18 L 72 14 L 90 16 L 108 10 L 126 12 L 148 8" fill="none" stroke={C.primary} strokeWidth="1.6"/>
          <path d="M0 26 L 18 22 L 36 24 L 54 18 L 72 14 L 90 16 L 108 10 L 126 12 L 148 8 L 148 36 L 0 36 Z" fill={C.primary} opacity="0.18"/>
        </svg>
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${cardInk}`, fontSize: 9, color: cardInk, fontStyle: 'italic', fontFamily: C.serif }}>
          ↳ próx. rega: 18h12
        </div>
      </div>

      {/* Chip de endpoint flutuando */}
      <div style={{
        position: 'absolute', left: -16, top: 80, transform: 'rotate(-6deg)',
        background: C.wheat, color: cardInk, border: `1.5px solid ${cardInk}`,
        boxShadow: `3px 3px 0 ${cardInk}`, padding: '6px 12px',
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
        letterSpacing: '0.1em', zIndex: 4,
      }}>
        :3000 público
      </div>
      <div style={{
        position: 'absolute', left: 28, top: 138, transform: 'rotate(3deg)',
        background: C.terracotta, color: '#fbf6e8', border: `1.5px solid ${cardInk}`,
        boxShadow: `3px 3px 0 ${cardInk}`, padding: '6px 12px',
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
        letterSpacing: '0.1em', zIndex: 4,
      }}>
        :3001 local-auth
      </div>

      {/* legenda */}
      <div style={{ marginTop: 32, fontSize: 12, fontFamily: C.serif, fontStyle: 'italic', textAlign: 'center', color: cardInk === '#1d231e' ? C.dim : C.dim, opacity: 0.85 }}>
        mesmo dado, três janelas: <span style={{ color: C.terracotta }}>navegador</span> · <span style={{ color: C.leaf }}>app</span> · <span style={{ color: C.sky }}>terminal</span>
      </div>
    </div>
  );
}

// ── 3 · AI — página de caderno (sem card torto) ───────────────────────────
// Conversa transcrita à mão sobre papel pautado, com sublinhados ondulados,
// setas e marginalia. A "página" é grande, não tem container externo.
function SlideAI({ C, dark, cardWheat, cardInk }) {
  const paper = '#fbf6e8';
  const rule = '#d8c69a';
  const ruled = `repeating-linear-gradient(${paper}, ${paper} 27px, ${rule} 27px, ${rule} 28px)`;
  const margin = C.terracotta;
  return (
    <div style={{ position: 'relative', minHeight: 540 }}>
      {/* página de caderno (sem rotation) */}
      <div style={{
        background: ruled, color: cardInk, padding: '24px 28px 24px 70px',
        border: `1.5px solid ${cardInk}`, position: 'relative',
        boxShadow: `0 2px 0 ${cardInk}, 0 14px 22px -8px rgba(29,35,30,0.18)`,
      }}>
        {/* margem vertical vermelha */}
        <div style={{ position: 'absolute', left: 50, top: 0, bottom: 0, width: 1, background: margin, opacity: 0.6 }}/>
        {/* furos do fichário */}
        <div style={{ position: 'absolute', left: 22, top: 30, bottom: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 12 }}>
          {[0,1,2,3].map(i => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: paperBg2(dark), border: `1px solid ${cardInk}`, opacity: 0.4 }}/>
          ))}
        </div>

        {/* cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: margin, letterSpacing: '0.18em', fontFamily: 'JetBrains Mono, monospace' }}>14·ABR·2026 · 14h32</span>
          <span style={{ fontSize: 10, color: cardInk, opacity: 0.55, fontFamily: 'JetBrains Mono, monospace' }}>pg. 12</span>
        </div>

        {/* prompt manuscrito */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: cardInk, opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>{`>`} eu pergunto:</div>
          <div style={{ fontSize: 22, fontFamily: C.serif, fontStyle: 'italic', lineHeight: 1.3, marginTop: 4, position: 'relative', display: 'inline-block' }}>
            "tem alguma coisa estranha com a horta hoje?"
            <svg style={{ position: 'absolute', left: 0, bottom: -6, width: '100%', height: 6 }} preserveAspectRatio="none" viewBox="0 0 400 6">
              <path d="M2 3 Q 50 0 100 3 T 200 3 T 300 3 T 398 3" stroke={margin} strokeWidth="1.4" fill="none"/>
            </svg>
          </div>
        </div>

        {/* resposta manuscrita */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, color: cardInk, opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>{`<`} llama3.2 responde:</div>
          <div style={{ fontSize: 14, lineHeight: 1.85, marginTop: 6, fontFamily: C.serif, color: cardInk }}>
            Detectei um <span style={{ background: C.wheat, padding: '0 4px' }}>trânsito de calor anormal</span> no seu cluster regional: <strong>38 sítios em Petrolina</strong> passaram dos 36°C <em>antes do meio-dia</em> (z-score +2.1σ vs baseline 30d).
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.85, marginTop: 8, fontFamily: C.serif, color: cardInk }}>
            No <em>seu</em> canteiro: pH estável (6.4 ✓), umidade caindo 4%/h. Recomendo antecipar a rega da tarde em ~2h.
          </div>
        </div>

        {/* tools usadas — chips ao pé */}
        <div style={{ marginTop: 24, paddingTop: 10, borderTop: `1px dashed ${cardInk}`, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 10, color: cardInk, opacity: 0.6, fontFamily: 'JetBrains Mono, monospace' }}>↳ tools MCP usadas:</span>
          <div style={{ display: 'flex', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
            {['get_telemetry', 'get_regional_stats', 'get_crop'].map(t => (
              <span key={t} style={{ background: C.wheat, color: cardInk, padding: '3px 8px', border: `1px solid ${cardInk}`, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Marginalia: post-it com a config do modelo */}
      <div style={{
        position: 'absolute', right: -14, top: -10, transform: 'rotate(5deg)',
        background: '#fef4a8', color: cardInk, border: `1.5px solid ${cardInk}`,
        boxShadow: `4px 4px 0 ${cardInk}`, padding: '8px 12px',
        fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
        lineHeight: 1.5, maxWidth: 180, zIndex: 3,
      }}>
        <div style={{ fontWeight: 700, color: margin }}>★ MODELO LOCAL</div>
        <div>llama3.2:8b</div>
        <div>via ollama</div>
        <div style={{ borderTop: `1px dashed ${cardInk}`, marginTop: 4, paddingTop: 4, color: C.leaf }}>● 0 bytes uploaded</div>
      </div>

      {/* setinha manuscrita */}
      <svg style={{ position: 'absolute', right: 30, top: 220, width: 80, height: 60 }} viewBox="0 0 80 60">
        <path d="M75 8 Q 40 24 12 50" stroke={margin} strokeWidth="1.4" fill="none"/>
        <path d="M16 44 L 12 50 L 18 52" stroke={margin} strokeWidth="1.4" fill="none"/>
        <text x="38" y="22" fontSize="10" fill={margin} fontFamily={C.serif} fontStyle="italic">útil!</text>
      </svg>
    </div>
  );
}

// fundo "transparente" para o furo (depende do tema do papel global)
function paperBg2(dark) { return dark ? '#16201a' : '#f4ecd8'; }

// ── 4 · MAP — célula H3 com pin "você está aqui" ──────────────────────────
function SlideMap({ C, dark, cardWheat, cardInk }) {
  // hex grid central
  const r = 22;
  const cells = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 9; col++) {
      const cx = 50 + col * 38 + (row % 2 ? 19 : 0);
      const cy = 50 + row * 33;
      const seed = ((row * 9 + col * 7) % 11) / 11;
      cells.push({ cx, cy, seed });
    }
  }
  const youCell = cells[Math.floor(cells.length / 2) + 1];

  return (
    <TiltCard tilt={-1} shadowColor={C.wheat} bg={cardWheat} ink={cardInk} serif={C.serif}
      label="ATLAS H3 · NORDESTE-CE · RES 7"
      sub="~5km² por célula">
      <svg viewBox="0 0 440 280" style={{ width: '100%', height: 260, display: 'block' }}>
        {cells.map((h, i) => {
          const fill = h.seed < 0.4 ? C.terracotta : h.seed < 0.7 ? C.wheat : C.leaf;
          const op = 0.25 + h.seed * 0.55;
          const points = `${h.cx},${h.cy - r} ${h.cx + r * 0.866},${h.cy - r / 2} ${h.cx + r * 0.866},${h.cy + r / 2} ${h.cx},${h.cy + r} ${h.cx - r * 0.866},${h.cy + r / 2} ${h.cx - r * 0.866},${h.cy - r / 2}`;
          return <polygon key={i} points={points} fill={fill} opacity={op} stroke={cardInk} strokeWidth="1"/>;
        })}
        {/* destaque você */}
        <polygon points={`${youCell.cx},${youCell.cy - r - 2} ${youCell.cx + (r + 2) * 0.866},${youCell.cy - (r + 2) / 2} ${youCell.cx + (r + 2) * 0.866},${youCell.cy + (r + 2) / 2} ${youCell.cx},${youCell.cy + r + 2} ${youCell.cx - (r + 2) * 0.866},${youCell.cy + (r + 2) / 2} ${youCell.cx - (r + 2) * 0.866},${youCell.cy - (r + 2) / 2}`} fill="none" stroke={cardInk} strokeWidth="2.5"/>
        <line x1={youCell.cx} y1={youCell.cy - r - 18} x2={youCell.cx} y2={youCell.cy - r - 4} stroke={cardInk} strokeWidth="1.5"/>
        <text x={youCell.cx} y={youCell.cy - r - 22} textAnchor="middle" fontSize="11" fill={cardInk} fontFamily={C.serif} fontStyle="italic">você está aqui</text>
        {/* legenda lateral */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill={cardInk}>
          <text x="10" y="20">↑ N</text>
          <text x="280" y="270">8a2a107fffff</text>
        </g>
      </svg>
      {/* slider de resolução */}
      <div style={{ marginTop: 8, padding: '10px 0', borderTop: `1.5px dashed ${cardInk}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
          <span>RES 5 · região</span>
          <span style={{ color: C.terracotta }}>RES 7 · cidade ←</span>
          <span>RES 11 · canteiro</span>
        </div>
        <div style={{ height: 6, background: cardInk, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '40%', top: -4, width: 14, height: 14, background: C.terracotta, border: `1.5px solid ${cardInk}` }}/>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: 'inherit', fontStyle: 'italic', fontFamily: C.serif, textAlign: 'center', opacity: 0.75 }}>
          ← mais privado · mais preciso →
        </div>
      </div>
    </TiltCard>
  );
}

// ── 5 · IDENTITY — cartão BIP-39 ──────────────────────────────────────────
function SlideIdentity({ C, dark, cardWheat, cardInk }) {
  const words = ['árvore', 'raiz', 'folha', 'orvalho', 'vento', 'sulco', 'semente', 'enxada', 'lavoura', 'pomar', 'canteiro', 'colheita'];
  return (
    <TiltCard tilt={0.8} shadowColor={C.terracotta} bg={cardWheat} ink={cardInk} serif={C.serif}
      label="★ SEMENTE · BIP-39 · GUARDAR EM LUGAR SECO ★"
      sub="ed25519 derivada">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {words.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', borderBottom: `1px dashed ${cardInk}`, padding: '8px 4px' }}>
            <span style={{ fontSize: 10, color: C.dim, fontFamily: 'JetBrains Mono, monospace', minWidth: 18 }}>{String(i + 1).padStart(2, '0')}.</span>
            <span style={{ fontSize: 18, fontStyle: 'italic', fontFamily: C.serif }}>{w}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '10px 12px', background: '#fbf6e8', border: `1.5px dashed ${C.terracotta}`, color: C.terracotta, fontSize: 11, fontFamily: C.serif, fontStyle: 'italic', lineHeight: 1.55, textAlign: 'center' }}>
        ↳ estas 12 palavras geram (e regeneram) toda a sua identidade.<br/>
        quem as tem, é você. zero recovery por design.
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>pubkey: 4b8f...c2a1</span>
        <span>seu nó: torre-01-alface</span>
        <span>14·ABR·2026</span>
      </div>
    </TiltCard>
  );
}

export { LandingCarousel };
