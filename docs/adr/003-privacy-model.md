---
description: ADR 003 — modelo de privacidade por campo com FieldPolicy baseada em mapa (default_disposition + per_destination) e disposições OMIT, PLAIN e ENCRYPTED.
---

# ADR 003 — Modelo de privacidade por campo com política baseada em mapa

**Status:** Aceito  
**Data:** 2026-04

## Contexto

Dispositivos Raiznet podem ter sensores cujas leituras são sensíveis (ex.: dados de saúde do cultivo que o agricultor não quer que concorrentes vejam) enquanto outras leituras do mesmo dispositivo são intencionalmente públicas (ex.: temperatura ambiente para mapas regionais).

Dois requisitos guiaram o design:
1. A privacidade precisa ser configurável no **nível do campo**, não apenas por dispositivo.
2. A política precisa suportar **overrides por destino** sem exigir que o usuário configure dois dispositivos lógicos separados.

## Decisão

Cada campo de sensor tem uma `FieldPolicy`:

```protobuf
message FieldPolicy {
  Disposition              default_disposition = 1;
  map<string, Disposition> per_destination     = 2;
}
```

`default_disposition` se aplica a qualquer destino não listado explicitamente em `per_destination`. A chave do mapa é uma pubkey de servidor (hex) ou uma string de topic de rede.

Três disposições:

| Disposição | Efeito |
|---|---|
| `OMIT` | O campo não é enviado a este destino |
| `PLAIN` | O campo trafega em claro |
| `ENCRYPTED` | O campo é criptografado com AES-256-GCM pela chave simétrica do dispositivo |

## Justificativa

**Um dispositivo, múltiplas políticas.** A abordagem de mapa evita a necessidade de "dois dispositivos lógicos" como gambiarra. Um dispositivo pode ser `PLAIN` no servidor local, `ENCRYPTED` na rede pública e `OMIT` para um servidor terceiro específico — tudo a partir de uma configuração.

**Camadas de UI.** O modelo de mapa suporta três níveis de granularidade voltados ao usuário, todos sustentados pela mesma estrutura de dados:
- *Igual para todos*: `default_disposition` definido, mapa vazio.
- *Público vs local*: duas entradas agrupando por classe de destino.
- *Por destino (avançado)*: uma entrada por pubkey de servidor ou topic.

**`ENCRYPTED` para acesso remoto do dono.** A disposição `ENCRYPTED` resolve um caso específico: o dono quer acompanhar seu sensor de fora da LAN sem expor os valores à rede pública. O blob cifrado trafega pela rede pública normalmente; os peers o armazenam mas não conseguem lê-lo. O app do dono descriptografa localmente usando a chave simétrica do dispositivo (derivada da seed BIP-39).

**Segurança por isolamento, não por consulta.** A arquitetura de dois bancos (`raiznet_public.db` / `raiznet_private.db`) impõe o isolamento no nível da conexão. O modelo `OMIT` / `PLAIN` / `ENCRYPTED` é a camada de política; a separação dos bancos é a camada de imposição. Ambas são necessárias.

**A replicação é sempre total.** Os filtros (listas de curadoria de MAC) nunca afetam o que é armazenado — eles controlam o que aparece nas respostas da API. Isso mantém a rede robusta e evita fragmentação.

## Trade-offs

- O mapa `per_destination` cresce com o número de destinos configurados. Na prática, a maioria dos usuários usará o padrão (mapa vazio) ou no máximo duas entradas.
- Mudar uma política não afeta dados já publicados. Peers que baixaram leituras em claro as mantêm — não há mecanismo de "despublicar" em um log somente-anexação.
- Campos `ENCRYPTED` são opacos para agregações. Métricas no nível da rede (médias por célula H3, gráficos regionais) só podem usar campos `PLAIN`. Isso é uma garantia de privacidade deliberada, não um bug.

## Consequências

- `packages/protocol/proto/device.proto` define `FieldPolicy`, `Disposition` e `PrivacyPolicy`.
- `apps/server/src/domain/telemetry.ts` resolve a disposição efetiva por campo: `per_destination[serverPubkeyHex] ?? default_disposition` (overrides no nível de topic entram com as redes).
- `packages/crypto/src/symmetric.ts` é dono da criptografia e descriptografia de campos com AES-256-GCM.
- O app do dono é responsável por manter o chaveiro simétrico do dispositivo (`{ versão → chave }`) e descriptografar campos `ENCRYPTED` recebidos de qualquer endpoint.
