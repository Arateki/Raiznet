#pragma once
#include <Arduino.h>

// Qual sensor está funcionando. Cada campo é independente —
// o sistema opera normalmente com qualquer combinação de falhas.
struct SensorStatus {
  bool dht_ok     = false;  // temperatura + umidade do ar
  bool tds_ok     = false;  // condutividade elétrica (nutrientes)
  bool laser_ok   = false;  // distância / nível de água
  bool battery_ok = true;   // leitura de bateria raramente falha
};

struct SensorData {
  float temp_ambient = NAN;  // °C  — NAN quando DHT falhou
  float humidity     = NAN;  // %   — NAN quando DHT falhou
  float ec           = NAN;  // ppm — NAN quando TDS falhou
  float water_level  = -1;   // mm  — -1 quando laser offline/fora de alcance
  float bat_volts    = 0;
  int   bat_percent  = 0;
  SensorStatus status;
  unsigned long captured_at = 0;  // millis() no momento da leitura
};

void       initSensors();
SensorData readSensors();
bool       anySensorFailed(const SensorData& d);
