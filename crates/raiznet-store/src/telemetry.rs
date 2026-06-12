// Operações sobre a tabela `telemetry` — paridade com o servidor TS.
//
// Cada sensor ocupa três colunas (_plain, _cipher, _nonce); NULL em todas
// significa "campo ausente nesta leitura". O insert usa INSERT OR IGNORE na
// PK (device_pubkey, seq): reenviar o mesmo bloco não duplica nem dá erro —
// o firmware depende dessa idempotência para retransmitir com segurança.

use crate::StoreError;
use rusqlite::{Connection, params};

/// As três colunas de um sensor. Option<T> = "pode estar ausente" (vira NULL
/// no banco) — o equivalente seguro do null/undefined do JS.
#[derive(Default, Clone)]
pub struct SensorColumns {
    pub plain: Option<f64>,
    pub cipher: Option<Vec<u8>>,
    pub nonce: Option<Vec<u8>>,
}

pub struct TelemetryInsert<'a> {
    pub device_pubkey: &'a [u8],
    pub seq: i64,
    pub timestamp: i64,
    pub received_at: i64,
    pub key_version: i64,
    pub ph: SensorColumns,
    pub ec: SensorColumns,
    pub water_level: SensorColumns,
    pub temp_water: SensorColumns,
    pub temp_ambient: SensorColumns,
    pub humidity: SensorColumns,
}

pub fn insert_telemetry(conn: &Connection, t: &TelemetryInsert) -> Result<(), StoreError> {
    conn.execute(
        "INSERT OR IGNORE INTO telemetry (
           device_pubkey, seq, timestamp, received_at, key_version,
           ph_plain, ph_cipher, ph_nonce,
           ec_plain, ec_cipher, ec_nonce,
           water_level_plain, water_level_cipher, water_level_nonce,
           temp_water_plain, temp_water_cipher, temp_water_nonce,
           temp_ambient_plain, temp_ambient_cipher, temp_ambient_nonce,
           humidity_plain, humidity_cipher, humidity_nonce
         ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)",
        params![
            t.device_pubkey, t.seq, t.timestamp, t.received_at, t.key_version,
            t.ph.plain, t.ph.cipher, t.ph.nonce,
            t.ec.plain, t.ec.cipher, t.ec.nonce,
            t.water_level.plain, t.water_level.cipher, t.water_level.nonce,
            t.temp_water.plain, t.temp_water.cipher, t.temp_water.nonce,
            t.temp_ambient.plain, t.temp_ambient.cipher, t.temp_ambient.nonce,
            t.humidity.plain, t.humidity.cipher, t.humidity.nonce
        ],
    )?;
    Ok(())
}

pub struct TelemetryRow {
    pub seq: i64,
    pub timestamp: i64,
    pub received_at: i64,
    pub ph: SensorColumns,
    pub ec: SensorColumns,
    pub water_level: SensorColumns,
    pub temp_water: SensorColumns,
    pub temp_ambient: SensorColumns,
    pub humidity: SensorColumns,
}

