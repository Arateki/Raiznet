# 1 — Cargo e workspace: o "pnpm do Rust"

**Arquivo de referência: `Cargo.toml` (raiz do repo)**

## O paralelo direto

| pnpm / Node | Cargo / Rust | No nosso repo |
|---|---|---|
| `package.json` | `Cargo.toml` | um por crate |
| `pnpm-workspace.yaml` | `[workspace]` no Cargo.toml da raiz | `Cargo.toml` |
| `pnpm-lock.yaml` | `Cargo.lock` | commitado (binário) |
| `node_modules/` | `target/` (build) + cache global `~/.cargo` | gitignored |
| pacote npm | **crate** | `raiznet-crypto`, `raiznet-store` |
| `pnpm --filter X build` | `cargo build -p X` | `cargo build -p raiznetd` |
| `workspace:*` | `{ path = "../..." }` | no `apps/raiznetd/Cargo.toml` |

## Diferenças que importam

**1. Crate = unidade de compilação, não só de publicação.** Um crate vira
ou uma biblioteca (`src/lib.rs`) ou um executável (`src/main.rs`) — ou os
dois, como o nosso `raiznetd`: a lib tem a lógica e o `main.rs` é uma casca
fina. Fizemos assim porque **testes de integração só enxergam a lib**
(ver capítulo 7).

**2. Dependências centralizadas.** No nosso `Cargo.toml` raiz:

```toml
[workspace.dependencies]
tokio = { version = "1", features = ["rt-multi-thread", "macros", "signal"] }
```

e cada crate usa `tokio.workspace = true`. Garante a mesma versão em todo o
workspace — o equivalente de fixar versões num catálogo do pnpm.

**3. Features.** Dependências Rust têm "features" — pedaços opcionais
compilados sob demanda. Exemplo nosso: `rusqlite` com `features = ["bundled"]`
compila o SQLite em C **dentro** do crate. É por isso que o `raiznetd` não
precisa de SQLite instalado no sistema — essencial para o binário estático
que vai rodar no OpenStick.

**4. Não existe "instalar" em runtime.** Tudo é resolvido e compilado em
build. Não há `node_modules` para carregar: o binário final é um arquivo só,
com tudo dentro.

## O perfil de release

```toml
[profile.release]
opt-level = "s"   # otimiza para TAMANHO (small), não velocidade máxima
lto = true        # otimização entre crates no link final
codegen-units = 1 # compila mais devagar, otimiza melhor
panic = "abort"   # panic mata o processo (sem unwinding) — binário menor
strip = true      # remove símbolos de debug
```

Esse bloco existe por causa do alvo de hardware (Snapdragon 410, ~250 MB de
RAM). `cargo build --release` usa esse perfil; o `cargo build` normal usa o
perfil `dev` (rápido de compilar, binário grande e lento).

## Edition

`edition = "2024"` no `[workspace.package]` é como um "target" do
TypeScript: define qual geração da linguagem o código usa. Editions novas
podem mudar sintaxe sem quebrar crates antigos — cada crate declara a sua.
