// AES-256-GCM dos campos `encrypted` — RUST_MIGRATION_PLAN.md §7.3.
//
// Formato de packages/crypto/src/symmetric.ts:
//   plaintext = o valor do sensor como float32 big-endian (4 bytes)
//   nonce     = 12 bytes aleatórios por campo
//   cipher    = ciphertext ‖ tag (tag GCM de 16 bytes posfixado — default do crate)
//
// O servidor NUNCA decifra — só armazena cipher/nonce. Decifrar é papel do
// app do owner. As duas funções vivem aqui para testes e para o app futuro.

use crate::identity::CryptoError;
use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};

/// Resultado de cifrar um campo. `Vec<u8>` é um vetor de bytes dinâmico
/// (dono dos dados, como um Buffer do Node).
pub struct EncryptedField {
    pub cipher: Vec<u8>, // ciphertext ‖ tag(16) — formato do symmetric.ts
    pub nonce: [u8; 12],
}

pub fn encrypt_field(value: f32, key: &[u8; 32]) -> Result<EncryptedField, CryptoError> {
    let aead = Aes256Gcm::new(key.into());
    // Nonce novo do gerador do SO a cada chamada — nunca reutilizar nonce com a mesma chave.
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let cipher = aead
        .encrypt(&nonce, value.to_be_bytes().as_slice()) // to_be_bytes = big-endian
        .map_err(|_| CryptoError::Aead)?;
    Ok(EncryptedField {
        cipher,
        nonce: nonce.into(),
    })
}

pub fn decrypt_field(
    cipher_and_tag: &[u8],
    nonce: &[u8; 12],
    key: &[u8; 32],
) -> Result<f32, CryptoError> {
    let aead = Aes256Gcm::new(key.into());
    let plain = aead
        .decrypt(Nonce::from_slice(nonce), cipher_and_tag)
        .map_err(|_| CryptoError::Aead)?; // tag inválida (dado adulterado) cai aqui
    let bytes: [u8; 4] = plain.as_slice().try_into().map_err(|_| CryptoError::Aead)?;
    Ok(f32::from_be_bytes(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decrypts_typescript_vector() {
        let key = [0x11u8; 32]; // [valor; N] repete o valor N vezes
        let nonce = [0x22u8; 12];
        let cipher = hex::decode("5731612f87cc0d953260cd9674bc34ffe5f3caea").unwrap();
        let value = decrypt_field(&cipher, &nonce, &key).unwrap();
        // floats não se comparam com == por causa de arredondamento.
        assert!((value - 6.2).abs() < 1e-6);
    }

    #[test]
    fn roundtrip() {
        let key = [0x07u8; 32];
        let f = encrypt_field(3.75, &key).unwrap();
        assert_eq!(decrypt_field(&f.cipher, &f.nonce, &key).unwrap(), 3.75);
    }

    #[test]
    fn tampered_cipher_fails_authentication() {
        let key = [0x07u8; 32];
        let mut f = encrypt_field(3.75, &key).unwrap();
        f.cipher[0] ^= 0x01; // vira um bit do ciphertext
        assert!(decrypt_field(&f.cipher, &f.nonce, &key).is_err());
    }
}
