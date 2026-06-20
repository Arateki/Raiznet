---
description: Glossário do protocolo Raiznet — termos como BIP-39, Crop, Disposition, Ed25519, event log, FieldPolicy, H3, raw, Safra, seq, topic e User key.
---

# Glossário

Termos usados ao longo do protocolo e da documentação da Raiznet. Entradas marcadas com *(design)* descrevem conceitos especificados mas ainda não implementados — veja o [Roadmap](/guide/roadmap).

---

**BIP-39**
Um padrão para gerar seed phrases legíveis (12 ou 24 palavras) que produzem chaves criptográficas de forma determinística. A Raiznet usa frases de 12 palavras para a identidade de Usuário e para a identidade do nó servidor.

**Crop** (Cultivo)
Um perfil de cultivo: faixas ideais de pH, EC, temperatura e umidade, mais o tempo de colheita e ajustes climáticos declarativos (`adjustments`). Armazenado no firmware e usado para avaliação local de alertas no ESP32.

**CropCatalog** *(design)*
Um catálogo somente-anexação de entradas `Crop` publicado por um nó servidor. Análogo a um Filtro, mas para conhecimento de cultivo. Qualquer servidor ou instituição pode publicar um; os usuários escolhem qual ativar.

**DeviceClaim** *(design)*
Um evento assinado por uma chave de Usuário declarando a propriedade de um dispositivo no momento do provisionamento, publicado no log de eventos público do dono.

**DeviceTransfer** *(design)*
Um evento assinado tanto pelo vendedor quanto pelo comprador, transferindo a propriedade de um dispositivo. As assinaturas duplas garantem que ambas as partes consentiram.

**Disposition** (Disposição)
A política de visibilidade de um único campo de sensor para um destino específico: `PLAIN` (em claro), `ENCRYPTED` (AES-256-GCM) ou `OMIT` (não enviado). Valores no fio: `1`, `2`, `0`.

**Ed25519**
Um algoritmo de assinatura de curva elíptica usado para toda identidade e assinatura na Raiznet. Rápido, com assinaturas pequenas (64 bytes) e chaves públicas pequenas (32 bytes).

**EncryptedBlob**
O payload criptografado de um campo de sensor: um ciphertext com a tag de autenticação AES-GCM de 16 bytes anexada, mais um nonce separado de 12 bytes. No fio JSON aparece como `{ "cipher": "<hex>", "nonce": "<hex>" }`.

**ESP-NOW** *(planejado)*
Um protocolo baseado em Wi-Fi da Espressif para comunicação direta entre dispositivos sem roteador. Planejado para a malha local de sensores entre dispositivos ESP32.

**Event log** (Log de eventos) *(design)*
A futura fonte da verdade de um nó: uma sequência somente-anexação e encadeada por hash de eventos assinados (registros de dispositivo, blocos de telemetria, eventos de curadoria). O SQLite passa a ser um índice derivado reconstruído reproduzindo o log. A replicação entre nós opera sobre esse log ([ADR-004](/adr/004-raiznet-native-replication)).

**FieldPolicy**
Um objeto de política por campo contendo um `default_disposition` e um mapa `per_destination` (chave: pubkey de servidor em hex ou topic de rede). Controla como cada campo de sensor é tratado para cada destino.

**Filter** (Filtro) *(design)*
Um log somente-anexação de eventos de curadoria de MAC (`mac_verified`, `mac_flagged`, `mac_banned`, `mac_unflagged`) publicado por um nó servidor. Aplicado em tempo de consulta para controlar quais dispositivos aparecem nas respostas da API e nas agregações — nunca afeta o que é armazenado.

**H3**
O sistema de indexação geoespacial hexagonal hierárquico da Uber. Cada célula H3 é um inteiro de 64 bits que identifica uma área hexagonal na Terra. A Raiznet armazena as localizações dos dispositivos como células H3 numa resolução escolhida pelo dono (mais grosseira = mais privada).

**identity.mnemonic**
O arquivo em `DATA_DIR/identity.mnemonic` contendo a seed phrase BIP-39 de 12 palavras do servidor. Criado no primeiro boot com permissões `0600`. Deve ter backup — é a identidade do nó.

**Lazy registration** (Registro preguiçoso)
O firmware de referência registra a si mesmo chamando `POST /v1/devices` durante o setup. Uma resposta `409 device_already_exists` conta como sucesso, então a chamada é repetível com segurança.

