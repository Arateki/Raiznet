---
description: Como a Raiznet transforma dados de sensores em conhecimento agrícola — inferência local com LLMs, inteligência regional, calibração coletiva e pesquisa.
---

# Inteligência coletiva

Um dos propósitos centrais da Raiznet é transformar dados brutos de sensores em conhecimento agrícola acionável — não só para o agricultor individual, mas para toda a rede.

Cada dispositivo que publica em uma rede pública contribui para um conjunto de dados compartilhado e crescente: o que foi plantado, onde, sob quais condições e qual foi o resultado. Com o tempo, esse conjunto se torna uma memória coletiva do que funciona em cada região, para cada cultivo, sob cada padrão de clima.

## A camada de inteligência (planejada)

A camada de inteligência é uma fase futura construída sobre a infraestrutura de dados já existente. Ela não exige mudanças no protocolo nem no modelo de armazenamento — os dados já estão lá.

### Inferência local (preservando privacidade)

Um agricultor que roda o próprio nó pode apontar qualquer LLM compatível com MCP — inclusive modelos locais via [Ollama](https://ollama.com) — diretamente para o endpoint local do seu servidor. O modelo tem acesso a:

- Histórico completo de telemetria (incluindo campos privados, descriptografados localmente)
- Safra ativa: tipo de cultivo, data de plantio, colheita esperada
- Cultivo com faixas ideais ajustadas
- Resultados históricos (`yield_kg`, `harvested_at`)

Exemplos de perguntas que o LLM pode responder só com dados locais:
- "Como está minha alface comparada ao mês passado?"
- "Meu pH vem subindo há 3 dias — o que devo ajustar?"
- "Com base nas minhas últimas 4 colheitas, qual é minha produtividade média para essa variedade?"
- "Dada a temperatura ambiente atual, devo ajustar minha meta de EC?"

Nenhum dado sai da rede local. A inferência é totalmente offline.

### Inteligência regional (rede pública)

Nós que participam de uma rede pública podem consultar dados agregados de todos os dispositivos na mesma região H3 e tipo de cultivo. Isso habilita:

- **Benchmarking contextual**: "Seu EC está em 2.4 — a mediana para alface na sua região é 1.8."
- **Detecção de anomalias**: sinalizar leituras que desviam significativamente do padrão regional, distinguindo deriva de sensor de estresse real do cultivo.
- **Refinamento da previsão de colheita**: aprender com a diferença entre o `harvest_time_days` estimado e o real ao longo de muitas Safras em condições semelhantes, melhorando estimativas futuras automaticamente.

### Calibração coletiva de Cultivos

Se agricultores de uma região operam consistentemente fora das faixas ideais de um Cultivo e ainda assim obtêm bom `yield_kg`, as faixas desse Cultivo provavelmente estão erradas para aquela região. Esse sinal alimenta naturalmente o modelo de `CropCatalog`: curadores regionais (cooperativas, instituições de pesquisa) publicam catálogos atualizados com faixas calibradas a partir dos resultados observados.

A rede gera o conhecimento. Os curadores o publicam. Os agricultores ativam o catálogo. Nenhuma autoridade central decide.

### Servidor MCP

Um pacote `@raiznet/mcp` planejado vai expor a API da Raiznet como um servidor MCP (Model Context Protocol), tornando os dados da Raiznet nativamente consumíveis por qualquer cliente LLM compatível com MCP:

| Ferramenta | Descrição |
|---|---|
| `get_devices` | Lista os dispositivos conhecidos por este nó |
| `get_telemetry` | Busca leituras recentes de um dispositivo |
| `get_safra` | Obtém o lote de plantio ativo e detalhes do cultivo |
| `get_regional_stats` | Estatísticas agregadas para uma célula H3 e tipo de cultivo |
| `get_crop` | Faixas ideais de um Cultivo, ajustadas para as condições atuais |

O servidor MCP pode rodar em dois modos:
- **Modo local** (sobre o endpoint local): acesso completo incluindo campos privados, para o assistente LLM pessoal do dono.
- **Modo público** (sobre o endpoint público): acesso somente-leitura aos dados públicos, para qualquer participante da rede ou pesquisador.

## Pesquisa acadêmica e publicação de conhecimento

A Raiznet é projetada para ser uma infraestrutura de dados de qualidade científica. A combinação de dados assinados e à prova de adulteração, geolocalização precisa (H3), resultados estruturados de cultivo (Safra) e um protocolo aberto cria um conjunto de dados com propriedades que importam para o trabalho científico: proveniência, reprodutibilidade e acessibilidade sem lock-in de fornecedor.

O trabalho futuro planejado inclui:

- **Parcerias de pesquisa**: disponibilizar conjuntos de dados da Raiznet anonimizados e agregados para universidades, instituições de pesquisa agrícola (como a Embrapa) e cooperativas, para publicação em periódicos revisados por pares e relatórios técnicos.
- **Publicação de conteúdo na rede**: o modelo de dados `Material` é projetado para distribuir conteúdo instrucional e científico — guias de cultivo, resultados de estudos de campo, boas práticas regionais — diretamente pela rede, de autoria assinada por pesquisadores, acessível offline.
- **Liberações de datasets abertos**: snapshots periódicos dos dados de redes públicas disponibilizados sob licenças abertas para a comunidade de pesquisa mais ampla, possibilitando trabalhos sobre temas como adaptação climática regional, otimização hidropônica e resiliência de sistemas alimentares de pequena escala.

O objetivo é um ciclo de feedback: agricultores geram dados, pesquisadores os analisam, as descobertas retornam à rede como Cultivos e Materiais melhorados, os agricultores se beneficiam. Nenhum intermediário captura o valor.

## Por que isso importa

O conhecimento agrícola historicamente esteve trancado em plataformas proprietárias, artigos acadêmicos inacessíveis a pequenos agricultores, ou na cabeça de agrônomos individuais. A estrutura da Raiznet — protocolo aberto, local-first, soberania de dados, indexada por H3, com resultados rastreados — cria as condições para que esse conhecimento emerja da própria rede, sem dono, disponível para todos.

Rodar um nó não é só contribuir para a resiliência da rede. É contribuir para um entendimento coletivo crescente de como cultivar alimentos melhor.
