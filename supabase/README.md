# Banco de dados dos cadastros (Supabase)

O site é estático (GitHub Pages), então os cadastros são gravados em um banco Supabase (gratuito) via API REST.

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, execute o conteúdo de `schema.sql`. Ele cria a tabela `cadastros` com RLS: visitantes só podem **inserir** (sempre como "Pendente"); somente a equipe autenticada lê e atualiza.
3. Em **Authentication → Users**, crie o usuário da equipe (e-mail e senha). Desative o cadastro público em **Authentication → Providers → Email → Allow new users to sign up**.
4. Em **Project Settings → API**, copie a *Project URL* e a chave `anon public` para `js/cadastro-config.js`:

```js
window.GF_CADASTRO = {
  supabaseUrl: 'https://SEU-PROJETO.supabase.co',
  supabaseAnonKey: 'SUA_CHAVE_ANON'
};
```

Depois, execute também `admins.sql`: cria as funções que a página `usuarios-admin.html` usa para listar, criar e remover administradores (apenas a equipe autenticada; senha mínima de 12 caracteres com maiúscula, minúscula e número; ninguém remove a si mesmo).

A chave `anon` é pública por design; a segurança vem das políticas RLS do `schema.sql`. Nunca use a chave `service_role` no site.

Cadastros ficam em `cadastros-admin.html` (login da equipe, filtro, alteração de status e exportação CSV).

## Acesso interno e segurança

- Depois de criar o usuário, autorize-o rodando no SQL Editor: `insert into public.equipe (user_id) select id from auth.users where email = 'SEU_EMAIL';`. Só quem está em `public.equipe` lê ou altera cadastros (RLS).
- Ative MFA e use senha forte em **Authentication**; mantenha o cadastro público desativado.
- O painel exige login, expira a sessão em 1 h ou 15 min sem atividade, bloqueia por 5 min após 5 erros e só funciona com o banco conectado (fora do localhost).

Execute tambem `instagram.sql` (tabelas das publicacoes do Instagram exibidas no site, gerenciadas em `instagram-admin.html`).

Execute tambem `conteudo.sql` (textos, cores e configuracoes do site, editados em `personalizar-admin.html`).

## Chatbot (Marina) com Gemini

O chat (`js/chatbot.js`) chama a Edge Function `supabase/functions/chat`, que guarda a chave do Google Gemini (a chave nunca vai para o site). Se a IA falhar ou estourar a cota gratuita, o chat responde com regras de reserva e oferece o WhatsApp.

1. Gere uma chave gratuita em https://aistudio.google.com/apikey.
2. Instale a CLI do Supabase e faça login: `supabase login` e `supabase link --project-ref eqlvmxtoqavglfrtfhfx`.
3. Guarde os segredos (use o endereço real do site em `ALLOWED_ORIGINS`):
   `supabase secrets set GEMINI_API_KEY=SUA_CHAVE ALLOWED_ORIGINS=https://nar1981.github.io`
4. Publique a função: `supabase functions deploy chat --no-verify-jwt`.

Opcional: `GEMINI_MODEL` troca o modelo (padrão `gemini-2.5-flash`). A função limita 8 mensagens por minuto por IP e 12 mensagens de histórico. Ajuste o texto de `SISTEMA` em `index.ts` para ensinar novos detalhes do estaleiro (modelos, prazos, políticas).
