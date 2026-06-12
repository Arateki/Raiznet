// Rotas de devices — paridade com apps/server/src/http/public/devices.ts.
//
// As validações replicam o zod do TS; em falha, 400 {"error":"validation_error",
// "details":[...]} (o corpus valida só status e a chave error; o shape de
// details pode divergir do zod).

use super::AppState;
use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Deserialize)]
pub struct FieldPolicyIn {
    pub default_disposition: u8,
    #[serde(default)]
    pub per_destination: std::collections::HashMap<String, u8>,
}

/// Body do POST /v1/devices. rename_all = "camelCase" mapeia owner_pubkey ↔
/// "ownerPubkey" etc. `#[serde(default)]` aplica o default se o campo faltar.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterBody {
    pub id: String,
    pub mac: String,
    pub owner_pubkey: String,
    pub owner_name: Option<String>,
    pub name: String,
    #[serde(default)]
    pub r#type: i64, // `type` é palavra reservada; r# permite usá-la como nome
    #[serde(default = "default_publish_to")]
    pub publish_to: i64,
    pub location: Option<i64>,
    #[serde(default)]
    pub networks: Vec<String>,
    #[serde(default)]
    pub local_servers: Vec<String>,
    pub privacy_policy: Option<std::collections::HashMap<String, FieldPolicyIn>>,
    pub hardware: Option<Value>,
}

fn default_publish_to() -> i64 {
    1
}

/// Política default quando o body não traz nenhuma: tudo plain (disposition 1)
/// — igual a DEFAULT_PRIVACY_POLICY do TS.
fn default_privacy_policy() -> Value {
    let field = json!({ "default_disposition": 1, "per_destination": {} });
    json!({
        "ph": field, "ec": field, "water_level": field,
        "temp_water": field, "temp_ambient": field, "humidity": field
    })
}

/// Shape do device nas respostas — igual ao formatDevice do TS.
fn format_device(d: &raiznet_store::devices::DeviceRow) -> Value {
    json!({
        "id": hex::encode(&d.pubkey),
        "mac": hex::encode(&d.mac),
        "ownerPubkey": hex::encode(&d.owner_pubkey),
        "name": d.name,
        "type": d.device_type,
        "location": d.location,
        "status": d.status,
        "hardware": serde_json::from_str::<Value>(&d.hardware).unwrap_or_else(|_| json!({})),
        "createdAt": d.created_at,
    })
}

fn validation_error(details: Vec<String>) -> (StatusCode, Json<Value>) {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": "validation_error", "details": details })),
    )
}

