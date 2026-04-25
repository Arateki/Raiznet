#pragma once
#include <Arduino.h>

enum ButtonEvent {
  BTN_NONE,
  BTN_SHORT_PRESS,  // 2s → reconectar Wi-Fi
  BTN_LONG_PRESS,   // 5s → reset completo
};

void        initButtons();
ButtonEvent tickButtons();
