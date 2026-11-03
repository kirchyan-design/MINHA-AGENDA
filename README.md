# JC ORGANIZA

Agenda, notas, diário, compras e plantões. O APK é gerado pelo GitHub Actions (aba Actions › Gerar APK).

## Versão 2.7

- **Escanear preços sem internet**: o leitor de texto (Tesseract) fica dentro do app, na pasta `ocr/`, e é guardado no aparelho. **Uma vez só**, rode em Actions › *Baixar leitor offline* › Run workflow para preencher a pasta `ocr/`. Depois disso o app guarda o leitor sozinho na primeira vez que abrir com internet.
- **Produto escaneado entra na lista de compras**: ao confirmar, cada produto vai direto para a lista que está sendo feita (se já estiver lá, só atualiza o preço) e o preço continua registrado no mercado.
- **Notificação de atualização**: quando sai uma versão nova, o app avisa por notificação do celular (uma vez por versão) e mostra o botão Atualizar. A checagem acontece ao abrir o app, ao voltar para ele e a cada 20 minutos enquanto está aberto. **Para cada atualização, aumente o número `VERSION` no `sw.js`** (ex.: 2.7.0 → 2.7.1); é isso que dispara o aviso.
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
