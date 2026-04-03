# Apphotmart — Backend de Automação de Onboarding

Backend serverless em Next.js para automatizar o onboarding das mentorias **Passo 0** e **0 a 100**.

Hospedado na Vercel. Roda 100% em nuvem, sem depender de servidor próprio.

---

## O que este app faz

```
Formulário → Salva lead no Google Sheets
                      ↓
              Hotmart aprova compra
                      ↓
         Webhook chega em /api/hotmart/webhook
                      ↓
    Identifica produto (Passo 0 ou 0 a 100)
                      ↓
       Busca lead na planilha pelo e-mail
                      ↓
    Envia e-mail de boas-vindas via Resend
                      ↓
       Atualiza status do lead na planilha
```

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/forms/submit` | Recebe lead do formulário da landing page |
| `POST` | `/api/hotmart/webhook` | Processa webhook de compra aprovada |
| `GET` | `/api/health` | Health check da aplicação |

---

## Stack

- **Next.js 16** com App Router e TypeScript
- **Google Sheets API** via Service Account
- **Resend** para e-mails transacionais
- **Zod** para validação de payloads
- **Vercel** para deploy e hospedagem

---

## Configuração rápida

### 1. Clonar e instalar

```bash
git clone <repo>
cd apphotmart
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha o `.env.local` com suas credenciais. Veja [docs/setup.md](docs/setup.md) para instruções detalhadas de cada serviço.

### 3. Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000/api/health

---

## Deploy na Vercel

### Passo a passo

1. Faça push do projeto para um repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → selecione o repositório
3. Na tela de configuração, adicione **todas as variáveis de ambiente** do `.env.example`
4. Clique em **Deploy**

### Variáveis obrigatórias na Vercel

Acesse **Project → Settings → Environment Variables** e adicione:

| Variável | Onde obter |
|----------|-----------|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | URL da planilha |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud Console |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | JSON da Service Account |
| `RESEND_API_KEY` | resend.com/api-keys |
| `RESEND_FROM_EMAIL` | Domínio verificado no Resend |
| `HOTMART_WEBHOOK_TOKEN` | Painel Hotmart → Webhooks |
| `HOTMART_PASSO0_PRODUCT_ID` | Painel Hotmart → Produtos |
| `HOTMART_0100_PRODUCT_ID` | Painel Hotmart → Produtos |
| `PASSO0_DRIVE_ASSETS_URL` | Link da pasta no Drive |
| `ZERO100_DRIVE_ASSETS_URL` | Link da pasta no Drive |

> **Atenção com a chave privada do Google:** cole o valor entre aspas duplas,
> mantendo os `\n` literais. A Vercel interpreta corretamente.

---

## Configurar o webhook na Hotmart

> Faça isso **depois** de publicar o app na Vercel e ter a URL pública.

1. Acesse o painel da Hotmart
2. Vá em **Ferramentas → Webhooks**
3. Clique em **Adicionar webhook**
4. Configure:
   - **URL:** `https://SEU-DOMINIO.vercel.app/api/hotmart/webhook`
   - **Token de autenticação:** crie um token forte e aleatório (ex: `openssl rand -hex 32`)
5. Selecione os eventos: **Compra Aprovada** e **Compra Concluída**
6. Copie o token gerado e adicione à variável `HOTMART_WEBHOOK_TOKEN` na Vercel
7. Faça um redeploy para aplicar a variável

---

## Testar o webhook localmente (sem Hotmart configurada)

Em `APP_ENV=development` com `HOTMART_WEBHOOK_TOKEN` vazio, a validação do token é ignorada.

```bash
curl -X POST http://localhost:3000/api/hotmart/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PURCHASE_APPROVED",
    "data": {
      "buyer": {
        "name": "João Silva",
        "email": "joao@exemplo.com",
        "phone": "11999999999"
      },
      "purchase": {
        "transaction": "HP-TESTE-001",
        "status": "APPROVED"
      },
      "product": {
        "id": 12345,
        "name": "Mentoria Passo 0"
      }
    }
  }'
```

> O e-mail `joao@exemplo.com` precisa existir na planilha (linha 2 em diante) para o fluxo completo funcionar.

---

## Testar o endpoint do formulário

