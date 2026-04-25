#include "telemetry.h"
#include "buffer.h"
#include "config.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

static const DeviceConfig*   gCfg     = nullptr;
static const DeviceIdentity* gId      = nullptr;
static TelemetryState        gState;
static unsigned long         lastSendMs = 0;

void initTelemetry(const DeviceConfig* cfg, const DeviceIdentity* id) {
  gCfg = cfg;
  gId  = id;
  bufferInit();
}

// Monta bitmask dos servidores atualmente configurados.
// external[i] → bit i | local[i] → bit 16+i
static uint32_t targetMask() {
  if (!gCfg) return 0;
  uint32_t mask = 0;
  for (size_t i = 0; i < gCfg->servers_external.size() && i < 16; i++) {
    if (!gCfg->servers_external[i].url.isEmpty()) mask |= (1u << i);
  }
  for (size_t i = 0; i < gCfg->servers_local.size() && i < 16; i++) {
    if (!gCfg->servers_local[i].url.isEmpty()) mask |= (1u << (16 + i));
  }
  return mask;
}

static String toHex(const String& raw) {
  static const char* hex = "0123456789abcdef";
  String out;
  out.reserve(raw.length() * 2);
  for (size_t i = 0; i < raw.length(); i++) {
    uint8_t b = (uint8_t)raw[i];
    out += hex[b >> 4];
    out += hex[b & 0x0f];
  }
  return out;
}

static String fieldValue(float value, uint8_t decimals) {
  return String(roundf(value * powf(10, decimals)) / powf(10, decimals), decimals);
}

static String buildRaw(const TelemetryEntry& e) {
  // Phase 1 canonical payload: deterministic ASCII signed by the device.
  // The server currently verifies the signature over `raw` but does not decode it.
  String raw;
  raw.reserve(180);
  raw += gId->public_key_hex;
  raw += '|';
  raw += String(e.seq);
  raw += '|';
  raw += String(e.timestamp_ms);
  raw += "|0";
  if (!isnan(e.ec)) {
    raw += "|ec=";
    raw += fieldValue(e.ec, 0);
  }
  if (e.water_level >= 0) {
    raw += "|waterLevel=";
    raw += fieldValue(e.water_level, 0);
  }
  if (!isnan(e.temp_ambient)) {
    raw += "|tempAmbient=";
    raw += fieldValue(e.temp_ambient, 2);
  }
  if (!isnan(e.humidity)) {
    raw += "|humidity=";
    raw += fieldValue(e.humidity, 2);
  }
  return raw;
}

static String buildJson(const TelemetryEntry& e, const String& raw, const String& sig) {
  JsonDocument doc;
  JsonArray blocks = doc["blocks"].to<JsonArray>();
  JsonObject block = blocks.add<JsonObject>();

  block["deviceId"]   = gId->public_key_hex;
  block["seq"]        = String(e.seq);
  block["timestamp"]  = String(e.timestamp_ms);
  block["keyVersion"] = 0;

  if (!isnan(e.ec)) {
    JsonObject ec = block["ec"].to<JsonObject>();
    ec["plain"] = roundf(e.ec);
  }
  if (e.water_level >= 0) {
    JsonObject waterLevel = block["waterLevel"].to<JsonObject>();
    waterLevel["plain"] = e.water_level;
  }
  if (!isnan(e.temp_ambient)) {
    JsonObject tempAmbient = block["tempAmbient"].to<JsonObject>();
    tempAmbient["plain"] = roundf(e.temp_ambient * 100) / 100.0f;
  }
  if (!isnan(e.humidity)) {
    JsonObject humidity = block["humidity"].to<JsonObject>();
    humidity["plain"] = roundf(e.humidity * 100) / 100.0f;
  }

  block["signature"] = sig;
  block["raw"]       = toHex(raw);

  String out;
  serializeJson(doc, out);
  return out;
}

static bool postToUrl(const String& url, const String& body) {
  if (url.isEmpty()) return false;
  HTTPClient http;
  http.setTimeout(8000);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();
  if (code >= 200 && code < 300) return true;
  Serial.printf("[telemetry] POST %s → HTTP %d\n", url.c_str(), code);
  return false;
}

void sendPending() {
  if (!gCfg || !gId) return;
  if (WiFi.status() != WL_CONNECTED) return;

  uint32_t mask = targetMask();

  TelemetryEntry* e = bufferNextPending(mask);
  while (e != nullptr) {
    String raw  = buildRaw(*e);
    String sig  = signMessage(*gId, raw);
    String body = buildJson(*e, raw, sig);

    // Tenta cada servidor externo que ainda não confirmou esta leitura
    for (size_t i = 0; i < gCfg->servers_external.size() && i < 16; i++) {
      uint8_t bit = (uint8_t)i;
      if (e->confirmed_mask & (1u << bit)) continue;  // já confirmou
      if (!(mask & (1u << bit)))           continue;  // não está na máscara atual
      if (postToUrl(gCfg->servers_external[i].url, body)) {
        bufferConfirmServer(e->seq, bit);
        Serial.printf("[telemetry] seq=%u confirmado por ext[%zu] (%s)\n",
                      e->seq, i, gCfg->servers_external[i].name.c_str());
      }
    }

    // Tenta cada servidor local que ainda não confirmou esta leitura
    for (size_t i = 0; i < gCfg->servers_local.size() && i < 16; i++) {
      uint8_t bit = (uint8_t)(16 + i);
      if (e->confirmed_mask & (1u << bit)) continue;
      if (!(mask & (1u << bit)))           continue;
      String url = "http://" + gCfg->servers_local[i].url + "/v1/telemetry";
      if (postToUrl(url, body)) {
        bufferConfirmServer(e->seq, bit);
        Serial.printf("[telemetry] seq=%u confirmado por local[%zu] (%s)\n",
                      e->seq, i, gCfg->servers_local[i].name.c_str());
      }
    }

    // Verifica se todos os servidores atuais confirmaram esta leitura
    bool allDone = (e->confirmed_mask & mask) == mask;
    if (allDone) {
      gState.last_send_ok = true;
      gState.fail_streak  = 0;
      lastSendMs          = millis();
    } else {
      // Ao menos um servidor falhou — para e tenta no próximo ciclo
      gState.last_send_ok = false;
      gState.fail_streak++;
      break;
    }

    e = bufferNextPending(mask);
  }

  // Tempo relativo do último envio completo
  if (lastSendMs > 0) {
    unsigned long elapsed = (millis() - lastSendMs) / 1000;
    gState.last_send_time = elapsed < 60
      ? String(elapsed) + "s atrás"
      : String(elapsed / 60) + "min atrás";
  }
}

TelemetryState getTelemetryState() { return gState; }

int pendingCount() { return bufferPendingCount(targetMask()); }
