// Assinatura e verificação Ed25519 — RUST_MIGRATION_PLAN.md §7.2.
//
// O que se assina no Raiznet é a string `raw` pipe-delimited montada pelo
// firmware (não o JSON!). Ed25519 é determinístico: a mesma chave + mesma
// mensagem produz sempre a mesma assinatura — por isso dá para comparar
// byte a byte com o vetor gerado pelo TypeScript.

use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};

/// Assina `message` e devolve os 64 bytes da assinatura.
/// `&[u8]` = fatia de bytes emprestada; `[u8; 64]` = array de tamanho fixo.
pub fn sign(message: &[u8], key: &SigningKey) -> [u8; 64] {
    key.sign(message).to_bytes()
}

/// Verifica a assinatura contra a pubkey. Retorna bool (nunca panica):
/// pubkey malformada ou assinatura inválida → false.
///
/// `verify_strict` rejeita pontos de ordem baixa (chaves maliciosas);
/// assinaturas honestas do firmware (rweather/Crypto) e do libsodium
/// passam — provado pelo vetor abaixo.
pub fn verify(message: &[u8], signature: &[u8; 64], pubkey: &[u8; 32]) -> bool {
    // `let ... else` é um atalho: se from_bytes falhar, retorna false já.
    let Ok(vk) = VerifyingKey::from_bytes(pubkey) else {
        return false;
    };
    vk.verify_strict(message, &Signature::from_bytes(signature))
        .is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity::node_keypair_from_mnemonic;

    const MNEMONIC: &str = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
    const EXPECTED_SIG: &str = "2199c52836b4e4a314c1a051ca1f799624e9553ff6ae768d23d0f8287f68cc8c3405dc01f105a297769ff2a9fedc045ff0afefec3f47951cae2e87f059c71c08";

    #[test]
    fn signature_is_byte_identical_to_typescript() {
        let key = node_keypair_from_mnemonic(MNEMONIC).unwrap();
        let pubkey_hex = hex::encode(key.verifying_key().to_bytes());
        // format! interpola variáveis como template literal do JS.
        let raw = format!(
            "{pubkey_hex}|1|1700000000000|0|ec=1800|ph=6.20|waterLevel=80|tempAmbient=24.50|humidity=60.00"
        );
        let sig = sign(raw.as_bytes(), &key);
        assert_eq!(hex::encode(sig), EXPECTED_SIG);
        assert!(verify(raw.as_bytes(), &sig, &key.verifying_key().to_bytes()));
        assert!(!verify(raw.as_bytes(), &[0u8; 64], &key.verifying_key().to_bytes()));
    }
}
