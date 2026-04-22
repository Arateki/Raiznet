import Database from 'better-sqlite3'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

export function openPrivateDb(dataDir: string): Database.Database {
  mkdirSync(dataDir, { recursive: true })
  const db = new Database(join(dataDir, 'raiznet_private.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createTables(db)
  return db
}

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      pubkey     BLOB NOT NULL PRIMARY KEY,
      name       TEXT NOT NULL,
      phone      TEXT,
      email      TEXT,
      website    TEXT,
      bio        TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      pubkey                  BLOB    NOT NULL PRIMARY KEY,
      mac                     BLOB    NOT NULL,
      owner_pubkey            BLOB    NOT NULL REFERENCES users(pubkey),
      name                    TEXT    NOT NULL,
      type                    INTEGER NOT NULL,
      location                INTEGER,
      publish_to              INTEGER NOT NULL DEFAULT 0,
      networks                TEXT    NOT NULL DEFAULT '[]',
      local_servers           TEXT    NOT NULL DEFAULT '[]',
      encryption_key_version  INTEGER NOT NULL DEFAULT 0,
      privacy_policy          TEXT    NOT NULL DEFAULT '{}',
      hardware                TEXT    NOT NULL DEFAULT '{}',
      status                  INTEGER NOT NULL DEFAULT 0,
      created_at              INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telemetry (
      device_pubkey           BLOB    NOT NULL REFERENCES devices(pubkey),
      seq                     INTEGER NOT NULL,
      timestamp               INTEGER NOT NULL,
      received_at             INTEGER NOT NULL,
      key_version             INTEGER,
      ph_plain                REAL,    ph_cipher           BLOB,    ph_nonce           BLOB,
      ec_plain                REAL,    ec_cipher           BLOB,    ec_nonce           BLOB,
      water_level_plain       REAL,    water_level_cipher  BLOB,    water_level_nonce  BLOB,
      temp_water_plain        REAL,    temp_water_cipher   BLOB,    temp_water_nonce   BLOB,
      temp_ambient_plain      REAL,    temp_ambient_cipher BLOB,    temp_ambient_nonce BLOB,
      humidity_plain          REAL,    humidity_cipher     BLOB,    humidity_nonce     BLOB,
      PRIMARY KEY (device_pubkey, seq)
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_time
      ON telemetry (device_pubkey, timestamp);
  `)
}
