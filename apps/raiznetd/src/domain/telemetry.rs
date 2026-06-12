// Regras de ingestão de telemetria — paridade exata com
// apps/server/src/domain/telemetry.ts (seção 7.6 do plano).
//
// Ordem por bloco: lookup do device no banco do destino → verificação da
// assinatura sobre o `raw` → resolução da disposição por campo → projeção
// para colunas → INSERT OR IGNORE no(s) banco(s) conforme publish_to.

use crate::domain::errors::DomainError;
use crate::http::{AppState, Destination};
use raiznet_store::telemetry::{SensorColumns, TelemetryInsert, insert_telemetry};
use serde::Deserialize;
use std::collections::HashMap;

/// Um campo de sensor como chegou no wire: valor em claro, cifrado, ou ausente.
/// Enums em Rust carregam dados por variante — o `match` força tratar todos os casos.
pub enum SensorField {
    Plain(f64),
    Encrypted { cipher: Vec<u8>, nonce: Vec<u8> },
    Absent,
}

/// Bloco de telemetria já decodificado (hex → bytes, strings → números).
pub struct TelemetryBlock {
    pub device_id: [u8; 32],
    pub seq: i64,
    pub timestamp: i64,
    pub key_version: i64,
    pub ph: SensorField,
    pub ec: SensorField,
    pub water_level: SensorField,
    pub temp_water: SensorField,
    pub temp_ambient: SensorField,
    pub humidity: SensorField,
    pub signature: [u8; 64],
    pub raw: Vec<u8>,
}

// Valores numéricos do enum Disposition (device.proto / banco / wire).
const DISPOSITION_OMIT: u8 = 0;
const DISPOSITION_PLAIN: u8 = 1;
const DISPOSITION_ENCRYPTED: u8 = 2;

/// FieldPolicy como guardada na coluna privacy_policy (JSON).
#[derive(Deserialize, Default)]
struct FieldPolicy {
    default_disposition: u8,
    #[serde(default)]
    per_destination: HashMap<String, u8>,
}

/// `per_destination[<pubkey do servidor>] ?? default_disposition`;
/// campo sem política no JSON → omit. Paridade com resolveDisposition do TS.
fn resolve_disposition(policy: Option<&FieldPolicy>, server_pubkey_hex: &str) -> u8 {
    match policy {
        None => DISPOSITION_OMIT,
        Some(p) => *p.per_destination.get(server_pubkey_hex).unwrap_or(&p.default_disposition),
    }
}

/// Paridade com fieldToColumns do TS: um mismatch entre o que veio no wire e
/// o que a política permite resulta em colunas NULL, **silenciosamente** —
/// não é erro (ex.: valor plain chegando onde a política manda encrypted).
fn field_to_columns(field: &SensorField, disposition: u8) -> SensorColumns {
    match (field, disposition) {
        (SensorField::Plain(v), DISPOSITION_PLAIN) => {
            SensorColumns { plain: Some(*v), cipher: None, nonce: None }
        }
        (SensorField::Encrypted { cipher, nonce }, DISPOSITION_ENCRYPTED) => SensorColumns {
            plain: None,
            cipher: Some(cipher.clone()),
            nonce: Some(nonce.clone()),
        },
        _ => SensorColumns::default(), // tudo None → tudo NULL
    }
}

