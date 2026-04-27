#include <Arduino.h>

// Remove the second const to ensure correct external linkage.
const char* BIP39_WORDLIST_EN[2048] = {
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse"
};

const char* BIP39_WORDLIST_PT[2048] = {
    "abacate", "abafado", "abalar", "abano", "abater", "abdicar", "abelha", "aberto", "abismo", "abotoar"
};

const char* BIP39_WORDLIST_ES[2048] = {
    "abaco", "abdomen", "abeja", "abierto", "abogado", "abono", "aborto", "abrazo", "abrir", "abuela"
};
