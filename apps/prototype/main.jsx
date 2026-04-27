import React from 'react';
import { createRoot } from 'react-dom/client';
import * as ReactDOMClient from 'react-dom';
import './tokens.css';

window.React = React;
window.ReactDOM = ReactDOMClient;

await import('./design-canvas.jsx');
await import('./ios-frame.jsx');
await import('./tweaks-panel.jsx');
await import('./glyphs.jsx');
await import('./screens-esp.jsx');
await import('./screens-server-1.jsx');
await import('./screens-server-2.jsx');
await import('./screens-server-3.jsx');

const {
  DesignCanvas,
  DCSection,
  DCArtboard,
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakSelect,
  TweakSlider,
  TweakNumber,
  useTweaks,
  ESPCaptiveSeed,
  ESPCaptiveWifi,
  ESPCaptiveServers,
  ESPDashboard,
  ESPPrivacy,
  ServerOnboardSeed,
  ServerOnboardMode,
  ServerDashA,
  ServerDashB,
  ServerMapA,
  ServerMapB,
  ServerDeviceA,
  ServerDeviceB,
  ServerProvision,
  ServerCrops,
  ServerFilters,
  ServerMaterials,
  ServerSettings,
  ServerMobileDash,
  ServerMobileMap,
  ServerMobileDevice,
} = window;

const TWEAKS = {
  greenIdx: 0,
  theme: 'dark',
  displayFont: 'Fraunces',
  smallTextBoost: 2,
  smallTextWeight: 540,
};

const GREENS = [
  { name: 'Forest (mata)', val: '#1a3a28' },
  { name: 'Leaf (folha)', val: '#3a7d44' },
  { name: 'Sage (salvia)', val: '#84a98c' },
  { name: 'Tech (cyber)', val: '#65d46e' },
];

const FONTS = ['Cormorant Garamond', 'Lora', 'Fraunces', 'Playfair Display', 'EB Garamond'];

function SmallTextBoost({ boost, weight }) {
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--small-text-boost', Number(boost) || 0);
    root.style.setProperty('--small-text-weight', Number(weight) || 540);

    const isMostlyNumeric = (text) => {
      const compact = text.replace(/\s/g, '');
      if (!compact) return false;
      const letters = (compact.match(/[A-Za-zÀ-ÿ]/g) || []).length;
      const digits = (compact.match(/[0-9]/g) || []).length;
      return digits > 0 && letters <= 2 && digits >= compact.length * 0.35;
    };

    const scan = () => {
      document.querySelectorAll('[data-small-text]').forEach((el) => {
        el.removeAttribute('data-small-text');
        el.style.removeProperty('--small-source-size');
      });

      const nodes = document.querySelectorAll('.dc-card *, [data-dc-focus-scope="1"] *');
      nodes.forEach((el) => {
        if (el.closest('.twk-panel') || el.closest('.twk-btn')) return;
        if (['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon'].includes(el.tagName.toLowerCase())) return;

        const text = el.textContent?.trim() || '';
        if (!text || isMostlyNumeric(text)) return;

        const styles = window.getComputedStyle(el);
        const size = Number.parseFloat(styles.fontSize);
        const currentWeight = Number.parseInt(styles.fontWeight, 10) || 400;
        if (!Number.isFinite(size) || size > 12.25 || currentWeight >= 600) return;

        el.setAttribute('data-small-text', '1');
        el.style.setProperty('--small-source-size', size.toFixed(2));
      });
    };

    scan();
    const observer = new MutationObserver(() => window.requestAnimationFrame(scan));
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scan);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scan);
    };
  }, [boost, weight]);

  return (
    <style>{`
      [data-small-text="1"] {
        font-size: min(13.5px, calc((var(--small-source-size, 11) + var(--small-text-boost, 2)) * 1px)) !important;
        font-weight: var(--small-text-weight, 540) !important;
        line-height: 1.48 !important;
      }
    `}</style>
  );
}

