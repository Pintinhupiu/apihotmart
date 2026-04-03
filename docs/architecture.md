# Arquitetura do Sistema

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE / EXTERNO                        │
│                                                                 │
│   Landing Page        Hotmart        Google Sheets   Resend     │
│   (formulário)        (webhook)      (planilha)      (e-mail)   │
└────────┬──────────────────┬──────────────┬──────────────┬───────┘
         │ POST             │ POST         │ R/W          │ SEND
         ▼                  ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (Next.js App)                       │
│                                                                 │
│  /api/forms/submit      /api/hotmart/webhook    /api/health     │
│        │                        │                               │
│        ▼                        ▼                               │
│  lib/validators         lib/hotmart                             │
│  lib/google-sheets      lib/products                            │
│                         lib/google-sheets                       │
│                         lib/resend                              │
│                                                                 │
│  lib/env  ·  lib/logger  ·  lib/utils                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo 1 — Submissão do formulário

```
Landing page
    │
    │ POST /api/forms/submit
    │ { nome, whatsapp, instagram, email, horario, dia, objetivo }
    ▼
Validação (Zod)
    │
    ├── inválido → 422 com erros detalhados
    │
    ▼
Verificar duplicidade (findLeadByEmail)
    │
    ├── e-mail já existe → 200 "já registrado"
    │
    ▼
insertLead → Google Sheets
    │
    └── status_compra = pendente
        email_enviado = nao
        demais campos de compra = vazios
    │
    ▼
201 { success: true }
    │
    └── Landing page redireciona para checkout da Hotmart
```

---

## Fluxo 2 — Compra aprovada (webhook Hotmart)

```
Hotmart
    │
    │ POST /api/hotmart/webhook
    │ Header: x-hotmart-hottok = TOKEN
    ▼
validateWebhookToken()
    │
    ├── dev sem token → loga aviso, permite
    ├── prod sem token → 500 erro de configuração
    ├── token errado  → 401
    │
    ▼
parseWebhookPayload()
    │
    ├── evento não aprovado (boleto, reembolso...) → 200 "ignorado"
    ├── sem e-mail do comprador → 200 "ignorado"
    │
    ▼
identifyProduct(productId, productName)
    │
    ├── ID match → produto identificado
    ├── nome match (fallback) → produto identificado
    ├── não reconhecido → 200 "produto não reconhecido" (log de aviso)
    │
    ▼
findLeadByEmail(buyerEmail)
    │
    ├── não encontrado → 200 (log de aviso, compra registrada mas lead ausente)
    │
    ▼
Verificar idempotência
    │
    ├── transaction_id já existe → 200 "já processado"
    ├── email_enviado = sim → pula envio, mas atualiza planilha
    │
    ▼
sendWelcomeEmail() via Resend
    │
    ├── sucesso → email_enviado = sim
    └── falha   → email_enviado = nao (planilha atualizada mesmo assim, log de erro)
    │
    ▼
updateLeadByEmail()
    │
    └── status_compra = pago
        produto_comprado = passo_0 | 0_a_100
        email_enviado = sim | nao
        transaction_id = <id>
        data_pagamento = <timestamp>
    │
    ▼
200 { success: true }
```

---

## Estrutura de arquivos

```
app/
  api/
    forms/submit/route.ts     ← Endpoint do formulário
    hotmart/webhook/route.ts  ← Endpoint do webhook
    health/route.ts           ← Health check

lib/
  env.ts           ← Leitura centralizada de env vars
  logger.ts        ← Logger estruturado (JSON) com contexto nomeado
  validators.ts    ← Schema Zod do formulário
  utils.ts         ← normalizePhone, normalizeEmail, nowISO, nowBrasilia
  google-sheets.ts ← insertLead, findLeadByEmail, updateLeadByEmail, leadExists
  hotmart.ts       ← validateWebhookToken, parseWebhookPayload, isApprovedEvent
  resend.ts        ← sendWelcomeEmail + template HTML
  products.ts      ← PRODUCTS map, identifyProduct, getProductByKey

types/
  lead.ts          ← LeadSheetRow, LeadFormSubmission, SHEET_COLUMNS, ProductType
  hotmart.ts       ← HotmartWebhookPayload, ParsedHotmartEvent, tipos Hotmart
  api.ts           ← ApiSuccessResponse, ApiErrorResponse, HealthCheckResponse

docs/
  setup.md         ← Guia de configuração de todos os serviços
  architecture.md  ← Este arquivo
```

---

## Decisões de design

### Uma planilha, dois produtos
Toda a lógica de identificação de produto é feita no momento do processamento
do webhook, comparando `product.id` e `product.name` do payload com as variáveis
de ambiente. A planilha armazena `produto_comprado` como string (`passo_0` ou `0_a_100`)
para rastreabilidade.

### E-mail único com template parametrizado
O template HTML do e-mail recebe `produtoNome`, `driveUrl` e `emailSubject`
como parâmetros. Isso evita duplicar código de template enquanto permite
personalização por produto.

### Idempotência por transaction_id + email_enviado
Dois mecanismos sobrepostos protegem contra duplicidade:
1. `transaction_id`: se o mesmo ID já existir na linha, o evento é ignorado
2. `email_enviado = sim`: mesmo se o transaction_id não bater, o e-mail não é reenviado

### Modo development vs production no webhook
Em `APP_ENV=development` com `HOTMART_WEBHOOK_TOKEN` vazio, a validação de token
é ignorada para facilitar testes locais com payload fake.
Em `APP_ENV=production`, token vazio resulta em erro 500 — a aplicação falha
de forma explícita, forçando a configuração correta antes do go-live.

### Falha no envio de e-mail não bloqueia a atualização da planilha
Se o Resend falhar, o `email_enviado` permanece `nao` na planilha.
Isso permite reprocessamento manual (ou futuro retry) sem perder o registro
da compra aprovada.

---

## Variáveis de ambiente por responsabilidade

| Variável | Usada em | Obrigatória em prod |
|----------|----------|---------------------|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | google-sheets.ts | Sim |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | google-sheets.ts | Sim |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | google-sheets.ts | Sim |
| `RESEND_API_KEY` | resend.ts | Sim |
| `RESEND_FROM_EMAIL` | resend.ts | Sim |
| `HOTMART_WEBHOOK_TOKEN` | hotmart.ts | Sim |
| `HOTMART_PASSO0_PRODUCT_ID` | products.ts | Recomendado |
| `HOTMART_PASSO0_PRODUCT_NAME` | products.ts | Sim |
| `HOTMART_0100_PRODUCT_ID` | products.ts | Recomendado |
| `HOTMART_0100_PRODUCT_NAME` | products.ts | Sim |
| `PASSO0_DRIVE_ASSETS_URL` | products.ts | Recomendado |
| `ZERO100_DRIVE_ASSETS_URL` | products.ts | Recomendado |
| `ALLOWED_ORIGIN` | forms/submit | Sim (não use `*`) |
| `APP_ENV` | env.ts, hotmart.ts | Sim (`production`) |
| `APP_URL` | referência | Opcional |
