#include "http_local.h"
#include "config.h"
#include "telemetry/telemetry.h"
#include "telemetry/buffer.h"
#include "identity/identity.h"
#include "storage/storage.h"
#include "wifi_setup/wifi_setup.h"
#include "docs/docs.h"
#include <WebServer.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <pgmspace.h>

static WebServer      server(80);
static DeviceConfig*       gCfg = nullptr;
static const DeviceIdentity* gId  = nullptr;
static SensorData     gLastReading;
static bool           gHasReading   = false;
static PendingAction  gPendingAction = ACTION_NONE;

const char LOCAL_PORTAL_CSS[] PROGMEM = R"rawliteral(
:root{
  --bg:#f4f1ea;--bg-2:#ede8dc;--bg-card:#fbf8f1;--bg-inset:#e8e2d2;
  --fg:#1d231e;--fg-2:#46493d;--fg-3:#807d6e;--fg-4:#b3ad9c;
  --line:#d8d2bf;--line-strong:#1d231e;--paper-tint:#f7f1de;
  --primary:#1a3a28;--primary-soft:rgba(26,58,40,.12);--aqua:#9ed8ff;
  --good:#2f7d45;--warn:#b8651e;--bad:#a83a2a;
  --f-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  --f-mono:"SF Mono","JetBrains Mono",ui-monospace,Menlo,monospace;
  --f-serif:Georgia,"Times New Roman",serif;
}
[data-theme="dark"]{
  --bg:#0d1310;--bg-2:#121814;--bg-card:#161d18;--bg-inset:#0a0f0c;
  --fg:#d8e3d4;--fg-2:#9aa897;--fg-3:#6c7869;--fg-4:#3f4a3e;
  --line:#20281f;--line-strong:#d8e3d4;--paper-tint:#14201a;
  --primary:#2d6e4a;--primary-soft:rgba(45,110,74,.28);--aqua:#a8dcff;
  --good:#7fd08d;--warn:#d4933a;--bad:#d36e63;
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--bg);color:var(--fg)}
body{font-family:var(--f-sans);font-size:15px}
a{color:inherit;text-decoration:none}
button{font:inherit}
.serif{font-family:var(--f-serif);font-weight:400}
.mono{font-family:var(--f-mono)}
.eyebrow,.eyebrow-tight{font-weight:750;text-transform:uppercase;color:var(--fg-3);white-space:pre;letter-spacing:.18em}
.eyebrow{font-size:11px;line-height:1}.eyebrow-tight{font-size:10px;line-height:1;letter-spacing:.14em}
.local-header{position:fixed;top:0;left:0;right:0;height:68px;background:var(--bg);border-bottom:1px solid var(--line);z-index:50;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;padding:0 24px}
.header-actions{justify-self:end;display:flex;align-items:center;gap:4px}
.lang-select{background:transparent;border:1px solid var(--line);border-radius:3px;color:var(--fg);font-size:12px;font-weight:750;text-transform:uppercase;cursor:pointer;padding:7px 8px;appearance:none;text-align:center}
.lang-select:focus{outline:none}
.lang-select option{background:var(--bg);color:var(--fg)}
.local-brand{justify-self:start;min-width:0;color:var(--fg);overflow:hidden;white-space:nowrap}
.local-brand-title{display:block;font-size:12px;font-weight:850;letter-spacing:.16em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis}
.local-brand-title .brand-aqua{color:var(--aqua)}
.local-tabs{justify-self:center;display:flex;align-items:flex-end;justify-content:center;gap:10px;border-bottom:0;background:transparent;padding:0;position:relative;z-index:10}
.local-tab{display:inline-flex;width:auto;margin:0 0 -1px;padding:6px 14px 7px;background:transparent;color:var(--primary);border:1px solid var(--primary);border-bottom:2px solid var(--primary);border-radius:4px 4px 0 0;font-size:12px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;transition:transform .12s ease-out;position:relative;z-index:11}
.local-tab:hover{transform:scale(1.04)}
.local-tab:active{transform:scale(.96)}
.local-tab.is-active{background:transparent;color:var(--primary);border-width:2.5px;border-bottom-width:5px;font-weight:900;transform:scale(1.1)}
.theme-btn.local-theme{justify-self:end;width:42px;height:42px;margin:0;padding:0;display:flex;align-items:center;justify-content:center;background:var(--bg);border:none;color:var(--fg);font-size:16px;transition:transform .08s ease}
.theme-btn.local-theme:active{transform:scale(.88)}
.theme-btn.local-theme svg{width:20px;height:20px;display:block}
#loader-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg);opacity:.85;z-index:9999}
#loader-overlay::after{content:"•••";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:var(--fg);font-size:32px;letter-spacing:4px;animation:blink 1.4s infinite both}
@keyframes blink{0%{opacity:.2}20%{opacity:1}100%{opacity:.2}}
body.is-loading{pointer-events:none!important;overflow:hidden}
body.is-loading #loader-overlay{display:block}
.portal-shell{min-height:100vh;padding:104px 42px 32px}
.main{width:100%;max-width:1120px;margin:0 auto;min-width:0;padding:0}
.topbar{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:32px}
.title h1{margin:8px 0 0;font-size:38px;line-height:1.08}
.title p{margin:10px 0 0;color:var(--fg-2);font-size:14px;font-weight:500;line-height:1.5;max-width:720px;overflow-wrap:anywhere}
.copy-btn{background:transparent;border:none;color:var(--fg-3);cursor:pointer;padding:0;margin-left:6px;vertical-align:middle;display:inline-flex;align-items:center;justify-content:center}
.copy-btn:hover{color:var(--fg)}
.copy-btn.copied{color:var(--good)}
.copy-btn svg{width:14px;height:14px}
.btn,.theme-btn{border:1px solid var(--line-strong);background:transparent;color:var(--fg);border-radius:2px;padding:9px 13px;font-size:12px;font-weight:750;letter-spacing:.04em;cursor:pointer;text-transform:uppercase;transition:transform .12s ease-out}
.btn:hover:not(:disabled),.theme-btn:hover:not(:disabled){transform:scale(1.04)}
.btn:active:not(:disabled),.theme-btn:active:not(:disabled){transform:scale(.96)}
.btn:disabled{cursor:not-allowed;opacity:0.5}
.btn-primary{background:var(--primary);border-color:var(--primary);color:#f4f1ea}
.status-strip{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:26px;text-align:center}
.status-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:var(--bg-card);padding:7px 10px;font-size:12px;font-weight:650;color:var(--fg-2)}
.status-light{width:7px;height:7px;background:var(--fg-4)}
.status-pill.ok .status-light{background:var(--good)}.status-pill.warn .status-light{background:var(--warn)}.status-pill.bad .status-light{background:var(--bad)}
.metric-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:34px}
@media(max-width:1100px){.metric-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.metric-card{min-width:0;background:var(--bg-card);padding:18px 18px 16px;position:relative;cursor:pointer}
.metric-card:focus{outline:2px solid var(--primary);outline-offset:-2px}
.metric-value{font-family:var(--f-serif);font-size:34px;line-height:1;margin-top:12px;white-space:nowrap}
.metric-unit{font-family:var(--f-sans);font-size:14px;font-weight:650;color:var(--fg-3);margin-left:4px}
.metric-detail{font-size:11px;font-weight:650;color:var(--fg-3);margin-top:8px;min-height:1.2em}
.metric-card.is-good .metric-detail{color:var(--good)}.metric-card.is-warn .metric-detail{color:var(--warn)}.metric-card.is-bad .metric-detail{color:var(--bad)}
.metric-help{display:none;margin-top:12px;padding-top:10px;border-top:1px solid var(--line);font-size:12px;line-height:1.45;color:var(--fg-2);font-weight:500}
.metric-help strong{display:block;margin-bottom:4px;color:var(--fg);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.metric-range{display:block;margin-top:6px;color:var(--fg);font-size:11px;font-weight:750}
.metric-card.is-help-open .metric-help{display:block}
.content-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.8fr);gap:36px;align-items:start}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.panel{border-top:1px solid var(--line-strong);padding-top:14px}
.info-list{border-top:1px solid var(--line)}
.info-row{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid var(--line);padding:10px 0;font-size:12px;font-weight:650}
.info-row span:first-child{color:var(--fg-2)}.info-row span:last-child{font-family:var(--f-mono);text-align:right;word-break:break-all}
.server-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.server-chip{border:1px solid var(--line);background:var(--paper-tint);padding:9px 10px;font-size:12px;font-weight:650}
.server-chip-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.server-chip strong{display:block;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.server-chip span{display:block;margin-top:3px;color:var(--fg-3);font-family:var(--f-mono);font-size:11px;word-break:break-all}
.server-status{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;color:var(--fg-3);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.server-status::before{content:"";width:7px;height:7px;background:var(--fg-4)}
.server-status.ok{color:var(--good)}.server-status.ok::before{background:var(--good)}
.server-status.bad{color:var(--bad)}.server-status.bad::before{background:var(--bad)}
.empty{color:var(--fg-3);font-size:12px;font-weight:650;border:1px dashed var(--line);padding:10px}
.form-label{display:block;font-size:10px;color:var(--fg-3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;font-weight:750}
.form-input{width:100%;padding:12px 14px;background:var(--bg-inset);border:1px solid var(--line);border-radius:2px;color:var(--fg);font-size:13px;font-family:var(--f-mono);margin-bottom:16px}
.form-input:focus{border-color:var(--primary);outline:none}
.srow{display:flex;gap:6px;margin-bottom:10px;align-items:center}
.srow .form-input{margin-bottom:0;flex:1}
.btn-danger{color:var(--bad);border-color:var(--bad)}
@media(max-width:900px){
  .local-header{grid-template-columns:minmax(0,1fr) auto;grid-template-rows:28px 24px;height:62px;padding:3px 12px 2px;gap:0 8px}
  .header-actions{grid-column:2;grid-row:1;align-self:center}
  .local-brand-title{font-size:10px;line-height:1;letter-spacing:.04em}
  .local-tabs{grid-column:1 / -1;grid-row:2;justify-self:center;align-self:start;gap:8px}
  .local-tab{display:inline-flex;width:auto;margin:0 0 -1px;padding:4px 9px 5px;background:transparent;color:var(--primary);border:1px solid var(--primary);border-bottom:2px solid var(--primary);border-radius:4px 4px 0 0;font-size:10px;font-weight:750;letter-spacing:.08em}
  .local-tab.is-active{background:transparent;color:var(--primary);border-width:2px;border-bottom-width:4px;font-weight:900;transform:scale(1.1);z-index:2}
  .local-theme{width:34px;height:34px}
  .local-theme svg{width:17px;height:17px}
  .lang-select{padding:4px;font-size:11px}
  .portal-shell{display:block;padding:96px 20px 28px}.topbar{display:block}
  .dev-sep{display:none}.dev-key{display:block;margin-top:4px}
  .metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.content-grid{grid-template-columns:1fr}
}
@media(max-width:520px){
  .metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .metric-card{padding:14px 12px 13px}
  .metric-value{font-size:30px}
  .metric-unit{font-size:12px}
  .title h1{font-size:31px}.local-brand-title{font-size:9px;letter-spacing:.02em}
}
.doc-wrap{max-width:740px}
.doc-section{border-top:1px solid var(--line);margin:0}
details.doc-section summary{list-style:none;display:flex;align-items:center;justify-content:space-between;padding:17px 0;cursor:pointer;font-size:15px;font-weight:850;text-transform:uppercase;letter-spacing:.06em;color:var(--fg)}
details.doc-section summary::-webkit-details-marker{display:none}
details.doc-section summary::after{content:'+';font-size:16px;font-weight:300;color:var(--fg-3);flex-shrink:0;margin-left:8px}
details.doc-section[open] summary::after{content:'\2212'}
.doc-body{padding-bottom:18px;font-size:17px;font-weight:550;line-height:1.68;color:var(--fg-2)}
.doc-h4{font-size:14px;font-weight:850;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-3);margin:18px 0 8px}
.doc-body p{margin:0 0 10px}
.doc-body ul,.doc-body ol{margin:6px 0 10px;padding-left:20px}
.doc-body li{margin-bottom:5px}
.doc-body strong{font-weight:850;color:var(--fg)}
.doc-body a{color:var(--primary);font-size:inherit;font-weight:850;letter-spacing:0;text-transform:none;text-decoration:underline}
.doc-badge{display:inline-block;font-family:var(--f-mono);font-size:14px;background:var(--primary-soft);color:var(--primary);padding:2px 7px;border-radius:2px;font-weight:750}
.doc-good{background:rgba(47,125,69,.13)!important;color:var(--good)!important}
.doc-warn{background:rgba(184,101,30,.13)!important;color:var(--warn)!important}
.doc-bad{background:rgba(168,58,42,.13)!important;color:var(--bad)!important}
.doc-body table{width:100%;border-collapse:collapse;font-size:15px;margin:10px 0 14px}
.doc-body th{text-align:left;font-size:13px;font-weight:850;text-transform:uppercase;letter-spacing:.04em;color:var(--fg-3);border-bottom:2px solid var(--line);padding:8px 8px}
.doc-body td{padding:9px 8px;border-bottom:1px solid var(--line);color:var(--fg-2);font-weight:550}
.doc-body td:first-child{font-weight:800;color:var(--fg);font-size:15px}
.doc-body dl{margin:0}
.doc-body dt{font-family:var(--f-mono);font-size:17px;font-weight:900;color:var(--fg);margin-top:16px}
.doc-body dd{margin:5px 0 0;font-size:16px;font-weight:550;color:var(--fg-2);line-height:1.64}
.doc-body code{font-family:var(--f-mono);font-size:15px;background:var(--bg-inset);border:1px solid var(--line);padding:0 4px;border-radius:2px}
.doc-toc{margin-bottom:18px;padding:11px 14px;background:var(--bg-inset);border:1px solid var(--line);border-radius:3px}
.doc-toc-item{border-top:0}
.doc-h4+.doc-toc-item{border-top:0}
.doc-toc-row{display:flex;align-items:center;gap:7px}
.doc-toc a{display:block;font-size:16px;font-weight:750;color:var(--primary);text-decoration:none;padding:7px 0}
.doc-toc a:hover{text-decoration:underline}
.doc-toc-toggle{appearance:none;background:transparent;border:1px solid var(--line);border-radius:5px;color:var(--fg-3);cursor:pointer;width:30px;height:30px;padding:0;font-size:18px;font-weight:650;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:transform .12s, border-color .12s}
.doc-toc-toggle:hover,.doc-toc-toggle:focus{border-color:var(--primary);color:var(--fg);outline:none;transform:scale(1.05)}
.doc-toc-item.is-open .doc-toc-toggle{border-color:var(--primary);color:var(--primary);box-shadow:inset 0 1px 2px rgba(0,0,0,0.08)}
.doc-subtoc{margin:-1px 0 5px 5px;padding:0 0 5px 12px;border-left:1px solid var(--line)}
.doc-subtoc[hidden]{display:none}
.doc-subtoc a{font-size:13px;font-weight:650;line-height:1.25;color:var(--fg-3);padding:5px 0}
.doc-subtoc a:hover{color:var(--fg)}
.doc-section,.doc-h4{scroll-margin-top:88px}
@media(min-width:901px){
  .doc-body{font-weight:430}
  .doc-body td{font-weight:430}
  .doc-body dd{font-weight:430}
}
)rawliteral";

const char LOCAL_DASHBOARD_HTML[] PROGMEM = R"rawliteral(<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SafraSense Aqua</title>
<link rel="stylesheet" href="/local.css">
</head>
<body>
<header class="local-header">
  <a class="local-brand" href="/">
    <span class="local-brand-title">S A F R A S E N S E <span class="brand-aqua">A Q U A</span></span>
  </a>
  <nav class="local-tabs" aria-label="Navegação principal">
    <a class="local-tab" href="/">Início</a>
    <a class="local-tab" id="raiznet-menu-item" href="/raiznet" style="display:none">Raiznet</a>
    <a class="local-tab" href="/config">Configurações</a>
    <a class="local-tab" href="/docs">Manual</a>
  </nav>
  <div class="header-actions">
    <select class="lang-select" id="langSelect" aria-label="Selecionar idioma">
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="ja">JA</option>
      <option value="zh">ZH</option>
    </select>
    <button class="theme-btn local-theme" id="themeBtn" type="button" aria-label="Alternar tema"></button>
  </div>
</header>
<div class="portal-shell">
  <main class="main">
    <div class="topbar">
      <div class="title">
        <div class="eyebrow">V I S Ã O   G E R A L</div>
        <h1 class="serif" id="deviceName">SafraSense Aqua</h1>
        <p id="deviceSummary">Aguardando a primeira leitura local do sensor.</p>
      </div>
    </div>

    <div class="status-strip">
      <div class="status-pill" id="wifiPill"><span class="status-light"></span><span>Wi-Fi --</span></div>
      <div class="status-pill" id="serverPill"><span class="status-light"></span><span>Servidor --</span></div>
      <div class="status-pill" id="bufferPill"><span class="status-light"></span><span>Buffer --</span></div>
      <div class="status-pill" id="sendPill"><span class="status-light"></span><span>Último envio --</span></div>
    </div>

    <div style="display:flex;justify-content:center;margin:0 0 14px">
      <button class="btn" id="forceReadBtn" onclick="forceRead()" style="font-size:10px;padding:6px 12px">+ Fazer nova leitura</button>
    </div>

    <section class="metric-grid" id="metricGrid">
      <article class="metric-card" id="mTemp"><div class="eyebrow-tight">Temperatura</div><div class="metric-value"><span data-value>--</span><span class="metric-unit">°C</span></div><div class="metric-detail" data-detail>sem leitura</div></article>
      <article class="metric-card" id="mHum"><div class="eyebrow-tight">Umidade do ar</div><div class="metric-value"><span data-value>--</span><span class="metric-unit">%</span></div><div class="metric-detail" data-detail>sem leitura</div></article>
      <article class="metric-card" id="mEc"><div class="eyebrow-tight">Sólidos dissolvidos</div><div class="metric-value"><span data-value>--</span><span class="metric-unit">ppm</span></div><div class="metric-detail" data-detail>sem leitura</div></article>
      <article class="metric-card" id="mPh">
        <div class="eyebrow-tight">Potencial Hidrog.</div>
        <div class="metric-value" style="display:flex;align-items:baseline;justify-content:space-between">
          <div><span data-value>--</span><span class="metric-unit">pH</span></div>
          <button class="copy-btn" onclick="event.stopPropagation();manualPh()" title="Inserir manual" style="margin:0;padding:4px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
        </div>
        <div class="metric-detail" data-detail>entrada manual</div>
      </article>
      <article class="metric-card" id="mWater"><div class="eyebrow-tight">Nível da água</div><div class="metric-value"><span data-value>--</span><span class="metric-unit">cm</span></div><div class="metric-detail" data-detail>sem leitura</div></article>
      <article class="metric-card" id="mBattery"><div class="eyebrow-tight">Bateria</div><div class="metric-value"><span data-value>--</span><span class="metric-unit">%</span></div><div class="metric-detail" data-detail>sem leitura</div></article>
    </section>
    <section class="content-grid">
      <div>
        <div class="section-head"><div class="eyebrow">S E R V I D O R E S</div></div>
        <div class="panel">
          <div class="eyebrow-tight">E X T E R N O S</div>
          <div class="server-list" id="externalServers"></div>
          <div class="eyebrow-tight" style="margin-top:16px">L O C A I S</div>
          <div class="server-list" id="localServers"></div>
        </div>
      </div>

      <div>
        <div class="section-head"><div class="eyebrow">S I S T E M A</div></div>
        <div class="panel">
          <div class="info-list" id="systemInfo"></div>
        </div>
      </div>
    </section>
  </main>
</div>
<script src="/dashboard.js"></script>
<script src="/local-nav.js"></script>
</body>
</html>)rawliteral";

