// Operações sobre a tabela `devices` — paridade com apps/server/src/http/public/devices.ts.
//
// Os structs *Row representam linhas lidas do banco; NewDevice agrupa os
// parâmetros de inserção. Strings JSON (hardware, privacy_policy, networks)
// ficam cruas aqui — quem faz parse é a camada de cima, igual ao TS.

use crate::StoreError;
use rusqlite::{Connection, OptionalExtension, params};

pub struct DeviceRow {
    pub pubkey: Vec<u8>,
    pub mac: Vec<u8>,
    pub owner_pubkey: Vec<u8>,
    pub name: String,
    pub device_type: i64, // `type` é palavra reservada em Rust, daí o rename
    pub location: Option<i64>,
    pub status: i64,
    pub hardware: String, // JSON cru, parse no handler
    pub created_at: i64,
}

/// Subconjunto usado pela ingestão de telemetria (lookup + política).
pub struct DevicePolicyRow {
    pub pubkey: Vec<u8>,
    pub publish_to: i64,
    pub privacy_policy: String, // JSON cru
}

/// Parâmetros de registro. `&'a str`/`&'a [u8]` são referências emprestadas —
/// o struct não copia os dados, só aponta para eles enquanto durar a chamada
/// (o `'a` é o "lifetime", o tempo de vida do empréstimo).
pub struct NewDevice<'a> {
    pub pubkey: &'a [u8],
    pub mac: &'a [u8],
    pub owner_pubkey: &'a [u8],
    pub owner_name: &'a str,
    pub name: &'a str,
    pub device_type: i64,
    pub publish_to: i64,
    pub location: Option<i64>,
    pub networks_json: &'a str,
    pub local_servers_json: &'a str,
    pub privacy_policy_json: &'a str,
    pub hardware_json: &'a str,
    pub created_at: i64,
}

pub fn device_exists(conn: &Connection, pubkey: &[u8]) -> Result<bool, StoreError> {
    // .optional() transforma "nenhuma linha" em None em vez de erro.
    let found: Option<i64> = conn
        .query_row(
            "SELECT 1 FROM devices WHERE pubkey = ?1",
            params![pubkey],
            |r| r.get(0),
        )
        .optional()?;
    Ok(found.is_some())
}

pub fn insert_device(conn: &Connection, d: &NewDevice) -> Result<(), StoreError> {
    // Upsert do owner antes do device, igual a devices.ts:111-115 — permite
    // registrar um device sem um passo prévio de criação de usuário.
    conn.execute(
        "INSERT INTO users (pubkey, name, created_at) VALUES (?1, ?2, ?3)
         ON CONFLICT (pubkey) DO NOTHING",
        params![d.owner_pubkey, d.owner_name, d.created_at],
    )?;
    conn.execute(
        "INSERT INTO devices
           (pubkey, mac, owner_pubkey, name, type, publish_to, location,
            networks, local_servers, privacy_policy, hardware, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            d.pubkey,
            d.mac,
            d.owner_pubkey,
            d.name,
            d.device_type,
            d.publish_to,
            d.location,
            d.networks_json,
            d.local_servers_json,
            d.privacy_policy_json,
            d.hardware_json,
            d.created_at
        ],
    )?;
    Ok(())
}

const DEVICE_COLS: &str =
    "pubkey, mac, owner_pubkey, name, type, location, status, hardware, created_at";

fn row_to_device(r: &rusqlite::Row) -> rusqlite::Result<DeviceRow> {
    Ok(DeviceRow {
        pubkey: r.get(0)?,
        mac: r.get(1)?,
        owner_pubkey: r.get(2)?,
        name: r.get(3)?,
        device_type: r.get(4)?,
        location: r.get(5)?,
        status: r.get(6)?,
        hardware: r.get(7)?,
        created_at: r.get(8)?,
    })
}

pub fn get_device(conn: &Connection, pubkey: &[u8]) -> Result<Option<DeviceRow>, StoreError> {
    Ok(conn
        .query_row(
            &format!("SELECT {DEVICE_COLS} FROM devices WHERE pubkey = ?1"),
            params![pubkey],
            row_to_device,
        )
        .optional()?)
}

pub fn list_devices(conn: &Connection) -> Result<Vec<DeviceRow>, StoreError> {
    let mut stmt = conn.prepare(&format!("SELECT {DEVICE_COLS} FROM devices"))?;
    let rows = stmt
        .query_map([], row_to_device)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn get_device_policy(
    conn: &Connection,
    pubkey: &[u8],
) -> Result<Option<DevicePolicyRow>, StoreError> {
    Ok(conn
        .query_row(
            "SELECT pubkey, publish_to, privacy_policy FROM devices WHERE pubkey = ?1",
            params![pubkey],
            |r| {
                Ok(DevicePolicyRow {
                    pubkey: r.get(0)?,
                    publish_to: r.get(1)?,
                    privacy_policy: r.get(2)?,
                })
            },
        )
        .optional()?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::open_in_memory;

    /// Device de teste com os campos mínimos preenchidos.
    fn sample<'a>(pubkey: &'a [u8], mac: &'a [u8], owner: &'a [u8]) -> NewDevice<'a> {
        NewDevice {
            pubkey,
            mac,
            owner_pubkey: owner,
            owner_name: "tester",
            name: "Tower 01",
            device_type: 0,
            publish_to: 2,
            location: None,
            networks_json: "[]",
            local_servers_json: "[]",
            privacy_policy_json: "{}",
            hardware_json: "{}",
            created_at: 1_700_000_000_000,
        }
    }

    #[test]
    fn insert_get_list_roundtrip() {
        let conn = open_in_memory().unwrap();
        let pubkey = [0xAAu8; 32];
        let mac = [0x01u8; 6];
        let owner = [0xBBu8; 32];
        insert_device(&conn, &sample(&pubkey, &mac, &owner)).unwrap();

        assert!(device_exists(&conn, &pubkey).unwrap());
        assert!(!device_exists(&conn, &[0u8; 32]).unwrap());

        let row = get_device(&conn, &pubkey).unwrap().unwrap();
        assert_eq!(row.pubkey, pubkey);
        assert_eq!(row.mac, mac);
        assert_eq!(row.name, "Tower 01");
        assert_eq!(row.status, 0); // default do schema

        assert_eq!(list_devices(&conn).unwrap().len(), 1);
        assert!(get_device(&conn, &[0u8; 32]).unwrap().is_none());
    }

    #[test]
    fn owner_upsert_does_not_conflict_on_second_device() {
        let conn = open_in_memory().unwrap();
        let owner = [0xBBu8; 32];
        insert_device(&conn, &sample(&[0x01u8; 32], &[0x01u8; 6], &owner)).unwrap();
        // Mesmo owner, segundo device: o ON CONFLICT DO NOTHING evita erro.
        insert_device(&conn, &sample(&[0x02u8; 32], &[0x02u8; 6], &owner)).unwrap();
        assert_eq!(list_devices(&conn).unwrap().len(), 2);
    }

    #[test]
    fn policy_lookup_returns_raw_json() {
        let conn = open_in_memory().unwrap();
        let pubkey = [0xAAu8; 32];
        let mut d = sample(&pubkey, &[0x01u8; 6], &[0xBBu8; 32]);
        d.privacy_policy_json = r#"{"ph":{"default_disposition":1,"per_destination":{}}}"#;
        insert_device(&conn, &d).unwrap();

        let policy = get_device_policy(&conn, &pubkey).unwrap().unwrap();
        assert_eq!(policy.publish_to, 2);
        assert!(policy.privacy_policy.contains("default_disposition"));
    }
}
