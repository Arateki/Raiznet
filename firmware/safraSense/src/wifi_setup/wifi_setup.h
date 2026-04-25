#pragma once
#include <Arduino.h>
#include "storage/storage.h"

// Conecta via WiFiManager. Abre portal de configuração se necessário.
// Atualiza cfg com os valores que o usuário preencheu no portal.
void setupWifi(DeviceConfig& cfg);

// Reconecta sem abrir portal. Usa credenciais já salvas.
void reconnectWifi();

String getMdnsName();
