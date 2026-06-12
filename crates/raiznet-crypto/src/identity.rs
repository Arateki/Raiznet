// Derivação de chaves de identidade — RUST_MIGRATION_PLAN.md §7.1.
//
// Existem DUAS derivações distintas em produção (e elas são incompatíveis
// entre si — a mesma frase gera chaves diferentes em cada uma):
//   (a) nó/servidor: BIP-39 padrão (PBKDF2) — igual a packages/crypto/keys.ts
//   (b) owner no firmware: SHA-256 da string do mnemonic — identity.cpp
// A unificação exige um ADR futuro; até lá, implementamos as duas.

use bip39::Mnemonic;
use ed25519_dalek::SigningKey;
use sha2::{Digest, Sha256};

/// Enum de erros deste crate. `thiserror` gera a implementação de Display
/// (a mensagem entre aspas) e as conversões automáticas (#[from]).
/// Em Rust, erros são valores retornados (Result), não exceções lançadas.
#[derive(Debug, thiserror::Error)]
pub enum CryptoError {
    #[error("invalid mnemonic: {0}")]
    InvalidMnemonic(#[from] bip39::Error),
    #[error("aead failure")]
    Aead,
}

/// Derivação (a) — idêntica a packages/crypto/src/keys.ts:
/// mnemonic BIP-39 → seed PBKDF2 de 64 bytes (passphrase vazia) →
/// primeiros 32 bytes → seed Ed25519.
///
/// `&str` é uma "fatia de string" emprestada (borrowed) — a função lê o
/// mnemonic sem tomar posse dele. `Result<A, B>` = sucesso A ou erro B.
pub fn node_keypair_from_mnemonic(mnemonic: &str) -> Result<SigningKey, CryptoError> {
    let m = Mnemonic::parse_normalized(mnemonic)?; // `?` propaga o erro se inválido
    let seed64 = m.to_seed_normalized(""); // PBKDF2-HMAC-SHA512, 2048 iterações
    // try_into converte a fatia [..32] em array fixo [u8; 32]; o expect nunca
    // dispara porque to_seed_normalized sempre retorna 64 bytes.
    let seed32: [u8; 32] = seed64[..32].try_into().expect("seed64 has 64 bytes");
    Ok(SigningKey::from_bytes(&seed32))
}

/// Derivação (b) — firmware identity.cpp generateOwnerIdentity:
/// SHA-256 da string UTF-8 do mnemonic → seed Ed25519. NÃO é BIP-39 padrão.
/// Não valida o mnemonic (o firmware também não) — qualquer string entra.
pub fn firmware_owner_keypair(mnemonic: &str) -> SigningKey {
    let seed: [u8; 32] = Sha256::digest(mnemonic.as_bytes()).into();
    SigningKey::from_bytes(&seed)
}

/// Gera um mnemonic BIP-39 novo de 12 palavras em inglês — igual ao
/// generateSeedPhrase() do TS (strength 128 bits = 12 palavras).
pub fn generate_mnemonic() -> String {
    Mnemonic::generate(12)
        .expect("12 is a valid word count")
        .to_string()
}

#[cfg(test)] // este módulo só é compilado ao rodar `cargo test`
mod tests {
    use super::*;
    const MNEMONIC: &str = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    #[test]
    fn node_derivation_matches_typescript_vector() {
        let key = node_keypair_from_mnemonic(MNEMONIC).unwrap();
        assert_eq!(
            hex::encode(key.verifying_key().to_bytes()),
            "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a"
        );
        assert_eq!(
            hex::encode(key.to_bytes()),
            "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1"
        );
    }

    #[test]
    fn firmware_owner_derivation_matches_firmware_vector() {
        let key = firmware_owner_keypair(MNEMONIC);
        assert_eq!(
            hex::encode(key.verifying_key().to_bytes()),
            "93a5f261984931e0df5c7434b16d468efb1953098d3cad4fa1506b9e052e7fc7"
        );
    }

    #[test]
    fn generated_mnemonic_is_valid_and_derivable() {
        let mnemonic = generate_mnemonic();
        assert_eq!(mnemonic.split_whitespace().count(), 12);
        // Um mnemonic recém-gerado precisa derivar sem erro.
        node_keypair_from_mnemonic(&mnemonic).unwrap();
    }
}
