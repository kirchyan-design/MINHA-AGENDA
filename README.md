# JC ORGANIZA

Agenda, notas, diário, compras e plantões. O APK é gerado pelo GitHub Actions (aba Actions › Gerar APK).

## Atualizações do aplicativo

- **Quem tem o APK 2.0 ou anterior** vê na tela Início um cartão com o botão **BAIXAR ATUALIZAÇÃO**, que abre a pasta do Google Drive (`APK_URL` no `index.html`) com o APK novo. É só instalar por cima, sem desinstalar. **Agora não** esconde o cartão por 3 dias.
- **Quem já tem o APK atualizado (2.1 em diante)** não vê esse cartão. As próximas atualizações chegam só pelo botão **Atualizar** na parte de baixo da tela (“Nova versão disponível”): ao tocar, o app recarrega já na versão nova.
- Como o app sabe que o APK é 2.0 ou anterior: a partir da 2.1 o plugin nativo `MediaPermissions` informa a permissão da câmera (`camera`). APK sem o plugin, ou sem `camera` na resposta, é tratado como 2.0 ou anterior (função `apkAntigo` no `index.html`).
- **Como lançar cada atualização**: aumente `VERSION` no `sw.js` e publique. O botão “Atualizar” aparece para todos. Mudou a parte nativa (plugins, permissões)? Gere o APK em Actions › *Gerar APK*, suba o arquivo na pasta do Drive e, se quiser, ajuste o critério de `apkAntigo`.
- O aviso por notificação, o push com o app fechado e a caixa de novidades continuam desligados (só o botão de baixo).

## Aviso: boas-vindas para novos usuários (não é uma atualização)

- **Caixa de informação com tudo o que o app oferece** (Início, Agenda, Calendário, Meus Plantões, Notas, Diário, Compras, Carteira, Promoções, Lembretes e alarme, Configurações). Aparece **uma única vez e só para usuário novo**: quem abre o app sem nome e sem dados vê a caixa logo depois de entrar com o nome ou com uma conta. Quem já usava o app nunca vê.
  - Chaves no `localStorage`: `ma-guia-novos-pend` (é novo e ainda vai ver) e `ma-guia-novos` (já viu / não é novo). O texto fica em `GUIA_APP` no `index.html`.
  - Não precisa mudar o `VERSION` do `sw.js`.

## Aviso: guia das Configurações (não é uma atualização)

- **Caixa de recado com o guia das Configurações**: uma caixa com a lista de todas as funções da tela Configurações (Perfil, Conta, Backup, Lembretes e alarme, Aplicativo, Tela inicial, Idioma, Menu, Aparência, Segurança, Permissões e Sair). Ela aparece **uma única vez por aparelho** (chave `ma-recado-config-v1` no `localStorage`):
  - **Quem já tem o app**: aparece na próxima vez que abrir (não precisa mudar o `VERSION` do `sw.js`: o app carrega o `index.html` novo sozinho), depois de liberar a senha e das outras caixas.
  - **Usuário novo**: aparece uma vez logo depois de entrar com o nome ou com uma conta (Google, e-mail ou celular).
  - Não empilha com outras caixas: espera elas fecharem. O texto fica em `RECADO_CFG` no `index.html`; se mudar alguma opção das Configurações, atualize a lista. Para mostrar de novo a todos, troque `-v1` por `-v2` na chave.

## Aviso: as 7 últimas atualizações (não é uma atualização)

- **Caixa “📢 As 7 últimas atualizações”**: lista as 7 versões mais recentes (hoje 3.4.4, 3.4.3, 3.4.1, 3.4.0, 3.3.0, 3.2.9 e 3.2.0) com o texto de cada uma. A lista sai sozinha de `NOVIDADES` no `index.html` (a mesma de Configurações › Novidades desta versão), então não precisa editar nada à parte: ao acrescentar uma versão nova em `NOVIDADES`, o aviso já passa a mostrar as 7 mais recentes.
- **Aparece uma única vez para cada usuário.** A marca é guardada por conta (e-mail, celular ou id) no `localStorage` (`ma-recado-novid7-v2:<usuário>`) e também dentro dos dados do usuário (`S.user.avisos['novid7-v2']`), que vão para a nuvem. Resultado: quem entra com a mesma conta em outro aparelho não vê de novo, e outra pessoa que use o mesmo aparelho com outra conta vê a sua vez. A marca é gravada antes de mostrar a caixa, então ela nunca repete.
- Quando aparece: na próxima abertura do app (já com nome/conta) e logo depois de entrar com uma conta, sempre depois da senha e das outras caixas (não empilha). Usuário novo não vê (já recebe a de boas-vindas). Não precisa mudar o `VERSION` do `sw.js`.
- Para mostrar de novo a todos (com a lista atualizada), troque `novid7-v2` por `novid7-v3` em `RECADO_NOVID_TAG`.

