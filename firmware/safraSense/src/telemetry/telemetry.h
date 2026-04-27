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

// Readings that still need confirmation from at least one server.
// Used by the dashboard without exposing bitmask logic.
int            pendingCount();