const char LOCAL_NAV_JS[] PROGMEM = R"rawliteral(
(function(){
  function ensureLoader(){
    var loader=document.getElementById('loader-overlay');
    if(!loader){
      loader=document.createElement('div');
      loader.id='loader-overlay';
      document.body.appendChild(loader);
    }
    return loader;
  }
  function startLoading(){
    ensureLoader();
    document.body.classList.add('is-loading');
  }
  function stopLoading(){
    document.body.classList.remove('is-loading');
  }
  function shouldLoadLink(a,e){
    if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return false;
    if(a.target&&a.target!=='_self')return false;
    if(a.hasAttribute('download'))return false;
    var href=a.getAttribute('href');
    if(!href||href.charAt(0)==='#')return false;
    var url;
    try{url=new URL(href,location.href);}catch(_){return false;}
    if(url.origin!==location.origin)return false;
    if(url.pathname===location.pathname&&url.search===location.search)return false;
    return true;
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',ensureLoader,{once:true});
  }else{
    ensureLoader();
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');
    if(shouldLoadLink(a,e))setTimeout(startLoading,0);
  });
  document.addEventListener('submit',function(e){
    var f=e.target;
    if(e.defaultPrevented||!f||f.target&&f.target!=='_self')return;
    setTimeout(startLoading,0);
  });
  window.addEventListener('pageshow',stopLoading);
})();
)rawliteral";

