#pragma once
#include <Arduino.h>
#include "sensors/sensors.h"

// Bitmask de servidores:
//   bit  0-15 → servers_external[0-15]
//   bit 16-31 → servers_local[0-15]
// "Enviado" = (confirmed_mask & current_target_mask) == current_target_mask.
// Usar a máscara atual (não a do momento da captura) permite que:
//   - remover um servidor não deixe leituras presas esperando ele
//   - adicionar um servidor não envie dados históricos para ele

// TODO deep sleep: adicionar RTC_DATA_ATTR antes das variáveis estáticas
// em buffer.cpp para que o buffer sobreviva ao ciclo de sleep.

struct TelemetryEntry {
  uint32_t seq;
  uint64_t timestamp_ms;
  float    temp_ambient;
  float    humidity;
  float    ec;
  float    water_level;
  float    bat_volts;
  int8_t   bat_percent;
  uint32_t confirmed_mask;  // bits dos servidores que já confirmaram
};

void            bufferInit();
void            bufferAdd(const SensorData& d);
int             bufferPendingCount(uint32_t current_target_mask);
int             bufferTotal();

// Próxima entrada que ainda tem servidores pendentes na máscara atual.
TelemetryEntry* bufferNextPending(uint32_t current_target_mask);

// Marca um servidor específico como confirmado para uma leitura.
void            bufferConfirmServer(uint32_t seq, uint8_t server_bit);