## Promoções: ofertas vencidas saem sozinhas

- **Regra:** a oferta que termina no dia `fim` **sai do app às 23:59 desse mesmo dia** (não espera a meia-noite). Até 23:58 ela aparece com a etiqueta “Último dia · até 05/11 às 23:59”; às 23:59:00 o encarte inteiro, com todos os produtos, é removido de Assaí, Atacadão, Novo Atacarejo e do **Comparar preços**.
- **Hoje (05/11), às 23:59:** saem *Dia de Feira* (Novo Atacarejo), *Leva o Assaí · Economia Arretada* e *4ª e 5ª Feirassaí*. O *Especial App Meu Assaí* (fim 04/11) já sai de uma vez. Depois: Super Ofertas (06/11 às 23:59) e Semana dos Laticínios (07/11 às 23:59), com a mesma regra.
- **Como funciona:** `mmVal()` considera a oferta encerrada a partir das 23:59:00 do `fim`, e `promoLimpar()` (antes de `vMeuMercadoAssai`) apaga de `AS_ENC`, `AT_LISTAS` e `NV_ENC` o que venceu. Com o app aberto, um agendador dispara exatamente às 23:59:00 e atualiza a tela na hora; há ainda uma conferência a cada 15 s e ao voltar para o app. Folhetos do Atacadão (`promocoes/atacadao.json`) vencidos também ficam de fora.
- **Lista vazia:** se um mercado ficar sem nenhuma oferta vigente, a tela mostra “Nenhuma oferta vigente de … no momento”.
- **Para cada encarte novo:** informe o `fim` certo (último dia de validade) em `AS_ENC`, `NV_ENC` ou `AT_LISTAS`; o resto é automático. Não precisa mudar o `VERSION` do `sw.js`.

## Carteira › Baixar PDF com todos os dados

- Botão **📄 Baixar PDF com todos os meus dados** no fim da aba *Resumo* da Carteira. O PDF (A4, várias páginas) traz: resumo geral, mês a mês (renda, contas fixas, gastos avulsos, sobra/falta), salário (bruto, proventos, descontos, líquido e dias de pagamento), rendas extras, contas fixas (com os meses pagos) e **todos** os gastos avulsos agrupados por mês, com subtotal.
- É gerado no próprio aparelho, sem internet e sem biblioteca externa (funções `pdfDoc`, `cPdfBuild` e `cPdf` no `index.html`, antes de `vCarteira`). No APK abre a tela de compartilhar (salvar/abrir); se não der, grava em Documentos/MeuPlano. No navegador baixa o arquivo `jc-organiza-carteira-AAAA-MM-DD.pdf`.
- Emojis não entram no PDF (a fonte padrão do PDF não tem emoji). Se for criada outra aba ou dado novo na Carteira, inclua a seção em `cPdfBuild`.

## Promoções › Assaí: 4ª e 5ª Feirassaí (04 a 05/11/2026)

- Nova lista `AS_FEIRA` (21 itens de hortifrúti) e entrada `feira` em `AS_ENC` no `index.html`. Formato da linha: `nome|embalagem ou kg|preço “de”|preço “por”|limite`. O encarte “Leva o Assaí com você” (02 a 05/11) foi conferido item a item e já estava correto, sem alterações.

## Promoções › Novo Atacarejo: Dia de Feira (04 a 05/11/2026)