const char LOCAL_DASHBOARD_JS[] PROGMEM = R"rawliteral(
(function(){
  const $ = (id) => document.getElementById(id);
  const doc = document.documentElement;
  window.copyId = function(text, btn) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(()=>{});
    } else {
      let ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(ta);
    }
    if (btn) {
      btn.classList.add('copied');
      const orig = btn.innerHTML;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      setTimeout(()=>{btn.classList.remove('copied');btn.innerHTML=orig;}, 1500);
    }
  };
  const moonSvg = "<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/></svg>";
  const sunSvg = "<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='4'/><line x1='12' y1='2' x2='12' y2='6'/><line x1='12' y1='18' x2='12' y2='22'/><line x1='4.93' y1='4.93' x2='7.76' y2='7.76'/><line x1='16.24' y1='16.24' x2='19.07' y2='19.07'/><line x1='2' y1='12' x2='6' y2='12'/><line x1='18' y1='12' x2='22' y2='12'/><line x1='4.93' y1='19.07' x2='7.76' y2='16.24'/><line x1='16.24' y1='7.76' x2='19.07' y2='4.93'/></svg>";
  const setThemeIcon = () => {
    const btn = $('themeBtn');
    if (btn) btn.innerHTML = doc.getAttribute('data-theme') === 'dark' ? sunSvg : moonSvg;
  };
  const storedTheme = localStorage.getItem('theme') || 'light';
  doc.setAttribute('data-theme', storedTheme);
  setThemeIcon();
  $('themeBtn').onclick = () => {
    const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setThemeIcon();
  };

  function text(id, value) { const el = $(id); if (el) el.textContent = value; }
  function fmt(value, digits) {
    return value === null || value === undefined || Number.isNaN(value) ? '--' : Number(value).toFixed(digits);
  }
  function statusName(state) { return state === 'ok' ? 'ok' : state === 'warn' ? 'warn' : state === 'bad' ? 'bad' : ''; }
  function setPill(id, label, state) {
    const el = $(id);
    if (!el) return;
    el.className = 'status-pill ' + statusName(state);
    el.querySelector('span:last-child').textContent = label;
  }
  function metric(id, value, detail, state) {
    const el = $(id);
    if (!el) return;
    const open = el.classList.contains('is-help-open');
    el.className = 'metric-card ' + (state ? 'is-' + state : '');
    if (open) el.classList.add('is-help-open');
    el.querySelector('[data-value]').textContent = value;
    el.querySelector('[data-detail]').textContent = detail;
    el.className = 'metric-card' + (state ? ' is-' + state : '');
  }
  window.manualPh = function() {
    const current = document.querySelector('#mPh [data-value]').textContent;
    const val = prompt("Digite o valor do PH (0-14):", current === '--' ? '7.0' : current);
    if (val !== null) {
      const ph = parseFloat(val.replace(',', '.'));
      if (!isNaN(ph) && ph >= 0 && ph <= 14) {
        fetch('/api/ph/manual?ph=' + ph, { method: 'POST' }).then(() => refresh());
      } else {
        alert("Valor inválido. Insira um número entre 0 e 14.");
      }
    }
  };
  window.forceRead = function() {
    const btn = $('forceReadBtn');
    btn.disabled = true;
    btn.textContent = 'Lendo sensores...';
    fetch('/api/force-read').then(() => {
      setTimeout(() => {
        refresh().then(() => {
          btn.disabled = false;
          btn.textContent = '+ Fazer nova leitura';
        });
      }, 2000);
    });
  };
  const metricHelp = {
    mTemp: {
      title: 'Temperatura',
      text: 'Indica o calor do ambiente ao redor da planta. Temperaturas fora da faixa ideal reduzem crescimento, absorção de água e resposta aos nutrientes.',
      range: 'Faixa ideal geral: 20 a 28 °C.'
    },
    mHum: {
      title: 'Umidade do ar',
      text: 'Mostra quanta umidade existe no ar. Umidade muito baixa aumenta perda de água; muito alta favorece fungos e dificulta a transpiração da planta.',
      range: 'Faixa ideal geral: 50 a 70%.'
    },
    mEc: {
      title: 'Sólidos dissolvidos',
      text: 'Estima a quantidade de sais e nutrientes dissolvidos na água. Valores baixos indicam pouca nutrição; valores altos podem causar estresse nas raízes.',
      range: 'Faixa ideal geral: 500 a 1200 ppm, conforme a cultura.'
    },
    mPh: {
      title: 'Potencial Hidrogeniônico',
      text: 'Mede a acidez ou alcalinidade da água. O pH correto é crucial para que a planta consiga absorver os nutrientes presentes na solução.',
      range: 'Faixa ideal geral: 5.5 a 6.5.'
    },
    mWater: {
      title: 'Nível da água',
      text: 'Mostra a altura disponível no reservatório. Nível baixo pode secar raízes, parar circulação ou concentrar demais os nutrientes.',
      range: 'Faixa ideal: acima do mínimo seguro do reservatório.'
    },
    mBattery: {
      title: 'Bateria',
      text: 'Indica a energia restante do dispositivo. Bateria baixa pode interromper leituras e atrasar o envio dos dados para os servidores.',
      range: 'Faixa ideal: acima de 40%.'
    }
  };
  function setupMetricHelp() {
    Object.keys(metricHelp).forEach((id) => {
      const card = $(id);
      const info = metricHelp[id];
      if (!card || card.querySelector('.metric-help')) return;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');
      card.setAttribute('aria-label', 'Mostrar detalhes: ' + info.title);
      const help = document.createElement('div');
      help.className = 'metric-help';
      help.innerHTML = '<strong>' + info.title + '</strong><span>' + info.text + '</span><span class="metric-range">' + info.range + '</span>';
      card.appendChild(help);
      const toggle = () => {
        const next = !card.classList.contains('is-help-open');
        document.querySelectorAll('.metric-card.is-help-open').forEach((openCard) => {
          if (openCard !== card) {
            openCard.classList.remove('is-help-open');
            openCard.setAttribute('aria-expanded', 'false');
          }
        });
        card.classList.toggle('is-help-open', next);
        card.setAttribute('aria-expanded', next ? 'true' : 'false');
      };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });
  }
  function infoRow(label, value) {
    const el = document.createElement('div');
    el.className = 'info-row';
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = label;
    b.innerHTML = value || '--';
    el.appendChild(a);
    el.appendChild(b);
    return el;
  }
  function renderServers(id, list) {
    const root = $(id);
    if (!root) return;
    root.textContent = '';
    if (!list || !list.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nenhum servidor configurado';
      root.appendChild(empty);
      return;
    }
    list.forEach((item) => {
      const chip = document.createElement('div');
      const online = item.online === true;
      chip.className = 'server-chip';
      const top = document.createElement('div');
      top.className = 'server-chip-top';
      const name = document.createElement('strong');
      const status = document.createElement('div');
      const url = document.createElement('span');
      name.textContent = item.name || 'Servidor';
      status.className = 'server-status ' + (online ? 'ok' : 'bad');
      status.textContent = online ? 'online' : 'offline';
      url.textContent = item.url || '--';
      top.appendChild(name);
      top.appendChild(status);
      chip.appendChild(top);
      chip.appendChild(url);
      root.appendChild(chip);
    });
  }
  function sensorState(ok) { return ok === false ? 'bad' : 'ok'; }
  function batteryState(percent) {
    if (percent === null || percent === undefined) return '';
    return percent < 20 ? 'bad' : percent < 40 ? 'warn' : 'ok';
  }
  async function refresh() {
    try {
      const response = await fetch('/api/status');
      const d = await response.json();
      const r = d.readings || {};
      const s = d.sensors || {};
      text('deviceName', d.device_name || 'SafraSense Aqua');
      const did = d.device_id || '--';
      const truncId = did !== '--' ? did.slice(0, 10) + '...' + did.slice(-10) : did;
      const copyBtn = did !== '--' ? `<button type="button" class="copy-btn" onclick="window.copyId('${did}', this)" aria-label="Copiar" title="Copiar chave pública"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>` : '';
      const summary = $('deviceSummary');
      if (summary) summary.innerHTML = `<span class="dev-net">${d.ip || '--'} &middot; ${d.mdns || 'safrasense'}.local</span> <span class="dev-sep">&middot;</span> <span class="dev-key">Chave p&uacute;blica: <span class="mono">${truncId}</span> ${copyBtn}</span>`;
      setPill('wifiPill', d.wifi_ok ? 'Wi-Fi conectado' : 'Wi-Fi offline', d.wifi_ok ? 'ok' : 'bad');
      setPill('serverPill', d.server_ok ? 'Servidor online' : 'Servidor offline', d.server_ok ? 'ok' : 'bad');
      setPill('bufferPill', (d.buffer_pending || 0) + ' pendente(s)', d.buffer_pending > 0 ? 'warn' : 'ok');
      setPill('sendPill', 'Último envio ' + (d.last_send_time || '--'), d.server_ok ? 'ok' : 'warn');

      metric('mTemp', fmt(r.temp_ambient, 1), s.dht === false ? 'sensor offline' : 'DHT ativo', sensorState(s.dht));
      metric('mHum', fmt(r.humidity, 1), s.dht === false ? 'sensor offline' : 'DHT ativo', sensorState(s.dht));
      metric('mEc', r.ec === undefined ? '--' : Math.round(r.ec), s.tds === false ? 'sensor offline' : 'TDS ativo', sensorState(s.tds));
      metric('mPh', r.ph === undefined ? '--' : fmt(r.ph, 1), 'entrada manual', 'ok');
      metric('mWater', r.water_level === undefined ? '--' : fmt(r.water_level / 10, 1), s.laser === false ? 'sensor offline' : 'laser ativo', sensorState(s.laser));
      metric('mBattery', r.bat_percent === undefined ? '--' : Math.round(r.bat_percent), r.bat_volts === undefined ? 'sem leitura' : fmt(r.bat_volts, 2) + ' V', batteryState(r.bat_percent));

      const info = $('systemInfo');
      if (info) {
        info.textContent = '';
        const uptimeMin = Math.floor((d.uptime_s || 0) / 60);
        [
          ['IP', d.ip],
          ['mDNS', (d.mdns || '--') + '.local'],
          ['MAC', d.mac],
          ['Uptime', uptimeMin + ' min'],
          ['Heap livre', Math.floor((d.free_heap || 0) / 1024) + ' KB'],
          ['Chave p&uacute;blica', '<span class="mono">' + truncId + '</span> ' + copyBtn]
        ].forEach((row) => info.appendChild(infoRow(row[0], row[1])));
      }

      renderServers('externalServers', d.servers_external);
      renderServers('localServers', d.servers_local);
    } catch (err) {
      setPill('wifiPill', 'Sem resposta local', 'bad');
    }
    setTimeout(refresh, 5000);
  }
  setupMetricHelp();
  refresh();
})();
)rawliteral";

