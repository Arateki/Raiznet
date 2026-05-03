#include "docs.h"

// ── Per-language string tables ─────────────────────────────────────────────
// Each DocLang holds all user-visible text for one language.
// To translate: add a new DocLang block and a case in getDocLang().
// Section titles are short strings. Section bodies are inner HTML blocks —
// kept together with their HTML structure so translators have full context.
// HTML skeleton (tags, classes) lives in the builder below, not here.

struct DocLang {
  // ── Navigation / page title ──────────────────────────────────────────
  const char* page_title;       // "Guia SafraSense"
  const char* page_subtitle;    // brief description shown under the title
  const char* back_link;        // "← Configuração" link label (captive portal)
  const char* toc_title;        // "Nesta página"

  // ── Section titles (used in <summary> and TOC links) ────────────────
  const char* s1_title;         // SafraSense hardware section
  const char* s2_title;         // Raiznet network section
  const char* s3_title;         // Hydroponics section
  const char* s4_title;         // Glossary section

  // ── Section bodies (inner HTML of .doc-body) ────────────────────────
  // Contains both HTML structure and translated text.
  // Do NOT change tag names or CSS classes — only translate the visible text.
  const char* s1_body;
  const char* s2_body;
  const char* s3_body;
  const char* s4_body;
};

// ── PT-BR ──────────────────────────────────────────────────────────────────

static const char S1_BODY_PT[] PROGMEM = R"HTML(
<div class="doc-h4">O que é</div>
<p>SafraSense Aqua é um dispositivo para cultivos em hidroponia. Ele fica perto das plantas, transforma o cultivo em dados fáceis de acompanhar, mede sinais do ambiente e da solução nutritiva, guarda a identidade do equipamento e pode enviar opcionalmente as leituras para servidores Raiznet quando houver rede disponível. Esses dados também podem ser conectados à IA de sua escolha para recomendações de cultivo baseadas no histórico real da sua produção.</p>
<p>A ideia é simples: em vez de descobrir tarde que a água acabou, que a solução ficou forte demais ou que o ar está ruim para a planta, o produtor passa a enxergar esses sinais enquanto ainda dá tempo de corrigir.</p>
<p>Manter o cultivo nas faixas recomendadas ajuda a planta a gastar menos energia se defendendo do ambiente e mais energia crescendo, enraizando e produzindo. O resultado esperado é um manejo mais estável, com crescimento mais rápido e colheitas mais consistentes.</p>
<p>Você também pode rodar um servidor Raiznet no seu próprio computador. Assim, o produto não depende de infraestrutura externa para entregar 100% das funcionalidades prometidas: os dados continuam locais, consultáveis e prontos para uso mesmo que nenhum serviço público esteja disponível.</p>
<div class="doc-h4">O que ele mede</div>
<ul>
<li><strong>Ar</strong> — temperatura e umidade, que afetam transpiração e crescimento.</li>
<li><strong>pH</strong> — acidez da solução, essencial para absorção de nutrientes.</li>
<li><strong>Solução nutritiva</strong> — EC/TDS, um sinal de quanto nutriente há na água.</li>
<li><strong>Reservatório</strong> — distância até a superfície da água, usada para estimar nível.</li>
<li><strong>Energia</strong> — tensão e percentual da bateria quando o modelo usa alimentação por bateria.</li>
</ul>
<p>Quando um sensor não estiver presente, o sistema pode aceitar entrada manual do dado correspondente, especialmente pH medido por tiras, gotas reagentes ou medidor portátil.</p>
<div class="doc-h4">Como usar no dia a dia</div>
<p>O SafraSense não substitui observar folhas e raízes. Ele funciona como um painel de sinais vitais do cultivo: mostra tendência, alerta mudanças e ajuda a comparar ciclos diferentes. Uma leitura isolada pode enganar; uma sequência de leituras costuma contar uma história melhor.</p>
<p>Quando conectado a um servidor Raiznet, o histórico vira material de aprendizado: você consegue rever o que aconteceu antes de uma colheita boa ou ruim e, no futuro, comparar seu cultivo com dados públicos da sua região.</p>
<div class="doc-h4">Primeira configuração</div>
<ol>
<li>Ligue o dispositivo — LED pisca entre amarelo e vermelho indicando modo de configuração.</li>
<li>Conecte-se à rede Wi-Fi <code>SafraSense-XXXX</code> (sem senha).</li>
<li>O portal abre automaticamente; ou acesse <code>192.168.4.1</code>.</li>
<li>Escolha o idioma e clique em Configurar.</li>
<li>Selecione sua rede Wi-Fi e insira a senha.</li>
<li>Opcionalmente, habilite a conexão com servidores Raiznet e informe os endereços. Se fizer isso, anote as 12 palavras geradas: elas são o backup da identidade do dono na rede.</li>
<li>Clique em Salvar. O dispositivo reinicia e começa as leituras.</li>
</ol>
<div class="doc-h4">Identidade e backup</div>
<p>Essa configuração é opcional e faz sentido quando você decide usar servidores Raiznet. Nesse caso, as 12 palavras funcionam como a chave reserva da identidade do dono na rede. Guarde em papel, cofre ou outro lugar offline. Quem tem essas palavras pode recuperar a identidade; quem perde as palavras perde essa recuperação.</p>
<div class="doc-h4">LED de status</div>
<ul>
<li><span class="doc-badge doc-good">Verde</span> — operando normalmente</li>
<li><span class="doc-badge doc-warn">Amarelo</span> — sem Wi-Fi ou sem servidor</li>
<li><span class="doc-badge doc-bad">Vermelho</span> — erro crítico ou modo configuração</li>
</ul>
<div class="doc-h4">Dashboard local</div>
<p>Na mesma rede Wi-Fi, acesse <code>safrasense-aqua.local/</code> para ver leituras em tempo real, status dos servidores e alterar configurações. Se houver mais de um dispositivo na rede, os demais usam o formato <code>safrasense-aqua-{codigo}.local/</code>. Digite a barra final para ajudar o navegador a procurar o endereço local.</p>
<div class="doc-h4">Resetar</div>
<ul>
<li><strong>Reconectar Wi-Fi</strong> — em Configurações → Reconectar Wi-Fi. Mantém chaves e identidade se houver pelo menos um servidor Raiznet conectado.</li>
<li><strong>Reset completo</strong> — em Configurações → Zona de perigo. Apaga identidade, chaves e Wi-Fi. Irreversível.</li>
</ul>
)HTML";

static const char S2_BODY_PT[] PROGMEM = R"HTML(
<div class="doc-h4">O que é</div>
<p>Raiznet é a rede que recebe, protege e compartilha dados de cultivo sem depender de um servidor central obrigatório. Um SafraSense e um computador na mesma rede Wi-Fi já formam uma Raiznet local; se você quiser, esses dados também podem participar de uma rede pública.</p>
<p>Pense nela como um caderno de cultivo que pode ficar só na sua bancada ou ser compartilhado com uma comunidade. A diferença é que cada leitura vem assinada pelo dispositivo, então outros nós conseguem verificar de onde ela veio e se foi alterada.</p>
<p>Você pode rodar seu próprio servidor Raiznet em um computador comum e manter a operação dentro da sua rede. Isso reduz dependência de infraestrutura externa e mantém 100% das funcionalidades prometidas sob controle do próprio usuário, incluindo histórico, painel local, automações e integrações com IA.</p>
<p>Os projetos ficam abertos no GitHub: <a href="https://github.com/Arateki/Raiznet" target="_blank" rel="noopener">Raiznet</a> e <a href="https://github.com/Arateki/Safrasense" target="_blank" rel="noopener">SafraSense</a>.</p>
<div class="doc-h4">Por que isso existe</div>
<p>O objetivo não é apenas ver números em tempo real. A Raiznet foi desenhada para criar memória agrícola: o que foi plantado, em que condições, em qual região e com qual resultado. Com o tempo, essa memória pode ajudar produtores, técnicos e pesquisadores a entender melhor cada cultura.</p>
<p>Dados públicos podem alimentar comparações regionais e estudos. Dados privados continuam locais ou criptografados. O produtor escolhe campo por campo o que sai, o que fica privado e o que nem deixa o dispositivo.</p>
<div class="doc-h4">Modos de operação</div>
<ul>
<li><strong>Local</strong> — funciona na rede Wi-Fi do produtor, sem internet.</li>
<li><strong>Público</strong> — dados escolhidos como públicos podem circular entre nós pela internet.</li>
<li><strong>Híbrido</strong> — uma parte fica local e outra parte ajuda a rede pública.</li>
</ul>
<div class="doc-h4">Servidores</div>
<p>Um servidor Raiznet é um nó da rede. Ele pode rodar em um notebook, Raspberry Pi, Mini PC ou VPS. Ele recebe leituras, guarda histórico e responde consultas de aplicativos, painéis e ferramentas de análise.</p>
<ul>
<li><strong>Externos (públicos)</strong> — URL completa: <code>https://node.arateki.com</code></li>
<li><strong>Locais (LAN)</strong> — IP e porta: <code>192.168.1.100:3000</code></li>
</ul>
<div class="doc-h4">Identidade e segurança</div>
<p>Cada dispositivo tem uma identidade própria, feita de chaves digitais. Ele assina as leituras antes de enviar. Isso permite que um servidor aceite dados de um equipamento conhecido sem depender de login tradicional ou senha compartilhada.</p>
<ul>
<li><strong>ID público</strong> — identifica o dispositivo na rede.</li>
<li><strong>Chave privada</strong> — fica protegida no dispositivo e assina os pacotes.</li>
<li><strong>12 palavras</strong> — backup da identidade do dono; nunca compartilhe.</li>
</ul>
<div class="doc-h4">Privacidade dos dados</div>
<ul>
<li><span class="doc-badge">público</span> — pode ser usado em mapas, médias e estudos da rede.</li>
<li><span class="doc-badge">encriptado</span> — circula protegido; só o dono consegue ler.</li>
<li><span class="doc-badge">omitido</span> — não é enviado para aquele destino.</li>
</ul>
<div class="doc-h4">Como os dados chegam ao servidor</div>
<p>A cada ciclo, o dispositivo lê os sensores, monta um pacote de telemetria, assina esse pacote e envia para o servidor configurado. O servidor confere a assinatura, separa o que é público do que é privado e guarda o histórico para consultas futuras.</p>
<div class="doc-h4">Inteligência coletiva</div>
<p>Quando muitos produtores compartilham dados públicos, a rede começa a revelar padrões: faixas de EC melhores para uma cultura em certa região, sinais de estresse antes da perda de produtividade, ou diferenças entre variedades. A proposta é que esse conhecimento volte para os produtores como recomendações, catálogos regionais e materiais de aprendizado.</p>
)HTML";

static const char S3_BODY_PT[] PROGMEM = R"HTML(
<div class="doc-h4">O que é hidroponia</div>
<p>Hidroponia é cultivar plantas sem terra, usando água com nutrientes no lugar do solo. A raiz fica em contato com uma solução nutritiva preparada para entregar o que a planta precisa para crescer.</p>
<p>Pense no reservatório como a despensa e a cozinha da planta ao mesmo tempo: a água carrega os nutrientes, o oxigênio ajuda a raiz a respirar e o pH decide se a planta consegue aproveitar essa comida.</p>
<div class="doc-h4">Como o sistema funciona</div>
<p>A solução sai do reservatório, passa pelas raízes e volta ou fica disponível para elas. Em sistemas com bomba, o movimento evita água parada; em sistemas com aeração, bolhas mantêm oxigênio suficiente para as raízes.</p>
<p>O SafraSense acompanha sinais importantes desse ambiente. Ele não substitui olhar as plantas e as raízes, mas ajuda a perceber mudanças cedo: água acabando, solução fraca demais, excesso de nutrientes, calor no reservatório ou ar muito seco.</p>
<div class="doc-h4">Como ler as medições</div>
<p>pH mostra se a solução está em uma faixa em que a planta consegue absorver nutrientes. EC/TDS mostra se há muitos ou poucos sais nutritivos na água. Temperatura e umidade indicam se o ambiente está confortável para crescimento e transpiração.</p>
<p>As tabelas abaixo são pontos de partida. A faixa ideal muda com idade da planta, clima, variedade, qualidade da água e marca do nutriente. Faça correções pequenas, aguarde a solução misturar e observe a tendência antes de corrigir de novo.</p>
<div class="doc-h4">Medição manual de pH</div>
<p>O pH também pode ser medido manualmente, usando tiras, gotas reagentes, medidor portátil ou outro método confiável. Quando você informa esse valor no sistema, a próxima leitura pode ser atualizada com esse dado manual, deixando o histórico do cultivo mais completo.</p>
<p>Isso é útil quando não há sensor automático de pH instalado, quando você quer conferir uma leitura suspeita ou quando acabou de ajustar a solução. Registrar a medição junto do horário ajuda a entender melhor como o pH muda ao longo do dia e depois das correções.</p>
<p>As referências abaixo são aproximações para orientar o início do manejo. Use com cautela: variedade, fase da planta, clima, água de origem e nutriente usado podem mudar bastante a faixa ideal.</p>
<div class="doc-h4">Parâmetros essenciais</div>
<table>
<thead><tr><th>Parâmetro</th><th>Faixa ideal</th><th>Impacto</th></tr></thead>
<tbody>
<tr><td>pH</td><td>5,5 – 6,5</td><td>Absorção de nutrientes</td></tr>
<tr><td>EC / TDS</td><td>500 – 1.500 ppm</td><td>Concentração nutricional</td></tr>
<tr><td>Temp. da água</td><td>18 – 22 °C</td><td>Oxigenação e raízes</td></tr>
<tr><td>Temp. do ar</td><td>18 – 28 °C</td><td>Fotossíntese e crescimento</td></tr>
<tr><td>Umidade do ar</td><td>50 – 70 %</td><td>Transpiração e fungos</td></tr>
</tbody>
</table>
<div class="doc-h4">Referência por cultura</div>
<table>
<thead><tr><th>Cultura</th><th>pH</th><th>EC (ppm)</th></tr></thead>
<tbody>
<tr><td>Alface</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Manjericão</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Rúcula</td><td>5,5 – 6,8</td><td>500 – 1.200</td></tr>
<tr><td>Coentro</td><td>6,0 – 7,0</td><td>500 – 1.200</td></tr>
<tr><td>Tomate</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Pimentão</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Pepino</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Morango</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
</tbody>
</table>
<p>Use a tabela por cultura como referência inicial, não como regra absoluta. Folhosas costumam usar solução mais leve; plantas com frutos, como tomate e pimentão, geralmente precisam de mais nutrientes quando estão produzindo.</p>
<div class="doc-h4">Diagnóstico rápido</div>
<ul>
<li><strong>pH alto (&gt;6,5)</strong> — adicione pH Down. Pode indicar excesso de calcário.</li>
<li><strong>pH baixo (&lt;5,5)</strong> — adicione pH Up. Pode causar deficiência de cálcio.</li>
<li><strong>EC alto</strong> — dilua com água limpa. Pode queimar raízes por excesso de sal.</li>
<li><strong>EC baixo</strong> — reponha solução nutritiva concentrada.</li>
<li><strong>Nível baixo</strong> — reabasteça com água pH ajustada; raízes a seco causam estresse irreversível.</li>
<li><strong>Temp. da água alta (&gt;24 °C)</strong> — menos oxigênio dissolvido; risco de Pythium.</li>
</ul>
<div class="doc-h4">Boas práticas</div>
<p>Uma rotina simples evita a maioria dos problemas: confira nível de água, pH e EC; veja se a bomba ou a aeração estão funcionando; observe cor, cheiro e textura das raízes. Raiz saudável costuma ser clara, firme e sem mau cheiro.</p>
<ul>
<li>Verifique pH e EC juntos — eles se influenciam mutuamente.</li>
<li>Troque a solução nutritiva a cada 7–14 dias para evitar acúmulo de sais.</li>
<li>Mantenha o reservatório coberto para evitar algas e evaporação.</li>
<li>Calibre os sensores periodicamente com soluções de referência.</li>
</ul>
)HTML";