- Encarte novo na tabela `NV_ENC` (`fei`) e `NV_TXT` do `index.html`: **Hortifrúti** (20 itens) e **Laticínios, Frios e Congelados** (20 itens). Formato de cada linha: `nome|descrição|preço|un ou kg|1 se for “super oferta”|limite por cliente`. Em Olinda a oferta não vale na loja da Casa Caiada (aviso no texto da tela). O Super Ofertas (03 a 06/11) já estava no app e foi conferido item a item com o PDF.

## Promoções › Atacadão: atualização automática dos folhetos

- **Robô** `.github/workflows/atualizar-atacadao.yml` (Actions › *Atualizar promoções do Atacadão*): roda de 3 em 3 horas, quando um PDF entra em `folhetos/atacadao/` e à mão (Run workflow). Faz duas coisas com o `scripts/atacadao.py`:
  1. `coletar`: abre o site do Atacadão (Olinda) num navegador, procura PDFs de folheto e baixa os novos para `folhetos/atacadao/`. **Esta etapa é a parte não testada**: o site monta a página por JavaScript. Depois da primeira execução, abra o relatório `relatorio-atacadao` (aba Actions, no fim da página da execução) para ver o que o site entregou.
  2. `ler`: lê todos os PDFs da pasta (tabela *Produto / Preço promocional / Setor / Validade*) e grava `promocoes/atacadao.json`. Listas vencidas saem do arquivo; PDFs vencidos há mais de 14 dias são apagados.
- **App**: `atCarregar()` no `index.html` lê `promocoes/atacadao.json` ao abrir, ao voltar para o app e a cada 30 min, guarda a última cópia no aparelho (`ma-at-json`) e mostra as listas como “Folheto · setor” na aba Atacadão e no comparador de preços. As listas digitadas (`AT_TXT`, `AT_LISTAS`) continuam valendo até vencerem.
- **Caminho garantido**: se o robô não achar o PDF no site, coloque o PDF do folheto na pasta `folhetos/atacadao/` pelo GitHub (Add file › Upload files). O robô roda sozinho em seguida e o app atualiza. Não precisa mudar `VERSION` nem gerar APK.

## Versão 3.4.5

- **Rádio** (Pop 2K, Love Song, Jovem Pam, Mix FM, Anos 80, MW Gospel e Hunter FM Rock; endereços na lista `RADIOS` do `index.html`): ícone de rádio no topo, ao lado da engrenagem. Ao tocar nele abre o painel onde o usuário **escolhe a rádio** e usa **PAUSE**, **STOP** e **PLAY**. A escolha fica salva. Para incluir outra rádio, basta adicionar uma linha na lista `RADIOS` do `index.html`. Em **Configurações › Rádio** dá para **desativar** (o ícone some e a música para). A escolha fica em `S.radio.off`.
  - **Tela desligada / app em segundo plano**: no APK novo a rádio toca por um **serviço nativo em primeiro plano** (`RadioService.java` + `RadioPlugin.java`, criados pelo passo “Rádio em segundo plano” do workflow *Gerar APK*). Aparece uma notificação com PAUSE/PLAY e STOP, o serviço segura CPU e Wi-Fi acordados, reconecta sozinho se a internet cair e pausa em ligações ou ao desconectar o fone. **É preciso gerar um APK novo** (Actions › Gerar APK) e instalar por cima; sem isso o app usa o player da página, que pode parar quando a tela apaga.
  - No navegador/APK antigo a rádio usa um player da página (com Media Session). Código no `index.html`: bloco “Rádio (Pop 2K · Hunter.FM)” (`radio*`).
- **Lista de compras**: removido o botão flutuante do microfone (`vozFabSync` agora nunca mostra o botão).
- **Notificações corrigidas**: os lembretes vinham **desligados por padrão** e nada os ligava, mesmo com a permissão do Android concedida. Agora:
  - ligam sozinhos uma vez (`S.notif.auto2`), pedem a permissão de notificações, criam os canais (`agenda`, `atualizacoes`) e agendam no sistema (LocalNotifications, `allowWhileIdle`) para avisar **com o app aberto ou fechado**; se o usuário desligar à mão, não religam;
  - o agendamento passou a ser em fila, confere a permissão antes, e se uma notificação falhar as outras ainda são agendadas (`agendarNotifs`);
  - novo botão **Testar notificação** em Configurações › Lembretes e alarme (chega em 5 s) e aviso do último erro de agendamento;
  - no navegador/PWA o alarme em segundo plano usa o service worker (`sw.js` ganhou `notificationclick`). Com a página **fechada** só o APK avisa; navegador não agenda sem servidor de push.
