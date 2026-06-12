# 4 — Erros: Result, o operador `?` e thiserror

**Arquivo de referência: `apps/raiznetd/src/domain/errors.rs`**

## Erro é valor de retorno, não exceção

Em TS, qualquer função pode lançar qualquer coisa a qualquer momento, e
nada na assinatura avisa. Em Rust, falha faz parte do TIPO de retorno:

```rust
pub fn node_keypair_from_mnemonic(mnemonic: &str) -> Result<SigningKey, CryptoError>
```

`Result<A, E>` é um enum: `Ok(A)` ou `Err(E)`. Quem chama é OBRIGADO a
tratar — ignorar um Result gera warning, e usar o valor sem checar nem
compila.

## O operador `?` — propagação em um caractere

```rust
// domain/telemetry.rs
let raw = hex::decode(&b.raw).map_err(|_| DomainError::InvalidPayload("raw".into()))?;
```

O `?` no final significa: "se for `Err`, retorna esse erro daqui mesmo; se
for `Ok`, desembrulha o valor e segue". É o try/catch+rethrow do TS reduzido
a um caractere — mas explícito em CADA ponto que pode falhar. Lendo uma
função Rust você enxerga todos os pontos de falha pelos `?`.

## thiserror — definindo os erros do domínio

```rust
#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("Device not found: {0}")]
    DeviceNotFound(String),
    #[error("Invalid signature for device {0}")]
    InvalidSignature(String),
    // ...
    #[error("storage failure")]
    Store(#[from] raiznet_store::StoreError),
}
```

- O atributo `#[error("...")]` gera a mensagem (o `Display`). **No nosso
  caso essas strings são contrato**: viajam no `errors[].error` do 207 e o
  corpus compara byte a byte com o que o servidor TS responde.
- `#[from]` gera a conversão automática `StoreError → DomainError`. É isso
  que deixa o `?` funcionar entre camadas: um erro de SQLite dentro de
  `ingest_block` vira `DomainError::Store` sozinho.

Equivale à regra do projeto no TS ("typed error classes em domain/errors.ts,
nunca throw de string") — só que aqui a linguagem fiscaliza.

## panic vs erro — e o `unwrap`

- **Erro (`Result`)**: situação esperada (assinatura inválida, device
  desconhecido). Trata, responde HTTP, segue a vida.
- **Panic**: bug do programador (invariante quebrada). Com o nosso
  `panic = "abort"`, derruba o processo — e o systemd reinicia.

`unwrap()`/`expect("msg")` convertem `Err`/`None` em panic. A regra no
projeto: **só** onde a falha é impossível por construção, com `expect` e
mensagem explicando o porquê:

```rust
let seed32: [u8; 32] = seed64[..32].try_into().expect("seed64 has 64 bytes");
//                                              ↑ to_seed_normalized SEMPRE retorna 64 bytes
```

Em caminho de request, nunca: lá tudo é `Result` + `?`.

## anyhow — só no binário

No `main.rs`: `fn main() -> anyhow::Result<()>`. O `anyhow` é um "erro
genérico que embrulha qualquer erro" — ótimo para o topo do programa, onde
só queremos logar e morrer. Nas bibliotecas (`raiznet-crypto`, `raiznet-store`)
usamos enums específicos (thiserror), porque quem chama precisa distinguir
os casos. Essa divisão é a regra 6 da tabela do plano: "thiserror nas libs,
anyhow apenas no binário".
