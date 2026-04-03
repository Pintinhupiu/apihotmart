import { NextRequest, NextResponse } from "next/server";
import { validateWebhookToken, parseWebhookPayload } from "@/lib/hotmart";
import { findLeadByEmail, updateLeadAtRow } from "@/lib/google-sheets";
import { sendWelcomeEmail } from "@/lib/resend";
import { identifyProduct } from "@/lib/products";
import { createLogger } from "@/lib/logger";
import { nowBrasilia } from "@/lib/utils";
import { env } from "@/lib/env";
import type { HotmartWebhookPayload } from "@/types/hotmart";
import type { ApiResponse } from "@/types/api";
import type { ProductType } from "@/types/lead";

const logger = createLogger("hotmart/webhook");

// ─── POST /api/hotmart/webhook ────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Wrapper global: qualquer erro não tratado retorna 200 para evitar
  // que a Hotmart entre em loop de reenvio infinito.
  try {
    return await processWebhook(request);
  } catch (err) {
    logger.error("Erro não tratado no processamento do webhook", {
      error: err instanceof Error ? err.message : String(err),
    });
    // Retorna 200 intencionalmente — o erro está logado para investigação
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Erro interno — evento registrado para revisão" },
      { status: 200 }
    );
  }
}

async function processWebhook(request: NextRequest): Promise<NextResponse> {

  // 1. Validar token da Hotmart
  const validation = validateWebhookToken(request.headers);
  if (!validation.valid) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: validation.reason },
      { status: validation.status }
    );
  }

  // 2. Parsear o payload
  let body: HotmartWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Payload inválido — esperado JSON" },
      { status: 400 }
    );
  }

  // 3. Logar payload completo apenas em desenvolvimento
  if (env.isDevelopment) {
    logger.debug("[DEV] Payload recebido do webhook", body);
  }

  // 4. Verificar se é evento de compra aprovada
  const event = parseWebhookPayload(body);
  if (!event) {
    // Evento ignorado (boleto, reembolso, etc.) — 200 para não gerar reenvio
    return NextResponse.json<ApiResponse>(
      { success: true, message: "Evento recebido e ignorado" },
      { status: 200 }
    );
  }

  const { transactionId, buyerEmail, buyerName, productId, productName } = event;

  // 5. Identificar o produto comprado
  const product = identifyProduct(productId, productName);
  if (!product) {
    logger.warn("Produto não identificado no webhook", { productId, productName });
    return NextResponse.json<ApiResponse>(
      { success: true, message: "Produto não reconhecido — evento registrado" },
      { status: 200 }
    );
  }

  logger.info("Produto identificado", {
    key: product.key,
    displayName: product.displayName,
  });

  // 6. Buscar o lead na planilha pelo e-mail
  const found = await findLeadByEmail(buyerEmail);

  if (!found) {
    logger.warn("Lead não encontrado na planilha", {
      email: buyerEmail,
      transactionId,
      product: product.key,
    });
    return NextResponse.json<ApiResponse>(
      { success: true, message: "Compra registrada — lead não localizado no forms" },
      { status: 200 }
    );
  }

  const { lead, rowIndex } = found;

  // 7. Idempotência por transaction_id
  if (lead.transaction_id && lead.transaction_id === transactionId) {
    logger.info("Webhook duplicado ignorado (mesmo transaction_id)", {
      email: buyerEmail,
      transactionId,
    });
    return NextResponse.json<ApiResponse>(
      { success: true, message: "Evento já processado anteriormente" },
      { status: 200 }
    );
  }

  // 8. Enviar e-mail de boas-vindas (se ainda não enviado)
  let emailEnviado = lead.email_enviado;

  if (emailEnviado === "sim") {
    logger.info("E-mail já enviado anteriormente — pulando envio", {
      email: buyerEmail,
    });
  } else {
    try {
      await sendWelcomeEmail({
        nome: lead.nome || buyerName,
        email: buyerEmail,
        produtoNome: product.displayName,
        horario: lead.horario,
        dia: lead.dia,
        driveUrl: product.driveAssetsUrl,
        emailSubject: product.emailSubject,
      });
      emailEnviado = "sim";
    } catch (err) {
      // Falha no e-mail não interrompe — planilha é atualizada mesmo assim.
      // email_enviado permanece "nao" para reprocessamento manual.
      logger.error("Falha ao enviar e-mail — planilha será atualizada mesmo assim", {
        email: buyerEmail,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 9. Atualizar o lead diretamente pelo rowIndex (sem nova leitura da planilha)
  await updateLeadAtRow(rowIndex, lead, {
    status_compra: "pago",
    produto_comprado: product.key as ProductType,
    email_enviado: emailEnviado,
    transaction_id: transactionId,
    data_pagamento: nowBrasilia(),
  });

  logger.info("Webhook processado com sucesso", {
    email: buyerEmail,
    product: product.key,
    transactionId,
    emailEnviado,
  });

  return NextResponse.json<ApiResponse>(
    { success: true, message: "Compra processada com sucesso" },
    { status: 200 }
  );
}
