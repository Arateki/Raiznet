#pragma once
#include <Arduino.h>
#include "storage/storage.h"
#include "identity/identity.h"

struct TelemetryState {
  bool   last_send_ok   = false;
  String last_send_time = "--";
  int    fail_streak    = 0;
};

void           initTelemetry(const DeviceConfig* cfg, const DeviceIdentity* id);
void           sendPending();
TelemetryState getTelemetryState();

// Leituras que ainda faltam ao menos um servidor confirmar.
// Usado pelo dashboard sem precisar expor a lógica de bitmask.
int            pendingCount();
