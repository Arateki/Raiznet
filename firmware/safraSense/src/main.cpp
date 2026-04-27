#include <Arduino.h>
#include "config.h"
#include "sensors/sensors.h"
#include "leds/leds.h"
#include "buttons/buttons.h"
#include "storage/storage.h"
#include "identity/identity.h"
#include "telemetry/buffer.h"
#include "telemetry/telemetry.h"
#include "wifi_setup/wifi_setup.h"
#include "http_local/http_local.h"
#include "device/device.h"

static DeviceConfig   cfg;
static DeviceIdentity identity;
static unsigned long  lastTelemetryMs = 0;

void setup() {
  Serial.begin(115200);

  initLeds();
  setLedState(LED_BOOTING);
  initButtons();
  initSensors();

  cfg      = loadConfig();
  identity = loadOrCreateIdentity();

  setLedState(LED_WIFI_CONNECTING);
  setupWifi(cfg);  // bloqueia até conectar ou o portal expirar

  // Tenta registrar o dispositivo logo após o Wi-Fi conectar
  syncDeviceRegistry(cfg, identity);

  initTelemetry(&cfg, &identity);
  initHttpServer(&cfg, &identity);

  setLedState(LED_NORMAL);
  Serial.println("[main] Iniciado.");
}

void loop() {
  // ── 1. Botão BOOT ─────────────────────────────────────────────────────
  ButtonEvent evt = tickButtons();

  if (evt == BTN_SHORT_PRESS) {
    // Reconecta Wi-Fi, mantém config e identidade intactos
    setLedState(LED_RESET_SHORT);
    reconnectWifi();

  } else if (evt == BTN_LONG_PRESS) {
    // Reset de configuração: apaga Wi-Fi + servidores + nome.
    // NÃO apaga o keypair — device_id permanece o mesmo na rede.
    setLedState(LED_RESET_LONG);
    delay(1000);
    eraseConfig();
    ESP.restart();
  }

  // ── 2. LEDs e requisições HTTP ────────────────────────────────────────
  tickLeds();
  handleHttpClients();

  // ── 3. Ação pendente da interface web (factory reset) ─────────────────
  if (getPendingAction() == ACTION_FACTORY_RESET) {
    setLedState(LED_RESET_LONG);
    delay(1000);
    eraseConfig();
    eraseIdentity();  // único ponto que apaga o keypair
    ESP.restart();
  }

  // ── 4. Ciclo de telemetria ────────────────────────────────────────────
  unsigned long now = millis();
  if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = now;

    SensorData reading = readSensors();
    bufferAdd(reading);
    updateLastReading(reading);

    sendPending();

    // Atualiza LEDs conforme estado atual
    TelemetryState ts     = getTelemetryState();
    bool sensorFail       = anySensorFailed(reading);
    bool serverOffline    = !ts.last_send_ok && ts.fail_streak > 0;

    if (sensorFail)         setLedState(LED_SENSOR_FAIL);
    else if (serverOffline) setLedState(LED_SERVER_OFFLINE);
    else                    setLedState(LED_NORMAL);

    if (ts.last_send_ok) blinkOnSend();
  }
}