static const char S4_BODY_PT[] PROGMEM = R"HTML(
<p>Estes termos aparecem porque tornam o SafraSense e a Raiznet possíveis. A primeira ideia é sempre simples; os detalhes ajudam quem quiser ir mais fundo.</p>
<div class="doc-h4">Tecnologia da rede</div>
<dl>
<dt>AES-256-GCM</dt>
<dd>AES-256-GCM é uma forma de trancar dados digitais antes de enviá-los. Pense nele como um cadeado que também acusa se alguém tentou mexer na embalagem. No Raiznet, ele protege leituras marcadas como privadas; só quem tem a chave correta consegue abrir. O número 256 indica o tamanho da chave, e o modo GCM ajuda a detectar alteração no conteúdo.</dd>

<dt>Assinatura digital</dt>
<dd>Assinatura digital é a prova matemática de que uma mensagem veio de quem diz ter enviado. No SafraSense, cada pacote de dados é assinado pelo dispositivo antes de chegar ao servidor. É parecido com assinar um documento, mas o servidor consegue verificar automaticamente e rejeitar pacote falso ou alterado.</dd>

<dt>Append-only log</dt>
<dd>Append-only log é uma lista em que só se acrescenta informação no final. Ele funciona como um caderno de registros: você pode escrever uma nova linha, mas não deve apagar as anteriores. No Hypercore, cada registro fica ligado ao anterior por verificação criptográfica; se alguém alterar uma página antiga, a rede percebe.</dd>

<dt>BIP-39</dt>
<dd>BIP-39 é um jeito padronizado de transformar uma chave em palavras que uma pessoa consegue anotar. No SafraSense, as 12 palavras são o backup da identidade do dono, como a segunda via de uma chave muito importante. A ordem importa: trocar duas palavras cria outra identidade. Guarde offline e não compartilhe, porque não existe recuperação centralizada se essas palavras forem perdidas.</dd>

<dt>Chave pública e chave privada</dt>
<dd>Chave pública é o endereço que pode ser mostrado; chave privada é o segredo que deve ficar protegido. A pública identifica, a privada assina ou abre informações. Na Raiznet, isso substitui boa parte do login tradicional: quem tem a chave certa prova posse sem entregar senha para um servidor central.</dd>

<dt>Dados locais</dt>
<dd>Dados locais são dados que ficam na sua rede ou no seu dispositivo. Eles não precisam ir para a internet para serem úteis. Essa é uma parte central da Raiznet: o produtor pode monitorar e consultar histórico mesmo sem nuvem, e só publica o que fizer sentido compartilhar.</dd>

<dt>Ed25519</dt>
<dd>Ed25519 é uma assinatura digital usada para provar que uma mensagem veio do dispositivo certo. Ela funciona como uma assinatura em papel, mas feita por matemática. O ESP32 assina cada pacote de telemetria com sua chave privada, e o servidor confere com a chave pública. Assim, dados falsos ou alterados podem ser rejeitados antes de entrar na rede.</dd>

<dt>ESP32</dt>
<dd>ESP32 é o pequeno computador que controla o SafraSense. Ele lê sensores, conecta no Wi-Fi, guarda configurações e envia dados para a Raiznet. Pense nele como uma placa de controle parecida com Arduino, mas com Wi-Fi embutido. O modelo usado tem memória limitada, por isso páginas, textos e funções precisam ser planejados com cuidado.</dd>

<dt>H3</dt>
<dd>H3 é um jeito de representar localização usando áreas em forma de hexágono no mapa. Em vez de publicar um endereço exato, o dispositivo pode informar apenas o bloco hexagonal em que está. No Raiznet, o dono escolhe o tamanho dessa área: maior para mais privacidade, menor para mais precisão agrícola. Isso permite análises regionais sem exigir coordenada exata.</dd>

<dt>HTTP POST</dt>
<dd>HTTP POST é uma forma simples de enviar dados pela rede. O SafraSense usa esse caminho para entregar leituras ao servidor Raiznet. É uma escolha prática para sensores: o dispositivo acorda, mede, envia o pacote e pode voltar a economizar energia, sem manter conexão aberta o tempo todo.</dd>

<dt>Hypercore</dt>
<dd>Hypercore é um registro de dados que pode ser copiado entre computadores com verificação de integridade. Pense em um diário compartilhado: novas páginas são adicionadas, e outros servidores podem copiar essas páginas sem depender de um servidor central. Cada dispositivo pode ter seu próprio Hypercore, e a criptografia ajuda a conferir se as páginas são verdadeiras.</dd>

<dt>Hyperswarm</dt>
<dd>Hyperswarm é o mecanismo que ajuda servidores Raiznet a se encontrarem na internet. Ele funciona como uma lista de encontro distribuída: quem conhece o mesmo tópico consegue achar outros participantes. Depois que se encontram, os servidores trocam dados Hypercore. Isso reduz a dependência de um ponto central para manter a rede pública funcionando.</dd>

<dt>Local-first</dt>
<dd>Local-first significa que o sistema precisa funcionar perto do produtor antes de depender da internet. Um SafraSense e um servidor na mesma rede Wi-Fi já bastam para operar. A internet vira uma opção para backup, colaboração e inteligência coletiva, não uma exigência para enxergar o cultivo.</dd>

<dt>mDNS</dt>
<dd>mDNS é o recurso que permite abrir o dispositivo por um nome local, como <code>safrasense-aqua.local/</code>. Ele evita que você precise decorar o IP do SafraSense na rede Wi-Fi. É parecido com chamar alguém pelo nome em vez de pelo número. Em alguns celulares, especialmente Android, pode ser necessário usar o IP direto mostrado no dashboard.</dd>

<dt>Nó Raiznet</dt>
<dd>Nó Raiznet é qualquer servidor que participa da rede. Ele pode ser público, local ou híbrido. Um nó recebe leituras, guarda histórico, responde consultas e, quando participa da rede pública, ajuda outros nós a manterem cópias verificáveis dos dados compartilhados.</dd>

<dt>OTA — Over-The-Air Update</dt>
<dd>OTA é atualizar o firmware pelo Wi-Fi, sem cabo USB. É como atualizar um aplicativo, mas no programa interno do dispositivo. O ESP32 pode gravar a nova versão em uma área separada da memória e só trocar depois de verificar. Se a atualização falhar, o sistema pode voltar para a versão anterior em vez de inutilizar o SafraSense.</dd>

<dt>Privacidade por campo</dt>
<dd>Privacidade por campo quer dizer que cada leitura pode ter uma regra própria. O pH pode ser público, a localização pode ser aproximada, e outro dado pode ficar só no dispositivo. Isso evita a escolha ruim entre "mostrar tudo" e "não participar da rede".</dd>

<dt>SEQ — Número de Sequência</dt>
<dd>SEQ é o número de ordem de cada pacote enviado pelo dispositivo. Ele funciona como numeração de páginas: se falta uma página, o servidor percebe; se uma página chega repetida, também percebe. O SafraSense guarda blocos de sequência para evitar repetir números depois de reiniciar. Podem aparecer pequenos saltos, mas a prioridade é nunca duplicar um pacote.</dd>

<dt>Telemetria</dt>
<dd>Telemetria é o conjunto de leituras que o dispositivo envia ao servidor. No SafraSense, isso pode incluir pH, EC/TDS, temperatura, umidade, nível de água e bateria. A telemetria vira histórico, alerta, comparação entre safras e base para recomendações futuras.</dd>

<dt>TRNG — True Random Number Generator</dt>
<dd>TRNG é a peça que gera números realmente aleatórios no ESP32. Esses números são usados quando o SafraSense cria chaves e as 12 palavras de backup. Pense nele como embaralhar cartas usando ruído físico do próprio hardware, não uma lista previsível. Para melhor qualidade, o firmware gera essa aleatoriedade quando o rádio Wi-Fi está ativo.</dd>
</dl>

<div class="doc-h4">Hidroponia e sensores</div>
<dl>
<dt>Bloqueio nutricional</dt>
<dd>Bloqueio nutricional acontece quando a planta não consegue absorver nutrientes que estão presentes na água. O caso mais comum é pH fora da faixa. É como ter comida no prato, mas a porta da cozinha estar travada: a solução parece correta, mas a raiz não aproveita bem.</dd>

<dt>Aeração</dt>
<dd>Aeração é colocar oxigênio na solução nutritiva. Raiz também respira, e água parada ou quente segura menos oxigênio. Em DWC, a bomba de ar é tão importante quanto a própria solução: sem ela, a planta pode murchar e as raízes podem apodrecer.</dd>

<dt>DWC — Deep Water Culture</dt>
<dd>DWC é um tipo de hidroponia em que as raízes ficam dentro da água nutritiva. A água precisa receber ar, geralmente por uma bomba com pedra porosa, para as raízes respirarem. É simples e bom para folhosas e ervas, mas água quente, bomba parada ou pouca aeração aumentam o risco de raiz apodrecer.</dd>

<dt>Torre hidropônica vertical</dt>
<dd>Torre hidropônica vertical é um sistema em que as plantas crescem em vários níveis, uma acima da outra, enquanto a solução nutritiva circula pela estrutura. Ela aproveita melhor espaços pequenos e pode produzir mais por metro quadrado. O cuidado principal é manter fluxo, nível, pH e nutrientes estáveis em todos os pontos da torre.</dd>

<dt>EC — Condutividade Elétrica</dt>
<dd>EC indica a concentração de nutrientes dissolvidos na água. Quanto mais sais nutritivos dissolvidos, mais a água conduz eletricidade. É como medir se a "sopa" da planta está fraca, no ponto ou salgada demais. EC é mais fácil de comparar entre equipamentos do que PPM.</dd>

<dt>NFT — Nutrient Film Technique</dt>
<dd>NFT é um tipo de hidroponia em que uma lâmina fina de água nutritiva passa pelas raízes. As raízes ficam parte no ar e parte recebendo solução, como se a planta bebesse de um fio d'água constante. Usa pouca água e nutrientes, mas depende muito da bomba.</dd>

<dt>pH</dt>
<dd>pH mostra se a solução está mais ácida ou mais alcalina. Para a planta, isso é como a regulagem da porta de entrada dos nutrientes: se estiver fora da faixa, a comida pode estar na água, mas a raiz não consegue aproveitar bem. Em muitas hidroponias, a faixa prática fica perto de 5,5 a 6,5.</dd>

<dt>PPM — Partes Por Milhão</dt>
<dd>PPM é uma forma de mostrar concentração, ou seja, quanto material há misturado na água. Em hidroponia, aparece muito em medidores de TDS para indicar nutrientes dissolvidos. Como medidores podem usar escalas diferentes, compare sempre usando a mesma escala ou prefira EC.</dd>

<dt>Pythium</dt>
<dd>Pythium é um problema que pode apodrecer raízes em sistemas hidropônicos. Ele se espalha melhor em água quente, com pouco oxigênio ou mal higienizada. Raízes podem escurecer, amolecer e ficar com mau cheiro. Prevenção é mais fácil que correção: boa aeração, reservatório fresco e limpeza entre cultivos.</dd>

<dt>Reservatório</dt>
<dd>Reservatório é o tanque onde fica a solução nutritiva. Ele é a base do sistema: se esquenta demais, fica sem oxigênio, pega luz ou acumula sujeira, as raízes sentem rápido. Manter o reservatório coberto e limpo reduz algas, evaporação e variações bruscas.</dd>

<dt>Solução nutritiva</dt>
<dd>Solução nutritiva é a água misturada com os nutrientes que substituem parte do papel do solo. Ela precisa estar forte o suficiente para alimentar a planta, mas não tão concentrada a ponto de estressar as raízes. pH, EC/TDS, temperatura e oxigênio ajudam a avaliar essa mistura.</dd>

<dt>TDS — Total de Sólidos Dissolvidos</dt>
<dd>TDS indica a quantidade estimada de sólidos dissolvidos na água. Em hidroponia, ele é usado como atalho para falar da concentração de nutrientes. O medidor normalmente calcula TDS a partir da EC e mostra em PPM. Por isso, TDS e EC estão olhando para a mesma coisa por caminhos diferentes.</dd>

<dt>DHT22</dt>
<dd>DHT22 é o sensor que mede temperatura e umidade do ar. Ele ajuda a saber se o ambiente está confortável para a planta transpirar e crescer. É como um termômetro com higrômetro ligado ao ESP32. Ele precisa de alguns segundos entre leituras; leituras rápidas demais podem sair erradas.</dd>

<dt>ToF — Time-of-Flight</dt>
<dd>ToF é uma forma de medir distância usando o tempo de ida e volta da luz. No SafraSense, esse sensor fica apontado para a água do reservatório. Distância menor significa nível mais alto; distância maior significa nível mais baixo. Luz solar direta ou reflexos fortes podem atrapalhar.</dd>

<dt>Transpiração</dt>
<dd>Transpiração é a perda de água da planta pelas folhas. Ela ajuda a puxar nutrientes pelas raízes, mas depende do clima ao redor. Ar muito seco pode fazer a planta perder água rápido demais; umidade alta demais pode favorecer fungos e reduzir troca de água.</dd>
</dl>
)HTML";

static const DocLang DOCS_PT = {
  /* page_title    */ "Guia SafraSense",
  /* page_subtitle */ "Refer\xc3\xaancia r\xc3\xa1pida para configura\xc3\xa7\xc3\xa3o, monitoramento e cultivo hidrop\xc3\xb4nico.",
  /* back_link     */ "\xe2\x86\x90 Configura\xc3\xa7\xc3\xa3o",
  /* toc_title     */ "Nesta p\xc3\xa1gina",
  /* s1_title      */ "SafraSense Aqua",
  /* s2_title      */ "Rede Raiznet",
  /* s3_title      */ "Cultivo Hidrop\xc3\xb4nico",
  /* s4_title      */ "Gloss\xc3\xa1rio",
  /* s1_body       */ S1_BODY_PT,
  /* s2_body       */ S2_BODY_PT,
  /* s3_body       */ S3_BODY_PT,
  /* s4_body       */ S4_BODY_PT,
};

