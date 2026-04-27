#pragma once
#include <Arduino.h>
#include "config.h"
#include "storage/storage.h"
#include "../identity/identity.h"

struct DeviceStatus {
  bool registered_ext;
  bool registered_local;
  String firmware_version;
  String model;
};

// Tenta registrar o dispositivo nos servidores configurados
// Retorna true se conseguiu registrar em todos os servidores ativos
bool syncDeviceRegistry(const DeviceConfig& cfg, const DeviceIdentity& id);

// Força o reset do status de registro (para forçar um novo sync)
void invalidateDeviceRegistry();

DeviceStatus getDeviceStatus();
