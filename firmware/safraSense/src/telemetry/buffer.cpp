#include "buffer.h"
#include "config.h"

// TODO deep sleep: adicionar RTC_DATA_ATTR antes de "static" nas três
// variáveis abaixo para que sobrevivam ao ciclo de sleep.
static TelemetryEntry entries[TELEMETRY_BUFFER_SIZE];
static int      head  = 0;
static int      count = 0;
static uint32_t seq   = 0;

void bufferInit() {
  memset(entries, 0, sizeof(entries));
  head  = 0;
  count = 0;
  seq   = 0;
}

static int idxOf(int logical) {
  return (head - count + logical + TELEMETRY_BUFFER_SIZE) % TELEMETRY_BUFFER_SIZE;
}

void bufferAdd(const SensorData& d) {
  TelemetryEntry& e = entries[head];
  e.seq            = seq++;
  e.timestamp_ms   = (uint64_t)millis();  // TODO: substituir por NTP unix ms
  e.temp_ambient   = d.temp_ambient;
  e.humidity       = d.humidity;
  e.ec             = d.ec;
  e.water_level    = d.water_level;
  e.bat_volts      = d.bat_volts;
  e.bat_percent    = (int8_t)d.bat_percent;
  e.confirmed_mask = 0;

  head = (head + 1) % TELEMETRY_BUFFER_SIZE;
  if (count < TELEMETRY_BUFFER_SIZE) count++;
}

// Entrada está completa quando todos os servidores atualmente configurados
// confirmaram. Usar a máscara atual (não histórica) permite add/remove dinâmico.
static bool isSent(const TelemetryEntry& e, uint32_t current_mask) {
  if (current_mask == 0) return true;  // nenhum servidor configurado
  return (e.confirmed_mask & current_mask) == current_mask;
}

int bufferPendingCount(uint32_t current_mask) {
  int n = 0;
  for (int i = 0; i < count; i++) {
    if (!isSent(entries[idxOf(i)], current_mask)) n++;
  }
  return n;
}

int bufferTotal() { return count; }

TelemetryEntry* bufferNextPending(uint32_t current_mask) {
  for (int i = 0; i < count; i++) {
    TelemetryEntry* e = &entries[idxOf(i)];
    if (!isSent(*e, current_mask)) return e;
  }
  return nullptr;
}

void bufferConfirmServer(uint32_t s, uint8_t server_bit) {
  for (int i = 0; i < count; i++) {
    TelemetryEntry* e = &entries[idxOf(i)];
    if (e->seq == s) {
      e->confirmed_mask |= (1u << server_bit);
      return;
    }
  }
}
