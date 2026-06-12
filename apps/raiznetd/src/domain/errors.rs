// Erros de domínio — paridade com apps/server/src/domain/errors.ts.
//
// ATENÇÃO: as strings de Display (entre aspas no #[error]) SÃO CONTRATO.
// Elas viajam no campo errors[].error da resposta 207 e o corpus de
// fixtures as compara byte a byte. Não reformule as mensagens.

#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("Device not found: {0}")]
    DeviceNotFound(String),
    #[error("Invalid signature for device {0}")]
    InvalidSignature(String),
    #[error("Invalid payload: {0}")]
    InvalidPayload(String),
    #[error("Raw/JSON mismatch for device {0}")]
    RawMismatch(String),
    #[error("storage failure")]
    Store(#[from] raiznet_store::StoreError),
}
