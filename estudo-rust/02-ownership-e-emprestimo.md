# 2 — Ownership e empréstimo: o coração do Rust

**Arquivo de referência: `crates/raiznet-store/src/devices.rs`**

## A ideia em uma frase

Todo valor tem **exatamente um dono**. Quando o dono sai de escopo, o valor
é liberado — sem garbage collector, sem `free()` manual. Quem não é dono
pode **pegar emprestado** com `&` (leitura) ou `&mut` (escrita exclusiva).

## Em TS isso não existe — e custa caro

```ts
const config = { nome: "Torre" }
salvar(config)
config.nome = "Outra"   // mutou depois de "entregar" — bug clássico de aliasing
```

Em TS, `salvar` e o chamador compartilham o mesmo objeto sem nenhum contrato.
Em Rust o compilador força você a declarar a intenção:

```rust
fn salvar(config: Config)        // TOMA POSSE — o chamador perde o valor
fn salvar(config: &Config)       // EMPRESTA para ler — chamador continua dono
fn salvar(config: &mut Config)   // EMPRESTA para escrever — exclusivo enquanto durar
```

## No nosso código

### `&[u8]` e `&str` — emprestar fatias

```rust
// devices.rs
pub fn device_exists(conn: &Connection, pubkey: &[u8]) -> Result<bool, StoreError>
```

`pubkey: &[u8]` significa "me empresta uns bytes para eu ler". A função não
copia a pubkey nem vira dona dela — só olha. `&str` é o mesmo para texto.
A regra prática: **parâmetros de leitura são sempre `&algo`**.

Os tipos "donos" correspondentes: `Vec<u8>` (bytes dinâmicos, como um
`Buffer`) e `String` (texto dinâmico). `DeviceRow` usa `Vec<u8>`/`String`
porque a linha lida do banco precisa ser DONA dos seus dados — ela sobrevive
depois que a query acabou.

### Lifetimes — o `'a` do `NewDevice`

```rust
pub struct NewDevice<'a> {
    pub pubkey: &'a [u8],
    pub name: &'a str,
    // ...
}
```

`NewDevice` não copia nada: só aponta para dados que **outra pessoa** possui
(o handler HTTP que decodificou o body). O `'a` (lifetime) é o compilador
exigindo a prova de que o `NewDevice` não vive mais que os dados apontados.
Em TS, guardar referência para algo que já morreu é impossível de expressar
— aqui é erro de compilação. É troca de bug em produção por erro de build.

### Move — quando o valor muda de dono

```rust
let raw = format!("...");        // raw é uma String (dona)
block.raw = raw.into_bytes();    // raw foi MOVIDA — não existe mais aqui
```

Depois de `into_bytes()`, usar `raw` de novo é erro de compilação ("value
moved"). Se você precisa do valor em dois lugares, as opções são: emprestar
(`&raw`), clonar (`raw.clone()`, cópia explícita e visível), ou repensar
quem deveria ser o dono.

### `clone()` — a cópia explícita

No `field_to_columns` (domain/telemetry.rs):

```rust
cipher: Some(cipher.clone()),
```

Clonamos porque o `SensorField` continua emprestado (só temos `&SensorField`)
e o `SensorColumns` precisa ser dono dos bytes para entregá-los ao banco.
Em TS toda atribuição compartilha referência silenciosamente; em Rust cada
cópia de verdade aparece escrita no código. Quando você vê muitos `.clone()`
num código Rust, é sinal de design a melhorar — mas alguns são legítimos.

### Compartilhar entre threads: `Arc<Mutex<T>>`

```rust
// http/mod.rs
pub public_db: Arc<Mutex<Connection>>,
```

Quando UM dono não basta (vários handlers usam o mesmo banco), entra o
`Arc` — "Atomically Reference Counted", um dono coletivo com contagem de
referências (parecido com como o JS compartilha objetos, mas explícito e
thread-safe). O `Mutex` por cima garante acesso exclusivo na hora de usar:
`db.lock()` trava, opera, e destrava quando o guard sai de escopo.

Detalhe bonito do nosso `ingest_block`:

```rust
let policy_row = {
    let db = state.devices_db().lock().expect("db mutex");
    raiznet_store::devices::get_device_policy(&db, &block.device_id)?...
};  // ← o lock é SOLTO aqui, no fim do bloco
```

O escopo `{}` controla por quanto tempo o banco fica travado. Em TS você
não pensa nisso; em Rust o escopo É o mecanismo de liberação (RAII).
