#pragma once

// ── Pinos de energia (acionados antes de ler, desligados depois) ──────────
#define PIN_POWER_TDS   25
#define PIN_POWER_DHT   26

// ── Pinos de sinal dos sensores ───────────────────────────────────────────
#define PIN_DHT         4
#define PIN_TDS         34
#define PIN_BATTERY     35

// ── I2C — sensor laser VL53L0X ───────────────────────────────────────────
#define PIN_SDA         21
#define PIN_SCL         22
#define VL53_I2C_ADDR   0x29

// ── Pinos dos LEDs ────────────────────────────────────────────────────────
#define PIN_LED_RED     14
#define PIN_LED_YELLOW  12
#define PIN_LED_GREEN   13

// ── Botão BOOT (GPIO0) — disponível em todos os DevKit v1 ─────────────────
#define PIN_BOOT_BUTTON 0
#define BTN_SHORT_MS    2000    // segurar 2s → reconecta Wi-Fi
#define BTN_LONG_MS     5000    // segurar 5s → reset completo

// ── Operação ──────────────────────────────────────────────────────────────
#define TELEMETRY_INTERVAL_MS   30000   // 30s (modo debug/teste)
#define TELEMETRY_BUFFER_SIZE   50      // máx de leituras em RAM

// ── Servidor externo padrão ───────────────────────────────────────────────
// Estes valores são usados apenas como default na primeira configuração.
// "Arateki" é referenciado só aqui; o resto do código usa as variáveis.
#define DEFAULT_SERVER_EXT_NAME  "Arateki"
#define DEFAULT_SERVER_EXT_URL   "https://raiznet.com/v1/telemetry"

// ── Namespaces do NVS (armazenamento persistente em flash) ─────────────────
#define NVS_CONFIG_NS   "cfg"
#define NVS_IDENTITY_NS "ident"
