#include "wifi_setup.h"
#include "config.h"
#include "leds/leds.h"
#include "identity/identity.h"
#include "i18n/i18n.h"
#include <WiFi.h>
#include <WiFiManager.h>
#include <ESPmDNS.h>
#include <time.h>

static String mdnsName;

// HTML/JS for displaying seed words and safety instructions.
const char* IDENTITY_CSS = R"rawliteral(
<style>
  :root { --bg:#f4f1ea; --fg:#1d231e; --fg-2:#46493d; --fg-3:#6d6a5f; --pri:#1a3a28; --line:#d8d2bf; --input-line:#d8d2bf; --pap:#f7f1de; --bad:#a83a2a; --btn-fg:#f4f1ea; --aqua:#9ed8ff; --mnemonic:#1a3a28; }
  [data-theme="dark"] { --bg:#0d1310; --fg:#d8e3d4; --fg-2:#b3c2af; --fg-3:#9ead99; --pri:#1a3a28; --line:#20281f; --input-line:#9ead99; --pap:#14201a; --bad:#d36e63; --btn-fg:#f4f1ea; --aqua:#a8dcff; --mnemonic:#c7efd5; }
  body { background:var(--bg); color:var(--fg); font-family:-apple-system,system-ui,sans-serif; text-align:left; padding:20px; margin:0; transition: background 0.2s, color 0.2s; display:flex; justify-content:center; }
  .wrap { width:100%; max-width:400px; margin:0 auto; text-align:left; position:relative; padding-top:44px; }
  h1 { font-family:Georgia,serif; font-size:24px; font-weight:normal; margin:0 0 20px; color:var(--fg); line-height:1.2; text-align:left; }
  .eyebrow { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--fg-3); margin-bottom:8px; font-weight:650; display:block; }
  .brand-aqua { color:var(--aqua); }
  .portal-brand { position:absolute; top:0; left:0; height:32px; max-width:calc(100% - 48px); display:flex; align-items:center; white-space:nowrap; overflow:hidden; }
  .portal-brand .eyebrow { margin:0; }
  input, select { width:100%; box-sizing:border-box; padding:14px; border:1px solid var(--input-line); background:transparent; font-family:monospace; font-size:14px; margin-bottom:16px; color:var(--fg); border-radius:4px; appearance:none; }
  input[type="checkbox"] { appearance:auto; -webkit-appearance:checkbox; width:auto; padding:0; margin:0 8px 16px 0; accent-color:var(--pri); vertical-align:middle; }
  input:focus, select:focus { border-color:var(--pri); outline:none; }
  button, input[type="submit"], input[type="button"], .btn { position:relative; display:block; background:var(--pri); color:var(--btn-fg) !important; border:1px solid var(--pri); font-family:-apple-system,sans-serif; font-size:13px; font-weight:500; letter-spacing:0.04em; padding:16px; cursor:pointer; width:100%; margin-bottom:12px; border-radius:4px; text-transform:uppercase; text-decoration:none; text-align:center; box-sizing:border-box; overflow:hidden; }
  button:hover, input[type="submit"]:hover, input[type="button"]:hover, .btn:hover { opacity:0.9; }
  #loader-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:var(--bg); opacity:0.85; z-index:9999; }
  #loader-overlay::after { content:"•••"; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); color:var(--fg); font-size:32px; letter-spacing:4px; animation:blink 1.4s infinite both; }
  @keyframes blink { 0% { opacity:.2; } 20% { opacity:1; } 100% { opacity:.2; } }
  body.is-loading { pointer-events:none !important; overflow:hidden; }
  body.is-loading #loader-overlay { display:block; }
  /* WiFiManager default overrides */
  div[style*="text-align:center"], div[style*="text-align: center"] { text-align:left !important; }
  div.c { display:none; } /* hide default header */
  .q { color:var(--fg-3); } /* fix dark mode list text */
  a { color:var(--pri); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .msg { padding:14px; background:var(--pap); border:1px solid var(--line); border-radius:4px; margin-bottom:16px; font-size:12px; color:var(--fg-2); line-height:1.5; }
  /* Ident section */
  .ident-section { border:1px solid var(--line); background:var(--pap); padding:16px; margin:20px 0; border-radius:4px; }
  .mnemonic-box { font-family:monospace; font-size:14px; line-height:1.6; word-spacing:6px; color:var(--mnemonic); margin-top:8px; font-weight:650; }
  .warn-box { font-size:11px; color:var(--bad); margin-top:12px; line-height:1.4; border-left:2px solid var(--bad); padding-left:10px; }
  label { font-size:10px; color:var(--fg-3); margin-bottom:6px; display:block; text-transform:uppercase; letter-spacing:0.05em; font-weight:650; }
  .theme-btn { position:absolute; top:0; right:0; background:none !important; border:none !important; color:var(--fg) !important; font-size:22px; cursor:pointer; width:auto; padding:5px; margin:0; z-index:100; letter-spacing:0; text-transform:none; pointer-events:auto; }
  .lang-sel { margin-bottom:20px; }
  dt { font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--fg-3); margin-top:12px; font-weight:650; }
  dd { font-family:monospace; font-size:14px; margin-left:0; margin-bottom:8px; word-break:break-all; }
  #exit-confirm { display:none; position:fixed; inset:0; z-index:10000; background:rgba(5,8,6,.55); align-items:center; justify-content:center; padding:20px; box-sizing:border-box; }
  #exit-confirm.is-open { display:flex; }
  .exit-card { width:100%; max-width:360px; background:var(--bg); color:var(--fg); border:1px solid var(--line); padding:18px; border-radius:4px; box-shadow:0 8px 30px rgba(0,0,0,.28); }
  .exit-card p { margin:0 0 14px; color:var(--fg-2); font-size:13px; line-height:1.5; }
  .exit-actions { display:flex; gap:8px; }
  .exit-actions button { margin:0; padding:12px; }
  .exit-cancel { background:transparent !important; color:var(--fg) !important; border-color:var(--line) !important; }
  .wm-credit { margin-top:24px; padding-top:14px; border-top:1px solid var(--line); display:flex; align-items:center; justify-content:center; gap:8px; color:var(--fg-3); font-size:10px; font-weight:650; letter-spacing:.04em; text-transform:uppercase; }
  .wm-credit svg { width:20px; height:20px; display:block; }
</style>
<script>
const dict = {
  '0': { conf:'Configure WiFi', info:'Info', exit:'Exit', upd:'Update', erase:'Erase WiFi config', setup:'Initial Setup', portal:'Configuration Portal', credit:'Developed by Arateki', lang:'Language', net:'-- Select Network --', other:'Other (Type SSID)', title_info:'Device Info', title_upd:'Update Firmware', noap:'No AP set', chip:'Chip ID', fsize:'Flash Size', exit_conf:'Close the configuration portal? You will need to restart the device to open it again.', exit_cancel:'Cancel', exit_confirm:'Close portal', exiting:'Closing...', exiting_msg:'The configuration portal has been closed. The device will now start.', firmware:'Firmware', upload_fw:'Upload new firmware', update_hint:'May not function inside captive portal, open in browser http://192.168.4.1', save:'Save', back:'Back', refresh:'Refresh Wi-Fi List', password:'Password', showpass:'Show Password', wmode:'WiFi mode', mac:'MAC Address', stip:'Station IP', stmac:'Station MAC', bssid:'BSSID', apip:'Access point IP', apmac:'Access point MAC', ap_ssid:'Access point SSID', uptime:'Uptime', chip_rev:'Chip Rev', last_reset:'Last reset reason', psram:'PSRAM Size', cpu:'CPU Frequency', heap:'Free Heap', sketch:'Sketch Size', sdk:'SDK version', temp:'Temperature', wifi:'WiFi', conn:'Connected', autoconx:'Autoconnect', st_ssid:'Station SSID', st_gw:'Station Gateway', st_sub:'Station Subnet', dns:'DNS Server', host:'Hostname', ap_host:'Access point hostname', about:'About', wm:'WiFiManager', ard:'Arduino', build:'Build Date' },
  '1': { conf:'Configurar Wi-Fi', info:'Informações', exit:'Sair', upd:'Atualizar', erase:'Apagar Wi-Fi salvo', setup:'Configuração Inicial', portal:'Portal de configuração', credit:'Desenvolvido por Arateki', lang:'Idioma / Language', net:'-- Selecionar Rede --', other:'Outra (Digitar SSID)', title_info:'Informações', title_upd:'Atualizar Firmware', noap:'Nenhuma rede configurada', chip:'ID do Chip', fsize:'Tamanho da Flash', exit_conf:'Deseja fechar o portal de configuração? Você precisará reiniciar o dispositivo para abrir novamente', exit_cancel:'Cancelar', exit_confirm:'Fechar portal', exiting:'Encerrando...', exiting_msg:'O portal foi encerrado e o sensor começará a operar.', firmware:'Firmware', upload_fw:'Enviar novo firmware', update_hint:'Pode não funcionar dentro do portal cativo. Abra no navegador: http://192.168.4.1', save:'Salvar', back:'Voltar', refresh:'Atualizar Lista Wi-Fi', password:'Senha', showpass:'Mostrar senha', wmode:'Modo Wi-Fi', mac:'Endereço MAC', stip:'IP da Estação', stmac:'MAC da Estação', bssid:'BSSID', apip:'IP do AP', apmac:'MAC do AP', ap_ssid:'SSID do AP', uptime:'Tempo Ligado', chip_rev:'Revisão do Chip', last_reset:'Motivo do último reset', psram:'Tamanho da PSRAM', cpu:'Frequência CPU', heap:'Memória Livre', sketch:'Tamanho do Código', sdk:'Versão SDK', temp:'Temperatura', wifi:'Wi-Fi', conn:'Conectado', autoconx:'Conexão automática', st_ssid:'SSID da Estação', st_gw:'Gateway da Estação', st_sub:'Sub-rede da Estação', dns:'Servidor DNS', host:'Nome do Dispositivo', ap_host:'Nome do Portal', about:'Sobre', wm:'Versão WiFiManager', ard:'Versão Arduino', build:'Data de Build' },
  '2': { conf:'Configurar Wi-Fi', info:'Información', exit:'Salir', upd:'Actualizar', erase:'Borrar Wi-Fi guardado', setup:'Configuración Inicial', portal:'Portal de configuración', credit:'Desarrollado por Arateki', lang:'Idioma / Language', net:'-- Seleccionar Red --', other:'Otra (Escribir SSID)', title_info:'Información', title_upd:'Actualizar Firmware', noap:'Ninguna red configurada', chip:'ID del Chip', fsize:'Tamaño de Flash', exit_conf:'¿Desea cerrar el portal de configuración? Tendrá que reiniciar el dispositivo para abrirlo de nuevo.', exit_cancel:'Cancelar', exit_confirm:'Cerrar portal', exiting:'Cerrando...', exiting_msg:'El portal se ha cerrado. El sensor comenzará a operar.', firmware:'Firmware', upload_fw:'Subir nuevo firmware', update_hint:'Puede no funcionar dentro del portal cautivo. Abra en el navegador: http://192.168.4.1', save:'Guardar', back:'Volver', refresh:'Actualizar lista Wi-Fi', password:'Contraseña', showpass:'Mostrar contraseña', wmode:'Modo Wi-Fi', mac:'Dirección MAC', stip:'IP de la Estación', stmac:'MAC de la Estación', bssid:'BSSID', apip:'IP del AP', apmac:'MAC del AP', ap_ssid:'SSID del AP', uptime:'Tiempo Encendido', chip_rev:'Revisión del Chip', last_reset:'Motivo del último reset', psram:'Tamaño de PSRAM', cpu:'Frecuencia CPU', heap:'Memoria Libre', sketch:'Tamaño del Código', sdk:'Versión SDK', temp:'Temperatura', wifi:'Wi-Fi', conn:'Conectado', autoconx:'Autoconexión', st_ssid:'SSID de Estación', st_gw:'Puerta de Enlace', st_sub:'Subred', dns:'Servidor DNS', host:'Nombre de Dispositivo', ap_host:'Nombre del Portal', about:'Acerca de', wm:'Versión WiFiManager', ard:'Versión Arduino', build:'Fecha de Build' },
  '3': { conf:'Wi-Fi設定', info:'情報', exit:'終了', upd:'更新', erase:'Wi-Fi設定を消去', setup:'初期設定', portal:'設定ポータル', credit:'Arateki 開発', lang:'言語', net:'-- ネットワーク選択 --', other:'その他 (SSID入力)', title_info:'情報', title_upd:'ファームウェア更新', noap:'未設定', chip:'チップID', fsize:'フラッシュサイズ', exit_conf:'設定ポータルを閉じますか？再度開くにはデバイスを再起動する必要があります。', exit_cancel:'キャンセル', exit_confirm:'ポータルを閉じる', exiting:'終了しています...', exiting_msg:'ポータルを閉じました。デバイスが起動します。', firmware:'ファームウェア', upload_fw:'新しいファームウェアをアップロード', update_hint:'キャプティブポータル内では動作しない場合があります。ブラウザで http://192.168.4.1 を開いてください', save:'保存', back:'戻る', refresh:'Wi-Fiリストを更新', password:'パスワード', showpass:'パスワードを表示', wmode:'WiFiモード', mac:'MACアドレス', stip:'ステーションIP', stmac:'ステーションMAC', bssid:'BSSID', apip:'AP IP', apmac:'AP MAC', ap_ssid:'AP SSID', uptime:'起動時間', chip_rev:'チップリビジョン', last_reset:'最終リセット理由', psram:'PSRAMサイズ', cpu:'CPU周波数', heap:'空きメモリ', sketch:'スケッチサイズ', sdk:'SDKバージョン', temp:'温度', wifi:'Wi-Fi', conn:'接続状態', autoconx:'自動接続', st_ssid:'ステーションSSID', st_gw:'ゲートウェイ', st_sub:'サブネット', dns:'DNS', host:'ホスト名', ap_host:'APホスト名', about:'情報', wm:'WiFiManagerバージョン', ard:'Arduinoバージョン', build:'ビルド日' },
  '4': { conf:'配置 Wi-Fi', info:'信息', exit:'退出', upd:'更新', erase:'清除 Wi-Fi 配置', setup:'初始设置', portal:'配置门户', credit:'由 Arateki 开发', lang:'语言', net:'-- 选择网络 --', other:'其他 (输入 SSID)', title_info:'设备信息', title_upd:'更新固件', noap:'未设置网络', chip:'芯片ID', fsize:'闪存大小', exit_conf:'关闭配置门户？如需再次打开，您需要重启设备。', exit_cancel:'取消', exit_confirm:'关闭门户', exiting:'正在关闭...', exiting_msg:'配置页已关闭，设备即将启动。', firmware:'固件', upload_fw:'上传新固件', update_hint:'在强制门户中可能无法工作。请在浏览器打开 http://192.168.4.1', save:'保存', back:'返回', refresh:'刷新 Wi-Fi 列表', password:'密码', showpass:'显示密码', wmode:'WiFi模式', mac:'MAC地址', stip:'站IP', stmac:'站MAC', bssid:'BSSID', apip:'AP IP', apmac:'AP MAC', ap_ssid:'AP SSID', uptime:'运行时间', chip_rev:'芯片版本', last_reset:'上次重置原因', psram:'PSRAM大小', cpu:'CPU频率', heap:'可用内存', sketch:'代码大小', sdk:'SDK版本', temp:'温度', wifi:'Wi-Fi', conn:'已连接', autoconx:'自动连接', st_ssid:'站 SSID', st_gw:'网关', st_sub:'子网掩码', dns:'DNS', host:'主机名', ap_host:'AP 主机名', about:'关于', wm:'WiFiManager版本', ard:'Arduino版本', build:'构建日期' }
};

const extraText = {
  '0': { cred_saved:'Credentials saved', settings_saved:'Settings saved', saving_credentials:'Saving credentials', trying_connect:'Trying to connect ESP to the network.', reconnect_retry:'If it fails, reconnect to the access point and try again.', not_connected:'Not connected', connected:'Connected', to:'to', with_ip:'with IP', ap_not_found:'AP not found', auth_failure:'Authentication failure', could_not_connect:'Could not connect' },
  '1': { cred_saved:'Credenciais salvas', settings_saved:'Configurações salvas', saving_credentials:'Salvando credenciais', trying_connect:'Tentando conectar o ESP à rede.', reconnect_retry:'Se falhar, reconecte-se ao ponto de acesso e tente novamente.', not_connected:'Não conectado', connected:'Conectado', to:'a', with_ip:'com IP', ap_not_found:'Rede não encontrada', auth_failure:'Falha de autenticação', could_not_connect:'Não foi possível conectar' },
  '2': { cred_saved:'Credenciales guardadas', settings_saved:'Configuración guardada', saving_credentials:'Guardando credenciales', trying_connect:'Intentando conectar el ESP a la red.', reconnect_retry:'Si falla, vuelva a conectarse al punto de acceso e inténtelo de nuevo.', not_connected:'No conectado', connected:'Conectado', to:'a', with_ip:'con IP', ap_not_found:'Red no encontrada', auth_failure:'Error de autenticación', could_not_connect:'No fue posible conectar' },
  '3': { cred_saved:'認証情報を保存しました', settings_saved:'設定を保存しました', saving_credentials:'認証情報を保存しています', trying_connect:'ESPをネットワークに接続しています。', reconnect_retry:'失敗した場合はアクセスポイントに再接続してもう一度お試しください。', not_connected:'未接続', connected:'接続済み', to:'to', with_ip:'IP', ap_not_found:'APが見つかりません', auth_failure:'認証に失敗しました', could_not_connect:'接続できませんでした' },
  '4': { cred_saved:'凭据已保存', settings_saved:'设置已保存', saving_credentials:'正在保存凭据', trying_connect:'正在将 ESP 连接到网络。', reconnect_retry:'如果失败，请重新连接到接入点后再试。', not_connected:'未连接', connected:'已连接', to:'到', with_ip:'IP', ap_not_found:'未找到 AP', auth_failure:'认证失败', could_not_connect:'无法连接' }
};

const textFor = (lang) => Object.assign({}, dict[lang] || dict['1'], extraText[lang] || extraText['1']);

const labelKeys = {
  'configure wifi':'conf', 'info':'info', 'exit':'exit', 'update':'upd', 'erase wifi config':'erase', 'save':'save', 'back':'back', 'refresh':'refresh',
  'captive portal':'portal', 'rede wi-fi cativa':'portal', 'portal de configuração':'portal', 'configuration portal':'portal',
  'credentials saved':'cred_saved', 'settings saved':'settings_saved', 'not connected':'not_connected',
  'ssid':'ssid', 'password':'password', 'show password':'showpass', 'no ap set':'noap',
  'chip id':'chip', 'flash size':'fsize', 'sdk version':'sdk', 'cpu frequency':'cpu',
  'wifi mode':'wmode', 'mac address':'mac', 'station ip':'stip', 'station mac':'stmac', 'bssid':'bssid',
  'access point ip':'apip', 'access point mac':'apmac', 'access point ssid':'ap_ssid', 'access point hostname':'ap_host',
  'uptime':'uptime', 'chip rev':'chip_rev', 'last reset reason':'last_reset', 'psram size':'psram',
  'memory - free heap':'heap', 'memory - sketch size':'sketch', 'temperature':'temp', 'connected':'conn', 'autoconnect':'autoconx',
  'station ssid':'st_ssid', 'station gateway':'st_gw', 'station subnet':'st_sub',
  'dns server':'dns', 'hostname':'host', 'wifi':'wifi', 'about':'about', 'wifimanager':'wm', 'arduino':'ard', 'build date':'build'
};

const readPref = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
  } catch (_) {}
  const match = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : fallback;
};
const writePref = (key, value) => {
  try { localStorage.setItem(key, value); } catch (_) {}
  document.cookie = key + '=' + encodeURIComponent(value) + ';path=/;max-age=31536000;SameSite=Lax';
};
document.documentElement.setAttribute('data-theme', readPref('theme', 'light'));

