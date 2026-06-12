# Estudo de Rust — guiado pelo código do Raiznet

Material de estudo para acompanhar a migração do nó para Rust (`raiznetd`).
Cada capítulo explica um conceito da linguagem **usando o código real deste
repositório** — nada de exemplos abstratos de foo/bar. A ideia é você ler o
capítulo com o arquivo citado aberto do lado.

Como o seu repertório é TypeScript, os capítulos comparam com TS/JS sempre
que ajuda.

## Capítulos

| # | Arquivo | Conceito | Código de referência |
|---|---|---|---|
| 1 | [01-cargo-e-workspace.md](01-cargo-e-workspace.md) | Cargo, crates e workspace (o "pnpm do Rust") | `Cargo.toml`, `crates/*` |
| 2 | [02-ownership-e-emprestimo.md](02-ownership-e-emprestimo.md) | Ownership, borrow e lifetimes — o coração do Rust | `crates/raiznet-store/src/devices.rs` |
| 3 | [03-structs-enums-option.md](03-structs-enums-option.md) | Structs, enums com dados, Option e match | `apps/raiznetd/src/domain/telemetry.rs` |
| 4 | [04-erros-e-result.md](04-erros-e-result.md) | Result, o operador `?` e thiserror | `apps/raiznetd/src/domain/errors.rs` |
| 5 | [05-traits-e-derive.md](05-traits-e-derive.md) | Traits, derive e generics | `apps/raiznetd/src/http/devices.rs` |
| 6 | [06-async-tokio-axum.md](06-async-tokio-axum.md) | Async, o runtime tokio e o axum; Arc/Mutex | `apps/raiznetd/src/main.rs` |
| 7 | [07-testes.md](07-testes.md) | Testes unitários, de integração e TDD com vetores | `apps/raiznetd/tests/corpus.rs` |

## Comandos do dia a dia

```bash
cargo build -p raiznetd            # compila o binário do nó
cargo run -p raiznetd              # compila e roda
cargo test --workspace             # roda TODOS os testes do workspace
cargo test -p raiznet-crypto       # só os testes de um crate
cargo clippy --workspace -- -D warnings   # linter (warnings = erro)
cargo fmt                          # formata tudo (como o prettier)
```

## Regra de ouro para ler Rust vindo de TS

Quando bater estranheza, pergunte: **"quem é o dono deste valor?"**.
Em TS tudo é referência compartilhada e o garbage collector limpa depois.
Em Rust cada valor tem exatamente um dono; o resto pega emprestado (`&`).
90% dos erros de compilação que você vai ver são o compilador te contando
que duas partes do código discordam sobre quem é o dono — e em TS esse
mesmo bug existiria silenciosamente em runtime.
