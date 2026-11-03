# JC ORGANIZA

Agenda, notas, diário, compras e plantões. O APK é gerado pelo GitHub Actions (aba Actions › Gerar APK).

## Aviso: boas-vindas para novos usuários (não é uma atualização)

- **Caixa de informação com tudo o que o app oferece** (Início, Agenda, Calendário, Meus Plantões, Notas, Diário, Compras, Carteira, Promoções, Lembretes e alarme, Configurações). Aparece **uma única vez e só para usuário novo**: quem abre o app sem nome e sem dados vê a caixa logo depois de entrar com o nome ou com uma conta. Quem já usava o app nunca vê.
  - Chaves no `localStorage`: `ma-guia-novos-pend` (é novo e ainda vai ver) e `ma-guia-novos` (já viu / não é novo). O texto fica em `GUIA_APP` no `index.html`.
  - Não precisa mudar o `VERSION` do `sw.js`.

## Aviso: guia das Configurações (não é uma atualização)

- **Caixa de recado com o guia das Configurações**: uma caixa com a lista de todas as funções da tela Configurações (Perfil, Conta, Backup, Lembretes e alarme, Aplicativo, Tela inicial, Idioma, Menu, Aparência, Segurança, Permissões e Sair). Ela aparece **uma única vez por aparelho** (chave `ma-recado-config-v1` no `localStorage`):
  - **Quem já tem o app**: aparece na próxima vez que abrir (não precisa mudar o `VERSION` do `sw.js`: o app carrega o `index.html` novo sozinho), depois de liberar a senha e das outras caixas.
  - **Usuário novo**: aparece uma vez logo depois de entrar com o nome ou com uma conta (Google, e-mail ou celular).
  - Não empilha com outras caixas: espera elas fecharem. O texto fica em `RECADO_CFG` no `index.html`; se mudar alguma opção das Configurações, atualize a lista. Para mostrar de novo a todos, troque `-v1` por `-v2` na chave.

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
