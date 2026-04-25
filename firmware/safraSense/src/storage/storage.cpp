#include "storage.h"
#include "config.h"
#include <Preferences.h>
#include <ArduinoJson.h>
#include <WiFi.h>

// Serializa toda a config como JSON e salva num único campo do NVS.
// Isso permite adicionar/remover campos sem migração manual.

DeviceConfig loadConfig() {
  Preferences p;
  p.begin(NVS_CONFIG_NS, true);  // true = somente leitura
  String json = p.getString("json", "");
  p.end();

  DeviceConfig cfg;

  if (json.isEmpty()) {
    // Primeiro boot: monta defaults com sufixo do MAC
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    cfg.device_name = "SafraSense-" + mac.substring(mac.length() - 4);
    cfg.servers_external.push_back({ DEFAULT_SERVER_EXT_NAME, DEFAULT_SERVER_EXT_URL });
    return cfg;
  }

  JsonDocument doc;
  if (deserializeJson(doc, json) != DeserializationError::Ok) {
    Serial.println("[storage] Config corrompida, usando defaults.");
    cfg.device_name = "SafraSense";
    return cfg;
  }

  cfg.device_name = doc["name"] | "SafraSense";

  for (JsonObject s : doc["ext"].as<JsonArray>()) {
    String name = s["name"] | "";
    String url  = s["url"]  | "";
    if (name.length() > 0 && url.length() > 0) {
      cfg.servers_external.push_back({ name, url });
    }
  }
  for (JsonObject s : doc["local"].as<JsonArray>()) {
    String name = s["name"] | "";
    String url  = s["url"]  | "";
    if (name.length() > 0 && url.length() > 0) {
      cfg.servers_local.push_back({ name, url });
    }
  }

  return cfg;
}

void saveConfig(const DeviceConfig& cfg) {
  JsonDocument doc;
  doc["name"] = cfg.device_name;

  JsonArray ext = doc["ext"].to<JsonArray>();
  for (const auto& s : cfg.servers_external) {
    JsonObject o = ext.add<JsonObject>();
    o["name"] = s.name;
    o["url"]  = s.url;
  }

  JsonArray loc = doc["local"].to<JsonArray>();
  for (const auto& s : cfg.servers_local) {
    JsonObject o = loc.add<JsonObject>();
    o["name"] = s.name;
    o["url"]  = s.url;
  }

  String json;
  serializeJson(doc, json);

  Preferences p;
  p.begin(NVS_CONFIG_NS, false);  // false = leitura/escrita
  p.putString("json", json);
  p.end();
}

void eraseConfig() {
  Preferences p;
  p.begin(NVS_CONFIG_NS, false);
  p.clear();
  p.end();
}
