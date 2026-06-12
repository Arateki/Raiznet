// GET /health — mesmo shape do servidor TS: {"status":"ok","ts":<unix_ms>}.

use axum::Json;

pub async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "ts": crate::now_ms() }))
}
