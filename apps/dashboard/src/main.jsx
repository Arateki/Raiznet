import React from 'react';
import { createRoot } from 'react-dom/client';
import { t } from './i18n/index.js';
import './styles.css';

const websiteUrl = import.meta.env.VITE_RAIZNET_WEBSITE_URL || '/';
const docsUrl = import.meta.env.VITE_RAIZNET_DOCS_URL || '/docs/';

function Spark() {
  return (
    <svg className="spark" viewBox="0 0 160 42" aria-hidden="true">
      <path d="M2 30 C16 18 26 22 38 20 S62 9 78 18 102 36 120 22 142 15 158 10" />
      <path d="M2 34 C24 30 40 34 56 29 S88 20 108 26 134 32 158 24" />
    </svg>
  );
}

function App() {
  return (
    <main className="dashboard">
      <header className="topbar">
        <a href={websiteUrl} className="brand">Raiznet</a>
        <nav>
          <a href={websiteUrl}>{t.nav.website}</a>
          <a href={docsUrl}>{t.nav.docs}</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p>raiznet:public:arateki:v1</p>
          <h1>{t.title}</h1>
          <span>{t.subtitle}</span>
        </div>
        <Spark />
      </section>

      <section className="summary-grid">
        {t.summary.map(([label, value, note]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <header>
            <h2>{t.recentTitle}</h2>
            <span>top 4 / 124</span>
          </header>
          <div className="device-list">
            {t.devices.map(([name, location, reading, last]) => (
              <div className="device-row" key={name}>
                <div>
                  <strong>{name}</strong>
                  <span>{location}</span>
                </div>
                <b>{reading}</b>
                <small>{last}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <header>
            <h2>{t.healthTitle}</h2>
          </header>
          <div className="health-list">
            {t.health.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
