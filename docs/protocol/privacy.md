# Privacy Model

Raiznet's privacy model operates at the field level. Each sensor reading (pH, EC, temperature, etc.) has an independent visibility policy that determines what travels where.

## Disposition

A `Disposition` defines how a field is handled for a given destination:

| Value | Meaning |
|---|---|
| `OMIT` | Field is not sent to this destination. Not stored. |
| `PLAIN` | Field travels in clear. Visible to all peers with access to that destination. |
| `ENCRYPTED` | Field is encrypted with the device's AES-256-GCM symmetric key before transmission. The blob travels normally, but only the key holder can read it. |

`ENCRYPTED` values never enter network aggregations or maps — aggregators ignore opaque blobs.

## FieldPolicy

Each sensor field has a `FieldPolicy`:

```protobuf
message FieldPolicy {
  Disposition default_disposition = 1;
  map<string, Disposition> per_destination = 2;
}
```

`default_disposition` applies to any destination not explicitly listed. `per_destination` maps a destination key to an override:

- **Server pubkey (hex)**: applies to that specific server.
- **Network topic** (e.g. `raiznet:public:arateki:v1`): applies to all peers in that network.

The UI presents three levels of granularity, all backed by the same map:

| UI level | Configuration |
|---|---|
| Same for all | `default_disposition` set, map empty |
| Public vs local | Two map entries grouping by class |
| Per destination (advanced) | One entry per server pubkey or topic |

## publish_to

The device's `publish_to` setting controls which categories of destinations are active:

| Value | Active destinations |
|---|---|
| `LOCAL_ONLY` | Only `local_servers` entries |
| `PUBLIC` | Only public network topics |
| `BOTH` | All destinations — each with its own FieldPolicy |

## local_servers as the differentiator

The `local_servers` list on the device determines whether "local" data reaches a server at all:

- **`local_servers` empty** → private fields stay in the ESP32 flash. The owner accesses them directly via local HTTP, BLE, or serial when nearby.
- **`local_servers` populated** → private fields are sent to those specific servers and stored in `raiznet_private.db`. Each server is independent and does not replicate private data with other servers.

Users who don't run a node never need to configure `local_servers`. The app communicates this clearly: local data stays on the device until the app connects directly.

## Security by isolation

The two databases on the server enforce isolation at the connection level, not the query level:

- `raiznet_public.db` — fed by Hypercore replication. The public endpoint's Fastify instance has access only to this database. A poorly written query cannot leak private data because the connection object is simply not available.
- `raiznet_private.db` — fed by local ingest only. Only the local endpoint (authenticated, `127.0.0.1`) has access. Never enters Hyperswarm.

## What is always public

When a device has `publish_to: PUBLIC | BOTH`, the following metadata is always public regardless of FieldPolicy:

- `id` (device pubkey)
- `mac`
- `owner_pubkey`
- `type` (sensor_mains / sensor_battery / gateway)
- `location` (H3 cell at owner-chosen resolution)
- `hardware` (model, firmware version)

This metadata is necessary for the network to know the device exists and for aggregations to function.

## Changing the policy

Changing `FieldPolicy` affects only future readings. Data already published (plain or encrypted) remains replicated across peers — there is no mechanism to "unpublish" what peers have already downloaded. This is a consequence of the append-only Hypercore design.

## Encrypted fields and the owner's app

The `ENCRYPTED` disposition solves a specific use case: the owner wants to follow their own sensor data from outside the LAN (no tunnel needed) without exposing the values to the public network.

Flow:
1. Device encrypts the field with its symmetric key before sending to the public Hypercore.
2. Any peer receives and stores the encrypted blob — they cannot read it.
3. The owner's app, which holds the symmetric key, decrypts the blob locally.

This means the owner can use any public gateway or peer node to retrieve their data without trusting it with the plaintext values.