// ── EN ─────────────────────────────────────────────────────────────────────

static const char S1_BODY_EN[] PROGMEM = R"HTML(
<div class="doc-h4">What it is</div>
<p>SafraSense Aqua is a device for hydroponic growing. It stays near the plants, turns the crop into easy-to-follow data, measures signals from the environment and nutrient solution, keeps the device identity, and can optionally send readings to Raiznet servers when a network is available. This data can also be connected to the AI of your choice for growing recommendations based on the real history of your production.</p>
<p>The idea is simple: instead of discovering too late that the water is gone, the solution is too strong, or the air is bad for the plant, the grower can see these signals while there is still time to correct them.</p>
<p>Keeping the crop within recommended ranges helps the plant spend less energy defending itself from the environment and more energy growing, rooting, and producing. The expected result is steadier management, faster growth, and more consistent harvests.</p>
<p>You can also run a Raiznet server on your own computer. This means the product does not depend on external infrastructure to deliver 100% of the promised functionality: data stays local, queryable, and ready to use even if no public service is available.</p>
<div class="doc-h4">What it measures</div>
<ul>
<li><strong>Air</strong> — temperature and humidity, which affect transpiration and growth.</li>
<li><strong>pH</strong> — solution acidity, essential for nutrient absorption.</li>
<li><strong>Nutrient solution</strong> — EC/TDS, a signal of how much nutrient is in the water.</li>
<li><strong>Reservoir</strong> — distance to the water surface, used to estimate level.</li>
<li><strong>Power</strong> — battery voltage and percentage when the model uses battery power.</li>
</ul>
<p>When a sensor is not present, the system can accept manual input for the corresponding value, especially pH measured with strips, reagent drops, or a handheld meter.</p>
<div class="doc-h4">Daily use</div>
<p>SafraSense does not replace looking at leaves and roots. It works like a vital signs panel for the crop: it shows trends, flags changes, and helps compare different cycles. One isolated reading can mislead; a sequence of readings usually tells a better story.</p>
<p>When connected to a Raiznet server, history becomes learning material: you can review what happened before a good or bad harvest and, in the future, compare your crop with public data from your region.</p>
<div class="doc-h4">First setup</div>
<ol>
<li>Turn on the device — the LED blinks between yellow and red to indicate setup mode.</li>
<li>Connect to the <code>SafraSense-XXXX</code> Wi-Fi network (no password).</li>
<li>The portal opens automatically; or open <code>192.168.4.1</code>.</li>
<li>Choose the language and click Configure.</li>
<li>Select your Wi-Fi network and enter the password.</li>
<li>Optionally enable connection to Raiznet servers and enter their addresses. If you do this, write down the generated 12 words: they are the backup for the owner identity on the network.</li>
<li>Click Save. The device restarts and begins reading.</li>
</ol>
<div class="doc-h4">Identity and backup</div>
<p>This setup is optional and makes sense when you decide to use Raiznet servers. In that case, the 12 words work as the backup key for the owner's network identity. Keep them on paper, in a safe, or in another offline place. Whoever has these words can recover the identity; whoever loses the words loses that recovery path.</p>
<div class="doc-h4">Status LED</div>
<ul>
<li><span class="doc-badge doc-good">Green</span> — operating normally</li>
<li><span class="doc-badge doc-warn">Yellow</span> — no Wi-Fi or no server</li>
<li><span class="doc-badge doc-bad">Red</span> — critical error or setup mode</li>
</ul>
<div class="doc-h4">Local dashboard</div>
<p>On the same Wi-Fi network, open <code>safrasense-aqua.local/</code> to see real-time readings, server status, and settings. If there is more than one device on the network, the others use the format <code>safrasense-aqua-{code}.local/</code>. Type the trailing slash to help the browser search for the local address.</p>
<div class="doc-h4">Reset</div>
<ul>
<li><strong>Reconnect Wi-Fi</strong> — in Settings -> Reconnect Wi-Fi. Keeps keys and identity if there is at least one connected Raiznet server.</li>
<li><strong>Full reset</strong> — in Settings -> Danger zone. Erases identity, keys, and Wi-Fi. Irreversible.</li>
</ul>
)HTML";

static const char S2_BODY_EN[] PROGMEM = R"HTML(
<div class="doc-h4">What it is</div>
<p>Raiznet is the network that receives, protects, and shares crop data without depending on a mandatory central server. A SafraSense and a computer on the same Wi-Fi network already form a local Raiznet; if you want, this data can also participate in a public network.</p>
<p>Think of it as a crop notebook that can stay only on your bench or be shared with a community. The difference is that each reading is signed by the device, so other nodes can verify where it came from and whether it was changed.</p>
<p>You can run your own Raiznet server on a regular computer and keep the operation inside your network. This reduces dependency on external infrastructure and keeps 100% of the promised functionality under the user's control, including history, local dashboards, automations, and AI integrations.</p>
<p>The projects are open on GitHub: <a href="https://github.com/Arateki/Raiznet" target="_blank" rel="noopener">Raiznet</a> and <a href="https://github.com/Arateki/Safrasense" target="_blank" rel="noopener">SafraSense</a>.</p>
<div class="doc-h4">Why it exists</div>
<p>The goal is not only to see numbers in real time. Raiznet was designed to create agricultural memory: what was planted, under which conditions, in which region, and with which result. Over time, this memory can help growers, technicians, and researchers understand each crop better.</p>
<p>Public data can feed regional comparisons and studies. Private data stays local or encrypted. The grower chooses field by field what leaves, what stays private, and what never leaves the device.</p>
<div class="doc-h4">Operating modes</div>
<ul>
<li><strong>Local</strong> — works on the grower's Wi-Fi network, without internet.</li>
<li><strong>Public</strong> — data chosen as public can circulate between nodes over the internet.</li>
<li><strong>Hybrid</strong> — part stays local and another part helps the public network.</li>
</ul>
<div class="doc-h4">Servers</div>
<p>A Raiznet server is a network node. It can run on a notebook, Raspberry Pi, Mini PC, or VPS. It receives readings, stores history, and answers queries from apps, dashboards, and analysis tools.</p>
<ul>
<li><strong>External (public)</strong> — full URL: <code>https://node.arateki.com</code></li>
<li><strong>Local (LAN)</strong> — IP and port: <code>192.168.1.100:3000</code></li>
</ul>
<div class="doc-h4">Identity and security</div>
<p>Each device has its own identity made of digital keys. It signs readings before sending them. This allows a server to accept data from a known device without depending on a traditional login or shared password.</p>
<ul>
<li><strong>Public ID</strong> — identifies the device on the network.</li>
<li><strong>Private key</strong> — stays protected on the device and signs packets.</li>
<li><strong>12 words</strong> — owner identity backup; never share them.</li>
</ul>
<div class="doc-h4">Data privacy</div>
<ul>
<li><span class="doc-badge">public</span> — can be used in maps, averages, and network studies.</li>
<li><span class="doc-badge">encrypted</span> — travels protected; only the owner can read it.</li>
<li><span class="doc-badge">omitted</span> — is not sent to that destination.</li>
</ul>
<div class="doc-h4">How data reaches the server</div>
<p>On each cycle, the device reads the sensors, builds a telemetry packet, signs that packet, and sends it to the configured server. The server checks the signature, separates public data from private data, and stores the history for future queries.</p>
<div class="doc-h4">Collective intelligence</div>
<p>When many growers share public data, the network starts revealing patterns: better EC ranges for a crop in a certain region, stress signals before productivity drops, or differences between varieties. The proposal is for this knowledge to return to growers as recommendations, regional catalogs, and learning material.</p>
)HTML";

static const char S3_BODY_EN[] PROGMEM = R"HTML(
<div class="doc-h4">What hydroponics is</div>
<p>Hydroponics is growing plants without soil, using nutrient water instead. Roots stay in contact with a nutrient solution prepared to deliver what the plant needs to grow.</p>
<p>Think of the reservoir as the plant's pantry and kitchen at the same time: water carries nutrients, oxygen helps the root breathe, and pH decides whether the plant can use that food.</p>
<div class="doc-h4">How the system works</div>
<p>The solution leaves the reservoir, passes through the roots, and returns or remains available to them. In systems with a pump, movement prevents stagnant water; in aerated systems, bubbles keep enough oxygen around the roots.</p>
<p>SafraSense tracks important signals in this environment. It does not replace looking at plants and roots, but it helps notice changes early: water running low, solution too weak, excess nutrients, reservoir heat, or air that is too dry.</p>
<div class="doc-h4">How to read measurements</div>
<p>pH shows whether the solution is in a range where the plant can absorb nutrients. EC/TDS shows whether there are too many or too few nutrient salts in the water. Temperature and humidity indicate whether the environment is comfortable for growth and transpiration.</p>
<p>The tables below are starting points. The ideal range changes with plant age, climate, variety, water quality, and nutrient brand. Make small corrections, wait for the solution to mix, and observe the trend before correcting again.</p>
<div class="doc-h4">Manual pH measurement</div>
<p>pH can also be measured manually with strips, reagent drops, a handheld meter, or another reliable method. When you enter this value in the system, the next reading can be updated with this manual data, making the crop history more complete.</p>
<p>This is useful when no automatic pH sensor is installed, when you want to check a suspicious reading, or when you have just adjusted the solution. Recording the measurement with the time helps you understand how pH changes during the day and after corrections.</p>
<p>The references below are approximations to guide initial management. Use them carefully: variety, plant phase, climate, source water, and nutrient used can change the ideal range substantially.</p>
<div class="doc-h4">Essential parameters</div>
<table>
<thead><tr><th>Parameter</th><th>Ideal range</th><th>Impact</th></tr></thead>
<tbody>
<tr><td>pH</td><td>5.5 - 6.5</td><td>Nutrient absorption</td></tr>
<tr><td>EC / TDS</td><td>500 - 1,500 ppm</td><td>Nutrient concentration</td></tr>
<tr><td>Water temp.</td><td>18 - 22 °C</td><td>Oxygenation and roots</td></tr>
<tr><td>Air temp.</td><td>18 - 28 °C</td><td>Photosynthesis and growth</td></tr>
<tr><td>Air humidity</td><td>50 - 70 %</td><td>Transpiration and fungi</td></tr>
</tbody>
</table>
<div class="doc-h4">Crop reference</div>
<table>
<thead><tr><th>Crop</th><th>pH</th><th>EC (ppm)</th></tr></thead>
<tbody>
<tr><td>Lettuce</td><td>5.5 - 6.5</td><td>500 - 1,200</td></tr>
<tr><td>Basil</td><td>5.5 - 6.5</td><td>500 - 1,200</td></tr>
<tr><td>Arugula</td><td>5.5 - 6.8</td><td>500 - 1,200</td></tr>
<tr><td>Cilantro</td><td>6.0 - 7.0</td><td>500 - 1,200</td></tr>
<tr><td>Tomato</td><td>5.5 - 6.5</td><td>500 - 1,200</td></tr>
<tr><td>Bell pepper</td><td>5.5 - 6.5</td><td>500 - 1,200</td></tr>
<tr><td>Cucumber</td><td>5.5 - 6.5</td><td>500 - 1,200</td></tr>
<tr><td>Strawberry</td><td>5.5 - 6.5</td><td>500 - 1,200</td></tr>
</tbody>
</table>
<p>Use the crop table as an initial reference, not as an absolute rule. Leafy greens usually use a lighter solution; fruiting plants such as tomato and bell pepper generally need more nutrients when producing.</p>
<div class="doc-h4">Quick diagnosis</div>
<ul>
<li><strong>High pH (&gt;6.5)</strong> — add pH Down. May indicate excess limestone.</li>
<li><strong>Low pH (&lt;5.5)</strong> — add pH Up. May cause calcium deficiency.</li>
<li><strong>High EC</strong> — dilute with clean water. Excess salt can burn roots.</li>
<li><strong>Low EC</strong> — replenish with concentrated nutrient solution.</li>
<li><strong>Low level</strong> — refill with pH-adjusted water; dry roots cause irreversible stress.</li>
<li><strong>High water temp. (&gt;24 °C)</strong> — less dissolved oxygen; Pythium risk.</li>
</ul>
<div class="doc-h4">Good practices</div>
<p>A simple routine prevents most problems: check water level, pH, and EC; see whether the pump or aeration is working; observe root color, smell, and texture. Healthy roots are usually light, firm, and free of bad smell.</p>
<ul>
<li>Check pH and EC together — they influence each other.</li>
<li>Replace the nutrient solution every 7-14 days to avoid salt buildup.</li>
<li>Keep the reservoir covered to avoid algae and evaporation.</li>
<li>Calibrate sensors periodically with reference solutions.</li>
</ul>
)HTML";

static const char S4_BODY_EN[] PROGMEM = R"HTML(
<p>These terms appear because they make SafraSense and Raiznet possible. The first idea is always simple; the details help anyone who wants to go deeper.</p>
<div class="doc-h4">Network technology</div>
<dl>
<dt>AES-256-GCM</dt>
<dd>AES-256-GCM is a way to lock digital data before sending it. Think of it as a padlock that also reports if someone tried to tamper with the package. In Raiznet, it protects readings marked as private; only someone with the correct key can open them. The number 256 indicates key size, and GCM helps detect content changes.</dd>

<dt>Digital signature</dt>
<dd>A digital signature is mathematical proof that a message came from who it claims to have come from. In SafraSense, each data packet is signed by the device before it reaches the server. It is similar to signing a document, but the server can verify it automatically and reject fake or altered packets.</dd>

<dt>Append-only log</dt>
<dd>An append-only log is a list where information is only added at the end. It works like a notebook of records: you can write a new line, but should not erase previous ones. In Hypercore, each record is linked to the previous one by cryptographic verification; if someone changes an old page, the network notices.</dd>

<dt>BIP-39</dt>
<dd>BIP-39 is a standard way to turn a key into words a person can write down. In SafraSense, the 12 words are the backup for the owner identity, like a spare copy of a very important key. Order matters: swapping two words creates another identity. Keep them offline and do not share them, because there is no centralized recovery if the words are lost.</dd>

<dt>Public key and private key</dt>
<dd>The public key is the address that can be shown; the private key is the secret that must stay protected. The public one identifies, the private one signs or opens information. In Raiznet, this replaces much of traditional login: the holder of the right key proves ownership without giving a password to a central server.</dd>

<dt>Local data</dt>
<dd>Local data is data that stays on your network or device. It does not need to go to the internet to be useful. This is a central part of Raiznet: the grower can monitor and query history even without cloud access, and only publishes what makes sense to share.</dd>

<dt>Ed25519</dt>
<dd>Ed25519 is a digital signature used to prove that a message came from the right device. It works like a paper signature, but made with math. The ESP32 signs each telemetry packet with its private key, and the server checks it with the public key. This way, fake or altered data can be rejected before entering the network.</dd>

<dt>ESP32</dt>
<dd>ESP32 is the small computer that controls SafraSense. It reads sensors, connects to Wi-Fi, stores settings, and sends data to Raiznet. Think of it as a control board similar to Arduino, but with built-in Wi-Fi. The model used has limited memory, so pages, text, and functions need to be planned carefully.</dd>

