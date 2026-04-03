# Guia de Configuração

Passo a passo completo para configurar todos os serviços integrados.

---

## 1. Google Cloud — Service Account

A integração com o Google Sheets usa uma **Service Account** (conta de serviço),
que é uma conta técnica usada por aplicações para acessar APIs do Google.

### Criar a Service Account

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto (ou selecione um existente)
3. Ative a **Google Sheets API**:
   - Navegue em **APIs e Serviços → Biblioteca**
   - Busque "Google Sheets API" → Ativar
4. Crie a Service Account:
   - Vá em **APIs e Serviços → Credenciais**
   - Clique em **Criar credenciais → Conta de serviço**
   - Dê um nome (ex: `apphotmart-sheets`)
   - Clique em **Concluído** (sem precisar de papéis extras)
5. Abra a conta criada → aba **Chaves**
6. Clique em **Adicionar chave → Criar nova chave → JSON**
7. Salve o arquivo JSON baixado

### Extrair as variáveis do JSON

No arquivo JSON baixado, copie:
- `client_email` → use em `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → use em `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

> **Atenção:** a `private_key` contém quebras de linha reais (`\n`).
> No `.env.local`, cole entre aspas duplas mantendo os `\n` literais:
> ```
> GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC123...\n-----END PRIVATE KEY-----\n"
> ```
> Na Vercel, cole o valor exatamente assim (com aspas, se necessário).

---

## 2. Google Sheets — Configurar a planilha

### Criar a planilha

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha
3. Renomeie a aba padrão para **`leads`** (clique duplo na aba)
4. Na linha 1, adicione os cabeçalhos exatamente nesta ordem:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| nome | whatsapp | instagram | email | horario | dia | objetivo | status_compra | produto_comprado | email_enviado | transaction_id | data_pagamento |

5. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
   Use esse ID em `GOOGLE_SHEETS_SPREADSHEET_ID`.

### Compartilhar com a Service Account

1. Na planilha, clique em **Compartilhar**
2. No campo de e-mail, cole o `client_email` da Service Account
3. Defina a permissão como **Editor**
4. Clique em **Enviar** (desmarque "Notificar pessoas")

---

## 3. Resend — Configurar envio de e-mail

1. Crie uma conta em [resend.com](https://resend.com)
2. Adicione e verifique seu domínio em **Domains**
   - Adicione os registros DNS conforme instruído
   - Aguarde a verificação (alguns minutos)
3. Crie uma API Key em **API Keys → Create API Key**
   - Use em `RESEND_API_KEY`
4. Configure:
   - `RESEND_FROM_EMAIL`: ex. `matriculas@meudominio.com.br`
   - `RESEND_FROM_NAME`: ex. `Mentoria`

> Durante testes locais sem domínio verificado, você pode usar
> `onboarding@resend.dev` como remetente para até 100 e-mails/dia.

---

## 4. Hotmart — Configurar webhook

> Faça isso **depois** de publicar o app na Vercel.

### Obter os IDs dos produtos

1. No painel da Hotmart, vá em **Produtos**
2. Clique no produto desejado
3. O ID numérico aparece na URL ou nos detalhes do produto
4. Copie e configure:
   - `HOTMART_PASSO0_PRODUCT_ID`
   - `HOTMART_0100_PRODUCT_ID`

### Cadastrar o webhook

1. Vá em **Ferramentas → Webhooks**
2. Clique em **Adicionar webhook**
3. Configure:
   - **URL:** `https://SEU-APP.vercel.app/api/hotmart/webhook`
   - **Token:** gere um token forte e aleatório

   Para gerar um token seguro no terminal:
   ```bash
   openssl rand -hex 32
   ```

4. Selecione os eventos:
   - ✅ Compra Aprovada (`PURCHASE_APPROVED`)
   - ✅ Compra Concluída (`PURCHASE_COMPLETE`)
5. Salve e copie o token
6. Adicione o token em `HOTMART_WEBHOOK_TOKEN` nas variáveis da Vercel
7. Faça um redeploy do app

### Testar o webhook

A Hotmart oferece um botão de **"Enviar teste"** no painel de webhooks.
Após o redeploy, use esse botão e verifique os logs na Vercel
(Project → Deployments → Functions → logs).

---

## 5. Google Drive — Materiais da mentoria

1. Crie uma pasta no Google Drive para cada produto
2. Faça upload dos materiais
3. Clique com o botão direito → **Compartilhar → Qualquer pessoa com o link**
4. Copie o link e configure:
   - `PASSO0_DRIVE_ASSETS_URL`
   - `ZERO100_DRIVE_ASSETS_URL`

---

## 6. Checklist final antes do go-live

- [ ] Service Account criada e chave JSON salva
- [ ] Planilha criada com aba `leads` e cabeçalhos corretos
- [ ] Planilha compartilhada com a Service Account (Editor)
- [ ] Domínio verificado no Resend
- [ ] App publicado na Vercel com todas as variáveis configuradas
- [ ] `APP_ENV=production` na Vercel
- [ ] `ALLOWED_ORIGIN` com a URL exata do seu site
- [ ] Webhook cadastrado na Hotmart com token seguro
- [ ] `HOTMART_WEBHOOK_TOKEN` configurado na Vercel + redeploy feito
- [ ] IDs dos produtos configurados (`HOTMART_PASSO0_PRODUCT_ID`, `HOTMART_0100_PRODUCT_ID`)
- [ ] Links do Drive configurados para ambos os produtos
- [ ] Teste de formulário realizado (verificar linha na planilha)
- [ ] Teste de webhook realizado (verificar e-mail + planilha atualizada)