/// Paridade com devices.ts:169-186: ORDER BY timestamp DESC LIMIT 500.
/// O endpoint público não retorna nonces — a query nem os seleciona.
pub fn query_telemetry(
    conn: &Connection,
    device_pubkey: &[u8],
) -> Result<Vec<TelemetryRow>, StoreError> {
    let mut stmt = conn.prepare(
        "SELECT seq, timestamp, received_at,
                ph_plain, ph_cipher, ec_plain, ec_cipher,
                water_level_plain, water_level_cipher,
                temp_water_plain, temp_water_cipher,
                temp_ambient_plain, temp_ambient_cipher,
                humidity_plain, humidity_cipher
         FROM telemetry WHERE device_pubkey = ?1
         ORDER BY timestamp DESC LIMIT 500",
    )?;
    // Closure (função anônima) que agrupa plain+cipher em SensorColumns.
    let col = |plain: Option<f64>, cipher: Option<Vec<u8>>| SensorColumns {
        plain,
        cipher,
        nonce: None,
    };
    let rows = stmt
        .query_map(params![device_pubkey], |r| {
            Ok(TelemetryRow {
                seq: r.get(0)?,
                timestamp: r.get(1)?,
                received_at: r.get(2)?,
                ph: col(r.get(3)?, r.get(4)?),
                ec: col(r.get(5)?, r.get(6)?),
                water_level: col(r.get(7)?, r.get(8)?),
                temp_water: col(r.get(9)?, r.get(10)?),
                temp_ambient: col(r.get(11)?, r.get(12)?),
                humidity: col(r.get(13)?, r.get(14)?),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::devices::{NewDevice, insert_device};
    use crate::open_in_memory;

    const DEVICE: [u8; 32] = [0xAAu8; 32];

    /// Registra o device dono das leituras (FK exige que ele exista).
    fn register_device(conn: &Connection) {
        insert_device(
            conn,
            &NewDevice {
                pubkey: &DEVICE,
                mac: &[0x01u8; 6],
                owner_pubkey: &[0xBBu8; 32],
                owner_name: "tester",
                name: "Tower 01",
                device_type: 0,
                publish_to: 2,
                location: None,
                networks_json: "[]",
                local_servers_json: "[]",
                privacy_policy_json: "{}",
                hardware_json: "{}",
                created_at: 1,
            },
        )
        .unwrap();
    }

    fn reading(seq: i64, timestamp: i64) -> TelemetryInsert<'static> {
        TelemetryInsert {
            device_pubkey: &DEVICE,
            seq,
            timestamp,
            received_at: timestamp + 100,
            key_version: 0,
            ph: SensorColumns {
                plain: Some(6.2),
                cipher: None,
                nonce: None,
            },
            ec: SensorColumns {
                plain: Some(1800.0),
                cipher: None,
                nonce: None,
            },
            water_level: SensorColumns::default(),
            temp_water: SensorColumns::default(),
            temp_ambient: SensorColumns::default(),
            humidity: SensorColumns::default(),
        }
    }

    #[test]
    fn roundtrip_preserves_exact_f64_values() {
        let conn = open_in_memory().unwrap();
        register_device(&conn);
        insert_telemetry(&conn, &reading(1, 1_700_000_000_000)).unwrap();

        let rows = query_telemetry(&conn, &DEVICE).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].seq, 1);
        assert_eq!(rows[0].ph.plain, Some(6.2)); // f64 exato, sem arredondar
        assert_eq!(rows[0].ec.plain, Some(1800.0));
        assert!(rows[0].temp_water.plain.is_none()); // ausente = NULL = None
    }

    #[test]
    fn duplicate_seq_is_ignored_without_error() {
        let conn = open_in_memory().unwrap();
        register_device(&conn);
        insert_telemetry(&conn, &reading(1, 1000)).unwrap();
        // Mesmo (device, seq) com valores diferentes: o OR IGNORE descarta
        // silenciosamente — a primeira escrita vence (paridade com o TS).
        let mut second = reading(1, 9999);
        second.ph.plain = Some(0.0);
        insert_telemetry(&conn, &second).unwrap();

        let rows = query_telemetry(&conn, &DEVICE).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].timestamp, 1000);
        assert_eq!(rows[0].ph.plain, Some(6.2));
    }

    #[test]
    fn unknown_device_violates_foreign_key() {
        let conn = open_in_memory().unwrap();
        // Sem registrar o device: o INSERT deve falhar com erro de FK,
        // provando que o pragma foreign_keys = ON está ativo.
        let result = insert_telemetry(&conn, &reading(1, 1000));
        assert!(result.is_err());
    }

    #[test]
    fn query_orders_by_timestamp_desc_and_limits_to_500() {
        let conn = open_in_memory().unwrap();
        register_device(&conn);
        // 501 leituras com timestamps crescentes, inseridas fora de ordem.
        for seq in (1..=501).rev() {
            insert_telemetry(&conn, &reading(seq, 1000 + seq)).unwrap();
        }
        let rows = query_telemetry(&conn, &DEVICE).unwrap();
        assert_eq!(rows.len(), 500); // LIMIT 500: a mais antiga fica de fora
        assert_eq!(rows[0].timestamp, 1501); // mais recente primeiro
        assert_eq!(rows[499].timestamp, 1002);
    }
}