<dt>H3</dt>
<dd>H3 is a way to represent location using hexagon-shaped areas on the map. Instead of publishing an exact address, the device can report only the hexagonal cell it is in. In Raiznet, the owner chooses the size of that area: larger for more privacy, smaller for more agricultural precision. This enables regional analysis without requiring exact coordinates.</dd>

<dt>HTTP POST</dt>
<dd>HTTP POST is a simple way to send data over the network. SafraSense uses this path to deliver readings to the Raiznet server. It is practical for sensors: the device wakes, measures, sends the packet, and can go back to saving energy without keeping a connection open all the time.</dd>

<dt>Hypercore</dt>
<dd>Hypercore is a data log that can be copied between computers with integrity verification. Think of it as a shared journal: new pages are added, and other servers can copy those pages without depending on a central server. Each device can have its own Hypercore, and cryptography helps verify that pages are authentic.</dd>

<dt>Hyperswarm</dt>
<dd>Hyperswarm is the mechanism that helps Raiznet servers find each other on the internet. It works like a distributed meeting list: participants that know the same topic can find each other. After they meet, servers exchange Hypercore data. This reduces dependency on a central point to keep the public network running.</dd>

<dt>Local-first</dt>
<dd>Local-first means the system must work near the grower before depending on the internet. One SafraSense and one server on the same Wi-Fi network are enough to operate. The internet becomes an option for backup, collaboration, and collective intelligence, not a requirement to see the crop.</dd>

<dt>mDNS</dt>
<dd>mDNS is the feature that lets you open the device by a local name, such as <code>safrasense-aqua.local/</code>. It avoids having to memorize the SafraSense IP address on the Wi-Fi network. It is like calling someone by name instead of by number. On some phones, especially Android, you may need to use the direct IP shown in the dashboard.</dd>

<dt>Raiznet node</dt>
<dd>A Raiznet node is any server that participates in the network. It can be public, local, or hybrid. A node receives readings, stores history, answers queries, and, when it participates in the public network, helps other nodes keep verifiable copies of shared data.</dd>

<dt>OTA — Over-The-Air Update</dt>
<dd>OTA is updating firmware over Wi-Fi, without a USB cable. It is like updating an app, but for the device's internal program. The ESP32 can write the new version to a separate memory area and only switch after verification. If the update fails, the system can return to the previous version instead of making SafraSense unusable.</dd>

<dt>Field-level privacy</dt>
<dd>Field-level privacy means each reading can have its own rule. pH can be public, location can be approximate, and another value can stay only on the device. This avoids the bad choice between "show everything" and "do not participate in the network".</dd>

<dt>SEQ — Sequence Number</dt>
<dd>SEQ is the order number of each packet sent by the device. It works like page numbering: if a page is missing, the server notices; if a page arrives repeated, it notices too. SafraSense reserves sequence blocks to avoid reusing numbers after a restart. Small gaps may appear, but the priority is never duplicating a packet.</dd>

<dt>Telemetry</dt>
<dd>Telemetry is the set of readings the device sends to the server. In SafraSense, this can include pH, EC/TDS, temperature, humidity, water level, and battery. Telemetry becomes history, alerts, comparison between growing cycles, and a base for future recommendations.</dd>

<dt>TRNG — True Random Number Generator</dt>
<dd>TRNG is the part that generates truly random numbers on the ESP32. These numbers are used when SafraSense creates keys and the 12 backup words. Think of it as shuffling cards using physical noise from the hardware itself, not a predictable list. For better quality, the firmware generates this randomness while the Wi-Fi radio is active.</dd>
</dl>

<div class="doc-h4">Hydroponics and sensors</div>
<dl>
<dt>Nutrient lockout</dt>
<dd>Nutrient lockout happens when the plant cannot absorb nutrients that are present in the water. The most common case is pH outside the range. It is like having food on the plate, but the kitchen door is locked: the solution may look correct, but the root cannot use it well.</dd>

<dt>Aeration</dt>
<dd>Aeration means adding oxygen to the nutrient solution. Roots also breathe, and stagnant or warm water holds less oxygen. In DWC, the air pump is as important as the solution itself: without it, the plant can wilt and roots can rot.</dd>

<dt>DWC — Deep Water Culture</dt>
<dd>DWC is a type of hydroponics where roots stay inside nutrient water. The water must receive air, usually from a pump with an air stone, so roots can breathe. It is simple and good for leafy greens and herbs, but warm water, a stopped pump, or weak aeration increases root-rot risk.</dd>

<dt>Vertical hydroponic tower</dt>
<dd>A vertical hydroponic tower is a system where plants grow on several levels, one above another, while the nutrient solution circulates through the structure. It uses small spaces better and can produce more per square meter. The main care point is keeping flow, level, pH, and nutrients stable at every point in the tower.</dd>

<dt>EC — Electrical Conductivity</dt>
<dd>EC indicates the concentration of dissolved nutrients in the water. The more nutrient salts are dissolved, the more the water conducts electricity. It is like measuring whether the plant's "soup" is weak, right, or too salty. EC is easier to compare between devices than PPM.</dd>

<dt>NFT — Nutrient Film Technique</dt>
<dd>NFT is a type of hydroponics where a thin film of nutrient water passes over the roots. Roots stay partly in air and partly receiving solution, as if the plant were drinking from a constant thread of water. It uses little water and nutrients, but depends heavily on the pump.</dd>

<dt>pH</dt>
<dd>pH shows whether the solution is more acidic or more alkaline. For the plant, it is like the setting of the nutrient entry door: if it is outside the range, food may be in the water, but the root cannot use it well. In many hydroponic systems, the practical range is close to 5.5 to 6.5.</dd>

<dt>PPM — Parts Per Million</dt>
<dd>PPM is a way to show concentration, meaning how much material is mixed in the water. In hydroponics, it appears often in TDS meters to indicate dissolved nutrients. Because meters can use different scales, always compare with the same scale or prefer EC.</dd>

<dt>Pythium</dt>
<dd>Pythium is a problem that can rot roots in hydroponic systems. It spreads better in warm, low-oxygen, or poorly cleaned water. Roots can darken, soften, and smell bad. Prevention is easier than correction: good aeration, a cool reservoir, and cleaning between growing cycles.</dd>

<dt>Reservoir</dt>
<dd>The reservoir is the tank that holds the nutrient solution. It is the base of the system: if it gets too warm, loses oxygen, catches light, or accumulates dirt, roots feel it quickly. Keeping the reservoir covered and clean reduces algae, evaporation, and sudden changes.</dd>

<dt>Nutrient solution</dt>
<dd>Nutrient solution is water mixed with nutrients that replace part of the soil's role. It must be strong enough to feed the plant, but not so concentrated that it stresses the roots. pH, EC/TDS, temperature, and oxygen help evaluate this mixture.</dd>

<dt>TDS — Total Dissolved Solids</dt>
<dd>TDS indicates the estimated amount of solids dissolved in the water. In hydroponics, it is used as shorthand for nutrient concentration. The meter usually calculates TDS from EC and displays it in PPM. Because of that, TDS and EC are looking at the same thing through different paths.</dd>

<dt>DHT22</dt>
<dd>DHT22 is the sensor that measures air temperature and humidity. It helps know whether the environment is comfortable for the plant to transpire and grow. It is like a thermometer with a hygrometer connected to the ESP32. It needs a few seconds between readings; readings that are too fast can be wrong.</dd>

<dt>ToF — Time-of-Flight</dt>
<dd>ToF is a way to measure distance using the travel time of light. In SafraSense, this sensor points at the water in the reservoir. Shorter distance means higher level; longer distance means lower level. Direct sunlight or strong reflections can interfere.</dd>

<dt>Transpiration</dt>
<dd>Transpiration is water loss from the plant through leaves. It helps pull nutrients through roots, but depends on the surrounding climate. Air that is too dry can make the plant lose water too quickly; humidity that is too high can favor fungi and reduce water exchange.</dd>
</dl>
)HTML";

static const DocLang DOCS_EN = {
  /* page_title    */ "SafraSense Guide",
  /* page_subtitle */ "Quick reference for setup, monitoring, and hydroponic growing.",
  /* back_link     */ "\xe2\x86\x90 Settings",
  /* toc_title     */ "On this page",
  /* s1_title      */ "SafraSense Aqua",
  /* s2_title      */ "Raiznet Network",
  /* s3_title      */ "Hydroponic Growing",
  /* s4_title      */ "Glossary",
  /* s1_body       */ S1_BODY_EN,
  /* s2_body       */ S2_BODY_EN,
  /* s3_body       */ S3_BODY_EN,
  /* s4_body       */ S4_BODY_EN,
};

// ── ES ─────────────────────────────────────────────────────────────────────

static const char S1_BODY_ES[] PROGMEM = R"HTML(
<div class="doc-h4">Qué es</div>
<p>SafraSense Aqua es un dispositivo para cultivos hidropónicos. Se queda cerca de las plantas, convierte el cultivo en datos fáciles de seguir, mide señales del ambiente y de la solución nutritiva, guarda la identidad del equipo y puede enviar opcionalmente las lecturas a servidores Raiznet cuando hay red disponible. Estos datos también pueden conectarse a la IA de su elección para recomendaciones de cultivo basadas en el historial real de su producción.</p>
<p>La idea es simple: en vez de descubrir tarde que se acabó el agua, que la solución quedó demasiado fuerte o que el aire está mal para la planta, el productor puede ver esas señales mientras todavía hay tiempo para corregir.</p>
<p>Mantener el cultivo dentro de los rangos recomendados ayuda a la planta a gastar menos energía defendiéndose del ambiente y más energía creciendo, enraizando y produciendo. El resultado esperado es un manejo más estable, con crecimiento más rápido y cosechas más consistentes.</p>
<p>También puede ejecutar un servidor Raiznet en su propia computadora. Así, el producto no depende de infraestructura externa para entregar el 100% de las funcionalidades prometidas: los datos siguen locales, consultables y listos para uso aunque no haya ningún servicio público disponible.</p>
<div class="doc-h4">Qué mide</div>
<ul>
<li><strong>Aire</strong> — temperatura y humedad, que afectan la transpiración y el crecimiento.</li>
<li><strong>pH</strong> — acidez de la solución, esencial para la absorción de nutrientes.</li>
<li><strong>Solución nutritiva</strong> — EC/TDS, una señal de cuánto nutriente hay en el agua.</li>
<li><strong>Reservorio</strong> — distancia hasta la superficie del agua, usada para estimar el nivel.</li>
<li><strong>Energía</strong> — tensión y porcentaje de batería cuando el modelo usa alimentación por batería.</li>
</ul>
<p>Cuando un sensor no está presente, el sistema puede aceptar entrada manual del dato correspondiente, especialmente pH medido con tiras, gotas reactivas o medidor portátil.</p>
<div class="doc-h4">Uso diario</div>
<p>SafraSense no sustituye observar hojas y raíces. Funciona como un panel de señales vitales del cultivo: muestra tendencias, alerta cambios y ayuda a comparar ciclos diferentes. Una lectura aislada puede engañar; una secuencia de lecturas suele contar una historia mejor.</p>
<p>Cuando está conectado a un servidor Raiznet, el historial se convierte en material de aprendizaje: puede revisar qué ocurrió antes de una buena o mala cosecha y, en el futuro, comparar su cultivo con datos públicos de su región.</p>
<div class="doc-h4">Primera configuración</div>
<ol>
<li>Encienda el dispositivo — el LED parpadea entre amarillo y rojo indicando modo de configuración.</li>
<li>Conéctese a la red Wi-Fi <code>SafraSense-XXXX</code> (sin contraseña).</li>
<li>El portal se abre automáticamente; o acceda a <code>192.168.4.1</code>.</li>
<li>Elija el idioma y haga clic en Configurar.</li>
<li>Seleccione su red Wi-Fi e introduzca la contraseña.</li>
<li>Opcionalmente, habilite la conexión con servidores Raiznet e informe las direcciones. Si lo hace, anote las 12 palabras generadas: son el respaldo de la identidad del dueño en la red.</li>
<li>Haga clic en Guardar. El dispositivo se reinicia y comienza las lecturas.</li>
</ol>
<div class="doc-h4">Identidad y respaldo</div>
<p>Esta configuración es opcional y tiene sentido cuando decide usar servidores Raiznet. En ese caso, las 12 palabras funcionan como la clave de respaldo de la identidad del dueño en la red. Guárdelas en papel, caja fuerte u otro lugar offline. Quien tiene esas palabras puede recuperar la identidad; quien pierde las palabras pierde esa recuperación.</p>
<div class="doc-h4">LED de estado</div>
<ul>
<li><span class="doc-badge doc-good">Verde</span> — operando normalmente</li>
<li><span class="doc-badge doc-warn">Amarillo</span> — sin Wi-Fi o sin servidor</li>
<li><span class="doc-badge doc-bad">Rojo</span> — error crítico o modo configuración</li>
</ul>
<div class="doc-h4">Dashboard local</div>
<p>En la misma red Wi-Fi, acceda a <code>safrasense-aqua.local/</code> para ver lecturas en tiempo real, estado de los servidores y cambiar configuraciones. Si hay más de un dispositivo en la red, los demás usan el formato <code>safrasense-aqua-{codigo}.local/</code>. Escriba la barra final para ayudar al navegador a buscar la dirección local.</p>
<div class="doc-h4">Restablecer</div>
<ul>
<li><strong>Reconectar Wi-Fi</strong> — en Configuración → Reconectar Wi-Fi. Mantiene claves e identidad si hay al menos un servidor Raiznet conectado.</li>
<li><strong>Reset completo</strong> — en Configuración → Zona de peligro. Borra identidad, claves y Wi-Fi. Irreversible.</li>
</ul>
)HTML";

