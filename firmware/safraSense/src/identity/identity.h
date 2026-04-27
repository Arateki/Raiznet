#pragma once
#include <Arduino.h>
#include "i18n/i18n.h"

struct DeviceIdentity {
  uint8_t public_key[32];
  uint8_t private_key[32];
  String  public_key_hex;

  // Identidade do Proprietário (BIP-39)
  uint8_t owner_public_key[32];
  uint8_t owner_private_key[32];
  String  owner_public_key_hex;
  String  mnemonic; 
  Language lang;

  String  mac;
};

// Ajustando a declaração extern
extern const char* BIP39_WORDLIST_EN[2048];
extern const char* BIP39_WORDLIST_PT[2048];
extern const char* BIP39_WORDLIST_ES[2048];

DeviceIdentity loadOrCreateIdentity();
void generateOwnerIdentity(DeviceIdentity& id, Language lang);
bool importOwnerIdentity(DeviceIdentity& id, String mnemonic);
String signMessage(const DeviceIdentity& id, const String& msg);
void eraseIdentity();
void saveIdentity(const DeviceIdentity& id);