- Para lançar: `VERSION` do `sw.js` já está em 3.4.5 e `NOVIDADES` ganhou a 3.4.5. A parte da rádio em segundo plano exige APK novo; o resto chega pelo botão “Atualizar”.

## Versão 3.4.0

- **Carteira › Salário** (nova aba, 5ª da Carteira). Duas telas: **Meu salário** e **Melhores dias**.
  - **Meu salário**: escolher *uma vez por mês* ou *por quinzena*; o dia que o salário cai (**dia do mês** ou **N-º dia útil**); regra de fim de semana (cai na sexta, cai na segunda ou não mudar); valor de cada pagamento (vazio = o app divide o líquido; botões *50/50* e *Adiantamento 40/60*). **Holerite**: salário bruto, adicionais (horas extras, comissão…), descontos livres (INSS, IRRF, vale-transporte, plano de saúde… + botões para adicionar outros e campo para criar o que quiser, cada um em R$ ou %) e o **salário líquido** calculado na hora. O botão **Estimar INSS e IR** usa a tabela 2026 (INSS: Portaria MPS/MF 13/2026; IRRF: Lei 15.270/2025, isenção até R$ 5.000 e redutor até R$ 7.350); é só uma estimativa e o usuário pode corrigir qualquer campo.
  - O líquido vira a **renda fixa** da Carteira (`cart.base`) enquanto “usar como renda do mês” estiver ligado (padrão). Se o usuário editar a renda à mão na aba Renda, o vínculo desliga sozinho.
  - **Melhores dias**: cada pagamento de salário vira um *período* que financia as contas fixas e gastos até o próximo pagamento. O app mostra o mapa do mês (cor = quanto ainda sobra no dia, 💰 salário, ● vencimento), quanto sobra em cada período, avisa quando um período não fecha e sugere o melhor dia para pagar. A caixa **Dívida ou pagamento extra** compara os períodos, indica o melhor dia e, se não couber de uma vez, sugere dividir em parcelas (20% de folga); “Lançar em Gastos” cria o gasto (categoria Gastos extras) no dia escolhido.
  - Também: cartão **Próximo salário** no Resumo, aviso de notificação no dia em que o salário cai (usa o mesmo liga/desliga e horário dos avisos de contas) e a Kayla (IA) agora conhece o salário.
  - Dados: `S.cart.sal` = `{tipo, bruto, deps, fds, auto, prov[], desc[], pags[]}`. Código: bloco “v3.4.0: Carteira · Salário…” no `index.html` (funções `sal*`).
  - Para lançar: `VERSION` do `sw.js` já está em 3.4.0; `NOVIDADES` ganhou a 3.4.0. Não precisa gerar APK novo.

## Versão 3.2.0

- **Novo tema Viking** (Configurações › Aparência › Cor do tema › Viking): papel de parede em SVG (aurora, lua, fiorde, montanhas, pinheiros, pedra com runa, neve e um drakkar balançando), fontes Uncial Antiqua / Cinzel / Alegreya Sans (Google Fonts), ícones do menu próprios (`VKICO`), frisos de runas no cabeçalho e no menu, cartões de madeira com rebites. Código: bloco “Tema VIKING” no CSS e “Tema VIKING: papel de parede” no JS. Também dá para pedir à Kayla: “deixa o app viking”.
- **Escuta pelo nome mais firme**: o vigia religa o microfone quando o Android corta a escuta, e o botão **Testar a escuta** (Configurações › Assistente Kayla) mostra se está ouvindo, o motivo de estar parada e o último texto ouvido.
- **Novidades desta versão** (Configurações): lista atualizada com as 7 últimas versões (3.1.4 a 3.2.0). Para cada versão nova: aumente `VERSION` no `sw.js` e acrescente a mesma versão em `NOVIDADES` no `index.html`.

## Versão 3.1.9