static const char S2_BODY_ES[] PROGMEM = R"HTML(
<div class="doc-h4">Qué es</div>
<p>Raiznet es la red que recibe, protege y comparte datos de cultivo sin depender de un servidor central obligatorio. Un SafraSense y una computadora en la misma red Wi-Fi ya forman una Raiznet local; si lo desea, esos datos también pueden participar en una red pública.</p>
<p>Piense en ella como un cuaderno de cultivo que puede quedarse solo en su mesa de trabajo o compartirse con una comunidad. La diferencia es que cada lectura viene firmada por el dispositivo, por lo que otros nodos pueden verificar de dónde vino y si fue alterada.</p>
<p>Puede ejecutar su propio servidor Raiznet en una computadora común y mantener la operación dentro de su red. Esto reduce la dependencia de infraestructura externa y mantiene el 100% de las funcionalidades prometidas bajo control del propio usuario, incluyendo historial, panel local, automatizaciones e integraciones con IA.</p>
<p>Los proyectos están abiertos en GitHub: <a href="https://github.com/Arateki/Raiznet" target="_blank" rel="noopener">Raiznet</a> y <a href="https://github.com/Arateki/Safrasense" target="_blank" rel="noopener">SafraSense</a>.</p>
<div class="doc-h4">Por qué existe</div>
<p>El objetivo no es solo ver números en tiempo real. Raiznet fue diseñada para crear memoria agrícola: qué se plantó, en qué condiciones, en qué región y con qué resultado. Con el tiempo, esta memoria puede ayudar a productores, técnicos e investigadores a entender mejor cada cultivo.</p>
<p>Los datos públicos pueden alimentar comparaciones regionales y estudios. Los datos privados permanecen locales o cifrados. El productor elige campo por campo qué sale, qué queda privado y qué ni siquiera sale del dispositivo.</p>
<div class="doc-h4">Modos de operación</div>
<ul>
<li><strong>Local</strong> — funciona en la red Wi-Fi del productor, sin internet.</li>
<li><strong>Público</strong> — los datos elegidos como públicos pueden circular entre nodos por internet.</li>
<li><strong>Híbrido</strong> — una parte queda local y otra parte ayuda a la red pública.</li>
</ul>
<div class="doc-h4">Servidores</div>
<p>Un servidor Raiznet es un nodo de la red. Puede ejecutarse en una notebook, Raspberry Pi, Mini PC o VPS. Recibe lecturas, guarda historial y responde consultas de aplicaciones, paneles y herramientas de análisis.</p>
<ul>
<li><strong>Externos (públicos)</strong> — URL completa: <code>https://node.arateki.com</code></li>
<li><strong>Locales (LAN)</strong> — IP y puerto: <code>192.168.1.100:3000</code></li>
</ul>
<div class="doc-h4">Identidad y seguridad</div>
<p>Cada dispositivo tiene una identidad propia, formada por claves digitales. Firma las lecturas antes de enviarlas. Esto permite que un servidor acepte datos de un equipo conocido sin depender de login tradicional o contraseña compartida.</p>
<ul>
<li><strong>ID público</strong> — identifica el dispositivo en la red.</li>
<li><strong>Clave privada</strong> — queda protegida en el dispositivo y firma los paquetes.</li>
<li><strong>12 palabras</strong> — respaldo de la identidad del dueño; nunca las comparta.</li>
</ul>
<div class="doc-h4">Privacidad de datos</div>
<ul>
<li><span class="doc-badge">público</span> — puede usarse en mapas, promedios y estudios de la red.</li>
<li><span class="doc-badge">cifrado</span> — circula protegido; solo el dueño puede leerlo.</li>
<li><span class="doc-badge">omitido</span> — no se envía a ese destino.</li>
</ul>
<div class="doc-h4">Cómo llegan los datos al servidor</div>
<p>En cada ciclo, el dispositivo lee los sensores, arma un paquete de telemetría, firma ese paquete y lo envía al servidor configurado. El servidor verifica la firma, separa lo público de lo privado y guarda el historial para consultas futuras.</p>
<div class="doc-h4">Inteligencia colectiva</div>
<p>Cuando muchos productores comparten datos públicos, la red empieza a revelar patrones: mejores rangos de EC para un cultivo en cierta región, señales de estrés antes de la pérdida de productividad o diferencias entre variedades. La propuesta es que ese conocimiento vuelva a los productores como recomendaciones, catálogos regionales y materiales de aprendizaje.</p>
)HTML";

static const char S3_BODY_ES[] PROGMEM = R"HTML(
<div class="doc-h4">Qué es hidroponía</div>
<p>La hidroponía es cultivar plantas sin tierra, usando agua con nutrientes en lugar de suelo. La raíz queda en contacto con una solución nutritiva preparada para entregar lo que la planta necesita para crecer.</p>
<p>Piense en el reservorio como la despensa y la cocina de la planta al mismo tiempo: el agua lleva los nutrientes, el oxígeno ayuda a la raíz a respirar y el pH decide si la planta puede aprovechar esa comida.</p>
<div class="doc-h4">Cómo funciona el sistema</div>
<p>La solución sale del reservorio, pasa por las raíces y vuelve o queda disponible para ellas. En sistemas con bomba, el movimiento evita agua estancada; en sistemas con aireación, las burbujas mantienen oxígeno suficiente para las raíces.</p>
<p>SafraSense acompaña señales importantes de ese ambiente. No sustituye mirar las plantas y raíces, pero ayuda a percibir cambios temprano: agua acabándose, solución demasiado débil, exceso de nutrientes, calor en el reservorio o aire demasiado seco.</p>
<div class="doc-h4">Cómo leer las mediciones</div>
<p>El pH muestra si la solución está en una franja en la que la planta puede absorber nutrientes. EC/TDS muestra si hay muchas o pocas sales nutritivas en el agua. Temperatura y humedad indican si el ambiente está cómodo para crecimiento y transpiración.</p>
<p>Las tablas siguientes son puntos de partida. El rango ideal cambia con la edad de la planta, clima, variedad, calidad del agua y marca del nutriente. Haga correcciones pequeñas, espere que la solución se mezcle y observe la tendencia antes de corregir de nuevo.</p>
<div class="doc-h4">Medición manual de pH</div>
<p>El pH también puede medirse manualmente con tiras, gotas reactivas, medidor portátil u otro método confiable. Cuando informa ese valor en el sistema, la próxima lectura puede actualizarse con ese dato manual, dejando el historial del cultivo más completo.</p>
<p>Esto es útil cuando no hay sensor automático de pH instalado, cuando quiere verificar una lectura sospechosa o cuando acaba de ajustar la solución. Registrar la medición junto con el horario ayuda a entender mejor cómo cambia el pH durante el día y después de las correcciones.</p>
<p>Las referencias de abajo son aproximaciones para orientar el manejo inicial. Úselas con cautela: variedad, fase de la planta, clima, agua de origen y nutriente usado pueden cambiar bastante el rango ideal.</p>
<div class="doc-h4">Parámetros esenciales</div>
<table>
<thead><tr><th>Parámetro</th><th>Rango ideal</th><th>Impacto</th></tr></thead>
<tbody>
<tr><td>pH</td><td>5,5 – 6,5</td><td>Absorción de nutrientes</td></tr>
<tr><td>EC / TDS</td><td>500 – 1.500 ppm</td><td>Concentración nutricional</td></tr>
<tr><td>Temp. del agua</td><td>18 – 22 °C</td><td>Oxigenación y raíces</td></tr>
<tr><td>Temp. del aire</td><td>18 – 28 °C</td><td>Fotosíntesis y crecimiento</td></tr>
<tr><td>Humedad del aire</td><td>50 – 70 %</td><td>Transpiración y hongos</td></tr>
</tbody>
</table>
<div class="doc-h4">Referencia por cultivo</div>
<table>
<thead><tr><th>Cultivo</th><th>pH</th><th>EC (ppm)</th></tr></thead>
<tbody>
<tr><td>Lechuga</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Albahaca</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Rúcula</td><td>5,5 – 6,8</td><td>500 – 1.200</td></tr>
<tr><td>Cilantro</td><td>6,0 – 7,0</td><td>500 – 1.200</td></tr>
<tr><td>Tomate</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Pimiento</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Pepino</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
<tr><td>Fresa</td><td>5,5 – 6,5</td><td>500 – 1.200</td></tr>
</tbody>
</table>
<p>Use la tabla por cultivo como referencia inicial, no como regla absoluta. Las hojas suelen usar solución más ligera; las plantas con frutos, como tomate y pimiento, generalmente necesitan más nutrientes cuando están produciendo.</p>
<div class="doc-h4">Diagnóstico rápido</div>
<ul>
<li><strong>pH alto (&gt;6,5)</strong> — agregue pH Down. Puede indicar exceso de caliza.</li>
<li><strong>pH bajo (&lt;5,5)</strong> — agregue pH Up. Puede causar deficiencia de calcio.</li>
<li><strong>EC alto</strong> — diluya con agua limpia. Puede quemar raíces por exceso de sal.</li>
<li><strong>EC bajo</strong> — reponga solución nutritiva concentrada.</li>
<li><strong>Nivel bajo</strong> — rellene con agua con pH ajustado; raíces secas causan estrés irreversible.</li>
<li><strong>Temp. del agua alta (&gt;24 °C)</strong> — menos oxígeno disuelto; riesgo de Pythium.</li>
</ul>
<div class="doc-h4">Buenas prácticas</div>
<p>Una rutina simple evita la mayoría de los problemas: revise nivel de agua, pH y EC; vea si la bomba o la aireación funcionan; observe color, olor y textura de las raíces. Una raíz saludable suele ser clara, firme y sin mal olor.</p>
<ul>
<li>Verifique pH y EC juntos — se influyen mutuamente.</li>
<li>Cambie la solución nutritiva cada 7–14 días para evitar acumulación de sales.</li>
<li>Mantenga el reservorio cubierto para evitar algas y evaporación.</li>
<li>Calibre los sensores periódicamente con soluciones de referencia.</li>
</ul>
)HTML";

static const char S4_BODY_ES[] PROGMEM = R"HTML(
<p>Estos términos aparecen porque hacen posibles a SafraSense y Raiznet. La primera idea siempre es simple; los detalles ayudan a quien quiera profundizar.</p>
<div class="doc-h4">Tecnología de la red</div>
<dl>
<dt>AES-256-GCM</dt>
<dd>AES-256-GCM es una forma de bloquear datos digitales antes de enviarlos. Piense en él como un candado que también avisa si alguien intentó manipular el paquete. En Raiznet, protege lecturas marcadas como privadas; solo quien tiene la clave correcta puede abrirlas. El número 256 indica el tamaño de la clave, y el modo GCM ayuda a detectar cambios en el contenido.</dd>

<dt>Firma digital</dt>
<dd>La firma digital es una prueba matemática de que un mensaje vino de quien dice haberlo enviado. En SafraSense, cada paquete de datos es firmado por el dispositivo antes de llegar al servidor. Es parecido a firmar un documento, pero el servidor puede verificar automáticamente y rechazar paquetes falsos o alterados.</dd>

<dt>Append-only log</dt>
<dd>Append-only log es una lista en la que solo se agrega información al final. Funciona como un cuaderno de registros: puede escribir una nueva línea, pero no debe borrar las anteriores. En Hypercore, cada registro queda ligado al anterior por verificación criptográfica; si alguien altera una página antigua, la red lo percibe.</dd>

<dt>BIP-39</dt>
<dd>BIP-39 es una forma estandarizada de transformar una clave en palabras que una persona puede anotar. En SafraSense, las 12 palabras son el respaldo de la identidad del dueño, como una segunda copia de una clave muy importante. El orden importa: cambiar dos palabras crea otra identidad. Guárdelas offline y no las comparta, porque no existe recuperación centralizada si esas palabras se pierden.</dd>

<dt>Clave pública y clave privada</dt>
<dd>La clave pública es la dirección que puede mostrarse; la clave privada es el secreto que debe protegerse. La pública identifica, la privada firma o abre información. En Raiznet, esto sustituye buena parte del login tradicional: quien tiene la clave correcta prueba posesión sin entregar contraseña a un servidor central.</dd>

<dt>Datos locales</dt>
<dd>Datos locales son datos que quedan en su red o en su dispositivo. No necesitan ir a internet para ser útiles. Esta es una parte central de Raiznet: el productor puede monitorear y consultar historial incluso sin nube, y solo publica lo que tenga sentido compartir.</dd>

<dt>Ed25519</dt>
<dd>Ed25519 es una firma digital usada para probar que un mensaje vino del dispositivo correcto. Funciona como una firma en papel, pero hecha con matemática. El ESP32 firma cada paquete de telemetría con su clave privada, y el servidor verifica con la clave pública. Así, datos falsos o alterados pueden rechazarse antes de entrar en la red.</dd>

<dt>ESP32</dt>
<dd>ESP32 es la pequeña computadora que controla SafraSense. Lee sensores, se conecta al Wi-Fi, guarda configuraciones y envía datos a Raiznet. Piense en él como una placa de control parecida a Arduino, pero con Wi-Fi integrado. El modelo usado tiene memoria limitada, por eso páginas, textos y funciones deben planificarse con cuidado.</dd>

<dt>H3</dt>
<dd>H3 es una forma de representar ubicación usando áreas con forma de hexágono en el mapa. En vez de publicar una dirección exacta, el dispositivo puede informar solo el bloque hexagonal donde está. En Raiznet, el dueño elige el tamaño de esa área: mayor para más privacidad, menor para más precisión agrícola. Esto permite análisis regionales sin exigir coordenadas exactas.</dd>

<dt>HTTP POST</dt>
<dd>HTTP POST es una forma simple de enviar datos por la red. SafraSense usa este camino para entregar lecturas al servidor Raiznet. Es una elección práctica para sensores: el dispositivo despierta, mide, envía el paquete y puede volver a ahorrar energía sin mantener una conexión abierta todo el tiempo.</dd>

<dt>Hypercore</dt>
<dd>Hypercore es un registro de datos que puede copiarse entre computadoras con verificación de integridad. Piense en un diario compartido: se agregan nuevas páginas, y otros servidores pueden copiarlas sin depender de un servidor central. Cada dispositivo puede tener su propio Hypercore, y la criptografía ayuda a verificar si las páginas son verdaderas.</dd>

<dt>Hyperswarm</dt>
<dd>Hyperswarm es el mecanismo que ayuda a los servidores Raiznet a encontrarse en internet. Funciona como una lista de encuentro distribuida: quien conoce el mismo tópico puede encontrar otros participantes. Después de encontrarse, los servidores intercambian datos Hypercore. Esto reduce la dependencia de un punto central para mantener la red pública funcionando.</dd>

<dt>Local-first</dt>
<dd>Local-first significa que el sistema debe funcionar cerca del productor antes de depender de internet. Un SafraSense y un servidor en la misma red Wi-Fi ya bastan para operar. Internet se vuelve una opción para respaldo, colaboración e inteligencia colectiva, no una exigencia para ver el cultivo.</dd>

<dt>mDNS</dt>
<dd>mDNS es el recurso que permite abrir el dispositivo por un nombre local, como <code>safrasense-aqua.local/</code>. Evita que tenga que memorizar la IP de SafraSense en la red Wi-Fi. Es parecido a llamar a alguien por nombre en vez de por número. En algunos celulares, especialmente Android, puede ser necesario usar la IP directa mostrada en el dashboard.</dd>

<dt>Nodo Raiznet</dt>
<dd>Nodo Raiznet es cualquier servidor que participa en la red. Puede ser público, local o híbrido. Un nodo recibe lecturas, guarda historial, responde consultas y, cuando participa en la red pública, ayuda a otros nodos a mantener copias verificables de los datos compartidos.</dd>

<dt>OTA — Over-The-Air Update</dt>
<dd>OTA es actualizar el firmware por Wi-Fi, sin cable USB. Es como actualizar una aplicación, pero en el programa interno del dispositivo. El ESP32 puede grabar la nueva versión en un área separada de memoria y solo cambiar después de verificar. Si la actualización falla, el sistema puede volver a la versión anterior en vez de inutilizar SafraSense.</dd>

<dt>Privacidad por campo</dt>
<dd>Privacidad por campo significa que cada lectura puede tener su propia regla. El pH puede ser público, la ubicación puede ser aproximada y otro dato puede quedar solo en el dispositivo. Esto evita la mala elección entre "mostrar todo" y "no participar en la red".</dd>

