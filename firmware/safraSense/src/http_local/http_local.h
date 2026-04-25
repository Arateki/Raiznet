#pragma once
#include <Arduino.h>
#include "storage/storage.h"
#include "identity/identity.h"
#include "sensors/sensors.h"

// Ação solicitada pela interface web para main.cpp executar no loop.
enum PendingAction {
  ACTION_NONE,
  ACTION_FACTORY_RESET,  // apaga config + identidade e reinicia
};

// Inicia o servidor HTTP na porta 80.
void initHttpServer(DeviceConfig* cfg, const DeviceIdentity* id);

// Chama a cada iteração do loop() para atender requisições.
void handleHttpClients();

// Atualiza a última leitura exibida no dashboard.
void updateLastReading(const SensorData& d);

// Retorna ação pendente e limpa ela (chamado uma vez em main.cpp).
PendingAction getPendingAction();
