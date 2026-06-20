---
description: ADR 002 — SQLite como cache de leitura derivado do log de eventos assinado, com bancos público e privado separados e isolamento no nível da conexão.
---

# ADR 002 — SQLite como cache de leitura derivado

**Status:** Aceito  
**Data:** 2026-04

::: info Atualização (2026-06)
O log de eventos assinado ainda não está implementado — hoje a ingestão escreve diretamente no SQLite (o caminho da "Fase 1" descrito em Trade-offs). O design do log também se afastou do Hypercore em direção a um log de eventos somente-anexação nativo da Raiznet ([ADR-004](/adr/004-raiznet-native-replication)); o princípio do SQLite-como-índice-derivado permanece inalterado.
:::

## Contexto

A fonte da verdade pretendida pela Raiznet é um log de eventos somente-anexação e criptograficamente assinado. No entanto, servir consultas de API rápidas (leituras por faixa de tempo, agregações, filtragem por célula H3) diretamente de tal log é impraticável: ele é projetado para anexação sequencial e replicação, não para consultas indexadas de acesso aleatório.

É necessária uma camada de índice secundário.

## Decisão

O **SQLite** (via `better-sqlite3`) é usado como um cache de leitura derivado. Ele não é a fonte da verdade de longo prazo. Quando o log de eventos existir, um banco SQLite corrompido ou apagado poderá ser totalmente reconstruído reproduzindo o log a partir do primeiro evento.

São mantidos dois bancos separados:

| Banco | Alimentado por | Acesso |
|---|---|---|
| `raiznet_public.db` | Ingestão pública (replicação do log de eventos planejada) | Endpoint público |
| `raiznet_private.db` | Apenas ingestão local | Apenas endpoint local |

## Justificativa

- **Performance de consulta**: colunas fixas do tipo `REAL` permitem agregações SQL padrão (AVG, MIN, MAX, GROUP BY) com índices. Sem parsing de JSON em tempo de consulta.
- **Simplicidade de schema**: sem ORM — SQL direto com resultados tipados via a API síncrona do `better-sqlite3`.
- **Garantia de reconstrução** (quando o log de eventos entrar): como o SQLite é derivado do log, a evolução do schema não significa perda de dados. Apague o arquivo, reproduza, pronto.
- **Segurança por isolamento**: a instância Fastify do endpoint público mantém conexão apenas com `raiznet_public.db`. Uma consulta no endpoint público não consegue retornar dados privados porque o objeto de conexão do banco simplesmente não está disponível para ela — o isolamento é no nível da conexão, não no nível da consulta.
- **API síncrona do `better-sqlite3`**: encaixa-se naturalmente nos handlers de rota assíncronos do Fastify sem exigir um pool de threads separado nem indireção de callbacks.

## Trade-offs

- Adicionar um novo tipo de sensor exige uma migração de schema (três colunas novas: `_plain`, `_cipher`, `_nonce`). Este é o custo aceito por consultas agregadas rápidas.
- O design de tabela larga (uma linha por leitura, todas as colunas de sensor na mesma linha) usa mais espaço em disco que uma tabela estreita chave-valor, mas habilita consultas indexadas por faixa sem joins.
- A Fase 1 escreve diretamente no SQLite. A Fase 2 adiciona o pipeline log de eventos → indexador → SQLite. A camada de API sempre lê do SQLite nas duas fases.

## Consequências

- `apps/server/src/storage/public-db.ts` e `private-db.ts` são donos da criação do schema (`CREATE TABLE IF NOT EXISTS`).
- Sem framework de migração na Fase 1 — as tabelas são criadas no primeiro boot, o schema é estável.
- Um indexador (Fase 2) será o único escritor de `raiznet_public.db` quando a replicação do log de eventos estiver ativa.
- `raiznet_private.db` é sempre escrito diretamente pelo caminho de ingestão local — ele nunca é replicado.