```bash
curl -X POST http://localhost:3000/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "whatsapp": "11999999999",
    "instagram": "@joaosilva",
    "email": "joao@exemplo.com",
    "horario": "19h",
    "dia": "Segunda ou Quarta",
    "objetivo": "Evoluir como fotógrafo profissional"
  }'
```

---

## Planilha Google Sheets

A planilha deve ter uma aba chamada **`leads`** com os cabeçalhos na linha 1:

```
nome | whatsapp | instagram | email | horario | dia | objetivo |
status_compra | produto_comprado | email_enviado | transaction_id | data_pagamento
```

Compartilhe a planilha com o e-mail da Service Account com permissão de **Editor**.

Veja instruções completas em [docs/setup.md](docs/setup.md).

---

## Checklist de deploy

### Antes de publicar

- [ ] `npm run build` passou sem erros localmente
- [ ] `.env.local` preenchido com credenciais reais e testado
- [ ] Planilha criada com aba `leads` e 12 cabeçalhos corretos
- [ ] Planilha compartilhada com a Service Account (Editor)
- [ ] Domínio verificado no Resend
- [ ] Teste local do forms: `curl POST /api/forms/submit` → linha aparece na planilha
- [ ] Teste local do webhook: `curl POST /api/hotmart/webhook` com payload fake → e-mail recebido + planilha atualizada

### Na Vercel (primeiro deploy)

1. Crie um repositório no GitHub e faça push do projeto
2. No painel da Vercel: **Add New Project** → selecione o repositório
3. **Não clique em Deploy ainda** — vá em **Environment Variables** primeiro
4. Adicione **todas as variáveis** abaixo marcadas como obrigatórias:

| Variável | Obrigatória | Notas |
|----------|:-----------:|-------|
| `APP_ENV` | ✅ | Defina como `production` |
| `APP_URL` | ✅ | URL do app na Vercel (preencha após o 1º deploy) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ✅ | |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | ✅ | Cole com `\n` literais, sem aspas extras |
| `RESEND_API_KEY` | ✅ | |
| `RESEND_FROM_EMAIL` | ✅ | Domínio verificado no Resend |
| `RESEND_FROM_NAME` | — | Padrão: `Mentoria` |
| `HOTMART_WEBHOOK_TOKEN` | ✅ | Preencher depois de criar o webhook na Hotmart |
| `HOTMART_PASSO0_PRODUCT_ID` | ✅ | ID numérico do produto no painel Hotmart |
| `HOTMART_PASSO0_PRODUCT_NAME` | ✅ | Padrão: `Mentoria Passo 0` |
| `HOTMART_0100_PRODUCT_ID` | ✅ | ID numérico do produto no painel Hotmart |
| `HOTMART_0100_PRODUCT_NAME` | ✅ | Padrão: `Mentoria 0 a 100` |
| `PASSO0_DRIVE_ASSETS_URL` | — | Link do Drive (aparece no e-mail) |
| `ZERO100_DRIVE_ASSETS_URL` | — | Link do Drive (aparece no e-mail) |
| `ALLOWED_ORIGIN` | ✅ | URL exata do seu site (sem `/` final) |

5. Clique em **Deploy**
6. Após o deploy, anote a URL gerada (ex: `apphotmart.vercel.app`)
7. Atualize `APP_URL` com essa URL e faça um novo deploy

### Configurar o webhook na Hotmart (após deploy)

1. Gere um token seguro: `openssl rand -hex 32`
2. No painel Hotmart → **Ferramentas → Webhooks → Adicionar**
3. URL: `https://SEU-APP.vercel.app/api/hotmart/webhook`
4. Token: cole o token gerado no passo 1
5. Eventos: marque **Compra Aprovada** e **Compra Concluída**
6. Salve
7. Na Vercel, atualize `HOTMART_WEBHOOK_TOKEN` com o token criado
8. Faça um **Redeploy** para aplicar

### Verificar que está funcionando

```bash
# Health check do app publicado
curl https://SEU-APP.vercel.app/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","version":"1.0.0","environment":"production"}
```

Nos logs da Vercel (**Project → Deployments → Functions**), todos os logs
aparecem em formato JSON estruturado — filtre por `context` para depurar um endpoint específico.
