// Identidade do nó em disco — compatível byte a byte com o servidor TS
// (apps/server/src/identity.ts): o arquivo <data_dir>/identity.mnemonic
// guarda a frase BIP-39 em texto puro, uma linha, permissão 0600.
// Migrar um nó de TS para Rust preserva a identidade (mesma pubkey).

use std::fs;
use std::io::Write;
use std::os::unix::fs::OpenOptionsExt; // .mode() em OpenOptions (só Unix)
use std::path::Path;

use raiznet_crypto::SigningKey;
use raiznet_crypto::identity::{generate_mnemonic, node_keypair_from_mnemonic};

pub struct NodeIdentity {
    pub signing_key: SigningKey,
    // Ainda não lido fora dos testes; mantido por paridade com o
    // ServerIdentity do TS (o app vai precisar exibir/exportar a frase).
    #[allow(dead_code)]
    pub mnemonic: String,
}

impl NodeIdentity {
    /// Pubkey do nó em hex minúsculo — é o ID do servidor na rede.
    pub fn pubkey_hex(&self) -> String {
        hex::encode(self.signing_key.verifying_key().to_bytes())
    }
}

/// Carrega a identidade de <data_dir>/identity.mnemonic, criando uma nova
/// se o arquivo não existir — mesmo comportamento do loadOrCreateIdentity TS.
pub fn load_or_create_identity(data_dir: &Path) -> anyhow::Result<NodeIdentity> {
    fs::create_dir_all(data_dir)?;
    let path = data_dir.join("identity.mnemonic");

    if path.exists() {
        // .trim() tolera newline/espaços extras, igual ao TS.
        let mnemonic = fs::read_to_string(&path)?.trim().to_string();
        let signing_key = node_keypair_from_mnemonic(&mnemonic)?;
        return Ok(NodeIdentity { signing_key, mnemonic });
    }

    let mnemonic = generate_mnemonic();
    let signing_key = node_keypair_from_mnemonic(&mnemonic)?;

    // create_new(true) falha se o arquivo já existir (evita sobrescrever uma
    // identidade por acidente em corrida); mode(0o600) = só o dono lê/escreve,
    // aplicado já na criação — o arquivo nunca existe com permissão aberta.
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(0o600)
        .open(&path)?;
    // Texto puro, sem newline final — formato exato do writeFileSync do TS.
    file.write_all(mnemonic.as_bytes())?;

    Ok(NodeIdentity { signing_key, mnemonic })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;

    #[test]
    fn creates_and_reloads_same_identity() {
        let dir = tempfile::tempdir().unwrap();
        let first = load_or_create_identity(dir.path()).unwrap();
        let second = load_or_create_identity(dir.path()).unwrap();
        // Recarregar do mesmo arquivo tem que dar a mesma chave.
        assert_eq!(first.pubkey_hex(), second.pubkey_hex());
        assert_eq!(first.mnemonic, second.mnemonic);
    }

    #[test]
    fn file_has_0600_permissions_and_no_trailing_newline() {
        let dir = tempfile::tempdir().unwrap();
        let identity = load_or_create_identity(dir.path()).unwrap();
        let path = dir.path().join("identity.mnemonic");

        let mode = fs::metadata(&path).unwrap().permissions().mode();
        assert_eq!(mode & 0o777, 0o600);

        let contents = fs::read_to_string(&path).unwrap();
        assert_eq!(contents, identity.mnemonic); // sem \n no final, igual ao TS
    }

    #[test]
    fn loads_identity_written_by_typescript_server() {
        // Simula um data dir criado pelo servidor TS: mnemonic conhecido no
        // arquivo. O Rust deve derivar exatamente a mesma pubkey (vetor §7.1).
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("identity.mnemonic"),
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
        )
        .unwrap();
        let identity = load_or_create_identity(dir.path()).unwrap();
        assert_eq!(
            identity.pubkey_hex(),
            "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a"
        );
    }

    #[test]
    fn tolerates_trailing_newline_in_existing_file() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(
            dir.path().join("identity.mnemonic"),
            "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about\n",
        )
        .unwrap();
        let identity = load_or_create_identity(dir.path()).unwrap();
        assert_eq!(
            identity.pubkey_hex(),
            "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a"
        );
    }
}
