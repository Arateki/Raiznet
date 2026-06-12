// Biblioteca do raiznetd — expõe os módulos para o binário (main.rs) e para
// os testes de integração (tests/corpus.rs).
//
// Padrão comum em Rust: o mesmo pacote tem uma lib (a lógica) e um bin (a
// casca executável). Testes de integração só conseguem importar a lib.

pub mod config;
pub mod domain;
pub mod http;
pub mod identity;

use std::time::{SystemTime, UNIX_EPOCH};

/// Timestamp atual em milissegundos Unix — mesmo formato do Date.now() do JS.
pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock before epoch")
        .as_millis() as u64
}