// ── /api/status ───────────────────────────────────────────────────────────

static void handleApiStatus() {
  TelemetryState ts = getTelemetryState();
  JsonDocument   doc;
  bool wifiOk = (WiFi.status() == WL_CONNECTED);

  doc["device_name"]    = gCfg->device_name;
  doc["device_id"]      = gId->public_key_hex;
  doc["mac"]            = gId->mac;
  doc["mdns"]           = getMdnsName();
  doc["ip"]             = WiFi.localIP().toString();
  doc["wifi_ok"]        = wifiOk;
  doc["server_ok"]      = ts.last_send_ok;
  doc["last_send_time"] = ts.last_send_time;
  doc["fail_streak"]    = ts.fail_streak;
  doc["buffer_pending"] = pendingCount();
  doc["buffer_total"]   = bufferTotal();
  doc["uptime_s"]       = millis() / 1000;
  doc["free_heap"]      = ESP.getFreeHeap();

  JsonObject sens = doc["sensors"].to<JsonObject>();
  sens["dht"]     = gLastReading.status.dht_ok;
  sens["tds"]     = gLastReading.status.tds_ok;
  sens["laser"]   = gLastReading.status.laser_ok;
  sens["battery"] = gLastReading.status.battery_ok;

  JsonObject rdg = doc["readings"].to<JsonObject>();
  if (gHasReading) {
    if (!isnan(gLastReading.temp_ambient)) rdg["temp_ambient"] = gLastReading.temp_ambient;
    if (!isnan(gLastReading.humidity))     rdg["humidity"]     = gLastReading.humidity;
    if (!isnan(gLastReading.ec))           rdg["ec"]           = gLastReading.ec;
    if (!isnan(gLastReading.ph))           rdg["ph"]           = gLastReading.ph;
    if (gLastReading.water_level >= 0)     rdg["water_level"]  = gLastReading.water_level;
    rdg["bat_volts"]   = gLastReading.bat_volts;
    rdg["bat_percent"] = gLastReading.bat_percent;
  }

  // Server list with confirmation status.
  JsonArray ext = doc["servers_external"].to<JsonArray>();
  for (size_t i = 0; i < gCfg->servers_external.size() && i < 16; i++) {
    const auto& s = gCfg->servers_external[i];
    JsonObject o = ext.add<JsonObject>();
    o["name"]   = s.name;
    o["url"]    = s.url;
    o["online"] = wifiOk && ((ts.online_mask & (1u << i)) != 0);
  }
  JsonArray loc = doc["servers_local"].to<JsonArray>();
  for (size_t i = 0; i < gCfg->servers_local.size() && i < 16; i++) {
    const auto& s = gCfg->servers_local[i];
    uint8_t bit = (uint8_t)(16 + i);
    JsonObject o = loc.add<JsonObject>();
    o["name"]   = s.name;
    o["url"]    = s.url;
    o["online"] = wifiOk && ((ts.online_mask & (1u << bit)) != 0);
  }

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

// ── /api/telemetry ────────────────────────────────────────────────────────

static void handleApiTelemetry() {
  if (!gHasReading) {
    server.send(503, "application/json", "{\"error\":\"sem leituras ainda\"}");
    return;
  }
  JsonDocument doc;
  doc["device_id"]  = gId->public_key_hex;
  doc["device_mac"] = gId->mac;
  doc["timestamp"]  = gLastReading.captured_at;

  JsonObject r = doc["readings"].to<JsonObject>();
  JsonObject s = doc["sensor_status"].to<JsonObject>();
  if (!isnan(gLastReading.temp_ambient)) r["temp_ambient"] = gLastReading.temp_ambient;
  if (!isnan(gLastReading.humidity))     r["humidity"]     = gLastReading.humidity;
  if (!isnan(gLastReading.ec))           r["ec"]           = gLastReading.ec;
  if (gLastReading.water_level >= 0)     r["water_level"]  = gLastReading.water_level;
  r["bat_volts"]   = gLastReading.bat_volts;
  r["bat_percent"] = gLastReading.bat_percent;
  s["dht"]     = gLastReading.status.dht_ok;
  s["tds"]     = gLastReading.status.tds_ok;
  s["laser"]   = gLastReading.status.laser_ok;
  s["battery"] = gLastReading.status.battery_ok;

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

// ── / (dashboard) ─────────────────────────────────────────────────────────

static void handleRoot() {
  String html = FPSTR(LOCAL_DASHBOARD_HTML);
  html.replace("class=\"local-tab\" href=\"/\"", "class=\"local-tab is-active\" href=\"/\"");
  if (!gCfg->servers_external.empty()) {
    html.replace("id=\"raiznet-menu-item\" href=\"/raiznet\" style=\"display:none\"", "id=\"raiznet-menu-item\" href=\"/raiznet\"");
  }
  server.send(200, "text/html", html);
}

static void handleLocalCss() {
  server.send_P(200, PSTR("text/css"), LOCAL_PORTAL_CSS, strlen_P(LOCAL_PORTAL_CSS));
}

static void handleDashboardJs() {
  server.send_P(200, PSTR("application/javascript"), LOCAL_DASHBOARD_JS, strlen_P(LOCAL_DASHBOARD_JS));
}

static void handleLocalNavJs() {
  server.send_P(200, PSTR("application/javascript"), LOCAL_NAV_JS, strlen_P(LOCAL_NAV_JS));
}

// ── /config (GET) ─────────────────────────────────────────────────────────

static String serverRows(const std::vector<ServerEntry>& list, const char* prefix) {
  String html;
  for (size_t i = 0; i < list.size(); i++) {
    html += "<div class='srow' id='" + String(prefix) + String(i) + "'>";
    html += "<input type='text' class='form-input' name='" + String(prefix) + "_name_" + String(i) + "' placeholder='Nome' value='" + list[i].name + "'>";
    html += "<input type='text' class='form-input' name='" + String(prefix) + "_url_"  + String(i) + "' placeholder='URL ou IP:porta' value='" + list[i].url + "'>";
    html += "<button type='button' class='btn btn-danger' style='padding:11px 14px;' onclick='removeRow(this)'>✕</button></div>";
  }
  return html;
}

static void handleConfig() {
  String extRows = serverRows(gCfg->servers_external, "ext");
  String locRows = serverRows(gCfg->servers_local,    "loc");

  String html = R"HTML(<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configurações</title>
<link rel="stylesheet" href="/local.css">
</head><body>
<header class="local-header">
  <a class="local-brand" href="/">
    <span class="local-brand-title">S A F R A S E N S E <span class="brand-aqua">A Q U A</span></span>
  </a>
  <nav class="local-tabs" aria-label="Navegação principal">
    <a class="local-tab" href="/">Início</a>
    <a class="local-tab" id="raiznet-menu-item" href="/raiznet" style="display:none">Raiznet</a>
    <a class="local-tab is-active" href="/config">Configurações</a>
    <a class="local-tab" href="/docs">Manual</a>
  </nav>
  <div class="header-actions">
    <select class="lang-select" id="langSelect" aria-label="Selecionar idioma">
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="ja">JA</option>
      <option value="zh">ZH</option>
    </select>
    <button class="theme-btn local-theme" id="themeBtn" type="button" aria-label="Alternar tema"></button>
  </div>
</header>
<div class="portal-shell">
  <main class="main">
    <div class="topbar">
      <div class="title">
        <div class="eyebrow">C O N F I G U R A Ç Õ E S</div>
        <h1 class="serif">Destinos e Sistema</h1>
      </div>
    </div>
    <div class="content-grid">
      <div class="panel">
        <form method="POST" action="/config/save" id="f">
          <input type="hidden" id="ext_count" name="ext_count" value="0">
          <input type="hidden" id="loc_count" name="loc_count" value="0">

          <label class="form-label">Nome do sensor</label>
          <input type="text" class="form-input" name="device_name" value=")HTML";
  html += gCfg->device_name;
  html += R"HTML(" maxlength="32">

          <div class="eyebrow" style="color:var(--primary);margin:24px 0 10px">Servidores Públicos</div>
          <div id="ext_list">)HTML";

  if (!gCfg->servers_external.empty()) {
    html.replace("id=\"raiznet-menu-item\" href=\"/raiznet\" style=\"display:none\"", "id=\"raiznet-menu-item\" href=\"/raiznet\"");
  }

  html += extRows;
  html += R"HTML(</div>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <button type="button" class="btn" onclick="addRow('ext')">+ Outro</button>
            <button type="button" class="btn" id="ara-btn" onclick="addArateki()">Usar Arateki</button>
          </div>

          <div class="eyebrow" style="margin:24px 0 10px">Servidor Local</div>
          <div id="loc_list">)HTML";
  html += locRows;
  html += R"HTML(</div>
          <button type="button" class="btn" onclick="addRow('loc')">+ Outro</button>

          <div style="margin-top:24px"><button type="submit" class="btn btn-primary" style="width:100%">Salvar</button></div>
        </form>
      </div>
      <div>
        <div class="panel">
          <div class="eyebrow" style="margin-bottom:14px">Ferramentas</div>
          <div style="display:grid;grid-template-columns:1fr;gap:8px">
            <a href="/api/status" target="_blank" class="btn" style="text-align:center">Status API</a>
            <a href="/api/telemetry" target="_blank" class="btn" style="text-align:center">JSON</a>
            <a href="/reset/wifi" onclick="return confirm('Reconectar Wi-Fi?')" class="btn" style="text-align:center">Reconectar Wi-Fi</a>
          </div>
        </div>
        <div class="panel" style="margin-top:36px;border-top-color:var(--bad)">
          <div class="eyebrow" style="margin-bottom:14px;color:var(--bad)">Zona de perigo</div>
          <button class="btn btn-danger" style="width:100%" onclick="location='/reset/factory'">Reset Completo (Apagar Chaves)</button>
        </div>
      </div>
    </div>
  </main>
</div>
<script>
const tb=document.getElementById('themeBtn'), doc=document.documentElement;
const moonSvg="<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/></svg>";
const sunSvg="<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='4'/><line x1='12' y1='2' x2='12' y2='6'/><line x1='12' y1='18' x2='12' y2='22'/><line x1='4.93' y1='4.93' x2='7.76' y2='7.76'/><line x1='16.24' y1='16.24' x2='19.07' y2='19.07'/><line x1='2' y1='12' x2='6' y2='12'/><line x1='18' y1='12' x2='22' y2='12'/><line x1='4.93' y1='19.07' x2='7.76' y2='16.24'/><line x1='16.24' y1='7.76' x2='19.07' y2='4.93'/></svg>";
function setThemeIcon(){tb.innerHTML=doc.getAttribute('data-theme')==='dark'?sunSvg:moonSvg}
const cur=localStorage.getItem('theme')||'light';
doc.setAttribute('data-theme',cur);
setThemeIcon();
tb.onclick=()=>{const n=doc.getAttribute('data-theme')==='dark'?'light':'dark';doc.setAttribute('data-theme',n);localStorage.setItem('theme',n);setThemeIcon();};

function countRows(pfx){return document.getElementById(pfx+'_list').querySelectorAll('.srow').length}
function updateCounts(){
  document.getElementById('ext_count').value=countRows('ext');
  document.getElementById('loc_count').value=countRows('loc');
  const btn=document.getElementById('ara-btn');
  if(!btn)return;
  let hasAra=false;
  document.getElementById('ext_list').querySelectorAll('.srow').forEach(row=>{
    const url=row.querySelector('input[name^="ext_url_"]').value;
    if(url===")HTML";
  html += DEFAULT_SERVER_EXT_URL;
  html += R"HTML(") hasAra=true;
  });
  btn.disabled=hasAra;
  btn.style.opacity=hasAra?0.5:1;
  btn.style.cursor=hasAra?'not-allowed':'pointer';
}
function addRow(pfx){
  const list=document.getElementById(pfx+'_list');
  const i=list.querySelectorAll('.srow').length;
  const d=document.createElement('div');d.className='srow';d.id=pfx+i;
  d.innerHTML=`<input type="text" class="form-input" name="${pfx}_name_${i}" placeholder="Nome">
    <input type="text" class="form-input" name="${pfx}_url_${i}" placeholder="${pfx==='loc'?'IP:porta':'URL'}">
    <button type="button" class="btn btn-danger" style="padding:11px 14px" onclick="removeRow(this)">✕</button>`;
  list.appendChild(d);
  d.querySelector('input').focus();
  updateCounts();
}
function removeRow(btn){btn.closest('.srow').remove();updateCounts()}
function addArateki(){
  const list=document.getElementById('ext_list');
  const i=list.querySelectorAll('.srow').length;
  const d=document.createElement('div');d.className='srow';d.id='ext'+i;
  d.innerHTML=`<input type="text" class="form-input" name="ext_name_${i}" value=")HTML";
  html += DEFAULT_SERVER_EXT_NAME;
  html += R"HTML("><input type="text" class="form-input" name="ext_url_${i}" value=")HTML";
  html += DEFAULT_SERVER_EXT_URL;
  html += R"HTML("><button type="button" class="btn btn-danger" style="padding:11px 14px" onclick="removeRow(this)">✕</button>`;
  list.appendChild(d);updateCounts();
}
document.getElementById('f').addEventListener('submit',updateCounts);
document.getElementById('ext_list').addEventListener('input',updateCounts);
updateCounts();
</script><script src="/local-nav.js"></script></body></html>)HTML";

  server.send(200, "text/html", html);
}

