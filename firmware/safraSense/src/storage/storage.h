#pragma once
#include <Arduino.h>
#include <vector>

// Par nome + URL. Nome vazio = entrada ignorada.
struct ServerEntry {
  String name;
  String url;
};

struct DeviceConfig {
  String device_name;
  std::vector<ServerEntry> servers_external;  // servidores na internet
  std::vector<ServerEntry> servers_local;     // servidores na rede LAN
};

DeviceConfig loadConfig();
void         saveConfig(const DeviceConfig& cfg);
void         eraseConfig();
