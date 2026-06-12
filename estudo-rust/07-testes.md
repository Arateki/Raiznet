# 7 — Testes: unitários, de integração e o TDD com vetores

**Arquivos de referência: `crates/raiznet-crypto/src/signing.rs` (unitário)
e `apps/raiznetd/tests/corpus.rs` (integração)**

## Testes unitários moram NO arquivo

```rust
// no fim de signing.rs
#[cfg(test)]          // este módulo só existe quando rodando `cargo test`
mod tests {
    use super::*;     // importa tudo do módulo de cima

    #[test]
    fn signature_is_byte_identical_to_typescript() {
        let key = node_keypair_from_mnemonic(MNEMONIC).unwrap();
        let sig = sign(raw.as_bytes(), &key);
        assert_eq!(hex::encode(sig), EXPECTED_SIG);
    }
}
```

- Convenção da casa no TS era `foo.ts` + `foo.test.ts` colocados; em Rust o
  costume é ainda mais perto: o módulo `tests` dentro do próprio arquivo,
  com acesso a funções privadas.
- `assert_eq!(a, b)` / `assert!(cond)` falham com diff legível.
- Rodar: `cargo test -p raiznet-crypto` (um crate) ou `--workspace` (tudo).
- **Os testes rodam em paralelo por padrão** — por isso cada teste cria seu
  próprio banco em memória, nunca compartilha estado global.

## Testes de integração moram em `tests/`

`apps/raiznetd/tests/corpus.rs` é um CRATE separado que importa o raiznetd
como biblioteca — testa "por fora", como um consumidor:

```rust
use raiznetd::http::{AppState, Destination, build_router};
```

(Foi por isso que dividimos o raiznetd em `lib.rs` + `main.rs`: testes de
integração só enxergam a lib.)

O corpus monta o router inteiro em memória e dispara requests sem abrir
porta nenhuma, via `tower::ServiceExt::oneshot`:

```rust
let response = router.oneshot(request).await.unwrap();
```

Equivale ao `app.inject()` do Fastify. Testes async levam
`#[tokio::test]` em vez de `#[test]` (sobe um runtime por teste).

## A estratégia da migração: TDD com vetores cruzados

O fluxo que usamos nas Fases 2–5, e que vale imitar em qualquer port:

1. **Gerar vetores com a implementação de referência.** O
   `test-fixtures/generate.mjs` roda o código TypeScript REAL e salva
   entradas/saídas exatas (chaves, assinatura, respostas HTTP, linhas de
   SQLite).
2. **Validar os vetores contra a referência viva.** Fase 0: os fixtures
   foram disparados contra o servidor TS rodando, com curl, antes de
   qualquer linha de Rust.
3. **Escrever o teste Rust com o vetor embutido.** Ed25519 é determinístico:
   a assinatura tem que bater BYTE A BYTE. Se falhar, o erro está na
   implementação nova — nunca no vetor.
4. **Implementar até passar; clippy limpo; commit.**

O resultado prático: "paridade de comportamento" deixa de ser opinião e
vira uma suíte que qualquer um roda com um comando.

## Ferramentas de qualidade que rodam junto

```bash
cargo clippy --workspace -- -D warnings   # linter; -D warnings = warning é erro
cargo fmt                                  # formatador oficial (sem config, sem debate)
```

O clippy é agressivo no bom sentido: sugere o jeito idiomático ("use
`unwrap_or` em vez desse match"...). No projeto, ele precisa passar limpo
antes de cada commit — mesma disciplina do eslint + prettier no lado TS.
