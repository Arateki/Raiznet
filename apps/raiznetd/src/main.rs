// raiznetd — ponto de entrada do nó Raiznet em Rust.
//
// Casca fina sobre a biblioteca (src/lib.rs): carrega config e identidade,
// abre os dois bancos e sobe os dois listeners — paridade com o servidor TS:
//   público (0.0.0.0:3000)  → rotas de devices no raiznet_public.db
//   local   (127.0.0.1:3001) → rotas de devices no raiznet_private.db

use std::future::IntoFuture; // habilita .into_future() no axum::serve
use std::sync::{Arc, Mutex};

use raiznetd::http::{self, AppState, Destination};
use raiznetd::{config, identity};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cfg = config::Config::from_env();

    // Logs estruturados em JSON no stdout — equivalente ao pino do TS.
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::new(&cfg.log_level))
        .init();

    // Identidade do nó: mesmo arquivo e formato do servidor TS — um nó
    // migrado de TS para Rust mantém a mesma pubkey.
    let node = identity::load_or_create_identity(&cfg.data_dir)?;
    let server_pubkey_hex = node.pubkey_hex();

    // Os dois bancos, cada um dentro de Arc<Mutex<...>> para compartilhar
    // entre os handlers (ver comentário de concorrência em raiznet-store).
    let public_db = Arc::new(Mutex::new(raiznet_store::open_db(
        &cfg.data_dir.join("raiznet_public.db"),
    )?));
    let private_db = Arc::new(Mutex::new(raiznet_store::open_db(
        &cfg.data_dir.join("raiznet_private.db"),
    )?));

    // Mesmos bancos, destinos diferentes — o destino decide qual banco cada
    // router usa (paridade com a inferência por porta do TS).
    let base = AppState {
        public_db,
        private_db,
        server_pubkey_hex: server_pubkey_hex.clone(),
        destination: Destination::Public,
    };
    let public_router = http::build_router(base.clone());
    let local_router = http::build_router(AppState { destination: Destination::Local, ..base });

    let public_listener = tokio::net::TcpListener::bind(("0.0.0.0", cfg.public_port)).await?;
    let local_listener = tokio::net::TcpListener::bind(("127.0.0.1", cfg.local_port)).await?;

    tracing::info!(
        pubkey = %server_pubkey_hex,
        public_port = cfg.public_port,
        local_port = cfg.local_port,
        "raiznet server started"
    );

    // try_join! roda os dois servidores em paralelo; se um falhar, derruba tudo.
    tokio::try_join!(
        axum::serve(public_listener, public_router).into_future(),
        axum::serve(local_listener, local_router).into_future(),
    )?;
    Ok(())
}
