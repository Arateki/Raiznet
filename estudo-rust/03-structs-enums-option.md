# 3 — Structs, enums com dados, Option e match

**Arquivo de referência: `apps/raiznetd/src/domain/telemetry.rs`**

## Enums que carregam dados — o recurso que o TS quase tem

O TS tem union types (`type Field = {case:'plain',...} | {case:'encrypted',...}`).
O enum de Rust é isso, nativo e verificado:

```rust
pub enum SensorField {
    Plain(f64),                                    // variante com um valor
    Encrypted { cipher: Vec<u8>, nonce: Vec<u8> }, // variante com campos nomeados
    Absent,                                        // variante vazia
}
```

Compare com o TS congelado (`apps/server/src/domain/telemetry.ts`):

```ts
type SensorField =
  | { case: 'plain'; value: number }
  | { case: 'encrypted'; cipher: Buffer; nonce: Buffer }
  | { case: 'absent' }
```

É a MESMA modelagem — o Rust só exige menos cerimônia (sem o campo `case`
discriminador; a variante já é a discriminação).

## `match` — o switch que não deixa esquecer caso

```rust
// field_to_columns — domain/telemetry.rs
match (field, disposition) {
    (SensorField::Plain(v), DISPOSITION_PLAIN) => /* colunas _plain */,
    (SensorField::Encrypted { cipher, nonce }, DISPOSITION_ENCRYPTED) => /* _cipher/_nonce */,
    _ => SensorColumns::default(), // QUALQUER outra combinação → NULL
}
```

Três superpoderes sobre o `switch` do TS:
1. **Exaustivo**: esquecer uma variante = erro de compilação (adicionou um
   caso novo no enum? o compilador aponta todos os matches a atualizar).
2. **Desestrutura**: `Plain(v)` já extrai o valor para a variável `v`.
3. **Casa tuplas**: `(field, disposition)` testa as duas coisas juntas —
   exatamente a tabela de combinações wire×política da seção 7.6 do plano.

## Option<T> — adeus, undefined

Rust não tem `null` nem `undefined`. "Pode não existir" é um enum:

```rust
pub struct SensorColumns {
    pub plain: Option<f64>,      // Some(6.2) ou None → NULL no SQLite
    pub cipher: Option<Vec<u8>>,
    pub nonce: Option<Vec<u8>>,
}
```

O compilador NÃO deixa você usar um `Option<f64>` como `f64` — é preciso
tratar o caso `None` (com `match`, `if let`, `unwrap_or`, `?`...). O bug
"cannot read property of undefined" é impossível por construção.

Atalhos que aparecem no nosso código:

```rust
// "se houver valor, use; senão, default" — como o ?? do TS:
policy.per_destination.get(key).unwrap_or(&p.default_disposition)

// "só me interessa o caso Some" — if let:
if let Some(v) = f.plain { return SensorField::Plain(v); }

// "Some → erro se None" com mensagem (ok_or_else), encadeando com ?:
hex::decode(&b.device_id).ok().and_then(|v| v.try_into().ok())
    .ok_or_else(|| DomainError::InvalidPayload("deviceId".into()))?
```

## Structs e o `#[derive(...)]`

```rust
#[derive(Default, Clone)]
pub struct SensorColumns { ... }
```

`derive` gera implementações automáticas: `Default` cria o valor "zerado"
(`SensorColumns::default()` = tudo `None`), `Clone` permite `.clone()`.
É o equivalente de ganhar métodos de graça — sem reflection, gerado em
compile-time. Outros derives comuns no projeto: `Debug` (imprimir com
`{:?}`), `Deserialize` (capítulo 5).

## Arrays fixos vs vetores

```rust
pub device_id: [u8; 32],   // exatamente 32 bytes, tamanho no TIPO
pub raw: Vec<u8>,          // quantos bytes vierem
```

`[u8; 32]` codifica no tipo que uma pubkey TEM 32 bytes — receber 31 nem
compila. O `try_into()` que aparece no parse converte `Vec<u8>` → `[u8; 32]`
e falha em runtime se o tamanho não bater (vira erro por bloco, nunca panic).