pub fn ingest_block(block: &TelemetryBlock, state: &AppState) -> Result<(), DomainError> {
    let device_id_hex = hex::encode(block.device_id);

    // 1. Lookup no banco do DESTINO (público → public_db, local → private_db).
    //    O lock vive só dentro deste bloco `{}` — solta antes da verificação.
    let policy_row = {
        let db = state.devices_db().lock().expect("db mutex");
        raiznet_store::devices::get_device_policy(&db, &block.device_id)?
            .ok_or_else(|| DomainError::DeviceNotFound(device_id_hex.clone()))?
    };

    // 2. Assinatura sobre os bytes do raw, contra a pubkey REGISTRADA no
    //    banco (coluna pubkey) — nunca contra a que veio no payload.
    let registered_pubkey: [u8; 32] = policy_row
        .pubkey
        .as_slice()
        .try_into()
        .map_err(|_| DomainError::InvalidPayload("stored pubkey".into()))?;
    if !raiznet_crypto::signing::verify(&block.raw, &block.signature, &registered_pubkey) {
        return Err(DomainError::InvalidSignature(device_id_hex));
    }

    // 3. Política de privacidade (JSON da coluna). Política ilegível → mapa
    //    vazio → tudo omit (paridade: o TS confiaria no JSON; default seguro).
    let policy: HashMap<String, FieldPolicy> =
        serde_json::from_str(&policy_row.privacy_policy).unwrap_or_default();
    let d = |name: &str| resolve_disposition(policy.get(name), &state.server_pubkey_hex);

    // 4. Projeção campo → colunas, com received_at do relógio do servidor.
    let insert = TelemetryInsert {
        device_pubkey: &block.device_id,
        seq: block.seq,
        timestamp: block.timestamp,
        received_at: crate::now_ms() as i64,
        key_version: block.key_version,
        ph: field_to_columns(&block.ph, d("ph")),
        ec: field_to_columns(&block.ec, d("ec")),
        water_level: field_to_columns(&block.water_level, d("water_level")),
        temp_water: field_to_columns(&block.temp_water, d("temp_water")),
        temp_ambient: field_to_columns(&block.temp_ambient, d("temp_ambient")),
        humidity: field_to_columns(&block.humidity, d("humidity")),
    };

    // 5. Paridade com telemetry.ts:132-140: o destino escolhe o banco.
    //    publish_to: 0=local_only 1=public 2=both. Um device incompatível com
    //    o destino é aceito sem inserir nada (conta como accepted — paridade).
    match state.destination {
        Destination::Public if policy_row.publish_to == 1 || policy_row.publish_to == 2 => {
            let db = state.public_db.lock().expect("db mutex");
            insert_telemetry(&db, &insert)?;
        }
        Destination::Local if policy_row.publish_to == 0 || policy_row.publish_to == 2 => {
            let db = state.private_db.lock().expect("db mutex");
            insert_telemetry(&db, &insert)?;
        }
        _ => {} // aceito sem inserir (paridade com o TS)
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use raiznet_store::devices::{NewDevice, insert_device};
    use std::sync::{Arc, Mutex};

    const SERVER_PUBKEY: &str = "ff00000000000000000000000000000000000000000000000000000000000000";

    /// Monta um AppState de teste com bancos em memória.
    fn state(destination: Destination) -> AppState {
        AppState {
            public_db: Arc::new(Mutex::new(raiznet_store::open_in_memory().unwrap())),
            private_db: Arc::new(Mutex::new(raiznet_store::open_in_memory().unwrap())),
            server_pubkey_hex: SERVER_PUBKEY.into(),
            destination,
        }
    }

    /// Registra um device assinante real (chave do vetor §7.1) nos DOIS bancos.
    fn register(state: &AppState, publish_to: i64, policy_json: &str) -> ([u8; 32], raiznet_crypto::SigningKey) {
        let key = raiznet_crypto::identity::node_keypair_from_mnemonic(
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        )
        .unwrap();
        let pubkey = key.verifying_key().to_bytes();
        for db in [&state.public_db, &state.private_db] {
            let conn = db.lock().unwrap();
            insert_device(
                &conn,
                &NewDevice {
                    pubkey: &pubkey,
                    mac: &[1u8; 6],
                    owner_pubkey: &[2u8; 32],
                    owner_name: "t",
                    name: "T",
                    device_type: 0,
                    publish_to,
                    location: None,
                    networks_json: "[]",
                    local_servers_json: "[]",
                    privacy_policy_json: policy_json,
                    hardware_json: "{}",
                    created_at: 1,
                },
            )
            .unwrap();
        }
        (pubkey, key)
    }

    /// Bloco assinado com ph plain 6.2.
    fn signed_block(pubkey: [u8; 32], key: &raiznet_crypto::SigningKey) -> TelemetryBlock {
        let raw = format!("{}|1|1700000000000|0|ph=6.20", hex::encode(pubkey));
        let signature = raiznet_crypto::signing::sign(raw.as_bytes(), key);
        TelemetryBlock {
            device_id: pubkey,
            seq: 1,
            timestamp: 1_700_000_000_000,
            key_version: 0,
            ph: SensorField::Plain(6.2),
            ec: SensorField::Absent,
            water_level: SensorField::Absent,
            temp_water: SensorField::Absent,
            temp_ambient: SensorField::Absent,
            humidity: SensorField::Absent,
            signature,
            raw: raw.into_bytes(),
        }
    }

    fn count_public_rows(state: &AppState) -> i64 {
        let db = state.public_db.lock().unwrap();
        db.query_row("SELECT COUNT(*) FROM telemetry", [], |r| r.get(0)).unwrap()
    }

    const ALL_PLAIN: &str = r#"{"ph":{"default_disposition":1,"per_destination":{}}}"#;

    #[test]
    fn local_only_device_on_public_endpoint_accepted_but_not_stored() {
        let st = state(Destination::Public);
        let (pubkey, key) = register(&st, 0, ALL_PLAIN); // 0 = local_only
        ingest_block(&signed_block(pubkey, &key), &st).unwrap(); // aceito...
        assert_eq!(count_public_rows(&st), 0); // ...mas nada armazenado
    }

    #[test]
    fn per_destination_overrides_default_disposition() {
        let st = state(Destination::Public);
        // default plain, mas para ESTE servidor: omit.
        let policy = format!(
            r#"{{"ph":{{"default_disposition":1,"per_destination":{{"{SERVER_PUBKEY}":0}}}}}}"#
        );
        let (pubkey, key) = register(&st, 2, &policy);
        ingest_block(&signed_block(pubkey, &key), &st).unwrap();

        let db = st.public_db.lock().unwrap();
        let ph: Option<f64> = db
            .query_row("SELECT ph_plain FROM telemetry WHERE seq = 1", [], |r| r.get(0))
            .unwrap();
        assert!(ph.is_none()); // o override por destino venceu o default
    }

    #[test]
    fn plain_value_with_encrypted_disposition_stores_null_silently() {
        let st = state(Destination::Public);
        let policy = r#"{"ph":{"default_disposition":2,"per_destination":{}}}"#; // 2 = encrypted
        let (pubkey, key) = register(&st, 2, policy);
        // O wire traz plain, a política exige encrypted: mismatch → NULL, sem erro.
        ingest_block(&signed_block(pubkey, &key), &st).unwrap();

        let db = st.public_db.lock().unwrap();
        let (ph, cipher): (Option<f64>, Option<Vec<u8>>) = db
            .query_row("SELECT ph_plain, ph_cipher FROM telemetry WHERE seq = 1", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap();
        assert!(ph.is_none());
        assert!(cipher.is_none());
    }

    #[test]
    fn invalid_signature_is_rejected_before_any_insert() {
        let st = state(Destination::Public);
        let (pubkey, key) = register(&st, 2, ALL_PLAIN);
        let mut block = signed_block(pubkey, &key);
        block.signature = [0u8; 64];
        let err = ingest_block(&block, &st).unwrap_err();
        assert!(matches!(err, DomainError::InvalidSignature(_)));
        assert_eq!(count_public_rows(&st), 0);
    }
}
