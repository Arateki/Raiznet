import React from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_LOCALE, dictionaries } from './i18n/index.js';
import {
  DEFAULT_LANG,
  HTML_LANG,
  LANG_TO_LOCALE,
  langFromLocale,
  langFromPathname,
  langPath,
  localeFromPathname,
  localizedPathForLocale,
  stripLangFromPath,
} from './lib/i18n-routing.js';
import { Seo, buildHomeSeo } from './lib/seo.jsx';
import './styles.css';

const LOCALE_OPTIONS = [
  { code: LANG_TO_LOCALE.pt, label: 'PT' },
  { code: LANG_TO_LOCALE.en, label: 'EN' },
  { code: LANG_TO_LOCALE.es, label: 'ES' },
  { code: LANG_TO_LOCALE.ja, label: 'JA' },
  { code: LANG_TO_LOCALE.zh, label: 'ZH' },
];

function getDefaultDashboardUrl() {
  if (typeof window === 'undefined') return '/dashboard/';
  const { hostname, port } = window.location;
  if ((hostname === '127.0.0.1' || hostname === 'localhost') && port === '5173') return `http://${hostname}:5174/`;
  if ((hostname === '127.0.0.1' || hostname === 'localhost') && port === '8080') return `http://${hostname}:8081/`;
  return '/dashboard/';
}

const links = {
  dashboardUrl: import.meta.env.VITE_RAIZNET_DASHBOARD_URL || getDefaultDashboardUrl(),
  docsUrl: import.meta.env.VITE_RAIZNET_DOCS_URL || '/docs/',
  githubUrl: import.meta.env.VITE_RAIZNET_GITHUB_URL || 'https://github.com/arateki/raiznet',
};

function RootMark() {
  return (
    <svg className="root-mark" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v8" />
      <path d="M12 11c-2 2-5 3-6 6" />
      <path d="M12 11c2 2 5 3 6 6" />
      <path d="M12 11v8" />
      <path d="M9 21h6" />
    </svg>
  );
}

function Icon({ name }) {
  const paths = {
    dashboard: <><rect x="4" y="5" width="16" height="14" rx="1" /><path d="M8 19v3h8v-3M8 10h3v5H8zM13 8h3v7h-3z" /></>,
    download: <><path d="M12 4v12M6 12l6 6 6-6" /><path d="M4 20h16" /></>,
    docs: <><path d="M5 4h9l5 5v11H5z" /><path d="M14 4v5h5M8 13h8M8 17h6" /></>,
    chip: <><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></>,
    node: <><circle cx="12" cy="12" r="3" /><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5 5l4.5 4.5M14.5 14.5 19 19M19 5l-4.5 4.5M9.5 14.5 5 19" /></>,
    moon: <><path d="M20 15.2A8 8 0 0 1 8.8 4 7 7 0 1 0 20 15.2Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  };

  return (
    <svg className="icon" width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.node}
    </svg>
  );
}

function Header({ copy, locale, onToggleLocale, theme, onToggleTheme }) {
  const dark = theme === 'dark';
  const currentLocaleIndex = LOCALE_OPTIONS.findIndex((option) => option.code === locale);
  const currentLocale = LOCALE_OPTIONS[currentLocaleIndex] || LOCALE_OPTIONS[0];
  const handleMenuChange = (event) => {
    const target = event.target.value;
    if (!target) return;
    window.location.href = target;
    event.target.value = '';
  };

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={copy.nav.home}>
        <RootMark />
        <span>R A I Z N E T</span>
      </a>
      <nav className="nav-links" aria-label={copy.nav.label}>
        <a href={links.docsUrl}><span>{copy.nav.docs}</span><small>{copy.navSub.docs}</small></a>
        <a href={links.dashboardUrl}><span>{copy.nav.network}</span><small>{copy.navSub.network}</small></a>
        <a href="#download"><span>{copy.nav.download}</span><small>{copy.navSub.download}</small></a>
        <a href="#projects"><span>{copy.nav.safraSense}</span><small>{copy.navSub.safraSense}</small></a>
      </nav>
      <label className="mobile-menu">
        <span>{copy.nav.menu}</span>
        <select aria-label={copy.nav.menu} defaultValue="" onChange={handleMenuChange}>
          <option value="" disabled>{copy.nav.menu}</option>
          <option value={links.docsUrl}>{copy.nav.docs}</option>
          <option value={links.dashboardUrl}>{copy.nav.network}</option>
          <option value="#download">{copy.nav.download}</option>
          <option value="#projects">{copy.nav.safraSense}</option>
        </select>
      </label>
      <div className="header-actions">
        <button
          type="button"
          className="language-toggle"
          onClick={onToggleLocale}
          aria-label={copy.actions.languageToggle}
          title={copy.actions.languageToggle}
        >
          {currentLocale.label}
        </button>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={dark ? copy.actions.themeLight : copy.actions.themeDark}
          title={dark ? copy.actions.themeLight : copy.actions.themeDark}
        >
          <Icon name={dark ? 'sun' : 'moon'} />
        </button>
        <a className="download-button" href="#download"><span className="download-label-full">{copy.actions.download}</span><span className="download-label-short">{copy.nav.download}</span></a>
      </div>
    </header>
  );
}

