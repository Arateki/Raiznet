// Camada HTTP do raiznetd — paridade com apps/server/src/index.ts.
//
// O servidor TS sobe DOIS listeners no mesmo processo: o público (0.0.0.0)
// e o local (127.0.0.1). O TS descobre o destino da ingestão pelo localPort
// do socket; aqui construímos dois routers com o destino explícito — mesmo
// comportamento observável, código mais simples.

pub mod devices;
pub mod health;
pub mod telemetry;

use rusqlite::Connection;
use std::sync::{Arc, Mutex};

/// Em qual endpoint este router atende. Decide qual banco as rotas usam.
/// `Clone, Copy` = o valor é copiado livremente (é só um byte).
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Destination {
    Public,
    Local,
}

/// Estado compartilhado pelos handlers (injeção de dependência do axum).
///
/// Arc = contador de referências atômico: vários handlers compartilham o
/// MESMO banco sem copiar. Mutex = trava de exclusão mútua: rusqlite não
/// permite uso simultâneo da mesma conexão por várias threads, então cada
/// acesso trava, opera (sub-milissegundo) e destrava.
#[derive(Clone)]
pub struct AppState {
    pub public_db: Arc<Mutex<Connection>>,
    pub private_db: Arc<Mutex<Connection>>,
    pub server_pubkey_hex: String,
    pub destination: Destination,
    /// Endurecimento: rejeitar blocos cujos valores JSON divergem do `raw`
    /// assinado (o TS aceita — ver plano §7.7 item 5). Default: ligado.
    pub strict_raw: bool,
}

impl AppState {
    /// Banco usado pelas rotas de devices deste router — paridade com
    /// index.ts:29-30 (público → publicDb, local → privateDb). É assimétrico
    /// de propósito: registrar um device no endpoint local cria um device
    /// "local", invisível no lado público.
    pub fn devices_db(&self) -> &Arc<Mutex<Connection>> {
        match self.destination {
            Destination::Public => &self.public_db,
            Destination::Local => &self.private_db,
        }
    }
}

/// Monta o router com as mesmas rotas do servidor TS.
/// Axum 0.8 usa `{id}` para parâmetros de path (não `:id`).
pub fn build_router(state: AppState) -> axum::Router {
    use axum::routing::{get, post};
    axum::Router::new()
        .route("/health", get(health::health))
        .route("/v1/devices", post(devices::register).get(devices::list))
        .route("/v1/devices/{id}", get(devices::get_one))
        .route(
            "/v1/devices/{id}/telemetry",
            get(devices::telemetry_history),
        )
        .route("/v1/telemetry", post(telemetry::ingest))
        .with_state(state)
}
