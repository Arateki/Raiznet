#include "identity.h"
#include "config.h"
#include <Preferences.h>
#include <WiFi.h>
#include <Ed25519.h>
#include <esp_random.h>

// Converte array de bytes em string hexadecimal.
// Ex: {0xAB, 0x0F} → "ab0f"
static String bytesToHex(const uint8_t* data, size_t len) {
  String out;
  out.reserve(len * 2);
  for (size_t i = 0; i < len; i++) {
    if (data[i] < 0x10) out += '0';
    out += String(data[i], HEX);
  }
  return out;
}

DeviceIdentity loadOrCreateIdentity() {
  DeviceIdentity id;
  id.mac = WiFi.macAddress();

  Preferences p;
  p.begin(NVS_IDENTITY_NS, false);
  size_t stored = p.getBytes("privkey", id.private_key, 32);

  if (stored != 32) {
    // Primeiro boot ou após reset de fábrica:
    // gera 32 bytes aleatórios com o hardware RNG do ESP32.
    // Esse RNG usa ruído térmico e é adequado para chaves criptográficas.
    esp_fill_random(id.private_key, 32);
    p.putBytes("privkey", id.private_key, 32);
    Serial.println("[identity] Novo keypair Ed25519 gerado e salvo.");

    // TODO provisioning: ao registrar na rede, o app deve coletar
    // um DeviceClaim assinado TANTO pela chave do usuário QUANTO por
    // esta chave do dispositivo (signature_device), para provar
    // acesso físico e prevenir spoofing de MAC.
  }

  p.end();

  // A chave pública é derivada deterministicamente da privada.
  // Não precisa ser armazenada — sempre recalculada no boot.
  Ed25519::derivePublicKey(id.public_key, id.private_key);
  id.public_key_hex = bytesToHex(id.public_key, 32);

  Serial.print("[identity] Device ID: ");
  Serial.println(id.public_key_hex);

  return id;
}

String signMessage(const DeviceIdentity& id, const String& msg) {
  uint8_t sig[64];
  Ed25519::sign(
    sig,
    id.private_key,
    id.public_key,
    (const uint8_t*)msg.c_str(),
    msg.length()
  );
  return bytesToHex(sig, 64);
}

void eraseIdentity() {
  Preferences p;
  p.begin(NVS_IDENTITY_NS, false);
  p.clear();
  p.end();
  Serial.println("[identity] Keypair apagado. Novo ID gerado no próximo boot.");
}
