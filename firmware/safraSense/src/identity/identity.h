#pragma once
#include <Arduino.h>

struct DeviceIdentity {
  uint8_t public_key[32];
  uint8_t private_key[32];
  String  public_key_hex;  // device_id na rede Raiznet (64 chars hex)
  String  mac;             // MAC formatado (AA:BB:CC:DD:EE:FF)
};

// Carrega do NVS. Se não existir, gera novo keypair Ed25519
// com o hardware RNG do ESP32 e persiste.
DeviceIdentity loadOrCreateIdentity();

// Assina msg com a chave privada. Retorna assinatura em hex (128 chars).
String signMessage(const DeviceIdentity& id, const String& msg);

// ATENÇÃO: apaga o keypair permanentemente.
// Chamar apenas via confirmação explícita na interface web.
void eraseIdentity();
