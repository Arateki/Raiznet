// raiznet-crypto — chaves, assinaturas e cifra simétrica do Raiznet.
//
// Três responsabilidades, uma por módulo:
//   identity  → derivação de chaves Ed25519 a partir de mnemonics (BIP-39 e firmware)
//   signing   → assinatura/verificação Ed25519 da string `raw` da telemetria
//   symmetric → AES-256-GCM dos campos com disposição `encrypted`
//
// Todos os algoritmos foram validados contra vetores gerados pelo código
// TypeScript real (test-fixtures/identity/vectors.json) — se um teste de vetor
// falhar, o erro está na implementação nova, nunca no vetor.

pub mod identity;
pub mod signing;
pub mod symmetric;

// Reexporta o tipo de chave para os consumidores (raiznetd) não precisarem
// depender de ed25519-dalek diretamente — a escolha da lib de curva fica
// encapsulada neste crate.
pub use ed25519_dalek::SigningKey;