// ── /config/save (POST) ───────────────────────────────────────────────────

static void handleConfigSave() {
  gCfg->device_name = server.arg("device_name");

  int extCount = server.arg("ext_count").toInt();
  gCfg->servers_external.clear();
  for (int i = 0; i < extCount; i++) {
    String name = server.arg("ext_name_" + String(i));
    String url  = server.arg("ext_url_"  + String(i));
    if (name.length() > 0 && url.length() > 0) {
      gCfg->servers_external.push_back({ name, url });
    }
  }

  int locCount = server.arg("loc_count").toInt();
  gCfg->servers_local.clear();
  for (int i = 0; i < locCount; i++) {
    String name = server.arg("loc_name_" + String(i));
    String url  = server.arg("loc_url_"  + String(i));
    if (name.length() > 0 && url.length() > 0) {
      gCfg->servers_local.push_back({ name, url });
    }
  }

  saveConfig(*gCfg);
  clearTelemetryServerStatus();
  server.sendHeader("Location", "/config");
  server.send(302, "text/plain", "");
}

// ── /reset/wifi ───────────────────────────────────────────────────────────

static void handleResetWifi() {
  server.send(200, "text/html",
    "<html><body style='font-family:sans-serif;background:#0f1117;color:#e8e8e8;padding:20px'>"
    "<h2>Reconectando Wi-Fi...</h2><p>Aguarde alguns segundos.</p>"
    "<script>setTimeout(()=>location='/',5000)</script></body></html>");
  delay(200);
  WiFi.disconnect(false);
  delay(300);
  WiFi.begin();
}

