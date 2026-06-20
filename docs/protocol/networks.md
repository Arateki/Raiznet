---
description: A camada federada de redes da Raiznet (em design) — topics, NetworkManifest, replicação total, modos de servidor e filtros de MAC componíveis.
---

# Redes

::: warning Especificação de design
Esta página especifica a camada federada de rede — topics, manifestos, filtros e replicação total. Ela **ainda não está implementada**: hoje os nós são independentes e a replicação está em design ([ADR-004](/adr/004-raiznet-native-replication)). Veja o [Roadmap](/guide/roadmap).
:::

Uma rede Raiznet é identificada por um **topic** — uma string legível por humanos usada como chave de descoberta de peers. Qualquer um pode criar uma rede escolhendo um topic novo. Qualquer um pode entrar em uma rede existente conectando-se ao seu topic.

## Topics

Uma string de topic não tem formato imposto, mas a convenção é:

```
raiznet:public:<org>:<versão>
```

Exemplos:
- `raiznet:public:arateki:v1` — a rede oficial da Arateki
- `raiznet:public:coop-verdao:v1` — a rede de uma cooperativa
- `raiznet:public:embrapa-nordeste:v1` — a rede de uma instituição de pesquisa

Topics **não são secretos**. Conhecer um topic é suficiente para entrar na rede. Privacidade de verdade significa rodar em modo `local_only`, não depender da obscuridade do topic.

## NetworkManifest

Quem cria uma rede é o fundador. Ele publica um evento `NetworkManifest` no seu log de eventos público, assinado com sua chave de Usuário:

```
name: string
topic: string
description: string?
default_filter_pubkey: bytes(32)?
created_at: uint64
signature: bytes(64)
```

O manifesto pode ser atualizado ao longo do tempo (novos eventos somente-anexação sobrescrevem o estado projetado). Se os usuários discordam do manifesto ou querem regras diferentes, criam a própria rede com um topic diferente — um fork leve que não exige permissão.

O fundador não tem privilégio técnico além de ter escrito o manifesto. Seu `default_filter_pubkey` é ativado por padrão nos novos servidores que entram na rede e aparece primeiro nas listas de filtros — apenas prioridade de UI.

## Replicação

**A replicação é sempre total.** Todo servidor replica todos os logs de dispositivo que descobre numa rede. Os filtros nunca afetam o que é armazenado — são uma lente em tempo de consulta que controla o que aparece nas respostas da API, nos mapas e nas agregações. Isso mantém a rede robusta: os dados ficam amplamente distribuídos e não há fragmentação em que só certos nós guardam certos dados.

## Modos de servidor

| Modo | Descoberta no swarm | Visível externamente |
|---|---|---|
| `public` | Anuncia em todos os topics configurados | Sim |
| `local_only` | Não se conecta ao swarm de forma alguma | Não |
| `hybrid` | Anuncia nos topics; cada dispositivo controla `publish_to` individualmente | Parcialmente |

Um servidor `local_only` é invisível para a malha global. Ele serve apenas dispositivos da rede Wi-Fi local e o app do dono.

## Filtros

Filtros são listas componíveis de curadoria de MAC publicadas por nós servidores. Cada filtro é um log somente-anexação de eventos de curadoria:

```
type: mac_verified | mac_flagged | mac_banned | mac_unflagged
mac: bytes(6)
reason: string?
created_at: uint64
signature: bytes(64)  // assinado pela chave de Usuário do autor do filtro
```

O estado atual de um filtro é a projeção de todos os eventos até o presente. Adição e remoção são sempre somente-anexação — não há edição destrutiva.

Os clientes combinam múltiplos filtros usando operações de conjunto sustentadas por **Roaring Bitmaps**:

| Combinação | Efeito |
|---|---|
| União | MACs verificados por qualquer filtro selecionado são aceitos — cobertura máxima |
| Interseção | MACs precisam aparecer em todos os filtros — rigor máximo |
| Diferença | Exclui MACs sinalizados em filtros negativos |

O filtro da Arateki serve como padrão para `raiznet:public:arateki:v1` porque a Arateki é a fundadora da rede. Qualquer outro fundador de rede tem a mesma relação com o próprio filtro. Ninguém tem monopólio — qualquer servidor pode publicar um filtro e qualquer cliente pode escolher em quais confiar.

## Entrando em uma rede

1. O servidor se conecta ao topic via a camada de descoberta de peers.
2. Os peers trocam listas de dispositivos conhecidos (pubkeys, MACs, células H3).
3. Os peers também trocam os filtros e catálogos disponíveis.
4. O servidor ativa o `default_filter_pubkey` do `NetworkManifest` (se definido).
5. O servidor replica todos os logs de dispositivo que vê na rede.
6. Os filtros são aplicados em tempo de consulta — eles determinam o que a API retorna, não o que é armazenado.

## Múltiplas redes

Um único servidor pode participar de múltiplas redes simultaneamente. Para cada topic em que entra, ele descobre um conjunto separado de peers e replica os logs dos dispositivos que listam aquele topic em `Device.networks`.

Um dispositivo pode publicar em múltiplas redes listando vários topics no seu campo `networks`.

## Criando uma rede para uma cooperativa

1. Escolha um topic único: `raiznet:public:minha-coop:v1`.
2. Publique um `NetworkManifest` com um nome legível e uma descrição.
3. Opcionalmente, crie um filtro listando os MACs verificados dos dispositivos da cooperativa.
4. Defina `default_filter_pubkey` no manifesto apontando para esse filtro.
5. Compartilhe a string do topic com os membros — eles configuram seus servidores para se conectar a ele.

Os membros veem por padrão apenas o que passa pelo seu filtro ativo. Tecnicamente, qualquer um pode se conectar ao topic, mas dispositivos não filtrados não aparecerão nas agregações ou mapas dos membros que usam o filtro padrão.
