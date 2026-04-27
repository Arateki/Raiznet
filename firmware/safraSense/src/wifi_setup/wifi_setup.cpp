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

// HTML/JS para exibir as palavras e instruções de segurança
const char* IDENTITY_CSS = R"rawliteral(
<style>
  .ident-section { background: #fdfdfd; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .ident-section h3 { margin: 0 0 10px 0; color: #2c3e50; font-size: 16px; border-bottom: 2px solid #4CAF50; display: inline-block; }
  .mnemonic-box { background: #333; color: #4CAF50; padding: 12px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; word-spacing: 10px; margin: 10px 0; }
  .warn-box { background: #fff5f5; color: #c0392b; padding: 10px; border-left: 4px solid #c0392b; font-size: 12px; margin: 10px 0; }
</style>
)rawliteral";

void setupWifi(DeviceConfig& cfg) {
  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_MINUS_1dBm);

  DeviceIdentity id = loadOrCreateIdentity();
  
  // Se não tem mnemônico, gera um agora (com entropia de hardware) para mostrar no portal
  if (id.mnemonic.length() == 0) {
    generateOwnerIdentity(id, LANG_PT); 
  }

  String mac = WiFi.macAddress();
  mac.replace(":", "");
  String suffix = mac.substring(mac.length() - 4);
  suffix.toLowerCase();

  mdnsName      = "safrasense-" + suffix;
  String apName = "SafraSense_Config_" + suffix;

  WiFiManager wm;
  wm.setConfigPortalTimeout(600); // 10 minutos para dar tempo de anotar as palavras

  // ── Seção de Identidade ──────────────────────────────────────────────────
  WiFiManagerParameter p_css(IDENTITY_CSS);
  WiFiManagerParameter p_title(("<div class='ident-section'><h3>" + t("setup_title", id.lang) + "</h3>").c_str());
  
  // Seleção de Idioma (JS para mudar textos no futuro)
  const char* langHtml = "<label>Idioma / Language</label>"
                         "<select name='lang' style='width:100%;padding:8px;margin:5px 0'>"
                         "<option value='1' selected>Português</option>"
                         "<option value='0'>English</option>"
                         "<option value='2'>Español</option></select>";
  WiFiManagerParameter p_lang_html(langHtml);

  // Exibição do Mnemônico gerado pelo hardware
  WiFiManagerParameter p_mnemonic_box(("<div class='mnemonic-box'>" + id.mnemonic + "</div>").c_str());
  
  // Campo para importar (caso o usuário já tenha um)
  WiFiManagerParameter p_import("import_mnemonic", t("import_btn", id.lang).c_str(), "", 128);
  
  WiFiManagerParameter p_warn(("<div class='warn-box'><b>" + t("security_warn", id.lang) + "</b></div></div>").c_str());

  // ── Parâmetros de Servidor ───────────────────────────────────────────────
  String extName = cfg.servers_external.empty() ? DEFAULT_SERVER_EXT_NAME : cfg.servers_external[0].name;
  String extUrl  = cfg.servers_external.empty() ? DEFAULT_SERVER_EXT_URL  : cfg.servers_external[0].url;
  String locUrl  = cfg.servers_local.empty() ? "" : cfg.servers_local[0].url;

  WiFiManagerParameter p_name    ("name",     t("sensor_name", id.lang).c_str(), cfg.device_name.c_str(), 32);
  WiFiManagerParameter p_ext_name("ext_name", "Servidor — Nome",                extName.c_str(), 32);
  WiFiManagerParameter p_ext_url ("ext_url",  t("ext_server", id.lang).c_str(),  extUrl.c_str(),  128);
  WiFiManagerParameter p_loc_url ("loc_url",  t("loc_server", id.lang).c_str(),  locUrl.c_str(),  64);

  wm.addParameter(&p_css);
  wm.addParameter(&p_title);
  wm.addParameter(&p_lang_html);
  wm.addParameter(&p_mnemonic_box);
  wm.addParameter(&p_import);
  wm.addParameter(&p_warn);
  
  wm.addParameter(&p_name);
  wm.addParameter(&p_ext_name);
  wm.addParameter(&p_ext_url);
  wm.addParameter(&p_loc_url);

  wm.setAPCallback([](WiFiManager*) {
    setLedState(LED_PORTAL_OPEN);
  });

  if (!wm.autoConnect(apName.c_str())) {
    delay(2000);
    ESP.restart();
  }

  // ── Processamento ────────────────────────────────────────────────────────
  
  // 1. Idioma
  id.lang = docToLang(wm.server->arg("lang"));
  
  // 2. Mnemônico (Prioriza o importado se o usuário preencheu)
  String imported = String(p_import.getValue());
  imported.trim();
  if (imported.length() > 0) {
    importOwnerIdentity(id, imported);
  } else {
    // Caso contrário, salva o que foi gerado no início da função
    saveIdentity(id);
  }

  // 3. Configurações
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
