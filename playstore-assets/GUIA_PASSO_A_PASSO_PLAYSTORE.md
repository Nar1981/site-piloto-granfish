# 🚀 Guia Passo a Passo: Publicando o App Gran Fish na Google Play Store

Este guia foi elaborado para que qualquer pessoa consiga publicar o aplicativo **Gran Fish** na **Google Play Store** em poucos minutos, com todos os arquivos já prontos e compilados.

---

## 📋 Pré-requisitos
1. **Conta de Desenvolvedor Google Play**:
   - Acesse: [https://play.google.com/console](https://play.google.com/console)
   - Taxa única do Google: US$ 25 (paga diretamente ao Google via cartão).
   - Verificação de identidade da conta (CPF ou CNPJ + documento).
2. **Arquivos Prontos (Já gerados no projeto)**:
   - Pacote do App: `app-release.aab` (baixado dos Artifacts do GitHub Actions).
   - Ícone: `playstore-assets/icon-512x512.png`
   - Banner: `playstore-assets/feature-graphic-1024x500.png`
   - Screenshots: `playstore-assets/screenshot-1` até `screenshot-5`
   - Política de Privacidade: `https://nar1981.github.io/site-piloto-granfish/politica-de-privacidade.html`
   - Textos prontos: Arquivo `playstore-assets/FICHA_GOOGLE_PLAY.md`

---

## Passo 1: Obter o arquivo `app-release.aab`
1. Acesse o repositório no GitHub:
   👉 **[https://github.com/Nar1981/site-piloto-granfish/actions](https://github.com/Nar1981/site-piloto-granfish/actions)**
2. Clique na execução mais recente do workflow **"Build Android App (APK & Play Store AAB)"**.
3. Na seção **Artifacts** (ao final da página), baixe:
   - 📦 **GranFish-GooglePlay-AAB** (extraia o arquivo `app-release.aab`).
   - 🔑 **GranFish-Release-Keystore** (guarde este arquivo `granfish-release.jks` em local seguro como backup da chave de assinatura).

---

## Passo 2: Criar o Aplicativo no Google Play Console
1. Entre em [play.google.com/console](https://play.google.com/console).
2. No canto superior direito, clique em **"Criar app"** (Create app).
3. Preencha os campos básicos:
   - **Nome do app:** `Gran Fish`
   - **Idioma padrão:** `Português (Brasil) - pt-BR`
   - **App ou jogo:** `App`
   - **Gratuito ou pago:** `Gratuito`
   - Marque as caixas de aceite de políticas e leis de exportação dos EUA.
4. Clique em **"Criar app"**.

---

## Passo 3: Configurar o Conteúdo do App (Painel Inicial)
No menu lateral esquerdo, vá em **"Conteúdo do app"** (App content) na seção *Políticas*:

1. **Política de Privacidade:**
   - Cole a URL: `https://nar1981.github.io/site-piloto-granfish/politica-de-privacidade.html`
   - Clique em Salvar.
2. **Acesso a apps:**
   - Selecione: *"Todas as funcionalidades estão disponíveis sem restrições"*.
3. **Anúncios:**
   - Selecione: *"Não, meu app não contém anúncios"*.
4. **Público-alvo e conteúdo:**
   - Selecione: **18 anos ou mais** (recomendado para aprovação mais rápida).
5. **Apps de notícias:**
   - Selecione: *"Não"*.
6. **Segurança dos dados (Data safety):**
   - Pergunta: "Seu app coleta ou compartilha algum dado de usuário?"
   - Selecione: **"Não"**.
   - Salve. O app receberá o selo oficial de privacidade segura.
7. **Classificação de conteúdo (Questionário IARC):**
   - Informe seu e-mail.
   - Categoria: *Utilitário / Produtividade / Outro*.
   - Responda "Não" a todas as perguntas sobre violência, drogas, compras no app e linguagem explícita.
   - Resultado: Classificação **Livre (PEGI 3 / Everyone)**. Clique em Salvar.

---

## Passo 4: Ficha Principal da Loja (Store Listing)
No menu lateral esquerdo, vá em **"Ficha principal da loja"** (Main store listing):

1. **Detalhes do App:**
   - **Nome do app:** `Gran Fish`
   - **Descrição curta:** (copie de `FICHA_GOOGLE_PLAY.md`):
     `Catálogo oficial e configurador de embarcações náuticas Gran Fish.`
   - **Descrição completa:** Copie o texto completo de `FICHA_GOOGLE_PLAY.md`.
2. **Recursos Gráficos:**
   - **Ícone do app:** Faça upload de `playstore-assets/icon-512x512.png`.
   - **Gráfico de recursos (Banner):** Faça upload de `playstore-assets/feature-graphic-1024x500.png`.
   - **Capturas de tela do smartphone:** Faça upload de `screenshot-1` a `screenshot-5`.
3. Clique em **"Salvar"**.

---

## Passo 5: Criar o Lançamento em Produção
1. No menu lateral esquerdo, na seção **Versão**, clique em **"Produção"** (Production).
2. Clique no botão azul **"Criar nova versão"** (Create new release).
3. Na seção **Pacotes de apps (App Bundles)**:
   - Clique em **"Fazer upload"** e selecione o arquivo **`app-release.aab`** que você baixou no Passo 1.
4. O Google Play verificará a assinatura digital e o nível de API (34).
5. No campo **Nome da versão:** coloque `1.0.0`.
6. No campo **Notas da versão:**
   ```text
   Lançamento oficial do aplicativo Gran Fish Náutica.
   Catálogo de embarcações, fichas técnicas completas, plantas baixas e funcionamento offline.
   ```
7. Clique em **"Salvar e revisar versão"** (Next / Review).

---

## Passo 6: Enviar para Análise do Google
1. Revise se não há nenhum aviso impeditivo em vermelho.
2. Clique em **"Iniciar lançamento para produção"** (Start rollout to Production).
3. **Pronto!** O app entrará na fila de revisão do Google Play (geralmente aprovado em 24 a 48 horas).
4. Assim que aprovado, o link público do Google Play ficará ativo para download em qualquer smartphone Android no Brasil e no mundo!
