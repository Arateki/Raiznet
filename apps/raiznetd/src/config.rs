// Configuração por variáveis de ambiente — paridade de defaults com o TS
// (PUBLIC_PORT 3000, LOCAL_PORT 3001, DATA_DIR ./data), com o prefixo
// RAIZNET_ para não colidir com outras coisas no ambiente.

pub struct Config {
    pub public_port: u16,            // RAIZNET_PUBLIC_PORT, default 3000
    pub local_port: u16,             // RAIZNET_LOCAL_PORT,  default 3001
    pub data_dir: std::path::PathBuf, // RAIZNET_DATA_DIR,   default ./data
    pub log_level: String,           // RAIZNET_LOG_LEVEL,   default "info"
}

impl Config {
    pub fn from_env() -> Self {
        // Função genérica: lê a env var e tenta converter para o tipo T;
        // qualquer falha (ausente ou inválida) cai no default.
        fn var<T: std::str::FromStr>(name: &str, default: T) -> T {
            std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
        }
        Config {
            public_port: var("RAIZNET_PUBLIC_PORT", 3000),
            local_port: var("RAIZNET_LOCAL_PORT", 3001),
            data_dir: std::env::var("RAIZNET_DATA_DIR")
                .unwrap_or_else(|_| "./data".into())
                .into(),
            log_level: std::env::var("RAIZNET_LOG_LEVEL").unwrap_or_else(|_| "info".into()),
        }
    }
}