function NatureBackground({ theme }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationId = 0;
    let width = 0;
    let height = 0;
    let leaves = [];

    const accent = theme === 'dark' ? '#e88863' : '#c2613a';
    const leaf = theme === 'dark' ? '#84a98c' : '#3a7d44';
    const paleLeaf = theme === 'dark' ? '#e6ead0' : '#1a3a28';

    const seeded = (seed) => {
      const value = Math.sin(seed * 999.91) * 10000;
      return value - Math.floor(value);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.max(20, Math.min(44, Math.round((width * height) / 38000)));
      leaves = Array.from({ length: count }, (_, index) => ({
        x: seeded(index * 13 + 1) * width,
        y: seeded(index * 17 + 7) * height,
        size: 9 + seeded(index * 23 + 3) * 18,
        speed: 0.08 + seeded(index * 29 + 5) * 0.22,
        fall: 0.015 + seeded(index * 31 + 9) * 0.06,
        sway: 20 + seeded(index * 37 + 11) * 54,
        rotate: seeded(index * 41 + 2) * Math.PI * 2,
        spin: (seeded(index * 43 + 4) - 0.5) * 0.006,
        phase: seeded(index * 47 + 6) * Math.PI * 2,
        tone: index % 6 === 0 ? accent : index % 3 === 0 ? paleLeaf : leaf,
        alpha: (theme === 'dark' ? 0.08 : 0.055) + seeded(index * 53 + 8) * 0.055,
      }));
    };

    const drawLeaf = (leafItem, time) => {
      const wind = reduceMotion ? 0 : Math.sin(time * 0.00028 + leafItem.phase) * leafItem.sway;
      const flutter = reduceMotion ? 0 : Math.sin(time * 0.002 + leafItem.phase) * 0.35;
      const x = leafItem.x + wind;
      const y = leafItem.y;
      const size = leafItem.size;

      context.save();
      context.translate(x, y);
      context.rotate(leafItem.rotate + flutter);
      context.globalAlpha = leafItem.alpha;
      context.fillStyle = leafItem.tone;
      context.strokeStyle = leafItem.tone;
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(0, -size * 0.58);
      context.bezierCurveTo(size * 0.55, -size * 0.38, size * 0.42, size * 0.36, 0, size * 0.64);
      context.bezierCurveTo(-size * 0.5, size * 0.34, -size * 0.48, -size * 0.34, 0, -size * 0.58);
      context.fill();
      context.globalAlpha = leafItem.alpha * 1.25;
      context.beginPath();
      context.moveTo(0, -size * 0.42);
      context.quadraticCurveTo(size * 0.06, 0, 0, size * 0.48);
      context.stroke();
      context.restore();
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'source-over';

      leaves.forEach((leafItem) => {
        if (!reduceMotion) {
          leafItem.x += leafItem.speed;
          leafItem.y += leafItem.fall;
          leafItem.rotate += leafItem.spin;
          if (leafItem.x > width + leafItem.sway + 30) leafItem.x = -leafItem.sway - 30;
          if (leafItem.y > height + 30) leafItem.y = -30;
        }
        drawLeaf(leafItem, time);
      });

      context.restore();
      if (!reduceMotion) animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return <canvas className="nature-canvas" ref={canvasRef} aria-hidden="true" />;
}

function TopBand({ copy }) {
  const bandRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const [scrolling, setScrolling] = React.useState(false);

  React.useEffect(() => {
    const band = bandRef.current;
    const content = contentRef.current;
    if (!band || !content) return undefined;

    const update = () => {
      const style = window.getComputedStyle(band);
      const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const available = band.clientWidth - horizontalPadding;
      setScrolling(content.scrollWidth > available + 1);
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(band);
    observer.observe(content);
    return () => observer.disconnect();
  }, [copy]);

  const content = (
    <>
      {copy.topBand.items.map((item, index) => (
        <span key={item}>{index === 0 && <i />}{item}</span>
      ))}
      <em>{copy.topBand.note}</em>
    </>
  );

  return (
    <div className={`top-band${scrolling ? ' is-scrolling' : ''}`} ref={bandRef}>
      <div className="top-band-track">
        <div className="top-band-group" ref={contentRef}>{content}</div>
        <div className="top-band-group" aria-hidden="true">{content}</div>
      </div>
    </div>
  );
}

function NetworkCard({ copy, slide }) {
  return (
    <article className="tilt-card network-card">
      <header>
        <span>{slide.visualTitle}</span>
        <em>{slide.metricLabel}</em>
      </header>
      <svg className="network-graphic" viewBox="0 0 440 320" aria-hidden="true">
        <g className="link-lines">
          <path d="M70 70 Q190 45 350 80" />
          <path d="M70 70 Q110 195 220 250" />
          <path d="M350 80 Q360 180 220 250" />
          <path d="M140 170 Q215 180 300 175" />
          <path d="M300 175 Q330 220 370 245" />
          <path d="M220 250 Q280 245 370 245" />
        </g>
        {[
          [70, 70, 16, 'arateki', 'main'],
          [350, 80, 13, 'coop-pe', 'terra'],
          [140, 170, 11, 'sítio-bem', 'sky'],
          [300, 175, 11, 'horta-ce', 'wheat'],
          [220, 250, 18, copy.card.youNode, 'terra'],
          [370, 245, 10, 'ufce', 'muted'],
        ].map(([x, y, r, label, tone]) => (
          <g className={`node node-${tone}`} key={label}>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y + Number(r) + 17}>{label}</text>
          </g>
        ))}
        <text className="hand-note" x="18" y="34">{copy.card.peerNote}</text>
        <text className="hand-note" x="290" y="302">{copy.card.noCentral}</text>
      </svg>
      <div className="card-metrics">
        <div><small>{copy.card.status}</small><strong>{slide.metric}</strong></div>
        <div><small>{copy.card.info}</small><strong>{slide.visualMeta}</strong></div>
      </div>
    </article>
  );
}

function AccessCard({ slide }) {
  return (
    <article className="hero-visual access-card" aria-label={slide.visualTitle}>
      <div className="browser-window">
        <header>
          <span className="window-dots"><i /><i /><i /></span>
          <code>app.arateki.com/v1/devices</code>
        </header>
        <div className="endpoint-body">
          <p><strong>GET</strong> /v1/devices <em>// public</em></p>
          <p>[</p>
          <p className="indent">{'{ "id": "4b8f...c2a1", "crop": "lettuce",'}</p>
          <p className="indent">{'  "h3": "8a2a107fffff", "owner": "arateki" }'}</p>
          <p>]</p>
          <p className="private-line"><strong>GET</strong> :3001/v1/devices/4b8f.../telemetry</p>
          <p className="indent muted">// local owner endpoint</p>
        </div>
      </div>
      <div className="phone-card">
        <div><span>14:32</span><span>live</span></div>
        <small>TOWER-01 · LETTUCE</small>
        <strong>{slide.metric}</strong>
        <span>{slide.metricLabel}</span>
        <svg viewBox="0 0 148 36" aria-hidden="true">
          <path d="M0 26 L18 22 L36 24 L54 18 L72 14 L90 16 L108 10 L126 12 L148 8" />
          <path className="area" d="M0 26 L18 22 L36 24 L54 18 L72 14 L90 16 L108 10 L126 12 L148 8 L148 36 L0 36 Z" />
        </svg>
      </div>
      <span className="endpoint-chip public">:3000 public</span>
      <span className="endpoint-chip local">:3001 local-auth</span>
      <footer>{slide.visualMeta}</footer>
    </article>
  );
}

function PrivacyCard({ slide }) {
  const policies = [
    ['water_ph', 'plain', 'leaf'],
    ['air_humidity', 'encrypted', 'terra'],
    ['owner_notes', 'omit', 'muted'],
  ];

  return (
    <article className="hero-visual privacy-card" aria-label={slide.visualTitle}>
      <header>
        <span>{slide.visualTitle}</span>
        <em>{slide.metricLabel}</em>
      </header>
      <div className="policy-board">
        {policies.map(([field, mode, tone]) => (
          <div className={`policy-row ${tone}`} key={field}>
            <code>{field}</code>
            <span>{mode}</span>
          </div>
        ))}
      </div>
      <div className="policy-route">
        <span>sensor</span>
        <i />
        <span>local</span>
        <i />
        <span>public core</span>
      </div>
      <div className="policy-note">
        <strong>{slide.metric}</strong>
        <span>{slide.visualMeta}</span>
      </div>
    </article>
  );
}

function MapCard({ slide }) {
  const radius = 22;
  const cells = [];

  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      cells.push({
        cx: 50 + col * 38 + (row % 2 ? 19 : 0),
        cy: 50 + row * 33,
        seed: ((row * 9 + col * 7) % 11) / 11,
      });
    }
  }

  const highlighted = cells[Math.floor(cells.length / 2) + 1];
  const pointsFor = (cell, extra = 0) => {
    const r = radius + extra;
    return `${cell.cx},${cell.cy - r} ${cell.cx + r * 0.866},${cell.cy - r / 2} ${cell.cx + r * 0.866},${cell.cy + r / 2} ${cell.cx},${cell.cy + r} ${cell.cx - r * 0.866},${cell.cy + r / 2} ${cell.cx - r * 0.866},${cell.cy - r / 2}`;
  };

  return (
    <article className="tilt-card map-card" aria-label={slide.visualTitle}>
      <header>
        <span>{slide.visualTitle}</span>
        <em>{slide.metricLabel}</em>
      </header>
      <svg viewBox="0 0 440 280" aria-hidden="true">
        {cells.map((cell, index) => (
          <polygon
            key={`${cell.cx}-${cell.cy}`}
            className={`hex hex-${index % 3}`}
            points={pointsFor(cell)}
            opacity={0.25 + cell.seed * 0.55}
          />
        ))}
        <polygon className="hex-current" points={pointsFor(highlighted, 3)} />
        <line x1={highlighted.cx} y1={highlighted.cy - radius - 18} x2={highlighted.cx} y2={highlighted.cy - radius - 4} />
        <text x={highlighted.cx} y={highlighted.cy - radius - 24}>{slide.metric}</text>
        <text className="map-code" x="278" y="270">8a2a107fffff</text>
      </svg>
      <div className="resolution-bar">
        <div><span>RES 5</span><span>RES 7</span><span>RES 11</span></div>
        <i><b /></i>
        <small>{slide.visualMeta}</small>
      </div>
    </article>
  );
}

