#pragma once
#include <Arduino.h>

enum LedState {
  LED_BOOTING,          // amarelo fixo
  LED_PORTAL_OPEN,      // amarelo + vermelho alternando
  LED_WIFI_CONNECTING,  // amarelo piscando devagar
  LED_NORMAL,           // LEDs apagados (verde pisca ao enviar)
  LED_SERVER_OFFLINE,   // amarelo pisca a cada 5s
  LED_SENSOR_FAIL,      // vermelho pisca a cada 5s
  LED_RESET_SHORT,      // amarelo 2 piscadas rápidas
  LED_RESET_LONG,       // todos piscam vermelho 3x antes de reiniciar
};

void initLeds();
void setLedState(LedState s);
void tickLeds();
void blinkOnSend();  // pisca verde rapidamente após envio bem-sucedido
