#pragma once
#include <Arduino.h>

enum Language { LANG_EN, LANG_PT, LANG_ES };

// Retorna a tradução para uma chave específica no idioma escolhido
String t(const char* key, Language lang);

// Auxiliar para converter string de formulário ("0", "1", "2") em enum Language
Language docToLang(String val);
