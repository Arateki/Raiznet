# 5 — Traits, derive e generics

**Arquivo de referência: `apps/raiznetd/src/http/devices.rs`**

## Trait = interface (mas mais poderosa)

Uma trait define um comportamento que tipos podem implementar — como uma
`interface` do TS. A diferença: você pode implementar uma trait para tipos
que não são seus (inclusive tipos da biblioteca padrão), e a resolução é
em compile-time (zero custo em runtime).

Traits que você já está usando sem perceber:

| Trait | O que dá | Onde aparece no projeto |
|---|---|---|
| `Debug` | imprimir com `{:?}` | `#[derive(Debug)]` nos erros |
| `Clone` | `.clone()` | `AppState`, `SensorColumns` |
| `Default` | valor "zerado" | `SensorColumns::default()` |
| `Display` | imprimir com `{}` | gerado pelo `#[error("...")]` do thiserror |
| `From`/`Into` | conversões | `#[from]` nos erros; `.into()` espalhado |
| `Deserialize` | JSON → struct | `RegisterBody`, `BlockInput` |

## Derive + serde: o zod declarativo

```rust
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterBody {
    pub id: String,
    pub owner_pubkey: String,          // casa com "ownerPubkey" do JSON
    #[serde(default = "default_publish_to")]
    pub publish_to: i64,               // ausente no JSON → 1
    pub privacy_policy: Option<std::collections::HashMap<String, FieldPolicyIn>>,
    // ...
}
```

O `#[derive(Deserialize)]` gera, em compile-time, o parser JSON completo
para o struct — tipos errados viram erro de parse, campos opcionais são
`Option`, defaults são declarados no lugar. É o papel que o zod cumpre no
servidor TS, mas sem biblioteca de runtime: o "schema" É o tipo.

Repare no truque do handler `register`: recebemos `Json<Value>` (JSON cru)
e fazemos `serde_json::from_value::<RegisterBody>(value)` manualmente — só
para transformar erro de parse em `400 validation_error` (paridade com o
zod), em vez do `422` automático do axum.

## `r#type` — palavra reservada como nome

```rust
pub r#type: i64,
```

`type` é palavra-chave do Rust. O prefixo `r#` ("raw identifier") permite
usá-la como nome de campo — necessário porque o JSON do protocolo chama o
campo de `"type"`.

## Generics — funções para qualquer tipo (com contrato)

```rust
// config.rs
fn var<T: std::str::FromStr>(name: &str, default: T) -> T {
    std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
}
```

`<T: FromStr>` lê: "para qualquer tipo T **que saiba se construir a partir
de string**". Com isso a mesma função lê `RAIZNET_PUBLIC_PORT` como `u16` e
qualquer outra env futura como outro tipo. É o generics do TS com uma
diferença: o bound (`: FromStr`) é verificado — não existe `any` escondido.
Tudo é monomorfizado em compile-time (o compilador gera uma versão por tipo
usado; custo zero em runtime).

## Closures — as arrow functions

```rust
// raiznet-store/src/telemetry.rs
let col = |plain: Option<f64>, cipher: Option<Vec<u8>>| SensorColumns { plain, cipher, nonce: None };
```

`|args| corpo` ≈ `(args) => corpo`. Closures capturam variáveis do escopo —
e o ownership (capítulo 2) também vale para o que elas capturam: o
compilador decide se captura por empréstimo ou por posse (`move |...|`
força posse, você verá isso quando chegarmos em tasks assíncronas).

## Métodos encadeados em iteradores

```rust
rows.iter().map(format_device).collect::<Vec<_>>()
```

`iter/map/filter/collect` ≈ os métodos de array do JS, mas **preguiçosos**:
nada roda até o `collect`. O `::<Vec<_>>` ("turbofish") diz para o collect
qual coleção montar; o `_` deixa o compilador inferir o tipo do item.