<dt>SEQ — Número de Secuencia</dt>
<dd>SEQ es el número de orden de cada paquete enviado por el dispositivo. Funciona como numeración de páginas: si falta una página, el servidor lo percibe; si una página llega repetida, también lo percibe. SafraSense reserva bloques de secuencia para evitar repetir números después de reiniciar. Pueden aparecer pequeños saltos, pero la prioridad es nunca duplicar un paquete.</dd>

<dt>Telemetría</dt>
<dd>Telemetría es el conjunto de lecturas que el dispositivo envía al servidor. En SafraSense, esto puede incluir pH, EC/TDS, temperatura, humedad, nivel de agua y batería. La telemetría se convierte en historial, alerta, comparación entre ciclos de cultivo y base para recomendaciones futuras.</dd>

<dt>TRNG — True Random Number Generator</dt>
<dd>TRNG es la pieza que genera números realmente aleatorios en el ESP32. Estos números se usan cuando SafraSense crea claves y las 12 palabras de respaldo. Piense en él como barajar cartas usando ruido físico del propio hardware, no una lista previsible. Para mejor calidad, el firmware genera esa aleatoriedad cuando la radio Wi-Fi está activa.</dd>
</dl>

<div class="doc-h4">Hidroponía y sensores</div>
<dl>
<dt>Bloqueo nutricional</dt>
<dd>El bloqueo nutricional ocurre cuando la planta no puede absorber nutrientes que están presentes en el agua. El caso más común es pH fuera de rango. Es como tener comida en el plato, pero la puerta de la cocina cerrada: la solución parece correcta, pero la raíz no la aprovecha bien.</dd>

<dt>Aireación</dt>
<dd>Aireación es poner oxígeno en la solución nutritiva. La raíz también respira, y el agua estancada o caliente retiene menos oxígeno. En DWC, la bomba de aire es tan importante como la propia solución: sin ella, la planta puede marchitarse y las raíces pueden pudrirse.</dd>

<dt>DWC — Deep Water Culture</dt>
<dd>DWC es un tipo de hidroponía en el que las raíces quedan dentro del agua nutritiva. El agua necesita recibir aire, generalmente por una bomba con piedra difusora, para que las raíces respiren. Es simple y bueno para hojas y hierbas, pero agua caliente, bomba parada o poca aireación aumentan el riesgo de pudrición de raíz.</dd>

<dt>Torre hidropónica vertical</dt>
<dd>La torre hidropónica vertical es un sistema en el que las plantas crecen en varios niveles, una encima de otra, mientras la solución nutritiva circula por la estructura. Aprovecha mejor espacios pequeños y puede producir más por metro cuadrado. El cuidado principal es mantener flujo, nivel, pH y nutrientes estables en todos los puntos de la torre.</dd>

<dt>EC — Conductividad Eléctrica</dt>
<dd>EC indica la concentración de nutrientes disueltos en el agua. Cuantas más sales nutritivas disueltas, más conduce electricidad el agua. Es como medir si la "sopa" de la planta está débil, en su punto o demasiado salada. EC es más fácil de comparar entre equipos que PPM.</dd>

<dt>NFT — Nutrient Film Technique</dt>
<dd>NFT es un tipo de hidroponía en el que una lámina fina de agua nutritiva pasa por las raíces. Las raíces quedan parte en el aire y parte recibiendo solución, como si la planta bebiera de un hilo de agua constante. Usa poca agua y nutrientes, pero depende mucho de la bomba.</dd>

<dt>pH</dt>
<dd>pH muestra si la solución está más ácida o más alcalina. Para la planta, esto es como la regulación de la puerta de entrada de los nutrientes: si está fuera de rango, la comida puede estar en el agua, pero la raíz no consigue aprovecharla bien. En muchas hidroponías, el rango práctico queda cerca de 5,5 a 6,5.</dd>

<dt>PPM — Partes Por Millón</dt>
<dd>PPM es una forma de mostrar concentración, es decir, cuánto material hay mezclado en el agua. En hidroponía, aparece mucho en medidores de TDS para indicar nutrientes disueltos. Como los medidores pueden usar escalas diferentes, compare siempre usando la misma escala o prefiera EC.</dd>

<dt>Pythium</dt>
<dd>Pythium es un problema que puede pudrir raíces en sistemas hidropónicos. Se propaga mejor en agua caliente, con poco oxígeno o mal higienizada. Las raíces pueden oscurecerse, ablandarse y tener mal olor. La prevención es más fácil que la corrección: buena aireación, reservorio fresco y limpieza entre cultivos.</dd>

<dt>Reservorio</dt>
<dd>Reservorio es el tanque donde queda la solución nutritiva. Es la base del sistema: si se calienta demasiado, queda sin oxígeno, recibe luz o acumula suciedad, las raíces lo sienten rápido. Mantener el reservorio cubierto y limpio reduce algas, evaporación y variaciones bruscas.</dd>

<dt>Solución nutritiva</dt>
<dd>Solución nutritiva es el agua mezclada con nutrientes que sustituyen parte del papel del suelo. Debe estar lo bastante fuerte para alimentar la planta, pero no tan concentrada como para estresar las raíces. pH, EC/TDS, temperatura y oxígeno ayudan a evaluar esa mezcla.</dd>

<dt>TDS — Total de Sólidos Disueltos</dt>
<dd>TDS indica la cantidad estimada de sólidos disueltos en el agua. En hidroponía, se usa como atajo para hablar de la concentración de nutrientes. El medidor normalmente calcula TDS a partir de EC y lo muestra en PPM. Por eso, TDS y EC miran lo mismo por caminos diferentes.</dd>

<dt>DHT22</dt>
<dd>DHT22 es el sensor que mide temperatura y humedad del aire. Ayuda a saber si el ambiente está cómodo para que la planta transpire y crezca. Es como un termómetro con higrómetro conectado al ESP32. Necesita algunos segundos entre lecturas; lecturas demasiado rápidas pueden salir erradas.</dd>

<dt>ToF — Time-of-Flight</dt>
<dd>ToF es una forma de medir distancia usando el tiempo de ida y vuelta de la luz. En SafraSense, este sensor apunta al agua del reservorio. Distancia menor significa nivel más alto; distancia mayor significa nivel más bajo. Luz solar directa o reflejos fuertes pueden interferir.</dd>

<dt>Transpiración</dt>
<dd>Transpiración es la pérdida de agua de la planta por las hojas. Ayuda a tirar nutrientes por las raíces, pero depende del clima alrededor. Aire demasiado seco puede hacer que la planta pierda agua muy rápido; humedad demasiado alta puede favorecer hongos y reducir el intercambio de agua.</dd>
</dl>
)HTML";

static const DocLang DOCS_ES = {
  /* page_title    */ "Guía SafraSense",
  /* page_subtitle */ "Referencia rápida para configuración, monitoreo y cultivo hidropónico.",
  /* back_link     */ "\xe2\x86\x90 Configuración",
  /* toc_title     */ "En esta página",
  /* s1_title      */ "SafraSense Aqua",
  /* s2_title      */ "Red Raiznet",
  /* s3_title      */ "Cultivo Hidropónico",
  /* s4_title      */ "Glosario",
  /* s1_body       */ S1_BODY_ES,
  /* s2_body       */ S2_BODY_ES,
  /* s3_body       */ S3_BODY_ES,
  /* s4_body       */ S4_BODY_ES,
};

// ── ZH ─────────────────────────────────────────────────────────────────────

static const char S1_BODY_ZH[] PROGMEM = R"HTML(
<div class="doc-h4">是什么</div>
<p>SafraSense Aqua 是用于水培种植的设备。它放在植物附近，把种植过程转换成容易跟踪的数据，测量环境和营养液的信号，保存设备身份，并且在网络可用时可以选择把读数发送到 Raiznet 服务器。这些数据也可以连接到您选择的 AI，用真实生产历史生成种植建议。</p>
<p>核心思路很简单：不要等到水已经用完、营养液太浓或空气条件已经伤害植物时才发现问题，而是在还来得及修正时就看到这些信号。</p>
<p>让作物保持在推荐范围内，可以帮助植物少把能量用于抵抗环境压力，把更多能量用于生长、生根和结果。预期效果是管理更稳定、生长更快、收成更一致。</p>
<p>您也可以在自己的电脑上运行 Raiznet 服务器。这样产品不依赖外部基础设施也能提供承诺的全部功能：数据保持本地、可查询，并且即使没有公共服务也能继续使用。</p>
<div class="doc-h4">测量什么</div>
<ul>
<li><strong>空气</strong> — 温度和湿度，会影响蒸腾和生长。</li>
<li><strong>pH</strong> — 溶液酸碱度，对养分吸收至关重要。</li>
<li><strong>营养液</strong> — EC/TDS，表示水中有多少养分。</li>
<li><strong>储液槽</strong> — 到水面的距离，用于估算水位。</li>
<li><strong>电量</strong> — 使用电池供电的型号会显示电池电压和百分比。</li>
</ul>
<p>当某个传感器不存在时，系统可以接受对应数据的手动输入，尤其是用试纸、试剂滴液或便携式仪表测得的 pH。</p>
<div class="doc-h4">日常使用</div>
<p>SafraSense 不能替代观察叶片和根系。它像作物的生命体征面板：显示趋势、提示变化，并帮助比较不同周期。单次读数可能误导；连续读数通常更能说明问题。</p>
<p>连接到 Raiznet 服务器后，历史数据会成为学习材料：您可以回看一次好收成或坏收成之前发生了什么，将来也可以把自己的种植与本地区公共数据进行比较。</p>
<div class="doc-h4">首次配置</div>
<ol>
<li>打开设备 — LED 在黄色和红色之间闪烁，表示配置模式。</li>
<li>连接到 Wi-Fi 网络 <code>SafraSense-XXXX</code>（无密码）。</li>
<li>门户会自动打开；也可以访问 <code>192.168.4.1</code>。</li>
<li>选择语言并点击配置。</li>
<li>选择您的 Wi-Fi 网络并输入密码。</li>
<li>可选：启用 Raiznet 服务器连接并填写地址。如果这样做，请记下生成的 12 个词：它们是网络中所有者身份的备份。</li>
<li>点击保存。设备会重启并开始读取数据。</li>
</ol>
<div class="doc-h4">身份和备份</div>
<p>此配置是可选的，适用于您决定使用 Raiznet 服务器的情况。此时，12 个词是网络所有者身份的备份钥匙。请保存在纸上、保险箱或其他离线位置。拥有这些词的人可以恢复身份；丢失这些词就失去这种恢复方式。</p>
<div class="doc-h4">状态 LED</div>
<ul>
<li><span class="doc-badge doc-good">绿色</span> — 正常运行</li>
<li><span class="doc-badge doc-warn">黄色</span> — 无 Wi-Fi 或无服务器</li>
<li><span class="doc-badge doc-bad">红色</span> — 严重错误或配置模式</li>
</ul>
<div class="doc-h4">本地仪表盘</div>
<p>在同一个 Wi-Fi 网络中，访问 <code>safrasense-aqua.local/</code> 可以查看实时读数、服务器状态并修改设置。如果网络中有多个设备，其他设备使用 <code>safrasense-aqua-{code}.local/</code> 格式。输入末尾斜杠可以帮助浏览器查找本地地址。</p>
<div class="doc-h4">重置</div>
<ul>
<li><strong>重新连接 Wi-Fi</strong> — 在 设置 → 重新连接 Wi-Fi。若至少有一个 Raiznet 服务器已连接，会保留密钥和身份。</li>
<li><strong>完全重置</strong> — 在 设置 → 危险区域。删除身份、密钥和 Wi-Fi。不可逆。</li>
</ul>
)HTML";

static const char S2_BODY_ZH[] PROGMEM = R"HTML(
<div class="doc-h4">是什么</div>
<p>Raiznet 是接收、保护和共享种植数据的网络，不依赖必须存在的中心服务器。一个 SafraSense 和同一 Wi-Fi 网络中的一台电脑已经可以组成本地 Raiznet；如果您愿意，这些数据也可以参与公共网络。</p>
<p>可以把它理解为一本种植笔记：它可以只留在您的工作台，也可以与社区共享。区别在于每条读数都由设备签名，因此其他节点可以验证数据来自哪里，以及是否被修改。</p>
<p>您可以在普通电脑上运行自己的 Raiznet 服务器，并把操作保持在自己的网络内。这降低了对外部基础设施的依赖，也让历史记录、本地面板、自动化和 AI 集成等全部功能保持在用户控制下。</p>
<p>项目在 GitHub 上开放：<a href="https://github.com/Arateki/Raiznet" target="_blank" rel="noopener">Raiznet</a> 和 <a href="https://github.com/Arateki/Safrasense" target="_blank" rel="noopener">SafraSense</a>。</p>
<div class="doc-h4">为什么存在</div>
<p>目标不只是实时看到数字。Raiznet 的设计是为了形成农业记忆：种了什么、在什么条件下、在哪个地区、结果如何。随着时间推移，这些记忆可以帮助生产者、技术人员和研究人员更好地理解每种作物。</p>
<p>公共数据可以用于地区比较和研究。私有数据保持本地或加密。生产者可以逐项选择哪些数据离开设备、哪些保持私有、哪些完全不发送。</p>
<div class="doc-h4">运行模式</div>
<ul>
<li><strong>本地</strong> — 在生产者的 Wi-Fi 网络中运行，不需要互联网。</li>
<li><strong>公共</strong> — 被选择为公共的数据可以通过互联网在节点之间流通。</li>
<li><strong>混合</strong> — 一部分留在本地，另一部分帮助公共网络。</li>
</ul>
<div class="doc-h4">服务器</div>
<p>Raiznet 服务器是网络中的一个节点。它可以运行在笔记本、Raspberry Pi、Mini PC 或 VPS 上。它接收读数、保存历史，并响应应用、面板和分析工具的查询。</p>
<ul>
<li><strong>外部（公共）</strong> — 完整 URL：<code>https://node.arateki.com</code></li>
<li><strong>本地（LAN）</strong> — IP 和端口：<code>192.168.1.100:3000</code></li>
</ul>
<div class="doc-h4">身份和安全</div>
<p>每个设备都有由数字密钥组成的独立身份。发送前，它会对读数签名。这让服务器可以接受已知设备的数据，而不依赖传统登录或共享密码。</p>
<ul>
<li><strong>公共 ID</strong> — 在网络中识别设备。</li>
<li><strong>私钥</strong> — 受保护地保存在设备中，用来签名数据包。</li>
<li><strong>12 个词</strong> — 所有者身份备份；绝不要分享。</li>
</ul>
<div class="doc-h4">数据隐私</div>
<ul>
<li><span class="doc-badge">公共</span> — 可用于地图、平均值和网络研究。</li>
<li><span class="doc-badge">加密</span> — 受保护地传输；只有所有者能读取。</li>
<li><span class="doc-badge">省略</span> — 不发送到该目标。</li>
</ul>
<div class="doc-h4">数据如何到达服务器</div>
<p>每个周期中，设备读取传感器、组装遥测数据包、签名该数据包并发送到配置的服务器。服务器验证签名，区分公共数据和私有数据，并保存历史以供未来查询。</p>
<div class="doc-h4">集体智能</div>
<p>当许多生产者共享公共数据时，网络开始揭示模式：某个地区某种作物更好的 EC 范围、产量下降前的压力信号，或不同品种之间的差异。目标是把这些知识以建议、地区目录和学习材料的形式返回给生产者。</p>
)HTML";

