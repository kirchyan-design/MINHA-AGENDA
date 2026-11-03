# JC ORGANIZA

Agenda, notas, diário, compras e plantões. O APK é gerado pelo GitHub Actions (aba Actions › Gerar APK).

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
- Meu Mercado mostra apenas as promoções do Assaí Atacadista.

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
