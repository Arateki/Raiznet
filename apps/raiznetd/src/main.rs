// raiznetd — ponto de entrada do nó Raiznet em Rust.
//
// Fase 1 da migração: o mínimo que sobe um servidor HTTP e responde
// GET /health igual ao servidor TS ({"status":"ok","ts":<unix_ms>}).
// As fases seguintes adicionam identidade, SQLite, devices e telemetria.

use axum::{Json, Router, routing::get};
use std::time::{SystemTime, UNIX_EPOCH};

/// Timestamp atual em milissegundos Unix — mesmo formato do Date.now() do JS.
/// `u64` é um inteiro sem sinal de 64 bits; `as u64` converte o resultado.
pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock before epoch")
        .as_millis() as u64
}

/// Handler do GET /health. `async fn` = função assíncrona (como async no JS).
/// O retorno `Json<...>` faz o axum serializar o valor e setar o Content-Type.
async fn health() -> Json<serde_json::Value> {
    // json!{} é uma macro que monta um valor JSON, parecido com um literal JS.
    Json(serde_json::json!({ "status": "ok", "ts": now_ms() }))
}

// #[tokio::main] transforma o main síncrono em assíncrono: inicializa o
// runtime do tokio (o "event loop" do Rust) e executa o corpo dentro dele.
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Logs estruturados em JSON no stdout — equivalente ao pino do servidor TS.
    tracing_subscriber::fmt().json().init();

    let app = Router::new().route("/health", get(health));

    // `await` suspende até a operação completar, sem travar a thread.
    // O `?` propaga o erro para cima (como um throw) se o bind falhar.
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("raiznetd started on :3000");
    axum::serve(listener, app).await?;
    Ok(())
}