static const char S3_BODY_ZH[] PROGMEM = R"HTML(
<div class="doc-h4">什么是水培</div>
<p>水培是在没有土壤的情况下种植植物，用含养分的水替代土壤。根系接触经过配制的营养液，从中获得生长所需的元素。</p>
<p>可以把储液槽看作植物的储藏室和厨房：水携带养分，氧气帮助根呼吸，pH 决定植物能否利用这些“食物”。</p>
<div class="doc-h4">系统如何工作</div>
<p>营养液从储液槽流出，经过根系，然后返回或保持可用。在带泵系统中，流动避免水停滞；在有曝气的系统中，气泡为根提供足够氧气。</p>
<p>SafraSense 跟踪这个环境中的重要信号。它不替代观察植物和根系，但能帮助更早发现变化：水量变低、溶液太弱、养分过量、储液槽过热或空气太干。</p>
<div class="doc-h4">如何解读测量值</div>
<p>pH 显示溶液是否处于植物能够吸收养分的范围。EC/TDS 显示水中的营养盐过多还是过少。温度和湿度说明环境是否适合生长和蒸腾。</p>
<p>下表是起点。理想范围会随植物年龄、气候、品种、水质和营养品牌而变化。请小幅修正，等待溶液混合，再观察趋势后继续调整。</p>
<div class="doc-h4">手动 pH 测量</div>
<p>pH 也可以用试纸、试剂滴液、便携式仪表或其他可靠方法手动测量。当您把数值输入系统时，下一次读数可以包含这项手动数据，让种植历史更完整。</p>
<p>没有自动 pH 传感器、需要核对可疑读数或刚调整溶液时，这很有用。把测量值和时间一起记录，有助于理解 pH 在一天内和修正后的变化。</p>
<p>以下参考值用于指导初始管理。请谨慎使用：品种、阶段、气候、原水和使用的营养液都会明显改变理想范围。</p>
<div class="doc-h4">关键参数</div>
<table>
<thead><tr><th>参数</th><th>理想范围</th><th>影响</th></tr></thead>
<tbody>
<tr><td>pH</td><td>5.5 – 6.5</td><td>养分吸收</td></tr>
<tr><td>EC / TDS</td><td>500 – 1,500 ppm</td><td>营养浓度</td></tr>
<tr><td>水温</td><td>18 – 22 °C</td><td>含氧量和根系</td></tr>
<tr><td>气温</td><td>18 – 28 °C</td><td>光合作用和生长</td></tr>
<tr><td>空气湿度</td><td>50 – 70 %</td><td>蒸腾和真菌</td></tr>
</tbody>
</table>
<div class="doc-h4">按作物参考</div>
<table>
<thead><tr><th>作物</th><th>pH</th><th>EC (ppm)</th></tr></thead>
<tbody>
<tr><td>生菜</td><td>5.5 – 6.5</td><td>500 – 1,200</td></tr>
<tr><td>罗勒</td><td>5.5 – 6.5</td><td>500 – 1,200</td></tr>
<tr><td>芝麻菜</td><td>5.5 – 6.8</td><td>500 – 1,200</td></tr>
<tr><td>香菜</td><td>6.0 – 7.0</td><td>500 – 1,200</td></tr>
<tr><td>番茄</td><td>5.5 – 6.5</td><td>500 – 1,200</td></tr>
<tr><td>甜椒</td><td>5.5 – 6.5</td><td>500 – 1,200</td></tr>
<tr><td>黄瓜</td><td>5.5 – 6.5</td><td>500 – 1,200</td></tr>
<tr><td>草莓</td><td>5.5 – 6.5</td><td>500 – 1,200</td></tr>
</tbody>
</table>
<p>把作物表作为初始参考，而不是绝对规则。叶菜通常使用较轻的溶液；番茄、甜椒等结果植物在生产阶段通常需要更多养分。</p>
<div class="doc-h4">快速诊断</div>
<ul>
<li><strong>pH 高 (&gt;6.5)</strong> — 添加 pH Down。可能表示石灰质过多。</li>
<li><strong>pH 低 (&lt;5.5)</strong> — 添加 pH Up。可能导致钙缺乏。</li>
<li><strong>EC 高</strong> — 用清水稀释。盐分过多可能灼伤根系。</li>
<li><strong>EC 低</strong> — 补充浓缩营养液。</li>
<li><strong>水位低</strong> — 用调好 pH 的水补充；根系干燥会造成不可逆压力。</li>
<li><strong>水温高 (&gt;24 °C)</strong> — 溶解氧减少；有 Pythium 风险。</li>
</ul>
<div class="doc-h4">良好实践</div>
<p>简单的日常流程可以避免多数问题：检查水位、pH 和 EC；确认泵或曝气是否工作；观察根的颜色、气味和质地。健康根通常颜色浅、结实且没有异味。</p>
<ul>
<li>同时检查 pH 和 EC — 它们会互相影响。</li>
<li>每 7–14 天更换营养液，避免盐分积累。</li>
<li>保持储液槽遮盖，避免藻类和蒸发。</li>
<li>定期用标准溶液校准传感器。</li>
</ul>
)HTML";

static const char S4_BODY_ZH[] PROGMEM = R"HTML(
<p>这些术语之所以出现，是因为它们让 SafraSense 和 Raiznet 成为可能。第一层理解总是简单的；细节帮助想深入的人继续了解。</p>
<div class="doc-h4">网络技术</div>
<dl>
<dt>AES-256-GCM</dt>
<dd>AES-256-GCM 是发送前锁住数字数据的一种方式。可以把它看作一个也会报告包装是否被动过的锁。在 Raiznet 中，它保护标记为私有的读数；只有拥有正确密钥的人才能打开。256 表示密钥大小，GCM 模式帮助检测内容是否被修改。</dd>

<dt>数字签名</dt>
<dd>数字签名是数学证明，说明一条消息确实来自它声称的发送者。在 SafraSense 中，每个数据包到达服务器前都由设备签名。它类似在文件上签字，但服务器可以自动验证并拒绝伪造或被修改的数据包。</dd>

<dt>Append-only log</dt>
<dd>Append-only log 是只能在末尾追加信息的列表。它像记录本：可以写新行，但不应擦掉旧行。在 Hypercore 中，每条记录都通过密码学验证连接到上一条；如果有人修改旧页面，网络会发现。</dd>

<dt>BIP-39</dt>
<dd>BIP-39 是把密钥转换成人能写下来的词的一种标准方式。在 SafraSense 中，12 个词是所有者身份的备份，就像一把非常重要的钥匙的备用副本。顺序很重要：交换两个词会生成另一个身份。请离线保存并不要分享，因为这些词丢失后没有中心化恢复方式。</dd>

<dt>公钥和私钥</dt>
<dd>公钥是可以展示的地址；私钥是必须保护的秘密。公钥用于识别，私钥用于签名或打开信息。在 Raiznet 中，这替代了很多传统登录：拥有正确密钥的人无需把密码交给中心服务器，也能证明所有权。</dd>

<dt>本地数据</dt>
<dd>本地数据是保留在您的网络或设备中的数据。它不需要上互联网也能发挥作用。这是 Raiznet 的核心：生产者即使没有云也能监测和查询历史，只发布有意义共享的内容。</dd>

<dt>Ed25519</dt>
<dd>Ed25519 是一种数字签名，用于证明消息来自正确设备。它像纸面签名，但由数学完成。ESP32 用私钥签署每个遥测包，服务器用公钥验证。这样，伪造或被修改的数据可以在进入网络前被拒绝。</dd>

<dt>ESP32</dt>
<dd>ESP32 是控制 SafraSense 的小型计算机。它读取传感器、连接 Wi-Fi、保存设置并把数据发送到 Raiznet。可以把它看作类似 Arduino、但内置 Wi-Fi 的控制板。所用型号内存有限，因此页面、文本和功能都需要谨慎规划。</dd>

<dt>H3</dt>
<dd>H3 是用地图上的六边形区域表示位置的方法。设备可以只发布所在的六边形网格，而不是精确地址。在 Raiznet 中，所有者选择区域大小：更大代表更多隐私，更小代表更高农业精度。这让地区分析不必要求精确坐标。</dd>

<dt>HTTP POST</dt>
<dd>HTTP POST 是通过网络发送数据的简单方式。SafraSense 用这种方式把读数交给 Raiznet 服务器。它适合传感器：设备唤醒、测量、发送数据包，然后可以回到省电状态，不需要一直保持连接。</dd>

<dt>Hypercore</dt>
<dd>Hypercore 是可以在计算机之间复制并验证完整性的数据记录。可以把它想成共享日记：新页面不断加入，其他服务器可以复制这些页面而不依赖中心服务器。每个设备可以有自己的 Hypercore，密码学帮助确认页面真实。</dd>

<dt>Hyperswarm</dt>
<dd>Hyperswarm 是帮助 Raiznet 服务器在互联网上找到彼此的机制。它像一个分布式会面列表：知道同一主题的参与者可以互相发现。找到后，服务器交换 Hypercore 数据。这降低了公共网络运行对中心点的依赖。</dd>

<dt>Local-first</dt>
<dd>Local-first 意味着系统必须先在生产者身边工作，再考虑依赖互联网。一个 SafraSense 和同一 Wi-Fi 网络中的一个服务器就足以运行。互联网是备份、协作和集体智能的选项，不是看到作物状态的前提。</dd>

<dt>mDNS</dt>
<dd>mDNS 让您可以用本地名称打开设备，例如 <code>safrasense-aqua.local/</code>。它避免您记住 SafraSense 在 Wi-Fi 网络中的 IP。就像叫人名而不是叫号码。在某些手机上，尤其是 Android，可能需要使用仪表盘显示的直接 IP。</dd>

<dt>Raiznet 节点</dt>
<dd>Raiznet 节点是参与网络的任何服务器。它可以是公共、本地或混合节点。节点接收读数、保存历史、响应查询；参与公共网络时，还帮助其他节点保留可验证的共享数据副本。</dd>

<dt>OTA — Over-The-Air Update</dt>
<dd>OTA 是通过 Wi-Fi 更新固件，不需要 USB 线。它像更新应用，但更新的是设备内部程序。ESP32 可以把新版本写入单独的内存区域，并在验证后切换。如果更新失败，系统可以回到旧版本，而不是让 SafraSense 无法使用。</dd>

<dt>按字段隐私</dt>
<dd>按字段隐私表示每个读数都可以有自己的规则。pH 可以公开，位置可以模糊，另一个数据可以只留在设备上。这避免了“全部公开”和“不参与网络”之间的糟糕二选一。</dd>

<dt>SEQ — 序列号</dt>
<dd>SEQ 是设备发送的每个数据包的顺序号。它像页码：缺页时服务器能发现；重复页到达时也能发现。SafraSense 会预留序列号区块，避免重启后重复编号。可能出现小跳号，但优先目标是绝不重复数据包。</dd>

<dt>遥测</dt>
<dd>遥测是设备发送到服务器的一组读数。在 SafraSense 中，它可以包括 pH、EC/TDS、温度、湿度、水位和电池。遥测会变成历史、警报、种植周期比较和未来建议的基础。</dd>

<dt>TRNG — True Random Number Generator</dt>
<dd>TRNG 是 ESP32 上生成真正随机数的组件。这些数字用于 SafraSense 创建密钥和 12 个备份词。可以把它想成用硬件自身的物理噪声洗牌，而不是使用可预测列表。为了更好质量，固件会在 Wi-Fi 无线电处于活动状态时生成这些随机性。</dd>
</dl>

<div class="doc-h4">水培和传感器</div>
<dl>
<dt>营养锁定</dt>
<dd>营养锁定是指植物无法吸收水中已经存在的养分。最常见原因是 pH 超出范围。就像盘子里有食物，但厨房门被锁住：溶液看起来正确，根却不能很好利用。</dd>

<dt>曝气</dt>
<dd>曝气是向营养液中加入氧气。根也需要呼吸，静止或温暖的水含氧较少。在 DWC 中，空气泵和营养液本身一样重要：没有它，植物可能萎蔫，根可能腐烂。</dd>

<dt>DWC — Deep Water Culture</dt>
<dd>DWC 是根系浸在营养水中的水培方式。水需要通过带气石的泵获得空气，让根能呼吸。它简单，适合叶菜和香草，但水温高、泵停止或曝气不足会增加烂根风险。</dd>

<dt>垂直水培塔</dt>
<dd>垂直水培塔是一种让植物在多个层级上下生长、营养液在结构中循环的系统。它更好利用小空间，并能提高单位面积产量。关键是让塔内各点的流量、水位、pH 和养分保持稳定。</dd>

<dt>EC — 电导率</dt>
<dd>EC 表示水中溶解养分的浓度。溶解的营养盐越多，水越导电。它像是在测植物的“汤”是太淡、刚好还是太咸。EC 比 PPM 更容易在不同设备之间比较。</dd>

<dt>NFT — Nutrient Film Technique</dt>
<dd>NFT 是一种水培方式，一层很薄的营养水膜流过根部。根一部分在空气中，一部分接收溶液，就像植物不断从一条细水流中饮水。它用水和养分少，但非常依赖水泵。</dd>

<dt>pH</dt>
<dd>pH 显示溶液更酸还是更碱。对植物来说，它像养分入口的调节器：如果不在范围内，食物可能在水里，但根不能很好利用。在很多水培系统中，实用范围接近 5.5 到 6.5。</dd>

<dt>PPM — 百万分之一</dt>
<dd>PPM 是表示浓度的一种方式，也就是水中混合了多少物质。在水培中，它常出现在 TDS 仪表上，用来表示溶解养分。由于仪表可能使用不同换算比例，请始终用同一比例比较，或优先使用 EC。</dd>

<dt>Pythium</dt>
<dd>Pythium 是会让水培根系腐烂的问题。它在温暖、低氧或清洁不足的水中更容易扩散。根可能变暗、变软并有异味。预防比修正容易：良好曝气、较凉的储液槽，以及种植周期之间的清洁。</dd>

<dt>储液槽</dt>
<dd>储液槽是存放营养液的水箱。它是系统基础：如果过热、缺氧、进光或积累污垢，根会很快受影响。保持储液槽遮盖和清洁可以减少藻类、蒸发和剧烈变化。</dd>

<dt>营养液</dt>
<dd>营养液是混合了养分的水，替代土壤的一部分作用。它必须足够强以供养植物，但不能浓到让根受压。pH、EC/TDS、温度和氧气帮助评估这份混合液。</dd>