pub async fn register(
    State(state): State<AppState>,
    // Recebemos Value e fazemos o parse manualmente para que um body
    // malformado vire 400 validation_error (como o zod do TS), e não o
    // 422 padrão do extractor Json<T> do axum.
    Json(value): Json<Value>,
) -> (StatusCode, Json<Value>) {
    let body: RegisterBody = match serde_json::from_value(value) {
        Ok(b) => b,
        Err(e) => return validation_error(vec![e.to_string()]),
    };

    let mut details = Vec::new();
    // unwrap_or_default: hex inválido vira vetor vazio, que reprova no
    // check de tamanho logo abaixo.
    let pubkey = hex::decode(&body.id).unwrap_or_default();
    let mac = hex::decode(&body.mac).unwrap_or_default();
    let owner = hex::decode(&body.owner_pubkey).unwrap_or_default();
    if body.id.len() != 64 || pubkey.len() != 32 {
        details.push("id must be 64 hex chars".into());
    }
    if body.mac.len() != 12 || mac.len() != 6 {
        details.push("mac must be 12 hex chars".into());
    }
    if body.owner_pubkey.len() != 64 || owner.len() != 32 {
        details.push("ownerPubkey must be 64 hex chars".into());
    }
    if body.name.is_empty() {
        details.push("name must not be empty".into());
    }
    if !(0..=2).contains(&body.r#type) {
        details.push("type must be 0..2".into());
    }
    if !(0..=2).contains(&body.publish_to) {
        details.push("publishTo must be 0..2".into());
    }
    if let Some(pp) = &body.privacy_policy {
        if pp
            .values()
            .any(|f| f.default_disposition > 2 || f.per_destination.values().any(|d| *d > 2))
        {
            details.push("disposition must be 0..2".into());
        }
    }
    if !details.is_empty() {
        return validation_error(details);
    }

    // Política: a do body (re-serializada) ou a default tudo-plain.
    let policy_json = body
        .privacy_policy
        .as_ref()
        .map(|pp| {
            serde_json::to_value(
                pp.iter()
                    .map(|(k, f)| {
                        (
                            k.clone(),
                            json!({
                                "default_disposition": f.default_disposition,
                                "per_destination": f.per_destination,
                            }),
                        )
                    })
                    .collect::<serde_json::Map<_, _>>(),
            )
            .expect("serializable")
        })
        .unwrap_or_else(default_privacy_policy);

    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::devices::device_exists(&db, &pubkey) {
        Ok(true) => {
            // O firmware trata este 409 como sucesso (registro lazy).
            return (StatusCode::CONFLICT, Json(json!({ "error": "device_already_exists" })));
        }
        Ok(false) => {}
        Err(_) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" })));
        }
    }

    let now = crate::now_ms() as i64;
    // Owner sem nome vira o prefixo da pubkey — paridade com devices.ts:115.
    let owner_name = body
        .owner_name
        .clone()
        .unwrap_or_else(|| body.owner_pubkey[..12].to_string());
    let new_device = raiznet_store::devices::NewDevice {
        pubkey: &pubkey,
        mac: &mac,
        owner_pubkey: &owner,
        owner_name: &owner_name,
        name: &body.name,
        device_type: body.r#type,
        publish_to: body.publish_to,
        location: body.location,
        networks_json: &serde_json::to_string(&body.networks).expect("serializable"),
        local_servers_json: &serde_json::to_string(&body.local_servers).expect("serializable"),
        privacy_policy_json: &policy_json.to_string(),
        hardware_json: &body.hardware.clone().unwrap_or_else(|| json!({})).to_string(),
        created_at: now,
    };
    if raiznet_store::devices::insert_device(&db, &new_device).is_err() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" })));
    }
    let row = raiznet_store::devices::get_device(&db, &pubkey)
        .ok()
        .flatten()
        .expect("just inserted");
    (StatusCode::CREATED, Json(json!({ "device": format_device(&row) })))
}

pub async fn list(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::devices::list_devices(&db) {
        Ok(rows) => (
            StatusCode::OK,
            Json(json!({ "devices": rows.iter().map(format_device).collect::<Vec<_>>() })),
        ),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }
}

pub async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> (StatusCode, Json<Value>) {
    let pubkey = hex::decode(&id).unwrap_or_default();
    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::devices::get_device(&db, &pubkey) {
        Ok(Some(row)) => (StatusCode::OK, Json(json!({ "device": format_device(&row) }))),
        // Mensagem com espaço e maiúscula mesmo — é o contrato do TS.
        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({ "error": "Device not found" }))),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }
}

/// Um campo na resposta de leitura: {"value":x} | {"encrypted":"hex"} | null.
fn format_field(c: &raiznet_store::telemetry::SensorColumns) -> Value {
    match (&c.plain, &c.cipher) {
        (Some(v), _) => json!({ "value": v }),
        (None, Some(b)) => json!({ "encrypted": hex::encode(b) }),
        (None, None) => Value::Null,
    }
}

pub async fn telemetry_history(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> (StatusCode, Json<Value>) {
    let pubkey = hex::decode(&id).unwrap_or_default();
    let db = state.devices_db().lock().expect("db mutex");
    match raiznet_store::telemetry::query_telemetry(&db, &pubkey) {
        Ok(rows) => {
            let readings: Vec<Value> = rows
                .iter()
                .map(|r| {
                    json!({
                        "seq": r.seq, "timestamp": r.timestamp, "receivedAt": r.received_at,
                        "ph": format_field(&r.ph), "ec": format_field(&r.ec),
                        "waterLevel": format_field(&r.water_level),
                        "tempWater": format_field(&r.temp_water),
                        "tempAmbient": format_field(&r.temp_ambient),
                        "humidity": format_field(&r.humidity),
                    })
                })
                .collect();
            (StatusCode::OK, Json(json!({ "readings": readings })))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "internal" }))),
    }
}
