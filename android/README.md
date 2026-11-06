# Gran Fish · Aplicativo Android Oficial

Aplicativo nativo Android desenvolvido para o estaleiro **Gran Fish**, empacotando todo o ecossistema do site, catálogo de embarcações com fichas técnicas interativas, configuradores 3D e a assistente virtual Marina.

---

## 📱 Destaques do Aplicativo

- **Navegação com Aceleração por Hardware:** Otimizado para WebGL/Three.js nos configuradores 3D da *Hurricane 60 SL* e *Linha Pontoon*.
- **100% Funcional Offline:** Equipado com `WebViewAssetLoader`, servindo todos os assets (HTML, CSS, JS, fotos de alta resolução e plantas baixas) localmente a partir de `https://appassets.androidplatform.net/assets/`.
- **Botão Voltar Nativo:** Integração com o botão físico e gestos do Android: fecha a modal do catálogo ou o chat da Marina antes de sair da tela ou recuar no histórico.
- **Integração Nativa:**
  - **WhatsApp:** Abre diretamente o app do WhatsApp oficial ao tocar em "Falar com o estaleiro" ou links da equipe.
  - **Telefone e E-mail:** Aciona discador nativo e cliente de e-mail.
  - **Google Maps:** Abre rotas direto para Pratápolis - MG.
  - **Gerenciador de Downloads:** PDFs e arquivos PPTX são baixados através do `DownloadManager` nativo do Android.
  - **Upload de Arquivos / Câmera:** Suporte nativo para envio de currículo e fotos no cadastro.
- **Splash Screen e Identidade Visual:** Tema luxo em tom navy `#071d26` e cobre `#d9743f`, com barra de status integrada.

---

## 🛠️ Como Abrir e Compilar

### Opção 1: Compilação Automática no GitHub (Sem instalar nada no PC)
Sempre que você envia alterações para o GitHub, o fluxo do **GitHub Actions** compila o APK automaticamente:
1. Acesse o repositório no GitHub: `https://github.com/Nar1981/site-piloto-granfish/actions`
2. Clique na execução **"Build Android APK"** mais recente.
3. Baixe o artefato **`GranFish-Android-Debug-APK`**.
4. Instale o arquivo `app-debug.apk` direto no seu celular Android!

### Opção 2: Android Studio
1. Abra o **Android Studio**.
2. Clique em **File > Open** e selecione a pasta `site-piloto-granfish/android`.
3. Aguarde o Gradle sincronizar as dependências.
4. Conecte seu celular Android via USB (ou use um emulador) e clique no botão verde **Run (▶)**.

### Opção 3: Linha de Comando (Gradle)
```bash
# No Windows
cd android
gradlew.bat assembleDebug

# No Linux / macOS
cd android
./gradlew assembleDebug
```
O APK compilado estará em:
`android/app/build/outputs/apk/debug/app-debug.apk`
