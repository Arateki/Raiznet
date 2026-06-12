// Teste de integração com o corpus de compatibilidade (test-fixtures/).
//
// Os fixtures foram gerados pelo código TypeScript REAL e validados contra o
// servidor TS rodando (Fase 0). Se um caso falhar aqui, o erro está no Rust —
// nunca no fixture. Roda o router inteiro em memória via tower::oneshot,
// sem abrir porta nenhuma.

use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use serde_json::Value;
use std::sync::{Arc, Mutex};
use tower::ServiceExt; // .oneshot()

use raiznetd::http::{AppState, Destination, build_router};

/// Lê um fixture de test-fixtures/ relativo à raiz do repo.
/// env!("CARGO_MANIFEST_DIR") = apps/raiznetd em compile-time.
fn fixture(rel: &str) -> Value {
    let path = format!("{}/../../test-fixtures/{rel}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("fixture {path}: {e}"));
    serde_json::from_str(&text).unwrap()
}

/// AppState novo com bancos em memória (estado limpo por teste).
fn fresh_state() -> AppState {
    AppState {
        public_db: Arc::new(Mutex::new(raiznet_store::open_in_memory().unwrap())),
        private_db: Arc::new(Mutex::new(raiznet_store::open_in_memory().unwrap())),
        // Pubkey de servidor arbitrária: os fixtures usam default_disposition,
        // então o per_destination nunca é consultado.
        server_pubkey_hex: "ff".repeat(32),
        destination: Destination::Public,
    }
}

/// Dispara uma request no router e devolve (status, body JSON).
async fn send(state: &AppState, method: &str, path: &str, body: Option<&Value>) -> (StatusCode, Value) {
    let router = build_router(state.clone());
    let builder = Request::builder()
        .method(method)
        .uri(path)
        .header(header::CONTENT_TYPE, "application/json");
    let request = match body {
        Some(b) => builder.body(Body::from(serde_json::to_vec(b).unwrap())).unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    };
    let response = router.oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let json: Value =
        if bytes.is_empty() { Value::Null } else { serde_json::from_slice(&bytes).unwrap() };
    (status, json)
}

/// Caso 7 do plano: telemetria ANTES de registrar → 207, nunca 404.
#[tokio::test]
async fn telemetry_before_registration_returns_207_unknown_device() {
    let state = fresh_state();
    let body = fixture("telemetry/post-ok.json");
    let expected = fixture("expected-http/telemetry-unknown-device.json");

    let (status, json) = send(&state, "POST", "/v1/telemetry", Some(&body)).await;
    assert_eq!(status.as_u16() as i64, expected["status"].as_i64().unwrap());
    assert_eq!(json, expected["body"]);
}

/// Casos 1–6 e 8 do plano, na sequência real de um device em campo.
#[tokio::test]
async fn full_corpus_sequence() {
    let state = fresh_state();
    let register = fixture("devices/register-ok.json");
    let telemetry = fixture("telemetry/post-ok.json");
    let device_id = register["id"].as_str().unwrap();

    // 1. Registro → 201 com id e mac ecoados.
    let expected = fixture("expected-http/register-ok.json");
    let (status, json) = send(&state, "POST", "/v1/devices", Some(&register)).await;
    assert_eq!(status.as_u16() as i64, expected["status"].as_i64().unwrap());
    assert_eq!(json["device"]["id"], expected["body_contains"]["device"]["id"]);
    assert_eq!(json["device"]["mac"], expected["body_contains"]["device"]["mac"]);

    // 2. Registro repetido → 409 (o firmware trata como sucesso).
    let expected = fixture("expected-http/register-duplicate.json");
    let (status, json) = send(&state, "POST", "/v1/devices", Some(&register)).await;
    assert_eq!(status.as_u16() as i64, expected["status"].as_i64().unwrap());
    assert_eq!(json, expected["body"]);

    // 3. Telemetria assinada → 200 accepted 1.
    let expected = fixture("expected-http/telemetry-ok.json");
    let (status, json) = send(&state, "POST", "/v1/telemetry", Some(&telemetry)).await;
    assert_eq!(status.as_u16() as i64, expected["status"].as_i64().unwrap());
    assert_eq!(json, expected["body"]);

    // 4. Mesma telemetria de novo → 200 accepted 1 (duplicata é sucesso).
    let expected = fixture("expected-http/telemetry-duplicate.json");
    let (status, json) = send(&state, "POST", "/v1/telemetry", Some(&telemetry)).await;
    assert_eq!(status.as_u16() as i64, expected["status"].as_i64().unwrap());
    assert_eq!(json, expected["body"]);

    // 5. Estado do SQLite confere com o fixture (e segue com UMA linha só).
    let expected_row = &fixture("expected-sqlite/telemetry-ok.json")["rows"][0];
    {
        let db = state.public_db.lock().unwrap();
        let count: i64 = db.query_row("SELECT COUNT(*) FROM telemetry", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 1);

        type RowTuple = (Vec<u8>, i64, i64, i64, f64, f64, f64, Option<f64>, f64, f64, i64);
        let row: RowTuple = db
            .query_row(
                "SELECT device_pubkey, seq, timestamp, key_version,
                        ph_plain, ec_plain, water_level_plain, temp_water_plain,
                        temp_ambient_plain, humidity_plain,
                        (ph_cipher IS NULL AND ec_cipher IS NULL AND water_level_cipher IS NULL
                         AND temp_water_cipher IS NULL AND temp_ambient_cipher IS NULL
                         AND humidity_cipher IS NULL)
                 FROM telemetry",
                [],
                |r| {
                    Ok((
                        r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?,
                        r.get(6)?, r.get(7)?, r.get(8)?, r.get(9)?, r.get(10)?,
                    ))
                },
            )
            .unwrap();

        assert_eq!(hex::encode(&row.0), expected_row["device_pubkey_hex"].as_str().unwrap());
        assert_eq!(row.1, expected_row["seq"].as_i64().unwrap());
        assert_eq!(row.2, expected_row["timestamp"].as_i64().unwrap());
        assert_eq!(row.3, expected_row["key_version"].as_i64().unwrap());
        assert_eq!(row.4, expected_row["ph_plain"].as_f64().unwrap());
        assert_eq!(row.5, expected_row["ec_plain"].as_f64().unwrap());
        assert_eq!(row.6, expected_row["water_level_plain"].as_f64().unwrap());
        assert!(row.7.is_none()); // temp_water nunca enviado pelo firmware
        assert_eq!(row.8, expected_row["temp_ambient_plain"].as_f64().unwrap());
        assert_eq!(row.9, expected_row["humidity_plain"].as_f64().unwrap());
        assert_eq!(row.10, 1); // todas as colunas _cipher NULL
    }

    // 6. Assinatura inválida → 207 com a mensagem exata.
    let bad = fixture("telemetry/post-bad-signature.json");
    let expected = fixture("expected-http/telemetry-bad-signature.json");
    let (status, json) = send(&state, "POST", "/v1/telemetry", Some(&bad)).await;
    assert_eq!(status.as_u16() as i64, expected["status"].as_i64().unwrap());
    assert_eq!(json, expected["body"]);

    // 8. Leitura pública: ph {"value":6.2}, tempWater null.
    let (status, json) =
        send(&state, "GET", &format!("/v1/devices/{device_id}/telemetry"), None).await;
    assert_eq!(status, StatusCode::OK);
    let reading = &json["readings"][0];
    assert_eq!(reading["seq"], 1);
    assert_eq!(reading["ph"]["value"], 6.2);
    assert_eq!(reading["ec"]["value"], 1800.0);
    assert_eq!(reading["waterLevel"]["value"], 80.0);
    assert_eq!(reading["tempWater"], Value::Null);
    assert_eq!(reading["tempAmbient"]["value"], 24.5);
    assert_eq!(reading["humidity"]["value"], 60.0);

    // Extra: GET por id e 404 com a mensagem exata do TS.
    let (status, json) = send(&state, "GET", &format!("/v1/devices/{device_id}"), None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["device"]["id"].as_str().unwrap(), device_id);

    let (status, json) =
        send(&state, "GET", &format!("/v1/devices/{}", "00".repeat(32)), None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(json["error"], "Device not found");
}

/// Batch fora dos limites (vazio ou >100) → 400, paridade com o Fastify.
#[tokio::test]
async fn telemetry_batch_limits_return_400() {
    let state = fresh_state();
    let (status, _) =
        send(&state, "POST", "/v1/telemetry", Some(&serde_json::json!({ "blocks": [] }))).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    let block = &fixture("telemetry/post-ok.json")["blocks"][0];
    let many: Vec<Value> = (0..101).map(|_| block.clone()).collect();
    let (status, _) =
        send(&state, "POST", "/v1/telemetry", Some(&serde_json::json!({ "blocks": many }))).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

/// O endpoint LOCAL registra devices no banco PRIVADO (assimetria proposital).
#[tokio::test]
async fn local_endpoint_uses_private_database() {
    let mut state = fresh_state();
    state.destination = Destination::Local;
    let register = fixture("devices/register-ok.json");

    let (status, _) = send(&state, "POST", "/v1/devices", Some(&register)).await;
    assert_eq!(status, StatusCode::CREATED);

    // Aparece no privado, não no público.
    let private_count: i64 = state
        .private_db.lock().unwrap()
        .query_row("SELECT COUNT(*) FROM devices", [], |r| r.get(0)).unwrap();
    let public_count: i64 = state
        .public_db.lock().unwrap()
        .query_row("SELECT COUNT(*) FROM devices", [], |r| r.get(0)).unwrap();
    assert_eq!(private_count, 1);
    assert_eq!(public_count, 0);

    // E a telemetria no destino local de um device publishTo=2 vai pro privado.
    let telemetry = fixture("telemetry/post-ok.json");
    let (status, json) = send(&state, "POST", "/v1/telemetry", Some(&telemetry)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(json["accepted"], 1);
    let rows: i64 = state
        .private_db.lock().unwrap()
        .query_row("SELECT COUNT(*) FROM telemetry", [], |r| r.get(0)).unwrap();
    assert_eq!(rows, 1);
}