- **Chamar a Kayla pelo nome**: já vem **ligado por padrão** (dá para desligar em Configurações › Assistente Kayla › **Chamar pelo nome**). Com o app aberto na tela, diga “Kayla, marcar dentista amanhã às 14h” e ela executa. Se disser só “Kayla”, o painel abre e o microfone liga sozinho para você dar a ordem.
  - A opção fica só no aparelho (`localStorage`, chave `ma-kayla-wake`), não vai para a nuvem. Ela fica ouvindo só enquanto o app está aberto e desbloqueado; com a tela apagada ou o app em segundo plano, para.
  - No Android o reconhecedor do Google reinicia de tempos em tempos e pode dar o “plim” de início. Usa um pouco mais de bateria.
  - Não precisa gerar APK novo (o plugin de voz e a permissão do microfone já existem): basta publicar `index.html` e `sw.js`.
  - Código: bloco “KAYLA · CHAMAR PELO NOME” no fim do `index.html` (funções `wake*`).

## Versão 2.9.7

- **Sem login por nome**: a tela de boas-vindas só tem Google e e-mail/senha (entrar ou criar conta); logo depois do login o usuário cai direto no app, com o nome tirado da conta. Quem já usava o app só com o nome continua normalmente.

## Versão 2.9.6

- Corrigido: a sincronização acusava “banco de dados não criado” quando o documento do usuário ainda não existia (a mensagem real do Firestore contém “databases/(default)”).

## Versão 2.9.5

- **Login por celular (SMS) removido**, para não precisar do plano pago do Firebase. Fica Google e e-mail/senha. No Firebase: Authentication › Sign-in method › **Telefone** › Desativar.

## Versão 2.9.4

- **Dados na nuvem**: quem entra com Google ou e-mail tem os dados (agenda, notas, diário com fotos, compras, plantões, etc.) guardados no Firestore, em `users/{uid}` (e-mail, telefone, nome, provedor, criadoEm, ultimoAcesso) e `users/{uid}/dados/p0…` (dados em partes). Ao trocar de celular ou sair e entrar de novo, os dados voltam. Sincroniza 5 s depois de cada alteração, ao fechar/abrir o app e pelo botão **Sincronizar** em Configurações › Conta. Se este aparelho e a nuvem tiverem dados diferentes, o app pergunta quais manter. Não sincroniza: logos dos mercados e quem usa o app só com o nome (sem conta).
- **Configuração, uma vez só** (sem isso a nuvem não funciona; o app mostra “A nuvem ainda não está liberada”):
  1. Firebase › Build › **Firestore Database** › Criar banco de dados (modo produção, região `southamerica-east1`).
  2. Firestore › aba **Regras** › cole o conteúdo do arquivo `firestore.rules` › Publicar.
- **Ver quem usa o app**: Firebase › Firestore › coleção `users` (e-mail, último acesso) e Authentication › Usuários.
- Os dados ficam legíveis para quem administra o projeto Firebase: informe isso na política de privacidade.

## Versão 2.9.3

- **Promoções › Comparar preços**: nova aba que compara o Assaí, o Atacadão e o Novo Atacarejo. Os produtos equivalentes ficam na tabela `CMP` do `index.html` (nome exato do produto no encarte + tamanho da embalagem em relação à referência); o preço é normalizado (por kg, L etc.). Mostra o mercado mais barato por setor e no total, e permite incluir ou não os preços de app/cartão. Só entram itens que aparecem em 2 ou mais mercados e encartes ainda válidos. **Ao subir encartes novos, confira se os nomes em `CMP` ainda existem.**

## Versão 2.9.1

- **Aviso de atualização com o app fechado**: o aparelho se inscreve no tópico `atualizacoes` do Firebase (Cloud Messaging). Quando você publica uma versão nova, o Android mostra a notificação “🔄 Atualização disponível” mesmo com o app fechado. Vale só para o **APK gerado a partir desta versão** (gere de novo em Actions › *Gerar APK* e instale por cima).
- **Envio automático** (workflow `avisar-atualizacao.yml`): roda sozinho quando o `VERSION` do `sw.js` muda, espera o site publicar a versão nova e só então envia o aviso. Configuração, uma vez só:
  1. Firebase › ⚙️ Configurações do projeto › *Contas de serviço* › **Gerar nova chave privada** (baixa um `.json`).
  2. GitHub › Settings › Secrets and variables › Actions › **New repository secret**: nome `FIREBASE_SERVICE_ACCOUNT`, valor = o conteúdo inteiro do `.json`. Nunca coloque esse arquivo no repositório.
  3. Para testar: Actions › *Avisar atualização* › Run workflow.
