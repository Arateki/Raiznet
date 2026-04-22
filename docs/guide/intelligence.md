# Collective Intelligence

One of Raiznet's core purposes is transforming raw sensor data into actionable agricultural knowledge — not just for the individual grower, but for the entire network.

Every device that publishes to a public network contributes to a growing shared dataset: what was planted, where, under what conditions, and what the outcome was. Over time, this dataset becomes a collective memory of what works in each region, for each crop, under each climate pattern.

## The intelligence layer (planned)

The intelligence layer is a future phase built on top of the existing data infrastructure. It does not require changes to the protocol or the storage model — the data is already there.

### Local inference (privacy-preserving)

A grower running their own node can point any MCP-compatible LLM — including local models via [Ollama](https://ollama.com) — directly at their server's local endpoint. The model has access to:

- Full telemetry history (including private fields, decrypted locally)
- Active Safra: crop type, planted date, expected harvest
- Crop with adjusted ideal ranges
- Historical outcomes (`yield_kg`, `harvested_at`)

Example queries the LLM can answer from local data alone:
- "How is my lettuce doing compared to last month?"
- "My pH has been drifting upward for 3 days — what should I adjust?"
- "Based on my last 4 harvests, what is my average yield for this variety?"
- "Given current ambient temperature, should I adjust my EC target?"

No data leaves the local network. Inference is fully offline.

### Regional intelligence (public network)

Nodes participating in a public network can query aggregated data across all devices in the same H3 region and crop type. This enables:

- **Contextual benchmarking**: "Your EC is 2.4 — the median for lettuce in your region is 1.8."
- **Anomaly detection**: flagging readings that deviate significantly from the regional pattern, distinguishing sensor drift from real crop stress.
- **Harvest prediction refinement**: learning from the gap between estimated and actual `harvest_time_days` across many Safras in similar conditions, improving future estimates automatically.

### Collective Crop calibration

If growers in a region consistently operate outside a Crop's ideal ranges and still achieve good `yield_kg`, the ranges in that Crop are probably wrong for that region. This signal feeds naturally into the `CropCatalog` model: regional curators (cooperatives, research institutions) publish updated catalogs with calibrated ranges derived from observed outcomes.

The network generates the knowledge. The curators publish it. Growers activate the catalog. No central authority decides.

### MCP server

A planned `@raiznet/mcp` package will expose the Raiznet API as an MCP (Model Context Protocol) server, making Raiznet data natively consumable by any MCP-compatible LLM client:

| Tool | Description |
|---|---|
| `get_devices` | List devices known to this node |
| `get_telemetry` | Fetch recent readings for a device |
| `get_safra` | Get active planting lot and crop details |
| `get_regional_stats` | Aggregated stats for an H3 cell and crop type |
| `get_crop` | Ideal ranges for a Crop, adjusted for current conditions |

The MCP server can run in two modes:
- **Local mode** (over the local endpoint): full access including private fields, for the owner's personal LLM assistant.
- **Public mode** (over the public endpoint): read-only access to public data, for any network participant or researcher.

## Academic research and knowledge publishing

Raiznet is designed to be a research-grade data infrastructure. The combination of signed, tamper-evident data (Hypercore), precise geolocation (H3), structured crop outcomes (Safra), and an open protocol creates a dataset with properties that matter for scientific work: provenance, reproducibility, and accessibility without vendor lock-in.

Planned future work includes:

- **Research partnerships**: making anonymized, aggregated Raiznet datasets available to universities, agricultural research institutions (such as Embrapa), and cooperatives for publication in peer-reviewed journals and technical reports.
- **Content publishing on the network**: the `Material` data model (stored in Hyperdrive) is designed for distributing instructional and scientific content — cultivation guides, field study results, regional best practices — directly through the network, authored and signed by researchers, accessible offline.
- **Open dataset releases**: periodic snapshots of public network data made available under open licenses for the broader research community, enabling work on topics such as regional climate adaptation, hydroponic optimization, and small-scale food system resilience.

The goal is a feedback loop: growers generate data, researchers analyze it, findings return to the network as improved Crops and Materials, growers benefit. No intermediary captures the value.

## Why this matters

Agricultural knowledge has historically been locked in proprietary platforms, academic papers inaccessible to small growers, or the minds of individual agronomists. Raiznet's structure — open protocol, local-first, data sovereign, H3-indexed, outcome-tracked — creates the conditions for that knowledge to emerge from the network itself, owned by no one, available to everyone.

Running a node is not just contributing to the network's resilience. It is contributing to a growing collective understanding of how to grow food better.
