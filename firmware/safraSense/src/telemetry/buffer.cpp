#include "buffer.h"
#include "config.h"
#include <Preferences.h>
#include <time.h>

// TODO deep sleep: adicionar RTC_DATA_ATTR antes de "static" nas três
// variáveis abaixo para que sobrevivam ao ciclo de sleep.
static TelemetryEntry entries[TELEMETRY_BUFFER_SIZE];
static int      head          = 0;
static int      count         = 0;
static uint64_t seq           = 0;
static uint64_t reservedUntil = 0;

static void reserveSeqBlock(uint64_t startSeq) {
  reservedUntil = startSeq + TELEMETRY_SEQ_BLOCK_SIZE;

  Preferences p;
  p.begin(NVS_TELEMETRY_NS, false);
  p.putULong64("next_seq", reservedUntil);
  p.end();
}

void bufferInit() {
  memset(entries, 0, sizeof(entries));
  head  = 0;
  count = 0;

  Preferences p;
  p.begin(NVS_TELEMETRY_NS, false);
  seq = p.getULong64("next_seq", 0);
  p.end();

  reserveSeqBlock(seq);
}

static int idxOf(int logical) {
  return (head - count + logical + TELEMETRY_BUFFER_SIZE) % TELEMETRY_BUFFER_SIZE;
}

static uint64_t nowUnixMs() {
  time_t seconds = time(nullptr);
  if (seconds > 1700000000) {
    return ((uint64_t)seconds * 1000ULL) + (millis() % 1000);
  }
  return (uint64_t)millis();
}

void bufferAdd(const SensorData& d) {
  if (seq >= reservedUntil) {
    reserveSeqBlock(seq);
  }

  TelemetryEntry& e = entries[head];
  e.seq            = seq++;
  e.timestamp_ms   = nowUnixMs();
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

void bufferConfirmServer(uint64_t s, uint8_t server_bit) {
  for (int i = 0; i < count; i++) {
    TelemetryEntry* e = &entries[idxOf(i)];
    if (e->seq == s) {
      e->confirmed_mask |= (1u << server_bit);
      return;
    }
  }
}
