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

// ── EN (not yet translated — falls back to PT) ─────────────────────────────
// static const DocLang DOCS_EN = { ... };

// ── ES (not yet translated — falls back to PT) ─────────────────────────────
// static const DocLang DOCS_ES = { ... };

// ── Language selector ──────────────────────────────────────────────────────

static const DocLang& getDocLang(Language lang) {
  switch (lang) {
    // Add cases here as translations are completed:
    // case LANG_EN: return DOCS_EN;
    // case LANG_ES: return DOCS_ES;
    default:      return DOCS_PT;
  }
}

// ── CSS for standalone captive portal docs page ────────────────────────────

static const char DOCS_PORTAL_CSS[] PROGMEM = R"CSS(
:root{--bg:#f4f1ea;--fg:#1d231e;--fg-2:#46493d;--fg-3:#6d6a5f;--pri:#1a3a28;--line:#d8d2bf;--pap:#f7f1de;--aqua:#9ed8ff;--good:#2f7d45;--warn:#b8651e;--bad:#a83a2a}
[data-theme=dark]{--bg:#0d1310;--fg:#d8e3d4;--fg-2:#b3c2af;--fg-3:#9ead99;--pri:#1a3a28;--line:#20281f;--pap:#14201a;--aqua:#a8dcff;--good:#7fd08d;--warn:#d4933a;--bad:#d36e63}
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
.doc-toc-item{border-top:1px solid var(--line)}
.doc-h4+.doc-toc-item{border-top:0}
.doc-toc-row{display:grid;grid-template-columns:minmax(0,1fr) 30px;align-items:center;gap:7px}
.doc-toc a{display:block;font-size:16px;font-weight:750;color:var(--pri);text-decoration:none;padding:7px 0;border-bottom:1px solid transparent}
.doc-toc a:hover{text-decoration:underline}
.doc-toc-toggle{appearance:none;background:transparent;border:1px solid transparent;border-radius:2px;color:var(--fg-3);cursor:pointer;width:30px;height:30px;padding:0;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center}
.doc-toc-toggle:hover,.doc-toc-toggle:focus{border-color:var(--line);color:var(--fg);outline:none}
.doc-toc-item.is-open .doc-toc-toggle{border-color:var(--line);color:var(--pri)}
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
  html += F("<!DOCTYPE html><html lang='pt-BR'><head>"
            "<meta charset='UTF-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            "<title>Manual \xe2\x80\x94 SafraSense Aqua</title>"
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
