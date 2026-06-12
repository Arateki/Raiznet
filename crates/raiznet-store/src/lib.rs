// raiznet-store — SQLite com paridade de schema e semântica com o servidor TS.
//
// Papel do SQLite no Raiznet: índice derivado/cache de leitura (ADR-002).
// Hoje a ingestão escreve direto; quando o event log chegar (Fase 7), este
// crate passa a ser populado apenas pelo replay de eventos.

pub mod devices;
pub mod schema;
pub mod telemetry;

use rusqlite::Connection;
use std::path::Path;

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("sqlite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("json: {0}")]
    Json(#[from] serde_json::Error),
}

/// Abre raiznet_public.db ou raiznet_private.db com os pragmas do servidor TS
/// (WAL + foreign_keys). synchronous=NORMAL é uma adição segura para WAL —
/// não muda nenhum dado observável, só reduz fsyncs.
pub fn open_db(path: &Path) -> Result<Connection, StoreError> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).ok();
    }
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.execute_batch(schema::SCHEMA)?;
    Ok(conn)
}

/// Banco em memória para testes — mesmo schema e pragmas, sem tocar o disco.
pub fn open_in_memory() -> Result<Connection, StoreError> {
    let conn = Connection::open_in_memory()?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.execute_batch(schema::SCHEMA)?;
    Ok(conn)
}

// Concorrência: rusqlite::Connection não é thread-safe para compartilhar
// (`!Sync`). Padrão obrigatório do projeto: cada banco vive em um
// Arc<std::sync::Mutex<Connection>>; os handlers seguram o lock pelo menor
// tempo possível (as operações são sub-milissegundo). Sem pool — YAGNI no
// perfil pequeno; revisitar apenas se aparecer contenção medida.