function KnowledgeCard({ slide }) {
  const materials = [
    ['guide', 'Lettuce · semiarid', 'material'],
    ['report', 'pH drift · Cariri', 'report'],
    ['practice', 'EC targets · hydro', 'practice'],
  ];

  return (
    <article className="tilt-card knowledge-card" aria-label={slide.visualTitle}>
      <header>
        <span>{slide.visualTitle}</span>
        <em>{slide.metricLabel}</em>
      </header>
      <div className="knowledge-flow">
        <div className="mcp-panel">
          <span>MCP tools</span>
          <code>get_telemetry</code>
          <code>get_safra</code>
          <code>get_regional_stats</code>
        </div>
        <div className="ai-panel">
          <small>{slide.metric}</small>
          <strong>assistente local</strong>
          <p>gera recomendações, relatórios e materiais a partir dos dados autorizados.</p>
        </div>
      </div>
      <div className="material-stack">
        {materials.map(([kind, title, tone], index) => (
          <div className={`material-card ${tone}`} key={title} style={{ '--lift': `${index * 9}px` }}>
            <span>{kind}</span>
            <strong>{title}</strong>
            <small>signed · offline</small>
          </div>
        ))}
      </div>
      <footer>{slide.visualMeta}</footer>
    </article>
  );
}