// ── /reset/factory (GET - confirmation page) ──────────────────────────────

static void handleResetFactoryPage() {
  server.send(200, "text/html", R"HTML(<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset de Fábrica</title>
<style>
:root { --bg:#f4f1ea; --fg:#1d231e; --line:#d8d2bf; --bad:#a83a2a; }
[data-theme="dark"] { --bg:#0d1310; --fg:#d8e3d4; --line:#20281f; --bad:#d36e63; }
body{font-family:-apple-system,sans-serif;background:var(--bg);color:var(--fg);padding:20px;transition:background .2s}
a{color:var(--fg);text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
.box{border:1px solid var(--bad);border-radius:2px;padding:20px;margin-top:24px;background:color-mix(in srgb, var(--bad) 5%, transparent)}
h2{color:var(--bad);font-family:Georgia,serif;font-weight:normal;margin-bottom:12px}
p{font-size:13px;line-height:1.6;margin-bottom:12px}
input{width:100%;padding:12px;background:transparent;border:1px solid var(--line);border-radius:2px;color:var(--fg);font-family:monospace;margin-top:10px}
button{margin-top:16px;padding:14px;background:var(--bad);border:none;border-radius:2px;color:#fff;cursor:pointer;width:100%;opacity:.4;text-transform:uppercase;letter-spacing:.04em;font-weight:600}
button.active{opacity:1}
</style></head><body>
<a href="/config">← Voltar</a>
<div class="box">
  <h2>Reset de fábrica</h2>
  <p>Esta ação vai <strong>apagar permanentemente</strong> a identidade criptográfica e as configurações.</p>
  <p>Para confirmar, digite <strong>CONFIRMAR</strong>:</p>
  <input type="text" id="pin" oninput="check()" placeholder="CONFIRMAR">
  <form method="POST" action="/reset/factory/confirm" id="f">
    <button type="submit" id="btn" disabled>Apagar e reiniciar</button>
  </form>
</div>
<script>
document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'light');
function check(){
  const ok=document.getElementById('pin').value==='CONFIRMAR';
  document.getElementById('btn').disabled=!ok;
  document.getElementById('btn').className=ok?'active':'';
}
</script></body></html>)HTML");
}

// ── /reset/factory/confirm (POST) ─────────────────────────────────────────

static void handleResetFactoryConfirm() {
  server.send(200, "text/html",
    "<html><body style='font-family:sans-serif;background:#0f1117;color:#e8e8e8;padding:20px'>"
    "<h2>Resetando...</h2><p>O dispositivo vai reiniciar e gerar uma nova identidade.</p>"
    "</body></html>");
  delay(500);
  gPendingAction = ACTION_FACTORY_RESET;  // main.cpp executes it on the next loop
}

// ── /docs ─────────────────────────────────────────────────────────────────

static const char DOCS_HEADER_HTML[] PROGMEM = R"rawliteral(<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manual — SafraSense Aqua</title>
<link rel="stylesheet" href="/local.css">
</head>
<body>
<header class="local-header">
  <a class="local-brand" href="/">
    <span class="local-brand-title">S A F R A S E N S E <span class="brand-aqua">A Q U A</span></span>
  </a>
  <nav class="local-tabs" aria-label="Navegação principal">
    <a class="local-tab" href="/">Início</a>
    <a class="local-tab" id="raiznet-menu-item" href="/raiznet" style="display:none">Raiznet</a>
    <a class="local-tab" href="/config">Configurações</a>
    <a class="local-tab" href="/docs">Manual</a>
  </nav>
  <div class="header-actions">
    <select class="lang-select" id="langSelect" aria-label="Selecionar idioma">
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="ja">JA</option>
      <option value="zh">ZH</option>
    </select>
    <button class="theme-btn local-theme" id="themeBtn" type="button" aria-label="Alternar tema"></button>
  </div>
</header>
<div class="portal-shell">
<main class="main doc-wrap">
<div class="topbar">
  <div class="title">
    <div class="eyebrow">M A N U A L</div>
    <h1 class="serif" style="display:inline-flex;align-items:center;gap:10px">
      Guia SafraSense
      <button class="copy-btn" id="copy-docs-btn" onclick="window.copyDocs(this)" title="Copiar manual completo" style="margin:0;width:30px;height:30px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </h1>
    <p>Referência rápida para configuração, monitoramento e cultivo hidropônico.</p>
  </div>
</div>
)rawliteral";

static const char DOCS_FOOTER_HTML[] PROGMEM = R"rawliteral(
</main>
</div>
<script>
(function(){
  var doc=document.documentElement,btn=document.getElementById('themeBtn');
  var moon="<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/></svg>";
  var sun="<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='4'/><line x1='12' y1='2' x2='12' y2='6'/><line x1='12' y1='18' x2='12' y2='22'/><line x1='4.93' y1='4.93' x2='7.76' y2='7.76'/><line x1='16.24' y1='16.24' x2='19.07' y2='19.07'/><line x1='2' y1='12' x2='6' y2='12'/><line x1='18' y1='12' x2='22' y2='12'/><line x1='4.93' y1='19.07' x2='7.76' y2='16.24'/><line x1='16.24' y1='7.76' x2='19.07' y2='4.93'/></svg>";
  function setIcon(t){if(btn)btn.innerHTML=t==='dark'?sun:moon;}
  var stored=localStorage.getItem('theme')||'light';
  doc.setAttribute('data-theme',stored);
  setIcon(stored);
  if(btn)btn.onclick=function(){
    var n=doc.getAttribute('data-theme')==='dark'?'light':'dark';
    doc.setAttribute('data-theme',n);localStorage.setItem('theme',n);setIcon(n);
  };
})();
window.copyDocs = function(btn) {
  const content = document.querySelector('.main.doc-wrap').innerText;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(content).catch(()=>{});
  } else {
    let ta = document.createElement("textarea");
    ta.value = content;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }
  if (btn) {
    btn.classList.add('copied');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    setTimeout(()=>{btn.classList.remove('copied');btn.innerHTML=orig;}, 1500);
  }
};
function openDocHash(hash,updateHistory){
  if(!hash||hash.charAt(0)!=='#')return;
  var t=document.querySelector(hash);
  if(!t)return;
  var sec=t.tagName==='DETAILS'?t:t.closest('details.doc-section');
  if(sec)sec.open=true;
  setTimeout(function(){t.scrollIntoView({block:'start'});},0);
  if(updateHistory!==false){
    if(history&&history.pushState)history.pushState(null,'',hash);
    else location.hash=hash;
  }
}
function buildSubtoc(item){
  var box=item.querySelector('.doc-subtoc');
  if(!box||box.getAttribute('data-built')==='1')return;
  var sec=document.getElementById(item.getAttribute('data-section'));
  if(!sec)return;
  var heads=sec.querySelectorAll('.doc-body .doc-h4');
  heads.forEach(function(h,i){
    if(!h.id)h.id=sec.id+'-sub-'+(i+1);
    var a=document.createElement('a');
    a.href='#'+h.id;
    a.textContent=h.textContent;
    box.appendChild(a);
  });
  box.setAttribute('data-built','1');
  if(!heads.length){
    var btn=item.querySelector('.doc-toc-toggle');
    if(btn)btn.hidden=true;
  }
}
document.querySelectorAll('.doc-toc-item').forEach(function(item){
  buildSubtoc(item);
  var btn=item.querySelector('.doc-toc-toggle');
  var box=item.querySelector('.doc-subtoc');
  if(btn&&box)btn.addEventListener('click',function(){
    var open=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded',open?'false':'true');
    item.classList.toggle('is-open',!open);
    box.hidden=open;
  });
});
document.querySelectorAll('.doc-toc a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    openDocHash(a.getAttribute('href'),true);
  });
});
if(location.hash)openDocHash(location.hash,false);
</script>
<script src="/local-nav.js"></script>
</body>
</html>)rawliteral";

