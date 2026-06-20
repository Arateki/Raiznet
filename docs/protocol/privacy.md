---
description: O modelo de privacidade por campo da Raiznet — disposições plain, encrypted e omit, FieldPolicy por destino, publish_to e segurança por isolamento.
---

# Modelo de privacidade

O modelo de privacidade da Raiznet opera no nível do campo. Cada leitura de sensor (pH, EC, temperatura, etc.) tem uma política de visibilidade independente que determina o que trafega para onde.

## Disposição

Uma `Disposition` define como um campo é tratado para um dado destino:

| Valor | Significado |
|---|---|
| `OMIT` | O campo não é enviado a este destino. Não é armazenado. |
| `PLAIN` | O campo trafega em claro. Visível a todos os peers com acesso àquele destino. |
| `ENCRYPTED` | O campo é criptografado com a chave simétrica AES-256-GCM do dispositivo antes da transmissão. O blob trafega normalmente, mas só quem tem a chave consegue lê-lo. |

Valores `ENCRYPTED` nunca entram em agregações ou mapas da rede — os agregadores ignoram blobs opacos.

## FieldPolicy

Cada campo de sensor tem uma `FieldPolicy`:

```protobuf
message FieldPolicy {
  Disposition default_disposition = 1;
  map<string, Disposition> per_destination = 2;
}
```

`default_disposition` se aplica a qualquer destino não listado explicitamente. `per_destination` mapeia uma chave de destino para um override:

- **Pubkey do servidor (hex)**: aplica-se àquele servidor específico.
- **Topic da rede** (ex.: `raiznet:public:arateki:v1`): aplica-se a todos os peers daquela rede.

A UI apresenta três níveis de granularidade, todos sustentados pelo mesmo mapa:

| Nível na UI | Configuração |
|---|---|
| Igual para todos | `default_disposition` definido, mapa vazio |
| Público vs local | Duas entradas no mapa agrupando por classe |
| Por destino (avançado) | Uma entrada por pubkey de servidor ou topic |

## publish_to

A configuração `publish_to` do dispositivo controla quais categorias de destino ficam ativas:

| Valor | Destinos ativos |
|---|---|
| `LOCAL_ONLY` | Apenas as entradas de `local_servers` |
| `PUBLIC` | Apenas topics de rede pública |
| `BOTH` | Todos os destinos — cada um com sua própria FieldPolicy |

## local_servers como diferenciador

A lista `local_servers` no dispositivo determina se o dado "local" chega a algum servidor:

- **`local_servers` vazio** → os campos privados ficam na flash do ESP32. O dono os acessa diretamente via HTTP local, BLE ou serial quando está por perto.
- **`local_servers` preenchido** → os campos privados são enviados a esses servidores específicos e armazenados em `raiznet_private.db`. Cada servidor é independente e não replica dados privados com outros servidores.

Usuários que não rodam um nó nunca precisam configurar `local_servers`. O app comunica isso com clareza: o dado local fica no dispositivo até o app se conectar diretamente.

## Segurança por isolamento

Os dois bancos no servidor impõem o isolamento no nível da conexão, não no nível da consulta:

- `raiznet_public.db` — alimentado pela ingestão pública (replicação entre peers planejada). O endpoint público tem acesso apenas a este banco. Uma consulta mal escrita não consegue vazar dados privados porque o objeto de conexão simplesmente não está disponível.
- `raiznet_private.db` — alimentado apenas pela ingestão local. Apenas o endpoint local (`127.0.0.1`) tem acesso. Ele nunca sai do nó.

## O que é sempre público

Quando um dispositivo tem `publish_to: PUBLIC | BOTH`, os metadados a seguir são sempre públicos, independentemente da FieldPolicy:

- `id` (pubkey do dispositivo)
- `mac`
- `owner_pubkey`
- `type` (sensor_mains / sensor_battery / gateway)
- `location` (célula H3 na resolução escolhida pelo dono)
- `hardware` (modelo, versão de firmware)

Esses metadados são necessários para a rede saber que o dispositivo existe e para as agregações funcionarem.

## Mudando a política

Mudar a `FieldPolicy` afeta apenas leituras futuras. Dados já publicados (em claro ou criptografados) permanecem com quem já os recebeu — não há mecanismo para "despublicar" o que os peers baixaram. Isso é consequência de dados somente-anexação e replicados.

## Campos criptografados e o app do dono

A disposição `ENCRYPTED` resolve um caso de uso específico: o dono quer acompanhar os dados do próprio sensor de fora da LAN (sem precisar de túnel) sem expor os valores à rede pública.

Fluxo:
1. O dispositivo criptografa o campo com sua chave simétrica antes de enviá-lo ao destino público.
2. Qualquer peer recebe e armazena o blob criptografado — ele não consegue lê-lo.
3. O app do dono, que guarda a chave simétrica, descriptografa o blob localmente.

Isso significa que o dono pode usar qualquer gateway público ou nó peer para recuperar seus dados sem confiar a ele os valores em claro.