<dt>TDS — 总溶解固体</dt>
<dd>TDS 表示水中溶解固体的估算数量。在水培中，它常作为营养浓度的简写。仪表通常从 EC 计算 TDS 并以 PPM 显示。因此，TDS 和 EC 是从不同路径观察同一件事。</dd>

<dt>DHT22</dt>
<dd>DHT22 是测量空气温度和湿度的传感器。它帮助判断环境是否适合植物蒸腾和生长。它像连接到 ESP32 的温湿度计。两次读数之间需要几秒；读取太快可能不准确。</dd>

<dt>ToF — Time-of-Flight</dt>
<dd>ToF 是用光往返时间测量距离的方法。在 SafraSense 中，这个传感器指向储液槽中的水。距离更小表示水位更高；距离更大表示水位更低。直射阳光或强反射可能干扰测量。</dd>

<dt>蒸腾</dt>
<dd>蒸腾是植物通过叶片失水。它帮助从根部拉动养分，但取决于周围气候。空气太干会让植物失水过快；湿度过高可能促进真菌并减少水分交换。</dd>
</dl>
)HTML";

static const DocLang DOCS_ZH = {
  /* page_title    */ "SafraSense 指南",
  /* page_subtitle */ "配置、监测和水培种植的快速参考。",
  /* back_link     */ "\xe2\x86\x90 设置",
  /* toc_title     */ "本页内容",
  /* s1_title      */ "SafraSense Aqua",
  /* s2_title      */ "Raiznet 网络",
  /* s3_title      */ "水培种植",
  /* s4_title      */ "术语表",
  /* s1_body       */ S1_BODY_ZH,
  /* s2_body       */ S2_BODY_ZH,
  /* s3_body       */ S3_BODY_ZH,
  /* s4_body       */ S4_BODY_ZH,
};

// ── Language selector ──────────────────────────────────────────────────────

static const DocLang& getDocLang(Language lang) {
  switch (lang) {
    case LANG_PT: return DOCS_PT;
    case LANG_EN: return DOCS_EN;
    case LANG_ES: return DOCS_ES;
    case LANG_ZH: return DOCS_ZH;
    default:      return DOCS_EN;
  }
}

// ── CSS for standalone captive portal docs page ────────────────────────────

static const char DOCS_PORTAL_CSS[] PROGMEM = R"CSS(
:root{--bg:#f4f1ea;--fg:#1d231e;--fg-2:#46493d;--fg-3:#6d6a5f;--pri:#1a3a28;--line:#d8d2bf;--pap:#f7f1de;--aqua:#9ed8ff;--good:#2f7d45;--warn:#b8651e;--bad:#a83a2a}
[data-theme=dark]{--bg:#0d1310;--fg:#d8e3d4;--fg-2:#b3c2af;--fg-3:#9ead99;--pri:#2d6e4a;--line:#20281f;--pap:#14201a;--aqua:#a8dcff;--good:#7fd08d;--warn:#d4933a;--bad:#d36e63}
*{box-sizing:border-box}
body{font-family:-apple-system,system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:20px;display:flex;justify-content:center;transition:background .2s,color .2s}
body::before{content:'';position:fixed;top:0;left:0;right:0;height:66px;background:var(--bg);z-index:89;pointer-events:none}
.wrap{width:100%;max-width:400px;padding-top:56px}
h1{font-family:Georgia,serif;font-size:30px;font-weight:650;margin:10px 0 18px}
.eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.brand-aqua{color:var(--aqua)}
.portal-brand{position:fixed;top:18px;left:50%;transform:translateX(-50%);width:calc(100% - 40px);max-width:400px;height:42px;display:flex;align-items:center;overflow:hidden;z-index:90;background:var(--bg)}
.theme-btn{position:fixed;top:16px;right:max(20px,calc((100vw - 400px)/2));background:var(--bg)!important;border:none!important;color:var(--fg)!important;cursor:pointer;width:42px;height:42px;padding:0;z-index:100;display:flex;align-items:center;justify-content:center}
.back-link{display:inline-block;font-size:12px;color:var(--fg-3);letter-spacing:.04em;text-transform:uppercase;text-decoration:none;margin-bottom:6px}
.back-link:hover{color:var(--fg)}
.doc-toc{margin-bottom:18px;padding:11px 14px;background:var(--pap);border:1px solid var(--line);border-radius:3px}
.doc-toc-item{border-top:0}
.doc-h4+.doc-toc-item{border-top:0}
.doc-toc-row{display:flex;align-items:center;gap:7px}
.doc-toc a{display:block;font-size:16px;font-weight:750;color:var(--pri);text-decoration:none;padding:7px 0;border-bottom:1px solid transparent}
.doc-toc a:hover{text-decoration:underline}
.doc-toc-toggle{appearance:none;background:transparent;border:1px solid var(--line);border-radius:5px;color:var(--fg-3);cursor:pointer;width:30px;height:30px;padding:0;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:transform .12s, border-color .12s}
.doc-toc-toggle:hover,.doc-toc-toggle:focus{border-color:var(--pri);color:var(--fg);outline:none;transform:scale(1.05)}
.doc-toc-item.is-open .doc-toc-toggle{border-color:var(--pri);color:var(--pri);box-shadow:inset 0 1px 2px rgba(0,0,0,0.08)}
.doc-subtoc{margin:-1px 0 5px 5px;padding:0 0 5px 12px;border-left:1px solid var(--line)}
.doc-subtoc[hidden]{display:none}
.doc-subtoc a{font-size:13px;font-weight:650;line-height:1.25;color:var(--fg-3);padding:5px 0}
.doc-subtoc a:hover{color:var(--fg)}
.doc-section{border-top:1px solid var(--line)}
.doc-section,.doc-h4{scroll-margin-top:84px}
details.doc-section summary{list-style:none;display:flex;align-items:center;justify-content:space-between;padding:17px 0;cursor:pointer;font-size:15px;font-weight:850;text-transform:uppercase;letter-spacing:.06em;color:var(--fg)}
details.doc-section summary::-webkit-details-marker{display:none}
details.doc-section summary::after{content:'+';font-size:16px;font-weight:300;color:var(--fg-3);flex-shrink:0;margin-left:8px}
details.doc-section[open] summary::after{content:'\2212'}
.doc-body{padding-bottom:18px;font-size:17px;font-weight:550;line-height:1.68;color:var(--fg-2)}
.doc-h4{font-size:14px;font-weight:850;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-3);margin:18px 0 8px}
p{margin:0 0 10px}
ul,ol{margin:6px 0 10px;padding-left:20px}
li{margin-bottom:5px}
strong{font-weight:850;color:var(--fg)}
.doc-body a{color:var(--pri);font-size:inherit;font-weight:850;letter-spacing:0;text-transform:none;text-decoration:underline}
.doc-badge{display:inline-block;font-family:monospace;font-size:14px;background:rgba(26,58,40,.12);color:var(--pri);padding:2px 7px;border-radius:2px;font-weight:750}
.doc-good{background:rgba(47,125,69,.13)!important;color:var(--good)!important}
.doc-warn{background:rgba(184,101,30,.13)!important;color:var(--warn)!important}
.doc-bad{background:rgba(168,58,42,.13)!important;color:var(--bad)!important}
[data-theme=dark] .doc-badge{background:rgba(26,58,40,.35)}
table{width:100%;border-collapse:collapse;font-size:15px;margin:10px 0 14px}
th{text-align:left;font-size:13px;font-weight:850;text-transform:uppercase;letter-spacing:.04em;color:var(--fg-3);border-bottom:2px solid var(--line);padding:8px 6px}
td{padding:9px 6px;border-bottom:1px solid var(--line);color:var(--fg-2);font-weight:550}
td:first-child{font-weight:800;color:var(--fg);font-size:15px}
dl{margin:0}
dt{font-family:monospace;font-size:17px;font-weight:900;color:var(--fg);margin-top:16px}
dd{margin:5px 0 0;font-size:16px;font-weight:550;color:var(--fg-2);line-height:1.64}
code{font-family:monospace;font-size:15px;background:var(--pap);border:1px solid var(--line);padding:0 4px;border-radius:2px}
@media(min-width:901px){
  .doc-body{font-weight:430}
  td{font-weight:430}
  dd{font-weight:430}
}
)CSS";

// ── Minimal theme toggle + anchor-open JS ─────────────────────────────────

static const char DOCS_THEME_JS[] PROGMEM = R"JS(
(function(){
  var doc=document.documentElement,btn=document.getElementById('themeBtn');
  var moon="<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/></svg>";
  var sun="<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='4'/><line x1='12' y1='2' x2='12' y2='6'/><line x1='12' y1='18' x2='12' y2='22'/><line x1='4.93' y1='4.93' x2='7.76' y2='7.76'/><line x1='16.24' y1='16.24' x2='19.07' y2='19.07'/><line x1='2' y1='12' x2='6' y2='12'/><line x1='18' y1='12' x2='22' y2='12'/><line x1='4.93' y1='19.07' x2='7.76' y2='16.24'/><line x1='16.24' y1='7.76' x2='19.07' y2='4.93'/></svg>";
  function setIcon(t){if(btn)btn.innerHTML=t==='dark'?sun:moon;}
  var stored=localStorage.getItem('theme')||'light';
  doc.setAttribute('data-theme',stored);setIcon(stored);
  if(btn)btn.onclick=function(){
    var n=doc.getAttribute('data-theme')==='dark'?'light':'dark';
    doc.setAttribute('data-theme',n);localStorage.setItem('theme',n);setIcon(n);
  };
})();
function openDocHash(hash,updateHistory){
  if(!hash||hash.charAt(0)!=='#')return;
  var t=document.querySelector(hash);
  if(!t)return;
  var sec=t.tagName==='DETAILS'?t:t.closest('details.doc-section');
  if(sec)sec.open=true;
  setTimeout(function(){t.scrollIntoView({block:'start'});},0);
  if(updateHistory!==false){
    if(history&&history.pushState)history.pushState(null,'',hash);
    else location.hash=hash;
  }
}
function buildSubtoc(item){
  var box=item.querySelector('.doc-subtoc');
  if(!box||box.getAttribute('data-built')==='1')return;
  var sec=document.getElementById(item.getAttribute('data-section'));
  if(!sec)return;
  var heads=sec.querySelectorAll('.doc-body .doc-h4');
  heads.forEach(function(h,i){
    if(!h.id)h.id=sec.id+'-sub-'+(i+1);
    var a=document.createElement('a');
    a.href='#'+h.id;
    a.textContent=h.textContent;
    box.appendChild(a);
  });
  box.setAttribute('data-built','1');
  if(!heads.length){
    var btn=item.querySelector('.doc-toc-toggle');
    if(btn)btn.hidden=true;
  }
}
document.querySelectorAll('.doc-toc-item').forEach(function(item){
  buildSubtoc(item);
  var btn=item.querySelector('.doc-toc-toggle');
  var box=item.querySelector('.doc-subtoc');
  if(btn&&box)btn.addEventListener('click',function(){
    var open=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded',open?'false':'true');
    item.classList.toggle('is-open',!open);
    box.hidden=open;
  });
});
document.querySelectorAll('.doc-toc a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    openDocHash(a.getAttribute('href'),true);
  });
});
if(location.hash)openDocHash(location.hash,false);
)JS";

// ── Internal helpers ───────────────────────────────────────────────────────

static void appendProgmem(String& out, const char* pgm) {
  const size_t len = strlen_P(pgm);
  out.reserve(out.length() + len + 1);
  char buf[128];
  size_t remaining = len;
  const char* p = pgm;
  while (remaining > 0) {
    size_t chunk = remaining < 127u ? remaining : 127u;
    memcpy_P(buf, p, chunk);
    buf[chunk] = '\0';
    out += buf;
    p += chunk;
    remaining -= chunk;
  }
}

static void appendTOCItem(String& out, const char* id, const char* title) {
  out += F("<div class=\"doc-toc-item\" data-section=\"");
  out += id;
  out += F("\"><div class=\"doc-toc-row\"><a class=\"doc-toc-main\" href=\"#");
  out += id;
  out += F("\">");
  out += title;
  out += F("</a><button class=\"doc-toc-toggle\" type=\"button\" aria-expanded=\"false\" aria-label=\"Subtópicos\">&#9166;</button></div><div class=\"doc-subtoc\" hidden></div></div>");
}

static void appendTOC(String& out, const DocLang& d) {
  out += F("<div class=\"doc-toc\"><div class=\"doc-h4\">");
  out += d.toc_title;
  out += F("</div>");
  appendTOCItem(out, "doc-s1", d.s1_title);
  appendTOCItem(out, "doc-s2", d.s2_title);
  appendTOCItem(out, "doc-s3", d.s3_title);
  appendTOCItem(out, "doc-s4", d.s4_title);
  out += F("</div>\n");
}

static void appendSection(String& out, const char* id, const char* title, const char* bodyPgm, bool openByDefault) {
  out += F("<details class=\"doc-section\" id=\"");
  out += id;
  out += F("\"");
  if (openByDefault) out += F(" open");
  out += F("><summary>");
  out += title;
  out += F("</summary><div class=\"doc-body\">");
  appendProgmem(out, bodyPgm);
  out += F("</div></details>\n");
}

// ── Public API ─────────────────────────────────────────────────────────────

void appendDocsContent(String& out, Language lang) {
  const DocLang& d = getDocLang(lang);
  appendTOC(out, d);
  // First section open by default so there is always visible content on load.
  appendSection(out, "doc-s1", d.s1_title, d.s1_body, true);
  appendSection(out, "doc-s2", d.s2_title, d.s2_body, false);
  appendSection(out, "doc-s3", d.s3_title, d.s3_body, false);
  appendSection(out, "doc-s4", d.s4_title, d.s4_body, false);
}

String buildDocsPortalPage(Language lang) {
  const DocLang& d = getDocLang(lang);
  String html;
  html.reserve(22000);
  html += F("<!DOCTYPE html><html lang='");
  html += (lang == LANG_PT) ? "pt-BR" : ((lang == LANG_ES) ? "es" : ((lang == LANG_ZH) ? "zh-CN" : "en"));
  html += F("'><head>"
            "<meta charset='UTF-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            "<title>");
  html += d.page_title;
  html += F(" \xe2\x80\x94 SafraSense Aqua</title>"
            "<style>");
  appendProgmem(html, DOCS_PORTAL_CSS);
  html += F("</style></head><body>"
            "<div class='portal-brand'>"
            "<span class='eyebrow'>S A F R A S E N S E <span class='brand-aqua'>A Q U A</span></span>"
            "</div>"
            "<button class='theme-btn' type='button' id='themeBtn'></button>"
            "<div class='wrap'>"
            "<a class='back-link' href='/'>"); html += d.back_link;
  html += F("</a><h1>"); html += d.page_title;
  html += F("</h1><p style='font-size:17px;font-weight:550;line-height:1.62;color:var(--fg-2);margin:0 0 18px'>"); html += d.page_subtitle;
  html += F("</p>");
  appendDocsContent(html, lang);
  html += F("</div><script>");
  appendProgmem(html, DOCS_THEME_JS);
  html += F("</script></body></html>");
  return html;
}
