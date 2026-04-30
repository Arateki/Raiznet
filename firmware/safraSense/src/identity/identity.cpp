#include "identity.h"
#include "config.h"
#include <Preferences.h>
#include <WiFi.h>
#include <Ed25519.h>
#include <SHA256.h>
#include <esp_random.h>

static String bytesToHex(const uint8_t* data, size_t len) {
  String out;
  out.reserve(len * 2);
  for (size_t i = 0; i < len; i++) {
    if (data[i] < 0x10) out += '0';
    out += String(data[i], HEX);
  }
  return out;
}

void saveIdentity(const DeviceIdentity& id) {
  Preferences p;
  p.begin(NVS_IDENTITY_NS, false);
  p.putBytes("privkey", id.private_key, 32);
  p.putBytes("own_priv", id.owner_private_key, 32);
  p.putString("mnemonic", id.mnemonic);
  p.putInt("lang", (int)id.lang);
  p.end();
}

DeviceIdentity loadOrCreateIdentity() {
  DeviceIdentity id;
  id.mac = WiFi.macAddress();
  Preferences p;
  p.begin(NVS_IDENTITY_NS, false);
  
  if (p.getBytes("privkey", id.private_key, 32) != 32) {
    esp_fill_random(id.private_key, 32);
    p.putBytes("privkey", id.private_key, 32);
  }
  Ed25519::derivePublicKey(id.public_key, id.private_key);
  id.public_key_hex = bytesToHex(id.public_key, 32);

  id.mnemonic = p.getString("mnemonic", "");
  id.lang = (Language)p.getInt("lang", (int)LANG_PT);
  if (id.mnemonic.length() > 0) {
    p.getBytes("own_priv", id.owner_private_key, 32);
    Ed25519::derivePublicKey(id.owner_public_key, id.owner_private_key);
    id.owner_public_key_hex = bytesToHex(id.owner_public_key, 32);
  }
  p.end();
  return id;
}

static String generateMnemonicFromEntropy(const uint8_t* entropy, Language lang) {
  uint8_t hash[32];
  SHA256 sha;
  sha.update(entropy, 16);
  sha.finalize(hash, 32);

  uint16_t indices[12];
  uint32_t buffer = 0;
  int bitCount = 0;
  int wordIdx = 0;

  for (int i = 0; i < 17; i++) {
    uint8_t byte = (i < 16) ? entropy[i] : (hash[0] & 0xF0);
    int bitsToCopy = (i < 16) ? 8 : 4;
    buffer = (buffer << bitsToCopy) | (byte >> (8 - bitsToCopy));
    bitCount += bitsToCopy;
    while (bitCount >= 11) {
      indices[wordIdx++] = (buffer >> (bitCount - 11)) & 0x7FF;
      bitCount -= 11;
    }
  }

  const char** list = (lang == LANG_PT) ? (const char**)BIP39_WORDLIST_PT : 
                      (lang == LANG_ES) ? (const char**)BIP39_WORDLIST_ES : 
                      (lang == LANG_JA) ? (const char**)BIP39_WORDLIST_JA :
                      (lang == LANG_ZH) ? (const char**)BIP39_WORDLIST_ZH :
                      (const char**)BIP39_WORDLIST_EN;
  String res = "";
  for (int i = 0; i < 12; i++) {
    res += list[indices[i]];
    if (i < 11) res += " ";
  }
  return res;
}

void generateOwnerIdentity(DeviceIdentity& id, Language lang) {
  id.lang = lang;
  uint8_t entropy[16];
  esp_fill_random(entropy, 16);
  id.mnemonic = generateMnemonicFromEntropy(entropy, lang);
  
  SHA256 sha;
  sha.update((uint8_t*)id.mnemonic.c_str(), id.mnemonic.length());
  sha.finalize(id.owner_private_key, 32);
  Ed25519::derivePublicKey(id.owner_public_key, id.owner_private_key);
  id.owner_public_key_hex = bytesToHex(id.owner_public_key, 32);
}

bool importOwnerIdentity(DeviceIdentity& id, String mnemonic) {
  mnemonic.trim();
  id.mnemonic = mnemonic;
  SHA256 sha;
  sha.update((uint8_t*)mnemonic.c_str(), mnemonic.length());
  sha.finalize(id.owner_private_key, 32);
  Ed25519::derivePublicKey(id.owner_public_key, id.owner_private_key);
  id.owner_public_key_hex = bytesToHex(id.owner_public_key, 32);
  return true;
}

String signMessage(const DeviceIdentity& id, const String& msg) {
  uint8_t sig[64];
  Ed25519::sign(sig, id.private_key, id.public_key, (const uint8_t*)msg.c_str(), msg.length());
  return bytesToHex(sig, 64);
}

void eraseIdentity() {
  Preferences p;
  p.begin(NVS_IDENTITY_NS, false);
  p.clear();
  p.end();
}
