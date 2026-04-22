# Networks

A Raiznet network is identified by a **topic** — a human-readable string used as the Hyperswarm discovery key. Anyone can create a network by choosing a new topic. Anyone can join an existing network by connecting to its topic.

## Topics

A topic string has no enforced format, but the convention is:

```
raiznet:public:<org>:<version>
```

Examples:
- `raiznet:public:arateki:v1` — the official Arateki network
- `raiznet:public:coop-verdao:v1` — a cooperative's network
- `raiznet:public:embrapa-nordeste:v1` — a research institution's network

Topics are **not secret**. Knowing a topic is sufficient to join the network. Real privacy means running in `local_only` mode, not relying on topic obscurity.

## NetworkManifest

Whoever creates a network is the founder. They publish a `NetworkManifest` event in their public Hypercore, signed with their User key:

```
name: string
topic: string
description: string?
default_filter_pubkey: bytes(32)?
created_at: uint64
signature: bytes(64)
```

The manifest can be updated over time (new append-only events overwrite the projected state). If users disagree with the manifest or want different rules, they create their own network with a different topic — a light fork that requires no permission.

The founder has no technical privilege beyond authoring the manifest. Their `default_filter_pubkey` is activated by default on new servers joining the network and appears first in filter lists — UI priority only.

## Replication

**Replication is always total.** Every server replicates all device cores it discovers in a network. Filters never affect what is stored — they are a query-time lens that controls what appears in API responses, maps, and aggregations. This keeps the network robust: data is distributed broadly and there is no fragmentation where only certain nodes hold certain data.

## Server modes

| Mode | Hyperswarm | Visible externally |
|---|---|---|
| `public` | Announces on all configured topics | Yes |
| `local_only` | Does not connect to Hyperswarm at all | No |
| `hybrid` | Announces on topics; each device controls `publish_to` individually | Partially |

A `local_only` server is invisible to the global mesh. It serves only devices on the local Wi-Fi network and the owner's app.

## Filters

Filters are composable MAC curation lists published by server nodes. Each filter is a Hypercore of append-only curation events:

```
type: mac_verified | mac_flagged | mac_banned | mac_unflagged
mac: bytes(6)
reason: string?
created_at: uint64
signature: bytes(64)  // signed by filter author's User key
```

The current state of a filter is the projection of all events up to the present. Addition and removal are always append-only — there is no destructive editing.

Clients combine multiple filters using set operations backed by **Roaring Bitmaps**:

| Combination | Effect |
|---|---|
| Union | MACs verified by any selected filter are accepted — maximum coverage |
| Intersection | MACs must appear in all filters — maximum rigor |
| Difference | Exclude MACs flagged in negative filters |

Arateki's filter serves as the default for `raiznet:public:arateki:v1` because Arateki is the network's founder. Any other network founder has the same relationship with their own filter. No one has a monopoly — any server can publish a filter and any client can choose which to trust.

## Joining a network

1. Server connects to the topic via Hyperswarm DHT.
2. Peers exchange lists of known devices (pubkeys, MACs, H3 cells).
3. Peers also exchange available filters and catalogs.
4. Server activates the `default_filter_pubkey` from the `NetworkManifest` (if set).
5. Server replicates all device cores it sees in the network.
6. Filters are applied at query time — they determine what the API returns, not what is stored.

## Multiple networks

A single server can participate in multiple networks simultaneously. For each topic it joins, it discovers a separate set of peers and replicates cores of devices listing that topic in `Device.networks`.

A device can publish to multiple networks by listing multiple topics in its `networks` field.

## Creating a network for a cooperative

1. Choose a unique topic: `raiznet:public:minha-coop:v1`.
2. Publish a `NetworkManifest` with a human-readable name and description.
3. Optionally create a filter listing the cooperative's verified device MACs.
4. Set `default_filter_pubkey` in the manifest to that filter.
5. Share the topic string with members — they configure their servers to connect to it.

Members see only what passes through their active filter by default. Anyone can technically connect to the topic, but unfiltered devices will not appear in aggregations or maps for members using the default filter.