**local_servers**
Uma lista de endereços de servidor configurada em um dispositivo no provisionamento. Determina para onde vão os dados de dispositivos `local_only` ou `both`. Se vazia, campos com disposição privada ficam apenas na flash do ESP32 — nenhum servidor local os recebe.

**MCP (Model Context Protocol)** *(planejado)*
Um protocolo aberto para expor dados e ferramentas a LLMs de forma padronizada. O pacote planejado `@raiznet/mcp` vai expor os dados da Raiznet como ferramentas MCP.

**nanopb** *(planejado)*
Uma implementação leve em C do Protocol Buffers para sistemas embarcados. Planejada para o lado ESP32 do formato binário canônico.

**NetworkManifest** *(design)*
Um evento assinado pela chave de Usuário do fundador de uma rede, declarando o nome, o topic e o Filtro padrão da rede. O Filtro do fundador recebe prioridade de UI — essa é a única distinção que um fundador tem.

**Protobuf (Protocol Buffers)**
O formato de serialização binária do Google. Os schemas `.proto` em `packages/protocol/proto/` definem a codificação canônica planejada da Raiznet ([ADR-001](/adr/001-protobuf)); o formato de fio atual é JSON.

**publish_to**
Uma configuração do dispositivo que controla quais categorias de destino recebem seus dados: `0` local_only (apenas `local_servers`), `1` public (apenas topics de rede), ou `2` both.

**raiznet_private.db**
O banco SQLite alimentado exclusivamente pela ingestão local. Contém dados de dispositivos `local_only` e campos com disposição privada. Servido apenas pelo endpoint local. Nunca sai do nó.

**raiznet_public.db**
O banco SQLite que guarda dispositivos e leituras publicamente publicáveis. Servido pelo endpoint público; será alimentado pela replicação do log de eventos quando as redes entrarem.

**raw**
A string ASCII delimitada por pipe que um dispositivo monta e assina para cada bloco de telemetria: `pubkey|seq|timestamp|key_version|campo=valor|…`. A assinatura Ed25519 cobre os bytes do raw, não o envelope JSON. Veja [Telemetria](/protocol/telemetry#a-string-raw-assinada).

**Relay** *(design)*
Um nó alcançável que ajuda dois peers atrás de NAT a estabelecer uma conexão direta — e carrega o tráfego quando o hole punching falha (comum sob CGNAT simétrico em 4G rural). Qualquer nó da comunidade pode atuar como relay; relays nunca são um gateway privilegiado ([ADR-004](/adr/004-raiznet-native-replication)).

**Roaring Bitmap** *(planejado)*
Uma estrutura de dados de bitset comprimido destinada a representar listas de MAC em Filtros, habilitando operações de conjunto rápidas entre muitos filtros.

**Safra**
Um lote de plantio ativo: um dispositivo, um Cultivo, uma data de início, uma data de colheita opcional e uma produtividade opcional. Vincula os dados de telemetria a resultados agrícolas.

**seq**
Um número de sequência monotonicamente crescente gerado por dispositivo. Alocado em blocos amigáveis à flash (o firmware de referência reserva 100 por vez na NVS), usado para deduplicação idempotente — o servidor armazena no máximo uma leitura por `(device_pubkey, seq)` e duplicatas contam como sucesso.

**Sodium**
`sodium-universal` / libsodium — fornece as primitivas criptográficas que sustentam o `hypercore-crypto` (assinatura Ed25519, bytes aleatórios), usado pelo `@raiznet/crypto`.

**TelemetryBlock**
Um conjunto de leituras de sensor de um dispositivo em um instante no tempo, assinado pela chave Ed25519 do dispositivo. Hoje um objeto JSON; uma mensagem Protobuf no formato canônico planejado.

**topic** *(design)*
Uma string usada como chave de descoberta de uma rede pública (ex.: `raiznet:public:arateki:v1`). Qualquer servidor que conheça um topic pode entrar na rede correspondente. Topics não são secretos — privacidade de verdade vem de rodar em modo `local_only`.

**User key** (Chave de Usuário)
O par de chaves Ed25519 derivado da seed phrase BIP-39 do dono. A raiz de autoridade sobre todos os dispositivos e redes que o dono controla. Usada para assinar eventos `DeviceClaim`, `DeviceTransfer`, `NetworkManifest` e Filtros. Nunca usada para assinar telemetria.
