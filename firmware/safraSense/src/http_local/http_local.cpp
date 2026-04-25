#include "http_local.h"
#include "config.h"
#include "telemetry/telemetry.h"
#include "telemetry/buffer.h"
#include "identity/identity.h"
#include "storage/storage.h"
#include "wifi_setup/wifi_setup.h"
#include <WebServer.h>
#include <WiFi.h>
#include <ArduinoJson.h>

static WebServer      server(80);
static DeviceConfig*       gCfg = nullptr;
static const DeviceIdentity* gId  = nullptr;
static SensorData     gLastReading;
static bool           gHasReading   = false;
static PendingAction  gPendingAction = ACTION_NONE;

// ── /api/status ───────────────────────────────────────────────────────────

static void handleApiStatus() {
  TelemetryState ts = getTelemetryState();
  JsonDocument   doc;

  doc["device_name"]    = gCfg->device_name;
  doc["device_id"]      = gId->public_key_hex;
  doc["mac"]            = gId->mac;
  doc["mdns"]           = getMdnsName();
  doc["ip"]             = WiFi.localIP().toString();
  doc["wifi_ok"]        = (WiFi.status() == WL_CONNECTED);
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
    if (gLastReading.water_level >= 0)     rdg["water_level"]  = gLastReading.water_level;
    rdg["bat_volts"]   = gLastReading.bat_volts;
    rdg["bat_percent"] = gLastReading.bat_percent;
  }

  // Lista de servidores com status de confirmação
  JsonArray ext = doc["servers_external"].to<JsonArray>();
  for (const auto& s : gCfg->servers_external) {
    JsonObject o = ext.add<JsonObject>();
    o["name"] = s.name;
    o["url"]  = s.url;
  }
  JsonArray loc = doc["servers_local"].to<JsonArray>();
  for (const auto& s : gCfg->servers_local) {
    JsonObject o = loc.add<JsonObject>();
    o["name"] = s.name;
    o["url"]  = s.url;
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
  server.send(200, "text/html", R"HTML(<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SafraSense</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,sans-serif;background:#0f1117;color:#e8e8e8;min-height:100vh}
header{padding:14px 16px;border-bottom:1px solid #1e2030;display:flex;justify-content:space-between;align-items:center}
.dname{font-size:1.05em;font-weight:600}
.did{font-size:.7em;color:#555;font-family:monospace;margin-top:2px}
.badge{padding:3px 9px;border-radius:10px;font-size:.78em;font-weight:500}
.ok{background:#0d2b1a;color:#4ade80}.warn{background:#2b1f00;color:#fbbf24}.err{background:#2b0d0d;color:#f87171}
.sbar{padding:7px 16px;font-size:.78em;display:flex;flex-wrap:wrap;gap:12px;background:#0c0e16;border-bottom:1px solid #1e2030;align-items:center}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:14px}
.card{background:#161820;border:1px solid #1e2030;border-radius:10px;padding:14px}
.clabel{font-size:.7em;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.cval{font-size:2em;font-weight:700;line-height:1}
.cunit{font-size:.85em;color:#666;margin-left:3px}
.offline{color:#f87171;font-size:.9em;margin-top:6px}
.batbar{height:5px;background:#1e2030;border-radius:3px;margin-top:8px;overflow:hidden}
.batfill{height:100%;border-radius:3px;transition:width .4s}
.sys{padding:0 16px 14px}
.stitle{font-size:.7em;color:#555;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.igrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.icard{background:#161820;border:1px solid #1e2030;border-radius:8px;padding:9px 11px}
.ikey{font-size:.67em;color:#555}
.ival{font-size:.82em;font-family:monospace;word-break:break-all}
nav{padding:12px 16px;border-top:1px solid #1e2030;display:flex;gap:8px;flex-wrap:wrap}
nav a{padding:7px 13px;background:#161820;border:1px solid #2a2d3e;border-radius:7px;text-decoration:none;color:#ccc;font-size:.82em}
.good{color:#4ade80}.warn2{color:#fbbf24}.bad{color:#f87171}
</style></head><body>
<header>
  <div><div class="dname" id="dn">—</div><div class="did" id="did">—</div></div>
  <span id="wb" class="badge">—</span>
</header>
<div class="sbar">
  <span>Servidor: <span id="sb" class="badge">—</span></span>
  <span id="buf">—</span>
  <span>Último envio: <span id="ls">—</span></span>
</div>
<div class="grid" id="grid"></div>
<div class="sys">
  <div class="stitle">Sistema</div>
  <div class="igrid" id="sinfo"></div>
</div>
<nav>
  <a href="/config">⚙ Configurações</a>
  <a href="/api/telemetry" target="_blank">JSON</a>
  <a href="/reset/wifi" onclick="return confirm('Reconectar Wi-Fi?')">↺ Reconectar Wi-Fi</a>
</nav>
<script>
function badge(el,text,cls){el.textContent=text;el.className='badge '+cls}
function cls(v,lo,hi){return v===null?'':v<lo?'bad':v<hi?'warn2':'good'}
async function refresh(){
  try{
    const d=await(await fetch('/api/status')).json();
    document.getElementById('dn').textContent=d.device_name;
    document.getElementById('did').textContent=d.device_id.slice(0,20)+'...';
    badge(document.getElementById('wb'),d.wifi_ok?'Wi-Fi ✓':'Wi-Fi ✗',d.wifi_ok?'ok':'err');
    badge(document.getElementById('sb'),d.server_ok?'Online':'Offline',d.server_ok?'ok':'err');
    document.getElementById('buf').textContent=d.buffer_pending+' leitura(s) pendente(s)';
    document.getElementById('ls').textContent=d.last_send_time;
    const r=d.readings,s=d.sensors;
    let h='';
    const fld=(label,val,unit,ok)=>ok===false
      ?`<div class="card"><div class="clabel">${label}</div><div class="offline">Sensor offline</div></div>`
      :`<div class="card"><div class="clabel">${label}</div><div class="cval">${val??'—'}</div><span class="cunit">${unit}</span></div>`;
    h+=fld('Temperatura Ar',r.temp_ambient!=null?r.temp_ambient.toFixed(1):null,'°C',s.dht);
    h+=fld('Umidade',r.humidity!=null?r.humidity.toFixed(1):null,'%',s.dht);
    h+=fld('Nutrientes EC',r.ec!=null?r.ec.toFixed(0):null,'ppm',s.tds);
    h+=fld('Nível Água',r.water_level!=null?(r.water_level/10).toFixed(1):null,'cm',s.laser);
    const bp=r.bat_percent??0;
    const bc=bp<20?'#f87171':bp<40?'#fbbf24':'#4ade80';
    h+=`<div class="card"><div class="clabel">Bateria</div>
      <div class="cval ${bp<20?'bad':bp<40?'warn2':'good'}">${bp}</div><span class="cunit">%</span>
      <div class="batbar"><div class="batfill" style="width:${bp}%;background:${bc}"></div></div></div>`;
    document.getElementById('grid').innerHTML=h;
    const upMin=Math.floor(d.uptime_s/60);
    const si=[['IP',d.ip],['mDNS',d.mdns+'.local'],['MAC',d.mac],
              ['Uptime',upMin+'min'],['Heap',Math.floor(d.free_heap/1024)+'KB'],
              ['Device ID',d.device_id.slice(0,16)+'...']];
    document.getElementById('sinfo').innerHTML=si.map(([k,v])=>
      `<div class="icard"><div class="ikey">${k}</div><div class="ival">${v}</div></div>`).join('');
  }catch(e){}
  setTimeout(refresh,5000);
}
refresh();
</script></body></html>)HTML");
}

// ── /config (GET) ─────────────────────────────────────────────────────────

static String serverRows(const std::vector<ServerEntry>& list, const char* prefix) {
  String html;
  for (size_t i = 0; i < list.size(); i++) {
    html += "<div class='srow' id='" + String(prefix) + String(i) + "'>";
    html += "<input name='" + String(prefix) + "_name_" + String(i) + "' placeholder='Nome' value='" + list[i].name + "'>";
    html += "<input name='" + String(prefix) + "_url_"  + String(i) + "' placeholder='URL ou IP:porta' value='" + list[i].url + "'>";
    html += "<button type='button' onclick='removeRow(this)'>✕</button></div>";
  }
  return html;
}

static void handleConfig() {
  String extRows = serverRows(gCfg->servers_external, "ext");
  String locRows = serverRows(gCfg->servers_local,    "loc");

  String html = R"HTML(<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configurações — SafraSense</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,sans-serif;background:#0f1117;color:#e8e8e8;padding:16px}
a.back{color:#888;text-decoration:none;font-size:.85em;display:inline-block;margin-bottom:14px}
h1{font-size:1.1em;margin-bottom:18px}
label{display:block;font-size:.75em;color:#888;margin-bottom:4px}
input[type=text]{width:100%;padding:9px 11px;background:#161820;border:1px solid #2a2d3e;border-radius:7px;color:#e8e8e8;font-size:.9em;margin-bottom:10px}
.sec{font-size:.7em;color:#555;text-transform:uppercase;letter-spacing:.05em;margin:20px 0 10px;padding-top:14px;border-top:1px solid #1e2030}
.srow{display:flex;gap:6px;margin-bottom:8px;align-items:center}
.srow input{margin-bottom:0;flex:1}
.srow button{padding:8px 10px;background:#2b0d0d;border:1px solid #f87171;border-radius:6px;color:#f87171;cursor:pointer;font-size:.85em;flex-shrink:0}
.add-btn{padding:7px 13px;background:#0d2b1a;border:1px solid #4ade80;border-radius:7px;color:#4ade80;font-size:.8em;cursor:pointer;margin-bottom:8px}
.preset{padding:5px 10px;background:#1e2030;border:1px solid #2a2d3e;border-radius:6px;color:#aaa;font-size:.78em;cursor:pointer;margin-bottom:10px}
.btn-row{display:flex;gap:8px;margin-top:18px}
button[type=submit]{padding:9px 18px;background:#2563eb;border:none;border-radius:7px;color:#fff;font-size:.9em;cursor:pointer}
.danger-sec{margin-top:28px;padding-top:14px;border-top:1px solid #2b0d0d}
.danger-title{font-size:.7em;color:#f87171;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px}
.btn-danger{padding:9px 15px;background:transparent;border:1px solid #f87171;border-radius:7px;color:#f87171;font-size:.85em;cursor:pointer}
</style></head><body>
<a href="/" class="back">← Voltar</a>
<h1>⚙ Configurações</h1>
<form method="POST" action="/config/save" id="f">
  <input type="hidden" id="ext_count" name="ext_count" value="0">
  <input type="hidden" id="loc_count" name="loc_count" value="0">

  <label>Nome do sensor</label>
  <input type="text" name="device_name" value=")HTML";
  html += gCfg->device_name;
  html += R"HTML(" maxlength="32">

  <div class="sec">Servidores externos (internet)</div>
  <div id="ext_list">)HTML";
  html += extRows;
  html += R"HTML(</div>
  <button type="button" class="add-btn" onclick="addRow('ext')">+ Adicionar servidor externo</button>
  <button type="button" class="preset" onclick="addArateki()">Usar Arateki</button>

  <div class="sec">Servidores locais (rede LAN)</div>
  <div id="loc_list">)HTML";
  html += locRows;
  html += R"HTML(</div>
  <button type="button" class="add-btn" onclick="addRow('loc')">+ Adicionar servidor local</button>

  <div class="btn-row"><button type="submit">Salvar</button></div>
</form>

<div class="danger-sec">
  <div class="danger-title">Zona de perigo</div>
  <div class="btn-row">
    <button class="btn-danger" onclick="if(confirm('Reconectar Wi-Fi?'))location='/reset/wifi'">Reconectar Wi-Fi</button>
    <button class="btn-danger" onclick="location='/reset/factory'">Reset de fábrica…</button>
  </div>
</div>

<script>
function countRows(pfx){return document.getElementById(pfx+'_list').querySelectorAll('.srow').length}
function updateCounts(){
  document.getElementById('ext_count').value=countRows('ext');
  document.getElementById('loc_count').value=countRows('loc');
}
function addRow(pfx){
  const list=document.getElementById(pfx+'_list');
  const i=list.querySelectorAll('.srow').length;
  const d=document.createElement('div');d.className='srow';d.id=pfx+i;
  d.innerHTML=`<input name="${pfx}_name_${i}" placeholder="Nome">
    <input name="${pfx}_url_${i}" placeholder="${pfx==='loc'?'IP:porta':'URL'}">
    <button type="button" onclick="removeRow(this)">✕</button>`;
  list.appendChild(d);updateCounts();
}
function removeRow(btn){btn.closest('.srow').remove();updateCounts()}
function addArateki(){
  const list=document.getElementById('ext_list');
  const i=list.querySelectorAll('.srow').length;
  const d=document.createElement('div');d.className='srow';d.id='ext'+i;
  d.innerHTML=`<input name="ext_name_${i}" value=")HTML";
  html += DEFAULT_SERVER_EXT_NAME;
  html += R"HTML("><input name="ext_url_${i}" value=")HTML";
  html += DEFAULT_SERVER_EXT_URL;
  html += R"HTML("><button type="button" onclick="removeRow(this)">✕</button>`;
  list.appendChild(d);updateCounts();
}
document.getElementById('f').addEventListener('submit',updateCounts);
updateCounts();
</script></body></html>)HTML";

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

// ── /reset/factory (GET — página de confirmação) ──────────────────────────

static void handleResetFactoryPage() {
  server.send(200, "text/html", R"HTML(<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset de Fábrica</title>
<style>
body{font-family:-apple-system,sans-serif;background:#0f1117;color:#e8e8e8;padding:20px}
a{color:#888;text-decoration:none;font-size:.85em}
.box{background:#1a0808;border:1px solid #5a1010;border-radius:10px;padding:20px;margin:20px 0}
h2{color:#f87171;margin-bottom:10px}p{color:#ccc;font-size:.9em;line-height:1.6;margin-bottom:10px}
input{width:100%;padding:9px;background:#0f1117;border:1px solid #5a1010;border-radius:6px;color:#e8e8e8;font-size:.9em;margin-top:10px}
button{margin-top:12px;padding:10px 20px;background:#7f1d1d;border:none;border-radius:7px;color:#fff;font-size:.9em;cursor:pointer;opacity:.4}
button.active{opacity:1;background:#dc2626}
</style></head><body>
<a href="/config">← Voltar</a>
<div class="box">
  <h2>⚠ Reset de fábrica</h2>
  <p>Esta ação vai <strong>apagar permanentemente</strong> a identidade criptográfica do dispositivo (keypair Ed25519), todas as configurações e as credenciais de Wi-Fi.</p>
  <p>O dispositivo vai gerar um <strong>novo Device ID</strong> no próximo boot e precisará ser registrado novamente na rede Raiznet.</p>
  <p>Para confirmar, digite <strong>CONFIRMAR</strong> abaixo:</p>
  <input type="text" id="pin" oninput="check()" placeholder="Digite CONFIRMAR">
  <form method="POST" action="/reset/factory/confirm" id="f">
    <button type="submit" id="btn" disabled>Apagar tudo e reiniciar</button>
  </form>
</div>
<script>
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
  gPendingAction = ACTION_FACTORY_RESET;  // main.cpp executa no próximo loop
}

// ── Rota 404 ──────────────────────────────────────────────────────────────

static void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

// ── Interface pública ─────────────────────────────────────────────────────

void initHttpServer(DeviceConfig* cfg, const DeviceIdentity* id) {
  gCfg = cfg;
  gId  = id;

  server.on("/",                      handleRoot);
  server.on("/api/status",            handleApiStatus);
  server.on("/api/telemetry",         handleApiTelemetry);
  server.on("/config",     HTTP_GET,  handleConfig);
  server.on("/config/save",HTTP_POST, handleConfigSave);
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
