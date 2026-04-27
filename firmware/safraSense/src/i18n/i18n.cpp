#include "i18n.h"

String t(const char* key, Language lang) {
  if (lang == LANG_PT) {
    if (strcmp(key, "setup_title") == 0) return "Configuração de Identidade";
    if (strcmp(key, "owner_id") == 0) return "ID do Proprietário (Público)";
    if (strcmp(key, "owner_secret") == 0) return "Mnemônico (12 palavras)";
    if (strcmp(key, "generate_btn") == 0) return "Gerar Nova Identidade";
    if (strcmp(key, "import_btn") == 0) return "Importar Identidade";
    if (strcmp(key, "security_warn") == 0) return "CUIDADO: Estas 12 palavras são sua chave mestra. Salve em local seguro e offline.";
    if (strcmp(key, "sensor_name") == 0) return "Nome do Sensor";
    if (strcmp(key, "ext_server") == 0) return "Servidor Externo (URL)";
    if (strcmp(key, "loc_server") == 0) return "Servidor Local (IP:Porta)";
  } else if (lang == LANG_ES) {
    if (strcmp(key, "setup_title") == 0) return "Configuración de Identidad";
    if (strcmp(key, "owner_id") == 0) return "ID del Propietario (Público)";
    if (strcmp(key, "owner_secret") == 0) return "Mnemónico (12 palabras)";
    if (strcmp(key, "generate_btn") == 0) return "Generar Nueva Identidad";
    if (strcmp(key, "import_btn") == 0) return "Importar Identidad";
    if (strcmp(key, "security_warn") == 0) return "CUIDADO: Guarde estas 12 palabras en un lugar seguro y offline.";
    if (strcmp(key, "sensor_name") == 0) return "Nombre del Sensor";
    if (strcmp(key, "ext_server") == 0) return "Servidor Externo (URL)";
    if (strcmp(key, "loc_server") == 0) return "Servidor Local (IP:Porta)";
  } else if (lang == LANG_JA) {
    if (strcmp(key, "setup_title") == 0) return "アイデンティティ設定";
    if (strcmp(key, "owner_id") == 0) return "オーナーID (公開)";
    if (strcmp(key, "owner_secret") == 0) return "ニーモニック (12語)";
    if (strcmp(key, "generate_btn") == 0) return "新しいアイデンティティを生成";
    if (strcmp(key, "import_btn") == 0) return "アイデンティティをインポート";
    if (strcmp(key, "security_warn") == 0) return "注意: この12語はマスターキーです。安全な場所にオフラインで保存してください。";
    if (strcmp(key, "sensor_name") == 0) return "センサー名";
    if (strcmp(key, "ext_server") == 0) return "外部サーバー (URL)";
    if (strcmp(key, "loc_server") == 0) return "ローカルサーバー (IP:ポート)";
  } else if (lang == LANG_ZH) {
    if (strcmp(key, "setup_title") == 0) return "身份设置";
    if (strcmp(key, "owner_id") == 0) return "所有者 ID (公开)";
    if (strcmp(key, "owner_secret") == 0) return "助记词 (12个单词)";
    if (strcmp(key, "generate_btn") == 0) return "生成新身份";
    if (strcmp(key, "import_btn") == 0) return "导入身份";
    if (strcmp(key, "security_warn") == 0) return "警告：这12个单词是您的主密钥。请安全地离线保存。";
    if (strcmp(key, "sensor_name") == 0) return "传感器名称";
    if (strcmp(key, "ext_server") == 0) return "外部服务器 (URL)";
    if (strcmp(key, "loc_server") == 0) return "本地服务器 (IP:端口)";
  } else {
    // Default EN
    if (strcmp(key, "setup_title") == 0) return "Identity Setup";
    if (strcmp(key, "owner_id") == 0) return "Owner ID (Public)";
    if (strcmp(key, "owner_secret") == 0) return "Mnemonic (12 words)";
    if (strcmp(key, "generate_btn") == 0) return "Generate New Identity";
    if (strcmp(key, "import_btn") == 0) return "Import Identity";
    if (strcmp(key, "security_warn") == 0) return "WARNING: These 12 words are your master key. Save them securely and offline.";
    if (strcmp(key, "sensor_name") == 0) return "Sensor Name";
    if (strcmp(key, "ext_server") == 0) return "External Server (URL)";
    if (strcmp(key, "loc_server") == 0) return "Local Server (IP:Port)";
  }
  return String(key);
}

Language docToLang(String val) {
  if (val == "1") return LANG_PT;
  if (val == "2") return LANG_ES;
  if (val == "3") return LANG_JA;
  if (val == "4") return LANG_ZH;
  return LANG_EN;
}
