// raiznetd — ponto de entrada do nó Raiznet em Rust.
//
// Fase 2 da migração: servidor HTTP com /health + identidade Ed25519 do nó
// carregada/criada em <data_dir>/identity.mnemonic (compatível com o TS).
// As fases seguintes adicionam SQLite, devices e telemetria.

mod identity;

use axum::{Json, Router, routing::get};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

/// Timestamp atual em milissegundos Unix — mesmo formato do Date.now() do JS.
pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock before epoch")
        .as_millis() as u64
}

/// Handler do GET /health — mesmo shape do servidor TS.
async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "ts": now_ms() }))
}

// #[tokio::main] inicializa o runtime async (o "event loop" do Rust)
// e executa o corpo do main dentro dele.
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Logs estruturados em JSON no stdout — equivalente ao pino do TS.
    tracing_subscriber::fmt().json().init();

    // Identidade do nó: mesmo arquivo e formato do servidor TS, então um nó
    // migrado mantém a pubkey. RAIZNET_DATA_DIR default ./data (config
    // completa por env chega na Fase 4).
    let data_dir: PathBuf = std::env::var("RAIZNET_DATA_DIR")
        .unwrap_or_else(|_| "./data".into())
        .into();
    let node = identity::load_or_create_identity(&data_dir)?;
    tracing::info!(pubkey = %node.pubkey_hex(), "raiznet server started");

    let app = Router::new().route("/health", get(health));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("raiznetd listening on :3000");
    axum::serve(listener, app).await?;
    Ok(())
}
