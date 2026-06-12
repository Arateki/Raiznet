# 6 — Async, tokio e axum (e o Arc<Mutex> do nosso estado)

**Arquivo de referência: `apps/raiznetd/src/main.rs` e `src/http/mod.rs`**

## async/await: igual ao TS... até deixar de ser

```rust
async fn health() -> Json<serde_json::Value> { ... }
let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
```

A sintaxe é familiar: `async fn` retorna um futuro, `.await` espera.
As diferenças que importam:

1. **Rust não tem runtime embutido.** O Node TEM event loop; em Rust você
   escolhe e instala um — o nosso é o **tokio** (o mais usado). O atributo
   `#[tokio::main]` transforma o `main` em "suba o runtime e rode isto".
2. **Futuros são preguiçosos.** Em TS, chamar uma função async já dispara a
   execução. Em Rust, `health()` sem `.await` não faz NADA — futuros só
   andam quando aguardados.
3. **Multi-thread por padrão.** Nosso tokio usa `rt-multi-thread`: handlers
   rodam em paralelo REAL (várias threads), não só concorrência cooperativa
   como no Node. É por isso que o estado compartilhado precisa de Mutex.

## axum: o Fastify da casa

```rust
// http/mod.rs
axum::Router::new()
    .route("/health", get(health::health))
    .route("/v1/devices", post(devices::register).get(devices::list))
    .route("/v1/devices/{id}", get(devices::get_one))
    .with_state(state)
```

- Rotas declaradas num `Router`, params de path com `{id}` (axum 0.8).
- **Extractors**: os parâmetros do handler declaram o que extrair da request:

```rust
pub async fn get_one(
    State(state): State<AppState>,   // o estado injetado (DI)
    Path(id): Path<String>,          // o {id} da URL
) -> (StatusCode, Json<Value>)       // o retorno VIRA a resposta
```

Em vez de `request.params.id` e `reply.code(404).send(...)` do Fastify, os
tipos na assinatura fazem o trabalho. Retornar a tupla `(StatusCode, Json)`
define status e body de uma vez.

## Os dois listeners — paridade com o TS

O servidor TS sobe dois Fastify (público e local) e infere o destino pela
porta do socket. Nós montamos **dois routers com o destino explícito**:

```rust
let public_router = http::build_router(base.clone());
let local_router  = http::build_router(AppState { destination: Destination::Local, ..base });

tokio::try_join!(
    axum::serve(public_listener, public_router).into_future(),
    axum::serve(local_listener, local_router).into_future(),
)?;
```

- `..base` é o spread do Rust: "os outros campos vêm de base".
- `try_join!` roda os dois servidores concorrentemente e propaga o primeiro
  erro — o `Promise.all` de cá.

## Arc<Mutex<Connection>> — por quê?

O `rusqlite::Connection` não pode ser usado por duas threads ao mesmo tempo
(em Rust isso é um FATO DO TIPO, não uma nota de documentação: `Connection`
não implementa a trait `Sync`, então o compilador **recusa** compartilhar).

A receita do projeto:

```rust
pub public_db: Arc<Mutex<Connection>>,
```

- `Arc` = vários donos do mesmo valor (contagem de referências atômica).
- `Mutex` = um de cada vez: `.lock()` devolve um "guard"; enquanto o guard
  vive, ninguém mais entra; quando sai de escopo, destrava sozinho.

```rust
let db = state.devices_db().lock().expect("db mutex");
// ... usa o banco ...
// fim do escopo → destrava automaticamente (RAII)
```

Por que não um pool de conexões? Decisão registrada no plano: as operações
são sub-milissegundo e o alvo é um nó pequeno — YAGNI. Se um dia houver
contenção medida, revisita-se.

## O detalhe do `.clone()` no estado

`AppState` deriva `Clone`, e cloná-lo é BARATO: clonar um `Arc` só
incrementa o contador (não copia o banco). O axum clona o estado para cada
handler — por isso o padrão `Arc<...>` dentro de structs de estado é
onipresente em código de servidor Rust.
