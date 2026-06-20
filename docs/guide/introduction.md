---
description: A Raiznet é uma rede descentralizada de monitoramento de cultivo e inteligência agrícola coletiva, local-first e soberana, baseada em dados assinados.
---

# Introdução

A Raiznet é uma rede descentralizada para monitoramento de cultivo e inteligência agrícola coletiva. Faz parte do produto **SafraSense**, da Arateki. Os dados fluem de sensores ESP32 instalados em torres de cultivo até uma malha de nós servidores, e podem ser lidos por qualquer membro da rede — com ou sem nó próprio. Os nós são projetados para sincronizar entre si ponto a ponto; veja o [Roadmap](/guide/roadmap) sobre o que está implementado hoje versus em design.

Além do monitoramento, a Raiznet é projetada como uma infraestrutura de dados de qualidade científica. Cada leitura é assinada, à prova de adulteração, geolocalizada e vinculada ao resultado de uma safra. Com o tempo, isso cria um conjunto de dados coletivo que LLMs e pesquisadores podem transformar em conhecimento acionável: melhores parâmetros de cultivo, calibrações regionais e publicações científicas — sem dono, disponíveis para todos. Veja [Inteligência coletiva](/guide/intelligence) para a visão completa.

## Princípios inegociáveis

1. **Local-first.** A rede funciona sem internet. Um ESP32 e um notebook no mesmo Wi-Fi já formam uma Raiznet válida.
2. **Soberania de dados.** O usuário é dono das chaves. Se a Arateki desaparecer amanhã, os dados do agricultor continuam vivos no seu nó.
3. **Sem login tradicional.** A identidade é um par de chaves Ed25519 gerado no cliente. Não há servidor de autenticação central.
4. **O ID do dispositivo é sempre público.** A única informação garantidamente pública é a existência de um dispositivo na rede — sua pubkey, MAC e metadados básicos. Todo o resto tem uma política de visibilidade individual definida pelo dono.
5. **Dado privado é dado local.** O que é marcado como público fica elegível para replicação pela rede. O que é marcado como privado permanece no armazenamento local — nunca sai da infraestrutura do dono.
6. **Rede pública ou rede local.** A Raiznet pública é a malha global de nós públicos. Uma "rede privada" é uma rede local: o servidor não se anuncia, apenas aceita conexões da LAN.
7. **Escritas são sempre assinadas.** Ler é consequência de pertencer à rede. Escrever exige a chave privada do dispositivo emissor — evita spam sem depender de permissão central.
8. **O servidor é opcional.** Ninguém é obrigado a rodar um nó. Mas quem roda fortalece a rede.

## O que a Raiznet não é

- Um serviço em nuvem. Não há servidor operado pela Raiznet em que você precise confiar.
- Uma blockchain. Não há consenso global, mineração nem tokens.
- Uma plataforma IoT tradicional. Não há lock-in de fornecedor, chave de API obrigatória nem limites de uso.

## Parte do SafraSense

A Raiznet é a **camada aberta de protocolo e rede** do SafraSense. O firmware de produção do hardware da Arateki vive em um repositório separado. Este repositório contém:

- A especificação do protocolo e o formato de fio (este site)
- A implementação do servidor em Node.js
- O firmware ESP32 de referência (`firmware/`)
- A CLI para operação e depuração
