#include "wifi_setup.h"
#include "config.h"
#include "leds/leds.h"
#include <WiFi.h>
#include <WiFiManager.h>
#include <ESPmDNS.h>

static String mdnsName;

void setupWifi(DeviceConfig& cfg) {
  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_MINUS_1dBm);

  String mac = WiFi.macAddress();
  mac.replace(":", "");
  String suffix = mac.substring(mac.length() - 4);
  suffix.toLowerCase();

  mdnsName      = "safrasense-" + suffix;
  String apName = "SafraSense_Config_" + suffix;

  WiFiManager wm;
  wm.setConfigPortalTimeout(180);  // fecha o portal após 3 min sem uso

  // ── Parâmetros do portal de configuração ─────────────────────────────────
  // Pré-preenchemos com os valores já salvos (ou defaults no primeiro boot).
  String extName = cfg.servers_external.empty() ? DEFAULT_SERVER_EXT_NAME : cfg.servers_external[0].name;
  String extUrl  = cfg.servers_external.empty() ? DEFAULT_SERVER_EXT_URL  : cfg.servers_external[0].url;
  String locName = cfg.servers_local.empty() ? "" : cfg.servers_local[0].name;
  String locUrl  = cfg.servers_local.empty() ? "" : cfg.servers_local[0].url;

  WiFiManagerParameter p_name    ("name",     "Nome do sensor",              cfg.device_name.c_str(), 32);
  WiFiManagerParameter p_ext_name("ext_name", "Servidor externo — nome",     extName.c_str(), 32);
  WiFiManagerParameter p_ext_url ("ext_url",  "Servidor externo — URL",      extUrl.c_str(),  128);
  WiFiManagerParameter p_loc_name("loc_name", "Servidor local — nome",       locName.c_str(), 32);
  WiFiManagerParameter p_loc_url ("loc_url",  "Servidor local — IP:porta",   locUrl.c_str(),  64);
  WiFiManagerParameter p_hint    ("<p style='color:#aaa;font-size:12px;margin-top:8px'>"
                                  "Servidores: deixe o nome vazio para desativar. "
                                  "Arateki padrão já está preenchido.</p>");

  wm.addParameter(&p_name);
  wm.addParameter(&p_hint);
  wm.addParameter(&p_ext_name);
  wm.addParameter(&p_ext_url);
  wm.addParameter(&p_loc_name);
  wm.addParameter(&p_loc_url);

  wm.setAPCallback([](WiFiManager*) {
    setLedState(LED_PORTAL_OPEN);
  });

  if (!wm.autoConnect(apName.c_str())) {
    delay(2000);
    ESP.restart();
  }

  // ── Persiste o que o usuário preencheu no portal ──────────────────────────
  cfg.device_name = String(p_name.getValue());
  cfg.servers_external.clear();
  cfg.servers_local.clear();

  String en = String(p_ext_name.getValue());
  String eu = String(p_ext_url.getValue());
  if (en.length() > 0 && eu.length() > 0) {
    cfg.servers_external.push_back({ en, eu });
  }

  String ln = String(p_loc_name.getValue());
  String lu = String(p_loc_url.getValue());
  if (ln.length() > 0 && lu.length() > 0) {
    cfg.servers_local.push_back({ ln, lu });
  }

  saveConfig(cfg);

  MDNS.begin(mdnsName.c_str());
  Serial.print("[wifi] Acessível em: http://");
  Serial.print(mdnsName);
  Serial.println(".local");
}

void reconnectWifi() {
  WiFi.disconnect(false);  // false = mantém as credenciais salvas
  delay(500);
  WiFi.begin();
  MDNS.begin(mdnsName.c_str());
}

String getMdnsName() { return mdnsName; }