- **Sem o segredo**: nada quebra, só não sai o aviso automático. Dá para enviar à mão: Firebase › Messaging › Nova campanha › Notificações › Destino: **Tópico** `atualizacoes`.
- Se o `google-services.json` não estiver no repositório, o APK sai sem o login Firebase e sem o push (o app abre normalmente).
- O aviso usa o canal “Atualizações do app”; dá para silenciar em Ajustes do celular › Apps › JC ORGANIZA › Notificações.

## Versão 2.8.3

- **Rotação de tela**: o app deixou de ser travado em pé (`orientation` no `manifest.webmanifest` agora é `any`) e todas as telas se adaptam. Em pé, nada muda. Deitado: o menu inferior vira uma barra lateral, o calendário e os diálogos ficam mais baixos, o teclado do PIN encolhe, os botões flutuantes (microfone, aviso de atualização) saem da frente do menu e respeitam o recorte da câmera/notch.
- **Moldura do scanner**: com o celular em pé ela ocupa ~92% da largura (bem maior que antes); deitado, vira uma moldura mais larga e refaz o cálculo quando a tela gira. O recorte da foto continua sendo só o que está dentro da moldura.
- O APK acompanha a rotação conforme a opção *Girar automaticamente* do Android.

## Versão 2.8.2

- **Moldura vertical na câmera**: ao escanear, aparece uma janela no formato de etiqueta de prateleira (o resto da tela fica escurecido). A foto é recortada só dentro da moldura antes de o texto ser lido, então nomes e preços vizinhos não atrapalham. Fotos escolhidas da galeria continuam sendo lidas inteiras.

## Versão 2.8.1

- **Escanear preços corrigido**: o leitor de texto não carregava porque a pasta `ocr/` não estava no site e o workflow *Baixar leitor offline* estava fora de `.github/workflows/` (o GitHub não o enxergava). Agora: (1) o workflow foi movido para `.github/workflows/leitor-offline.yml`; (2) se a pasta `ocr/` não existir, o app baixa o leitor do CDN (jsDelivr), guarda no aparelho e passa a funcionar offline nas próximas vezes. Para ter o leitor 100% dentro do app, rode uma vez Actions › *Baixar leitor offline* › Run workflow.

## Versão 2.8

- **Microfone flutuante na lista de compras**: o botão 🎤 que ficava dentro da lista foi removido. Agora há um botão redondo no canto da tela (só em Compras › lista atual): **segure, fale o produto e o preço (ex.: “arroz turquesa 6,99”) e solte**. O item entra na lista e o preço é registrado no mercado. Melhorias: o app espera meio segundo ao soltar para não cortar o preço falado por último, volta a ouvir se o Android encerrar por silêncio com o dedo ainda no botão, e mostra o motivo se algo falhar.
- **Permissão do microfone**: o app pergunta uma vez (mesmo para quem já tinha respondido às outras permissões) e, se estiver bloqueado, o botão abre uma caixa com atalho para os Ajustes do celular.
- **Novidades da atualização**: depois de atualizar, o app abre uma caixa com a lista de novidades **uma única vez**. O texto fica em `NOVIDADES` no `index.html`.
- **Como lançar cada atualização**: (1) aumente `VERSION` no `sw.js`; (2) acrescente a mesma versão em `NOVIDADES` no `index.html` com a lista do que mudou; (3) publique. O app avisa por notificação e, depois de atualizado, mostra a caixa.

## Versão 2.7

