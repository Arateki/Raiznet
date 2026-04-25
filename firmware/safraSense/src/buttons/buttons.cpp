#include "buttons.h"
#include "config.h"

static unsigned long pressStart = 0;
static bool          wasPressed = false;

void initButtons() {
  // INPUT_PULLUP = o pino lê HIGH quando solto e LOW quando pressionado.
  // O resistor interno do ESP32 faz esse pull-up sem componente externo.
  pinMode(PIN_BOOT_BUTTON, INPUT_PULLUP);
}

ButtonEvent tickButtons() {
  // LOW = pressionado (pull-up ativo)
  bool pressed = (digitalRead(PIN_BOOT_BUTTON) == LOW);
  unsigned long now = millis();

  if (pressed && !wasPressed) {
    pressStart = now;
    wasPressed = true;
  }

  if (!pressed && wasPressed) {
    wasPressed = false;
    unsigned long held = now - pressStart;
    if (held >= BTN_LONG_MS)  return BTN_LONG_PRESS;
    if (held >= BTN_SHORT_MS) return BTN_SHORT_PRESS;
  }

  return BTN_NONE;
}
