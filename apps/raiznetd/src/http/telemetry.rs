// POST /v1/telemetry — handler fino: decodifica o JSON e delega cada bloco
// para domain::telemetry::ingest_block. Paridade com http/public/telemetry.ts.

use super::AppState;
use crate::domain::errors::DomainError;
use crate::domain::telemetry::{SensorField, TelemetryBlock, ingest_block};
use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Deserialize)]
pub struct SensorFieldInput {
    pub plain: Option<f64>,
    pub cipher: Option<String>,
    pub nonce: Option<String>,
}

/// Um bloco como chega no wire. ATENÇÃO: seq e timestamp são STRINGS no JSON
/// (o firmware serializa uint64 como string para não perder precisão).
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockInput {
    pub device_id: String,
    pub seq: String,
    pub timestamp: String,
    pub key_version: i64,
    pub ph: Option<SensorFieldInput>,
    pub ec: Option<SensorFieldInput>,
    pub water_level: Option<SensorFieldInput>,
    pub temp_water: Option<SensorFieldInput>,
    pub temp_ambient: Option<SensorFieldInput>,
    pub humidity: Option<SensorFieldInput>,
    pub signature: String,
    pub raw: String,
}

#[derive(Deserialize)]
pub struct TelemetryBody {
    pub blocks: Vec<BlockInput>,
}

/// Paridade com parseField do TS: plain tem prioridade; cipher precisa vir
/// com nonce; qualquer outra coisa (inclusive hex inválido) vira Absent.
fn parse_field(f: &Option<SensorFieldInput>) -> SensorField {
    match f {
        None => SensorField::Absent,
        Some(f) => {
            if let Some(v) = f.plain {
                return SensorField::Plain(v);
            }
            if let (Some(c), Some(n)) = (&f.cipher, &f.nonce) {
                if let (Ok(cipher), Ok(nonce)) = (hex::decode(c), hex::decode(n)) {
                    return SensorField::Encrypted { cipher, nonce };
                }
            }
            SensorField::Absent
        }
    }
}

/// Decodifica os campos hex/string do bloco. Divergência aceita (§7.7 item 8):
/// hex malformado vira erro por bloco aqui; o TS truncaria silenciosamente —
/// o firmware nunca envia hex malformado, o corpus não cobre esse caso.
fn parse_block(b: &BlockInput) -> Result<TelemetryBlock, DomainError> {
    let device_id: [u8; 32] = hex::decode(&b.device_id)
        .ok()
        .and_then(|v| v.try_into().ok())
        .ok_or_else(|| DomainError::InvalidPayload("deviceId".into()))?;
    let signature: [u8; 64] = hex::decode(&b.signature)
        .ok()
        .and_then(|v| v.try_into().ok())
        .ok_or_else(|| DomainError::InvalidPayload("signature".into()))?;
    let raw = hex::decode(&b.raw).map_err(|_| DomainError::InvalidPayload("raw".into()))?;
    // str::parse::<i64> rejeita números acima de i64::MAX — o SQLite INTEGER é i64.
    let seq: i64 = b
        .seq
        .parse()
        .map_err(|_| DomainError::InvalidPayload("seq".into()))?;
    let timestamp: i64 = b
        .timestamp
        .parse()
        .map_err(|_| DomainError::InvalidPayload("timestamp".into()))?;
    Ok(TelemetryBlock {
        device_id,
        seq,
        timestamp,
        key_version: b.key_version,
        ph: parse_field(&b.ph),
        ec: parse_field(&b.ec),
        water_level: parse_field(&b.water_level),
        temp_water: parse_field(&b.temp_water),
        temp_ambient: parse_field(&b.temp_ambient),
        humidity: parse_field(&b.humidity),
        signature,
        raw,
    })
}

pub async fn ingest(
    State(state): State<AppState>,
    Json(value): Json<Value>,
) -> (StatusCode, Json<Value>) {
    // Parse manual para que body malformado vire 400 (como o schema do
    // Fastify no TS), não o 422 do extractor tipado do axum.
    let body: TelemetryBody = match serde_json::from_value(value) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "blocks must have 1..100 items" })),
            );
        }
    };
    if body.blocks.is_empty() || body.blocks.len() > 100 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "blocks must have 1..100 items" })),
        );
    }

    let mut errors: Vec<Value> = Vec::new();
    for b in &body.blocks {
        // and_then encadeia: só ingere se o parse deu certo.
        let result = parse_block(b).and_then(|block| ingest_block(&block, &state));
        match result {
            Ok(()) => {}
            // Falha de storage é problema do servidor, não do bloco → 500.
            Err(DomainError::Store(e)) => {
                tracing::error!(error = %e, "telemetry storage failure");
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "internal" })),
                );
            }
            // Erros de domínio entram em errors[] com o seq ORIGINAL (string).
            Err(e) => errors.push(json!({ "seq": b.seq, "error": e.to_string() })),
        }
    }

    let accepted = body.blocks.len() - errors.len();
    // Tudo ok → 200; qualquer falha por bloco → 207 (nunca 404!).
    let status = if errors.is_empty() {
        StatusCode::OK
    } else {
        StatusCode::MULTI_STATUS
    };
    (
        status,
        Json(json!({ "accepted": accepted, "errors": errors })),
    )
}