static void handleRaiznet() {
  if (gCfg->servers_external.empty()) {
    server.sendHeader("Location", "/");
    server.send(302, "text/plain", "");
    return;
  }

  String html = R"HTML(<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Raiznet - SafraSense</title>
<link rel="stylesheet" href="/local.css">
</head><body>
<header class="local-header">
  <a class="local-brand" href="/">
    <span class="local-brand-title">S A F R A S E N S E <span class="brand-aqua">A Q U A</span></span>
  </a>
  <nav class="local-tabs" aria-label="Navegação principal">
    <a class="local-tab" href="/">Início</a>
    <a class="local-tab is-active" id="raiznet-menu-item" href="/raiznet">Raiznet</a>
    <a class="local-tab" href="/config">Configurações</a>
    <a class="local-tab" href="/docs">Manual</a>
  </nav>
  <div class="header-actions">
    <select class="lang-select" id="langSelect" aria-label="Selecionar idioma">
      <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option><option value="ja">JA</option><option value="zh">ZH</option>
    </select>
    <button class="theme-btn local-theme" id="themeBtn" type="button" aria-label="Alternar tema"></button>
  </div>
</header>
<div class="portal-shell">
  <main class="main">
    <div class="topbar">
      <div class="title">
        <div class="eyebrow">R E D E   D E S C E N T R A L I Z A D A</div>
        <h1 class="serif">Status Raiznet</h1>
      </div>
    </div>
    <div class="content-grid" style="grid-template-columns: 1fr;">
      <div class="panel">
        <div class="section-head"><div class="eyebrow">Servidores Conectados</div></div>
        <div id="externalServers" class="server-list">
          <div class="empty">Carregando status...</div>
        </div>
      </div>
    </div>
  </main>
</div>
<script src="/dashboard.js"></script>
<script src="/local-nav.js"></script>
</body></html>)HTML";

  server.send(200, "text/html", html);
}

