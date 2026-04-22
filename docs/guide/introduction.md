# Introduction

Raiznet is a decentralized network for crop monitoring and collective agricultural intelligence. It is part of Arateki's **SafraSense** product. Data flows from ESP32 sensors installed in growing towers, through a mesh of Node.js servers that sync via the Hypercore protocol, and can be read by any member of the network — with or without their own node.

Beyond monitoring, Raiznet is designed as a research-grade data infrastructure. Every reading is signed, tamper-evident, geolocated, and linked to a planting outcome. Over time, this creates a collective dataset that LLMs and researchers can turn into actionable knowledge: better crop parameters, regional calibrations, and scientific publications — owned by no one, available to everyone. See [Collective Intelligence](/guide/intelligence) for the full vision.

## Non-negotiable principles

1. **Local-first.** The network works without internet. An ESP32 and a laptop on the same Wi-Fi are already a valid Raiznet.
2. **Data sovereignty.** The user owns the keys. If Arateki disappears tomorrow, the grower's data stays alive in their node.
3. **No traditional login.** Identity is an Ed25519 keypair generated on the client. There is no central authentication server.
4. **Device ID is always public.** The only information guaranteed public is the existence of a device in the network — its pubkey, MAC, and basic metadata. Everything else has an individual visibility policy defined by the owner.
5. **Private data is local data.** What is marked as public goes to the replicated Hypercore. What is marked as private stays in local storage — never enters the swarm.
6. **Public or local network.** The public Raiznet is the global mesh discovered via Hyperswarm. A "private network" is a local network: the server doesn't announce on the swarm, it only accepts LAN connections.
7. **Writes are always signed.** Reading is a consequence of belonging to the network. Writing requires the private key of the emitting device — prevents spam without depending on central permission.
8. **Server is optional.** Nobody is required to run a node. But whoever does strengthens the network.

## What Raiznet is not

- A cloud service. There is no Raiznet-operated server you must trust.
- A blockchain. There is no global consensus, no mining, no tokens.
- A traditional IoT platform. There is no vendor lock-in, no required API key, no usage limits.

## Part of SafraSense

Raiznet is the **open protocol and network layer** of SafraSense. The production firmware for Arateki hardware lives in a separate repository. This repository contains:

- The protocol specification (Protobuf schemas, wire format)
- The Node.js server implementation
- A reference ESP32 firmware sample (`firmware/esp32-sample/`)
- The CLI for operations and debugging
