---
description: A API local da Raiznet em 127.0.0.1 — mesmas rotas da API pública mas sobre o banco privado, acesso remoto via túnel e autenticação do dono planejada.
---

# API local

O endpoint local escuta em `127.0.0.1:LOCAL_PORT` (padrão `3001`). Ele roda no mesmo processo do endpoint público, mas faz bind apenas no loopback — é destinado ao app do dono, à CLI e ao ferramental na mesma máquina (ou alcançado por um túnel como Tailscale ou uma VPN).

::: danger Ainda sem autenticação
O endpoint local atualmente **não tem autenticação**. O isolamento depende inteiramente do bind em `127.0.0.1`. Não faça port-forward nem proxy reverso desta porta para a internet. A autenticação por challenge-response do dono está planejada — veja abaixo.
:::

## URL base

```
http://127.0.0.1:3001
```

## Rotas

O endpoint local expõe as **mesmas rotas** da [API pública](/reference/public-api), com uma diferença estrutural: qual banco elas acessam.

| Rota | Endpoint público | Endpoint local |
|---|---|---|
| `GET /health` | — | idêntica |
| `POST /v1/devices` | escreve `raiznet_public.db` | escreve `raiznet_private.db` |
| `GET /v1/devices`, `GET /v1/devices/:id` | lê `raiznet_public.db` | lê `raiznet_private.db` |
| `GET /v1/devices/:id/telemetry` | lê `raiznet_public.db` | lê `raiznet_private.db` |
| `POST /v1/telemetry` | destino de ingestão `public` | destino de ingestão `local` |

Essa assimetria é deliberada: registrar um dispositivo no endpoint local o cria como um **dispositivo local** no banco privado, invisível para o lado público.

### Destino da ingestão

`POST /v1/telemetry` no endpoint local armazena as leituras em `raiznet_private.db` quando o `publishTo` do dispositivo é `0` (local_only) ou `2` (both). Um dispositivo com `publishTo: 1` (apenas público) que poste aqui é validado e aceito, mas nada é armazenado.

Um dispositivo `both` envia **requisições separadas** para cada endpoint — uma para o público, uma para o local — cada uma montada conforme as disposições de campo daquele destino.

## Acesso remoto

Para ler dados locais de fora da LAN, use uma rede overlay privada (Tailscale, WireGuard) para alcançar `127.0.0.1:3001` no servidor — ou marque os campos como `encrypted` para a rede pública e os descriptografe no seu app (veja [Modelo de privacidade](/protocol/privacy)).

---

## Planejado: autenticação do dono

A autenticação por challenge-response com a chave de Usuário do dono está projetada mas **ainda não implementada**:

1. O cliente chama `GET /v1/auth/challenge` → recebe 32 bytes aleatórios.
2. O cliente assina o desafio com a chave secreta de Usuário.
3. O cliente envia a assinatura para `POST /v1/auth/verify` → recebe um token de sessão.

## Planejado: visão combinada

O endpoint local eventualmente mesclará `raiznet_public.db` + `raiznet_private.db` por `(device_pubkey, seq)`, para que o dono veja uma série contínua por dispositivo, com campos criptografados retornados como `cipher` + `nonce` para descriptografia local. Hoje, cada endpoint retorna apenas o próprio banco.