document.addEventListener('DOMContentLoaded', () => {
  const loader = document.createElement('div');
  loader.id = 'loader-overlay';
  document.body.appendChild(loader);

  const exitModal = document.createElement('div');
  exitModal.id = 'exit-confirm';
  exitModal.innerHTML = "<div class='exit-card'><p id='exit-confirm-text'></p><div class='exit-actions'><button type='button' class='exit-cancel' id='exit-cancel'></button><button type='button' id='exit-ok'></button></div></div>";
  document.body.appendChild(exitModal);

  // Wrap content for max-width and center alignment
  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  while (document.body.firstChild && document.body.firstChild !== loader && document.body.firstChild !== wrap) {
    wrap.appendChild(document.body.firstChild);
  }
  document.body.appendChild(wrap);

  const brandHtml = "<span class='eyebrow'>S A F R A S E N S E <span class='brand-aqua'>- A Q U A</span></span>";
  const topBrand = document.createElement('div');
  topBrand.className = 'portal-brand';
  topBrand.innerHTML = brandHtml;
  wrap.appendChild(topBrand);

  // Theme toggle
  const btn = document.createElement('button');
  btn.className = 'theme-btn';
  btn.innerHTML = '◑';
  btn.type = 'button';
  wrap.appendChild(btn);

  const doc = document.documentElement;
  const setT = (t) => { doc.setAttribute('data-theme', t); writePref('theme', t); };
  setT(readPref('theme', 'light'));
  btn.onclick = (e) => { e.preventDefault(); setT(doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); };

  const startLoading = () => document.body.classList.add('is-loading');
  const stopLoading = () => document.body.classList.remove('is-loading');
  const actionPath = (el) => {
    try { return new URL(el.getAttribute('action') || el.getAttribute('href') || '', location.href).pathname; }
    catch (_) { return ''; }
  };
  const isExitForm = (form) => form && actionPath(form) === '/exit';
  const showExitConfirm = () => {
    const lang = readPref('lang', '1');
    const t = textFor(lang);
    document.getElementById('exit-confirm-text').innerText = t.exit_conf;
    document.getElementById('exit-cancel').innerText = t.exit_cancel;
    document.getElementById('exit-ok').innerText = t.exit_confirm;
    exitModal.classList.add('is-open');
  };
  const goExit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    showExitConfirm();
    return false;
  };
  document.getElementById('exit-cancel').onclick = () => exitModal.classList.remove('is-open');
  document.getElementById('exit-ok').onclick = () => {
    exitModal.classList.remove('is-open');
    startLoading();
    window.location.href = '/exit';
  };

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && actionPath(link) === '/exit') {
      goExit(e);
      return;
    }

    const trigger = e.target.closest('button, input[type="submit"], input[type="button"], .btn');
    const form = trigger ? trigger.closest('form') : null;
    if (isExitForm(form)) {
      goExit(e);
    }
  }, true);

  // Add loading animation to buttons, handling confirmation safely
  document.querySelectorAll('form').forEach(f => {
    f.addEventListener('submit', (e) => {
      if (isExitForm(f)) {
        goExit(e);
        return;
      }
      startLoading();
    });
  });
  
  document.querySelectorAll('button:not(.theme-btn), .btn').forEach(b => {
    b.addEventListener('click', function(e) {
      if (this.type !== 'button' && !this.closest('form[action="/exit"]')) startLoading();
    });
  });

  // Fix loading/theme state when navigating back from the browser history cache.
  window.addEventListener('pageshow', () => {
    stopLoading();
    setT(readPref('theme', 'light'));
  });
  window.addEventListener('focus', stopLoading);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) stopLoading();
  });

  const path = window.location.pathname;
  let langVal = readPref('lang', '1');
  if (!dict[langVal]) langVal = '1';

  const h1 = wrap.querySelector('h1');
  
  const walkText = (node, cb) => {
    if (node.nodeType === 3) cb(node);
    else node.childNodes.forEach(c => walkText(c, cb));
  };

  const translateStandardText = (t, lang) => {
    document.querySelectorAll('h1,h3,dt,label,button,strong').forEach(el => {
      const key = labelKeys[(el.textContent || '').trim().toLowerCase()];
      if (key && t[key]) el.innerText = t[key];
    });

    walkText(document.body, node => {
      node.nodeValue = node.nodeValue
        .replace('No AP set', t.noap)
        .replace('Saving Credentials', t.saving_credentials)
        .replace('Saving credentials', t.saving_credentials)
        .replace('Trying to connect ESP to network.', t.trying_connect)
        .replace('If it fails reconnect to AP to try again', t.reconnect_retry)
        .replace('AP not found', t.ap_not_found)
        .replace('Authentication failure', t.auth_failure)
        .replace('Could not connect', t.could_not_connect)
        .replace('with IP', t.with_ip)
        .replace(/^ to /, ' ' + t.to + ' ')
        .replace('Upload new firmware', t.upload_fw)
        .replace('* May not function inside captive portal, open in browser http://192.168.4.1', '* ' + t.update_hint)
        .replace('May not function inside captive portal, open in browser http://192.168.4.1', t.update_hint)
        .replace('Used / Total bytes', lang === '1' ? 'Usado / Total bytes' : (lang === '2' ? 'Usado / Total bytes' : 'Used / Total bytes'))
        .replace('bytes available', lang === '1' ? 'bytes disponíveis' : (lang === '2' ? 'bytes disponibles' : 'bytes available'))
        .replace('mins', lang === '1' ? 'min' : (lang === '2' ? 'min' : 'mins'))
        .replace('secs', lang === '1' ? 's' : (lang === '2' ? 's' : 'secs'))
        .replace(/^Yes$/, lang === '1' ? 'Sim' : (lang === '2' ? 'Sí' : 'Yes'))
        .replace(/^No$/, lang === '1' ? 'Não' : (lang === '2' ? 'No' : 'No'));
    });
  };

  const syncInternalLangControl = (lang) => {
    const langSelect = document.querySelector('select[name="lang"]');
    if (!langSelect || path === '/') return;
    langSelect.value = lang;
    langSelect.style.display = 'none';
    langSelect.setAttribute('aria-hidden', 'true');
    const label = langSelect.previousElementSibling;
    if (label && label.tagName === 'LABEL') label.style.display = 'none';
    langSelect.onchange = (e) => writePref('lang', e.target.value);
  };

  const removeInfoHelp = () => {
    if (path !== '/info') return;
    const help = Array.from(document.querySelectorAll('h3')).find(h => (h.textContent || '').trim().toLowerCase() === 'available pages');
    let node = help;
    while (node) {
      const next = node.nextSibling;
      node.remove();
      node = next;
    }
  };

  const removeDuplicatedIdentityHeader = () => {
    if (path !== '/wifi' && path !== '/0wifi') return;
    document.querySelectorAll('.ident-section').forEach(section => {
      const title = section.previousElementSibling;
      const brand = title ? title.previousElementSibling : null;
      if (brand && brand.classList && brand.classList.contains('eyebrow') && brand.textContent.includes('S A F R A')) {
        brand.remove();
      }
    });
  };

  const renderCredit = (t) => {
    let credit = document.getElementById('wm-credit');
    if (!credit) {
      credit = document.createElement('div');
      credit.id = 'wm-credit';
      credit.className = 'wm-credit';
      wrap.appendChild(credit);
    }
    credit.innerHTML = "<svg viewBox='0 0 400 400' aria-hidden='true'><g fill='currentColor'><path d='M 60,340 L 200,60 L 200,71.3 L 65.8,340 Z'/><path d='M 340,340 L 200,60 L 200,71.3 L 334.2,340 Z'/></g></svg><span>" + (t.credit || dict['0'].credit) + "</span>";
  };

  const applyTranslations = (lang) => {
    const t = textFor(lang);
    translateStandardText(t, lang);
    syncInternalLangControl(lang);
    removeInfoHelp();
    document.title = path === '/info' ? t.title_info : (path === '/update' ? t.title_upd : (path === '/wifisave' ? t.cred_saved : t.portal));

    if (h1) {
      if (h1.innerText.includes('WiFiManager') || h1.innerText.includes('Safra') || path === '/') {
        h1.innerText = t.setup;
      } else if (path === '/info') {
        h1.innerText = t.title_info;
      } else if (path === '/update') {
        h1.innerText = t.title_upd;
      } else if (path === '/wifi' || path === '/0wifi') {
        h1.innerText = t.portal;
      } else if (path === '/wifisave') {
        h1.innerText = t.cred_saved;
      }
    }
    
    if (path === '/') {
      document.querySelectorAll('form[action="/wifi"] button').forEach(b => b.innerText = t.conf);
      document.querySelectorAll('form[action="/info"] button').forEach(b => b.innerText = t.info);
      document.querySelectorAll('form[action="/update"] button').forEach(b => b.innerText = t.upd);
      document.querySelectorAll('form[action="/exit"] button').forEach(b => b.innerText = t.exit);
    } else if (path === '/info') {
      document.querySelectorAll('dt').forEach(dt => {
        if(dt.innerText.includes('Chip ID')) dt.innerText = t.chip;
        if(dt.innerText.includes('Flash')) dt.innerText = t.fsize;
        if(dt.innerText.includes('WiFi mode') || dt.innerText.includes('Modo Wi-Fi')) dt.innerText = t.wmode;
        if(dt.innerText.includes('Station IP') || dt.innerText.includes('IP da Estação')) dt.innerText = t.stip;
        if(dt.innerText.includes('Station MAC') || dt.innerText.includes('MAC da Estação')) dt.innerText = t.stmac;
        if(dt.innerText.includes('Soft AP IP') || dt.innerText.includes('Access point IP') || dt.innerText.includes('IP do AP')) dt.innerText = t.apip;
        if(dt.innerText.includes('Soft AP MAC') || dt.innerText.includes('Access point MAC') || dt.innerText.includes('MAC do AP')) dt.innerText = t.apmac;
        if(dt.innerText.includes('MAC Address')) dt.innerText = t.mac;
        if(dt.innerText.includes('BSSID')) dt.innerText = t.bssid;
      });
    } else if (path === '/update') {
      const ubtn = document.querySelector('input[type="submit"]');
      if (ubtn && ubtn.value === 'Update') ubtn.value = t.upd;
      const uploadBtn = document.getElementById('uploadbin');
      if (uploadBtn) uploadBtn.innerText = t.upd;
    } else if (path === '/exit') {
      wrap.innerHTML = '';
      wrap.appendChild(topBrand);
      wrap.appendChild(btn);
      const title = document.createElement('h1');
      title.innerText = t.exiting;
      const msg = document.createElement('div');
      msg.className = 'msg';
      msg.innerHTML = t.exiting_msg + "<br><br><div style='text-align:center;font-size:24px;animation:blink 1.4s infinite;color:var(--pri)'>•••</div>";
      wrap.appendChild(title);
      wrap.appendChild(msg);
    }
    renderCredit(t);
  };

  if (path === '/') {
    const langDiv = document.createElement('div');
    langDiv.className = 'lang-sel';
    langDiv.innerHTML = `<label id="lbl-lang">${dict[langVal].lang}</label>
      <select id="root-lang">
        <option value="1" ${langVal==='1'?'selected':''}>Português</option>
        <option value="0" ${langVal==='0'?'selected':''}>English</option>
        <option value="2" ${langVal==='2'?'selected':''}>Español</option>
        <option value="3" ${langVal==='3'?'selected':''}>日本語</option>
        <option value="4" ${langVal==='4'?'selected':''}>简体中文</option>
      </select>`;
    if(h1) h1.after(langDiv);
    
    document.getElementById('root-lang').onchange = (e) => {
      const newLang = e.target.value;
      writePref('lang', newLang);
      document.getElementById('lbl-lang').innerText = dict[newLang].lang;
      applyTranslations(newLang);
    };
  }
  
  applyTranslations(langVal);

  // Custom Wi-Fi Select on /wifi
  if (path === '/wifi') {
    const networks = [];
    wrap.querySelectorAll('a[href^="#p"]').forEach(a => {
      const rawSsid = a.getAttribute('data-ssid');
      const ssid = rawSsid !== null ? rawSsid : (a.textContent || '').replace(/\u00a0/g, ' ').trim();
      if (ssid) networks.push(ssid);
      const row = a.closest('div');
      if (row) row.style.display = 'none';
      else a.style.display = 'none';
    });
    wrap.querySelectorAll('.q').forEach(q => q.style.display = 'none');
    
    const ssidInput = document.getElementById('s');
    if (ssidInput && networks.length > 0) {
      const sel = document.createElement('select');
      const addOption = (value, label) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        sel.appendChild(opt);
      };
      addOption('', dict[langVal].net);
      networks.forEach(n => addOption(n, n));
      addOption('_other_', dict[langVal].other);
      
      ssidInput.parentNode.insertBefore(sel, ssidInput);
      
      const updateVis = () => {
        if (sel.value === '_other_') {
          ssidInput.style.display = 'block';
          ssidInput.value = '';
        } else {
          ssidInput.style.display = 'none';
          ssidInput.value = sel.value;
        }
      };
      sel.onchange = updateVis;
      updateVis();
    }
  }

  const langSelect = document.querySelector('select[name="lang"]');
  if (langSelect && path !== '/') {
    langSelect.value = langVal;
    langSelect.onchange = (e) => writePref('lang', e.target.value);
  }
});
</script>
)rawliteral";