- **Escanear preços sem internet**: o leitor de texto (Tesseract) fica dentro do app, na pasta `ocr/`, e é guardado no aparelho. **Uma vez só**, rode em Actions › *Baixar leitor offline* › Run workflow para preencher a pasta `ocr/`. Depois disso o app guarda o leitor sozinho na primeira vez que abrir com internet.
- **Produto escaneado entra na lista de compras**: ao confirmar, cada produto vai direto para a lista que está sendo feita (se já estiver lá, só atualiza o preço) e o preço continua registrado no mercado.
- **Notificação de atualização**: quando sai uma versão nova, o app avisa por notificação do celular (uma vez por versão) e mostra o botão Atualizar. A checagem acontece ao abrir o app, ao voltar para ele e a cada 20 minutos enquanto está aberto. **Para cada atualização, aumente o número `VERSION` no `sw.js`** (ex.: 2.7.0 → 2.7.1); é isso que dispara o aviso.
- **Comando de voz na lista de compras**: escolha o mercado, segure o botão 🎤 e diga o produto e o preço (ex.: “arroz turquesa 6,99”). O item entra na lista e o preço é registrado no mercado; dá para **Desfazer**. Usa o reconhecimento de voz do Android (plugin `@capacitor-community/speech-recognition`), então é preciso gerar o APK de novo.
- Promoções mostra as ofertas do Assaí Atacadista, do Atacadão e do Novo Atacarejo (escolha no topo da tela).

## Versão 2.6

- **Dados exclusivos por conta**: cada e-mail (ou celular) tem os seus próprios dados neste aparelho. Entrar com outra conta mostra o app zerado; entrar de novo com a conta original traz os dados dela de volta. Ao desconectar, os dados ficam guardados e o app volta para a tela inicial. Os dados que já existiam no aparelho ficam com a primeira conta que entrar.

## Versão 2.5

- **Login por e-mail e senha e por celular (SMS)**, além do Google, na tela inicial e em Configurações › Conta.
- **Recuperação da senha do app**: em “Esqueci”, a pessoa confirma a conta conectada (Google, e-mail ou SMS) e cria uma nova senha, sem perder os dados.

## Versão 2.4

- **Login com Google** (Firebase Authentication): botão na tela inicial e em Configurações › Conta Google. Requer o `google-services.json` na raiz do repositório.

## Versão 2.3

- Os temas especiais (BTS, One Piece, Homem-Aranha, Batman, Natal e Superman) e as fotos de fundo foram removidos. Continuam as cores do tema e os modos claro/escuro.

## Novidades da versão 2.1

- **Mercados próprios** (Compras › Mercados): cadastre quantos mercados quiser; eles aparecem na escolha do mercado e na comparação de preços.
- **Escanear preços** (Compras › Escanear): aponte a câmera para a etiqueta da prateleira; o app lê nome e preço, você confere e salva no mercado.
- **Permissão da câmera**: pedida na primeira abertura, em Configurações › Permissões e ao abrir o scanner.

## CLT: detalhes das vagas e atualização automática

- **Cartão da vaga**: além de cargo, empresa e salário, mostra **Benefícios, Jornada/horário, Modalidade, Local e Requisitos** quando a informação existe (campo vazio não aparece). Nas vagas da lista fixa (`CLT_RAW`), benefícios, horário e modalidade são tirados do texto das observações; para escrever à mão, use as posições extras da linha: `[..., benefícios, jornada, requisitos, link, local]`.
- **Atualização automática**: o robô `.github/workflows/atualizar-vagas.yml` roda de 3 em 3 horas (e pelo botão Run workflow), executa `scripts/vagas.py` e grava `vagas/clt.json`. O app lê esse arquivo ao abrir, ao voltar para o app e a cada 30 min (`cltCarregar`), e o botão **🔄 Atualizar** do menu CLT força a busca. Vagas com mais de 30 dias saem; as vagas novas ganham o selo **🆕 Nova**.
- A lista fixa de 06/11/2026 continua valendo por 14 dias; depois disso só aparecem as vagas do robô. Se o robô não achar nada, o `clt.json` anterior é mantido.
- **Fontes**: API pública do Gupy (sem chave) e Adzuna (opcional, traz salário: cadastre os secrets `ADZUNA_ID` e `ADZUNA_KEY`). Depois da primeira execução, abra o relatório `relatorio-vagas` (Actions) para ver o que cada fonte entregou.

## Espaço Cultural (versão 3.5.1)