function App() {
  const [tw, setTw] = useTweaks(TWEAKS);

  React.useEffect(() => {
    const r = document.documentElement;
    const green = GREENS[Number(tw.greenIdx)] ?? GREENS[0];
    r.setAttribute('data-theme', tw.theme);
    r.style.setProperty('--primary', green.val);
    r.style.setProperty('--primary-soft', `color-mix(in oklab, ${green.val} 18%, transparent)`);
    r.style.setProperty('--primary-line', `color-mix(in oklab, ${green.val} 35%, transparent)`);
    r.style.setProperty('--f-serif', `"${tw.displayFont}", "Lora", Georgia, serif`);
  }, [tw.greenIdx, tw.theme, tw.displayFont]);

  React.useEffect(() => {
    if (!tw.displayFont) return;
    const id = 'gf-display';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${tw.displayFont.replace(/ /g, '+')}:ital,wght@0,400;0,500;1,400;1,500&display=swap`;
  }, [tw.displayFont]);

  return (
    <>
      <SmallTextBoost boost={tw.smallTextBoost} weight={tw.smallTextWeight} />
      <DesignCanvas>
        <DCSection id="esp-captive" title="ESP32 - Captive Portal (mobile)" subtitle="Setup local do no folha. Mostrado a alguns metros do dispositivo, apontando o celular para a rede 'safrasense-XXXX' aberta.">
          <DCArtboard id="esp-1" label="01 - Boas-vindas + seed" width={390} height={760}><ESPCaptiveSeed /></DCArtboard>
          <DCArtboard id="esp-2" label="02 - Wi-Fi & swarm" width={390} height={760}><ESPCaptiveWifi /></DCArtboard>
          <DCArtboard id="esp-3" label="03 - Servidores conhecidos" width={390} height={760}><ESPCaptiveServers /></DCArtboard>
          <DCArtboard id="esp-4" label="04 - Dashboard local" width={390} height={760}><ESPDashboard /></DCArtboard>
          <DCArtboard id="esp-5" label="05 - Privacidade por campo" width={390} height={760}><ESPPrivacy /></DCArtboard>
        </DCSection>

        <DCSection id="srv-onb" title="Servidor - Onboarding" subtitle="Primeira execucao. O usuario gera a identidade, escolhe modo do no, ingressa em redes.">
          <DCArtboard id="srv-onb-1" label="01 - Seed phrase" width={1280} height={800}><ServerOnboardSeed /></DCArtboard>
          <DCArtboard id="srv-onb-2" label="02 - Modo + redes" width={1280} height={800}><ServerOnboardMode /></DCArtboard>
        </DCSection>

        <DCSection id="srv-dash" title="Servidor - Visao Geral" subtitle="Duas variacoes: editorial botanica/aquarela e terminal densa.">
          <DCArtboard id="srv-dash-a" label="A - Editorial" width={1440} height={900}><ServerDashA /></DCArtboard>
          <DCArtboard id="srv-dash-b" label="B - Terminal" width={1440} height={900}><ServerDashB /></DCArtboard>
        </DCSection>

        <DCSection id="srv-map" title="Servidor - Mapa H3" subtitle="Granularidade por celula H3. Choropleth por metrica selecionavel.">
          <DCArtboard id="srv-map-a" label="A - Colmeia editorial" width={1440} height={900}><ServerMapA /></DCArtboard>
          <DCArtboard id="srv-map-b" label="B - Heatmap densidade" width={1440} height={900}><ServerMapB /></DCArtboard>
        </DCSection>

        <DCSection id="srv-dev" title="Servidor - Dispositivo individual" subtitle="Telemetria, safra ativa, politica de privacidade por campo.">
          <DCArtboard id="srv-dev-a" label="A - Editorial" width={1440} height={900}><ServerDeviceA /></DCArtboard>
          <DCArtboard id="srv-dev-b" label="B - Terminal" width={1440} height={900}><ServerDeviceB /></DCArtboard>
          <DCArtboard id="srv-dev-c" label="Provisionamento (DeviceClaim)" width={1440} height={900}><ServerProvision /></DCArtboard>
        </DCSection>

        <DCSection id="srv-misc" title="Servidor - Cultivos, Filtros, Materiais, Configuracoes">
          <DCArtboard id="srv-crops" label="Cultivos / CropProfiles" width={1440} height={900}><ServerCrops /></DCArtboard>
          <DCArtboard id="srv-filters" label="Filtros (set algebra)" width={1440} height={900}><ServerFilters /></DCArtboard>
          <DCArtboard id="srv-mats" label="Materiais educativos" width={1440} height={900}><ServerMaterials /></DCArtboard>
          <DCArtboard id="srv-set" label="Configuracoes / chaves" width={1440} height={900}><ServerSettings /></DCArtboard>
        </DCSection>

        <DCSection id="srv-mob" title="Servidor - Mobile" subtitle="Versao reduzida do servidor, para acompanhar a rede pelo celular.">
          <DCArtboard id="srv-mob-1" label="Visao geral mobile" width={390} height={760}><ServerMobileDash /></DCArtboard>
          <DCArtboard id="srv-mob-2" label="Mapa mobile" width={390} height={760}><ServerMobileMap /></DCArtboard>
          <DCArtboard id="srv-mob-3" label="Dispositivo mobile" width={390} height={760}><ServerMobileDevice /></DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks" defaultOpen>
        <TweakSection label="Cor primaria">
          <TweakRadio
            label="Verde"
            value={Number(tw.greenIdx)}
            onChange={(v) => setTw('greenIdx', Number(v))}
            options={GREENS.map((g, i) => ({ value: i, label: g.name }))}
          />
          <div style={{ display: 'flex', gap: 6, padding: '8px 0 4px' }}>
            {GREENS.map((g, i) => (
              <button
                type="button"
                key={g.val}
                aria-label={g.name}
                onClick={() => setTw('greenIdx', i)}
                style={{
                  flex: 1,
                  height: 28,
                  background: g.val,
                  border: 0,
                  cursor: 'pointer',
                  outline: i === Number(tw.greenIdx) ? '2px solid #c96442' : '1px solid rgba(0,0,0,.12)',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        </TweakSection>
        <TweakSection label="Tema">
          <TweakRadio
            label="Modo"
            value={tw.theme}
            onChange={(v) => setTw('theme', v)}
            options={[
              { value: 'light', label: 'Aquarela' },
              { value: 'dark', label: 'Terminal' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Tipografia display">
          <TweakSelect
            label="Familia"
            value={tw.displayFont}
            onChange={(v) => setTw('displayFont', v)}
            options={FONTS.map((font) => ({ value: font, label: font }))}
          />
        </TweakSection>
        <TweakSection label="Legibilidade">
          <TweakSlider
            label="Textos pequenos"
            value={Number(tw.smallTextBoost)}
            min={0}
            max={4}
            step={0.5}
            unit="px"
            onChange={(v) => setTw('smallTextBoost', v)}
          />
          <TweakNumber
            label="Peso"
            value={Number(tw.smallTextWeight)}
            min={400}
            max={650}
            step={10}
            onChange={(v) => setTw('smallTextWeight', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