void setupWifi(DeviceConfig& cfg) {
  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_MINUS_1dBm);

  DeviceIdentity id = loadOrCreateIdentity();
  
  // If there is no mnemonic, generate one now with hardware entropy for portal display.
  if (id.mnemonic.length() == 0) {
    generateOwnerIdentity(id, LANG_PT); 
  }

  String mac = WiFi.macAddress();
  mac.replace(":", "");
  String suffix = mac.substring(mac.length() - 4);
  suffix.toLowerCase();

  mdnsName      = "safrasense-aqua-" + suffix;
  String apName = "Safrasense-aqua_" + suffix;

  WiFiManager wm;
  wm.setTitle("Portal de configuração");
  wm.setConfigPortalTimeout(600); // 10 minutes to give enough time to write down the words
  
  // Apply our custom CSS and JS to ALL pages (menu, wifi list, setup form, info)
  wm.setCustomHeadElement(IDENTITY_CSS);

  // ── Identity section ─────────────────────────────────────────────────────
  WiFiManagerParameter p_css(IDENTITY_CSS);
  
  String headerHtml = 
    "<h1>" + t("setup_title", id.lang) + "</h1>"
    "<div class='ident-section'>"
      "<div class='eyebrow'>Sua Chave-mestre</div>"
      "<div class='mnemonic-box'>" + id.mnemonic + "</div>"
      "<div class='warn-box'>" + t("security_warn", id.lang) + "</div>"
    "</div>";
  WiFiManagerParameter p_header(headerHtml.c_str());
  
  const char* langHtml = "<label>Idioma / Language</label>"
                         "<select name='lang'>"
                         "<option value='1' selected>Português</option>"
                         "<option value='0'>English</option>"
                         "<option value='2'>Español</option>"
                         "<option value='3'>日本語</option>"
                         "<option value='4'>简体中文</option></select>";
  WiFiManagerParameter p_lang_html(langHtml);

  String importHtml = "<label>" + t("import_btn", id.lang) + " (Opcional)</label>";
  WiFiManagerParameter p_import_label(importHtml.c_str());
  WiFiManagerParameter p_import("import_mnemonic", "", "", 128);

  // ── Server parameters ───────────────────────────────────────────────────
  String extName = cfg.servers_external.empty() ? DEFAULT_SERVER_EXT_NAME : cfg.servers_external[0].name;
  String extUrl  = cfg.servers_external.empty() ? DEFAULT_SERVER_EXT_URL  : cfg.servers_external[0].url;
  String locUrl  = cfg.servers_local.empty() ? "" : cfg.servers_local[0].url;

  String nameLabel = "<label>" + t("sensor_name", id.lang) + "</label>";
  WiFiManagerParameter p_name_label(nameLabel.c_str());
  WiFiManagerParameter p_name("name", "", cfg.device_name.c_str(), 32);

  String extNameLabel = "<label>Servidor Público — Nome</label>";
  WiFiManagerParameter p_ext_name_label(extNameLabel.c_str());
  WiFiManagerParameter p_ext_name("ext_name", "", extName.c_str(), 32);

  String extUrlLabel = "<label>" + t("ext_server", id.lang) + "</label>";
  WiFiManagerParameter p_ext_url_label(extUrlLabel.c_str());
  WiFiManagerParameter p_ext_url("ext_url", "", extUrl.c_str(), 128);

  String locUrlLabel = "<label>" + t("loc_server", id.lang) + "</label>";
  WiFiManagerParameter p_loc_url_label(locUrlLabel.c_str());
  WiFiManagerParameter p_loc_url("loc_url", "", locUrl.c_str(), 64);

  wm.addParameter(&p_header);
  wm.addParameter(&p_lang_html);
  wm.addParameter(&p_import_label);
  wm.addParameter(&p_import);
  
  wm.addParameter(&p_name_label);
  wm.addParameter(&p_name);
  wm.addParameter(&p_ext_name_label);
  wm.addParameter(&p_ext_name);
  wm.addParameter(&p_ext_url_label);
  wm.addParameter(&p_ext_url);
  wm.addParameter(&p_loc_url_label);
  wm.addParameter(&p_loc_url);

  wm.setAPCallback([](WiFiManager*) {
    setLedState(LED_PORTAL_OPEN);
  });

  // Keep LEDs ticking while the portal is active.
  wm.setWebServerCallback([]() {
    // This runs when the web server is processing, but we need something 
    // that runs every loop. WiFiManager has setConfigPortalBlocking(false) 
    // but that complicates the flow. 
    // The best way for blocking mode is setProcessWebClientCallback or similar if available,
    // or simply using the portal in non-blocking mode.
  });

  // Let's use the non-blocking approach to keep the main loop running.
  wm.setConfigPortalBlocking(false);

  if (!wm.autoConnect(apName.c_str())) {
    // If it fails to connect, it will start the portal in non-blocking mode.
    // We need a loop here to keep it alive while portal is active.
    while (wm.getConfigPortalActive()) {
      wm.process();
      tickLeds();
      delay(10);
    }
  }

  // ── Processing ──────────────────────────────────────────────────────────
  
  // Only process parameters if we actually ran the config portal.
  if (wm.server && wm.server->args() > 0) {
    // 1. Language
    id.lang = docToLang(wm.server->arg("lang"));
    
    // 2. Mnemonic (prefer the imported one when the user fills it in).
    String imported = String(p_import.getValue());
    imported.trim();
    if (imported.length() > 0) {
      importOwnerIdentity(id, imported);
    } else {
      // Otherwise, save the mnemonic generated at the start of this function.
      saveIdentity(id);
    }

    // 3. Settings
    cfg.device_name = String(p_name.getValue());
    cfg.servers_external.clear();
    cfg.servers_local.clear();

    if (String(p_ext_name.getValue()).length() > 0) {
      cfg.servers_external.push_back({ String(p_ext_name.getValue()), String(p_ext_url.getValue()) });
    }
    if (String(p_loc_url.getValue()).length() > 0) {
      cfg.servers_local.push_back({ "Local", String(p_loc_url.getValue()) });
    }

    saveConfig(cfg);
  }
  
  configTime(NTP_GMT_OFFSET_SEC, NTP_DAYLIGHT_SEC, NTP_SERVER_1, NTP_SERVER_2);
  MDNS.begin(mdnsName.c_str());
}

void reconnectWifi() {
  WiFi.disconnect(false);
  delay(500);
  WiFi.begin();
  configTime(NTP_GMT_OFFSET_SEC, NTP_DAYLIGHT_SEC, NTP_SERVER_1, NTP_SERVER_2);
  MDNS.begin(mdnsName.c_str());
}

String getMdnsName() { return mdnsName; }