static void handleDocs() {
  String html;
  html.reserve(22000);
  html += FPSTR(DOCS_HEADER_HTML);
  if (!gCfg->servers_external.empty()) {
    html.replace("id=\"raiznet-menu-item\" href=\"/raiznet\" style=\"display:none\"", "id=\"raiznet-menu-item\" href=\"/raiznet\"");
  }
  html.replace("class=\"local-tab\" href=\"/docs\">Manual</a>", "class=\"local-tab is-active\" href=\"/docs\">Manual</a>");
  appendDocsContent(html);
  html += FPSTR(DOCS_FOOTER_HTML);
  server.send(200, "text/html", html);
}

// ── 404 route ─────────────────────────────────────────────────────────────

static void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

// ── Public interface ──────────────────────────────────────────────────────

void initHttpServer(DeviceConfig* cfg, const DeviceIdentity* id) {
  gCfg = cfg;
  gId  = id;

  server.on("/",                      handleRoot);
  server.on("/raiznet",               handleRaiznet);
  server.on("/local.css",             handleLocalCss);
  server.on("/dashboard.js",          handleDashboardJs);
  server.on("/local-nav.js",          handleLocalNavJs);
  server.on("/api/status",            handleApiStatus);
  server.on("/api/telemetry",         handleApiTelemetry);
  server.on("/api/force-read", []() {
    gPendingAction = ACTION_FORCE_READ;
    server.send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/api/ph/manual", HTTP_POST, []() {
    if (server.hasArg("ph")) {
      float ph = server.arg("ph").toFloat();
      if (ph >= 0 && ph <= 14) {
        gLastReading.ph = ph;
        gHasReading = true;
        // Also add to buffer so it gets sent
        bufferAdd(gLastReading);
        server.send(200, "application/json", "{\"ok\":true}");
        return;
      }
    }
    server.send(400, "application/json", "{\"error\":\"invalid ph\"}");
  });
  server.on("/config",                handleConfig);
  server.on("/config/save",HTTP_POST, handleConfigSave);
  server.on("/docs",                  handleDocs);
  server.on("/reset/wifi",            handleResetWifi);
  server.on("/reset/factory",         handleResetFactoryPage);
  server.on("/reset/factory/confirm", HTTP_POST, handleResetFactoryConfirm);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("[http] Servidor local iniciado na porta 80.");
}

void handleHttpClients() {
  server.handleClient();
}

void updateLastReading(const SensorData& d) {
  gLastReading = d;
  gHasReading  = true;
}

PendingAction getPendingAction() {
  PendingAction a = gPendingAction;
  gPendingAction  = ACTION_NONE;
  return a;
}