- **Menu novo “Espaço Cultural” 🎭**: shows, teatro e humor, infantil, festivais, festas/samba, artes e exposições e Carnaval 2027 em Recife, Olinda, Paulista e Jaboatão dos Guararapes, pagos e gratuitos. Filtros por cidade, categoria, preço e período, busca, favoritos (⭐), botão **Pôr na Agenda**, **Mapa** e **Ingressos**. Eventos que já passaram somem sozinhos.
- **Dados**: ficam em `CU_BASE` no `index.html` e no arquivo `cultural.json` (mesma lista). Ao abrir o menu, o app lê o `cultural.json`; para atualizar a lista sem lançar app novo, troque o arquivo e aumente `atualizado` (AAAA-MM-DD). Campos: `t` título, `d` data, `f` data final, `h` horário, `l` local, `c` cidade (`r` Recife, `o` Olinda, `p` Paulista, `j` Jaboatão), `k` categoria, `p` preço, `g` (1 gratuito, 0 pago, vazio = consultar), `u` link, `o` observações.
- Lista reunida em 06/11/2026 de sites de ingressos e agendas culturais. Paulista e Jaboatão têm poucos eventos publicados nessas fontes.


- **Tema Natal** (`data-color="natal"`): árvore de Natal no fundo e no canto da tela, neve caindo, bolas penduradas, luzes piscando no topo, azevinho nos cartões e fonte natalina. Vem ligado automaticamente na primeira abertura (`natalAuto()` no `index.html`) e o usuário troca em Configurações › Aparência › Cor do tema. A imagem da árvore fica dentro do `index.html` (constante `NT_IMG`). Também põe um gorrinho de Papai Noel em cima do ícone do app (cabeçalho e tela de entrada), só enquanto o tema Natal estiver ativo (`ntHats()` no `index.html`).

## Biblioteca (menu 📚)

Menu **Biblioteca** com mais de 350 livros em português (domínio público) lidos dentro do app, com leitor de PDF (páginas, tamanho da letra, modo noturno e "parou na página X").

- Catálogo: `biblioteca/livros.json` (o app também tem uma cópia embutida) e fontes em `biblioteca/fontes.json`.
- Para criar os PDFs: GitHub > Actions > **Gerar Biblioteca (livros em PDF)** > Run workflow. Ele baixa os textos do Projeto Gutenberg, gera `biblioteca/<id>.pdf` e salva no repositório.
- Local: `pip install reportlab && python3 biblioteca/gerar-livros.py`.
- Depois da primeira leitura de cada livro, ele fica no aparelho e abre sem internet.

## Menu Bíblia

- **Duas abas**: Bíblia Protestante (66 livros) e Bíblia Católica (73 livros). Dentro de cada uma: **Ler**, **Anotações**, **Histórias** e **Harpa** (na aba Católica aparece como **Cânticos**).
- **Texto da Bíblia**: o app procura primeiro na pasta `biblia/` (por exemplo `biblia/arc.json`, `biblia/catolica.json`), depois na internet (repositórios públicos no GitHub). Depois da primeira leitura o texto fica guardado no aparelho e abre sem internet.
- **Bíblia Católica com os 7 livros deuterocanônicos** (Tobias, Judite, 1 e 2 Macabeus, Sabedoria, Eclesiástico e Baruc): coloque um arquivo `biblia/catolica.json` (73 livros) no GitHub, ou use o botão **Importar** na tela Ler. Formato: `[{"abbrev":"gn","name":"Gênesis","chapters":[["versículo 1","versículo 2"]]}]`, com os livros na ordem da Bíblia católica. Sem esse arquivo, a aba Católica usa a Almeida (ARC) nos 66 livros em comum.
- **Anotações, marcações, estudos, favoritos e hinos** ficam em `S.biblia`, então entram no backup e na sincronização do app.
- **Harpa / Cânticos**: as letras não vêm prontas. Adicione pelo botão **＋** ou use **Importar** com um arquivo `.json` (`[{"numero":1,"titulo":"…","letra":"…"}]`) ou `.txt` (cada hino começa com `# 1 - Título`).
- Como lançar: publique `index.html` e `sw.js` (a versão do `sw.js` já foi aumentada para 3.6.2). O botão **Atualizar** aparece para todos.