function IdentityCard({ slide }) {
  const words = ['root', 'leaf', 'rain', 'wind', 'seed', 'field', 'water', 'soil', 'harvest', 'node', 'tower', 'key'];

  return (
    <article className="tilt-card identity-card" aria-label={slide.visualTitle}>
      <header>
        <span>{slide.visualTitle}</span>
        <em>{slide.metricLabel}</em>
      </header>
      <div className="seed-grid">
        {words.map((word, index) => (
          <div key={word}>
            <span>{String(index + 1).padStart(2, '0')}.</span>
            <strong>{word}</strong>
          </div>
        ))}
      </div>
      <p>
        <strong>{slide.metric}</strong>
        <span>{slide.visualMeta}</span>
      </p>
      <footer><span>pubkey: 4b8f...c2a1</span><span>ed25519</span></footer>
    </article>
  );
}

function HeroCard({ copy, slide, index }) {
  if (index === 1) return <AccessCard slide={slide} />;
  if (index === 2) return <PrivacyCard slide={slide} />;
  if (index === 3) return <MapCard slide={slide} />;
  if (index === 4) return <KnowledgeCard slide={slide} />;
  if (index === 5) return <IdentityCard slide={slide} />;
  return <NetworkCard copy={copy} slide={slide} />;
}

function Hero({ copy }) {
  const slides = copy.hero.slides;
  const [slide, setSlide] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const current = slides[slide];
  const next = React.useCallback(() => setSlide((value) => (value + 1) % slides.length), [slides.length]);
  const previous = () => setSlide((value) => (value - 1 + slides.length) % slides.length);

  React.useEffect(() => {
    if (paused) return undefined;
    const timer = window.setTimeout(next, 9000);
    return () => window.clearTimeout(timer);
  }, [next, paused, slide]);

  return (
    <section className="hero" id="top" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="slide-meta">
        <span>{current.eyebrow}</span>
        <div>
          <b>{String(slide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</b>
          <button type="button" onClick={previous} aria-label={copy.carousel.previous}>&lt;</button>
          <button type="button" onClick={next} aria-label={copy.carousel.next}>&gt;</button>
        </div>
      </div>
      <div className="hero-grid">
        <div className="hero-copy-block" key={current.title}>
          <h1>{current.title}</h1>
          <p>{current.copy}</p>
          <div className="hero-actions">
            <a className="button primary" href={links.dashboardUrl}><Icon name="dashboard" />{copy.actions.dashboard}</a>
            <a className="button secondary" href="#download"><Icon name="download" />{copy.actions.download}</a>
            <a className="button ghost" href={links.docsUrl}><Icon name="docs" />{copy.actions.docs}</a>
          </div>
        </div>
        <div key={current.visualTitle} className="card-shell">
          <HeroCard copy={copy} slide={current} index={slide} />
        </div>
      </div>
      <div className="carousel-dots">
        {slides.map((item, index) => (
          <button
            type="button"
            key={item.title}
            className={index === slide ? 'active' : ''}
            onClick={() => setSlide(index)}
            aria-label={`${copy.carousel.goTo} ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function Events({ copy }) {
  return (
    <section className="events-section">
      <div className="section-title">
        <span>{copy.events.eyebrow}</span>
        <h2>{copy.events.titleStart} <em>{copy.events.titleEmphasis}</em> {copy.events.titleEnd}</h2>
      </div>
      <div className="events-grid">
        {copy.events.items.map(({ title, body, tech }) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
            <small>{tech}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function Projects({ copy }) {
  return (
    <section className="paper-section" id="projects">
      <div className="section-title">
        <span>{copy.projects.eyebrow}</span>
        <h2>{copy.projects.title}</h2>
        <p>{copy.projects.copy}</p>
      </div>
      <div className="project-grid">
        {copy.projects.items.map((item, index) => (
          <article className="project-card" style={{ '--tilt': `${[-1.2, 0.8, -0.6, 1.1][index]}deg` }} key={item.title}>
            <Icon name={item.icon} />
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
            <small>{item.meta}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function Flow({ copy }) {
  return (
    <section className="paper-section" id="how">
      <div className="section-title">
        <span>{copy.how.eyebrow}</span>
        <h2>{copy.how.title}</h2>
      </div>
      <div className="flow-grid">
        {copy.how.steps.map((step, index) => (
          <article style={{ '--tilt': `${[-1, 0.8, -0.4, 1.2, -0.7][index]}deg` }} key={step.title}>
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Download({ copy }) {
  return (
    <section className="download-section" id="download">
      <div>
        <span>{copy.download.eyebrow}</span>
        <h2>{copy.download.title}</h2>
        <p>{copy.download.copy}</p>
      </div>
      <div className="download-actions">
        <a className="download-row primary" href={links.githubUrl}><Icon name="download" /><span>{copy.download.github}<small>github.com/arateki/raiznet</small></span></a>
        <a className="download-row" href={links.docsUrl}><Icon name="docs" /><span>{copy.download.guide}<small>{copy.navSub.docs}</small></span></a>
        <div className="terminal">{copy.download.commands.map((line) => <code key={line}>{line}</code>)}</div>
      </div>
    </section>
  );
}

function getBrowserPath() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

function getStoredLocale() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('raiznet-locale');
  return dictionaries[stored] ? stored : null;
}

function getStartupLocale(pathname, initialLocale) {
  if (dictionaries[initialLocale]) return initialLocale;

  const routeLocale = localeFromPathname(pathname);
  if (routeLocale && dictionaries[routeLocale]) return routeLocale;

  const stored = getStoredLocale();
  if (stored) return stored;

  // Sem preferência salva, a raiz é SEMPRE o idioma padrão (PT). Não usamos
  // navigator.language aqui de propósito: auto-trocar o idioma da raiz
  // confunde crawlers (o Googlebot renderiza como en-US e veria a página
  // "mudar" de idioma) e o Google desaconselha redirect por locale. O
  // visitante troca pelo botão de idioma, e a escolha fica salva.
  return DEFAULT_LOCALE;
}

function updateBrowserUrlForLocale(locale) {
  if (typeof window === 'undefined') return getBrowserPath();

  const targetPath = localizedPathForLocale(locale, window.location.pathname);
  const nextUrl = `${targetPath}${window.location.search}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.pushState(null, '', nextUrl);
  }

  return targetPath;
}

export function App({ initialLocale, initialTheme = 'light', routePath: initialRoutePath } = {}) {
  const [routePath, setRoutePath] = React.useState(() => initialRoutePath || getBrowserPath());
  const [locale, setLocale] = React.useState(() => {
    return getStartupLocale(initialRoutePath || getBrowserPath(), initialLocale);
  });
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === 'undefined') return initialTheme;
    return window.localStorage.getItem('raiznet-theme') || 'light';
  });
  const toggleTheme = () => {
    setTheme((value) => {
      const next = value === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem('raiznet-theme', next);
      return next;
    });
  };
  const toggleLocale = () => {
    setLocale((value) => {
      const currentIndex = LOCALE_OPTIONS.findIndex((option) => option.code === value);
      const next = LOCALE_OPTIONS[(currentIndex + 1) % LOCALE_OPTIONS.length] || LOCALE_OPTIONS[0];
      window.localStorage.setItem('raiznet-locale', next.code);
      const nextPath = updateBrowserUrlForLocale(next.code);
      setRoutePath(nextPath);
      return next.code;
    });
  };
  const copy = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  const seo = buildHomeSeo(copy, locale, routePath);

  React.useEffect(() => {
    const lang = langFromLocale(locale);
    document.documentElement.lang = HTML_LANG[lang];
  }, [locale]);

  React.useEffect(() => {
    const pathname = window.location.pathname || '/';
    const routeLang = langFromPathname(pathname);

    // URL legada do idioma padrão (/pt, /pt/...): normaliza para a raiz, que
    // é a casa canônica do PT. replaceState não cria entrada no histórico.
    if (routeLang === DEFAULT_LANG) {
      const targetPath = stripLangFromPath(pathname);
      window.history.replaceState(null, '', `${targetPath}${window.location.search}${window.location.hash}`);
      setRoutePath(targetPath);
      return;
    }

    if (!routeLang) {
      const targetPath = langPath(langFromLocale(locale));
      if (targetPath !== pathname) {
        window.history.replaceState(null, '', `${targetPath}${window.location.search}${window.location.hash}`);
      }
      setRoutePath(targetPath);
      return;
    }

    setRoutePath(pathname);
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      const nextPath = window.location.pathname || '/';
      const routeLocale = localeFromPathname(nextPath);
      setRoutePath(nextPath);

      if (routeLocale && dictionaries[routeLocale]) {
        window.localStorage.setItem('raiznet-locale', routeLocale);
        setLocale(routeLocale);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="page-shell" data-theme={theme} data-locale={locale}>
      <Seo seo={seo} />
      <NatureBackground theme={theme} />
      <Header copy={copy} locale={locale} onToggleLocale={toggleLocale} theme={theme} onToggleTheme={toggleTheme} />
      <TopBand copy={copy} />
      <main>
        <Hero copy={copy} />
        <Events copy={copy} />
        <Projects copy={copy} />
        <Flow copy={copy} />
        <Download copy={copy} />
      </main>
      <footer>{copy.footer.madeBy}</footer>
    </div>
  );
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root) createRoot(root).render(<App />);
}
