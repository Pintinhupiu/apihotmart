import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { nowISO } from "@/lib/utils";
import {
  HOTMART_APPROVED_EVENTS,
  type HotmartWebhookPayload,
  type ParsedHotmartEvent,
} from "@/types/hotmart";

const logger = createLogger("hotmart");

// ─── Validação do token ───────────────────────────────────────────────────────

/**
 * Resultado da validação do webhook.
 */
export type WebhookValidationResult =
  | { valid: true }
  | { valid: false; reason: string; status: number };

/**
 * Valida se a requisição veio realmente da Hotmart.
 *
 * Comportamento por ambiente:
 * - development: se HOTMART_WEBHOOK_TOKEN estiver vazio, loga aviso e permite.
 *   Isso facilita testes locais com payload fake antes de ter o webhook configurado.
 * - production: token é obrigatório. Requisições sem o header ou com token
 *   errado são rejeitadas com 401.
 *
 * A Hotmart envia o token no header: x-hotmart-hottok
 */
export function validateWebhookToken(
  headers: Headers
): WebhookValidationResult {
  const token = env.HOTMART_WEBHOOK_TOKEN;

  if (!token) {
    if (env.isProduction) {
      logger.error(
        "HOTMART_WEBHOOK_TOKEN não configurado em produção — requisição rejeitada"
      );
      return {
        valid: false,
        reason: "Webhook token não configurado no servidor",
        status: 500,
      };
    }

    // Modo desenvolvimento sem token: avisa mas permite
    logger.warn(
      "[DEV] HOTMART_WEBHOOK_TOKEN não configurado — validação ignorada em desenvolvimento"
    );
    return { valid: true };
  }

  const hottok = headers.get("x-hotmart-hottok");

  if (!hottok) {
    logger.warn("Webhook recebido sem header x-hotmart-hottok");
    return {
      valid: false,
      reason: "Token de autenticação ausente",
      status: 401,
    };
  }

  if (hottok !== token) {
    logger.warn("Token do webhook inválido", {
      received: hottok.slice(0, 4) + "***",
    });
    return { valid: false, reason: "Token de autenticação inválido", status: 401 };
  }

  return { valid: true };
}

// ─── Parsing do payload ───────────────────────────────────────────────────────

/**
 * Verifica se o evento é de compra aprovada/concluída.
 */
export function isApprovedEvent(event?: string): boolean {
  if (!event) return false;
  return (HOTMART_APPROVED_EVENTS as readonly string[]).includes(event);
}

/**
 * Extrai e normaliza os dados relevantes de um payload da Hotmart.
 *
 * @returns ParsedHotmartEvent se o evento for aprovado e tiver dados mínimos,
 *          ou null se o evento deve ser ignorado.
 */
export function parseWebhookPayload(
  payload: HotmartWebhookPayload
): ParsedHotmartEvent | null {
  const event = payload.event ?? "";

  if (!isApprovedEvent(event)) {
    logger.info("Evento ignorado (não é compra aprovada)", { event });
    return null;
  }

  const buyer = payload.data?.buyer;
  const purchase = payload.data?.purchase;
  const product = payload.data?.product;

  if (!buyer?.email) {
    logger.warn("Payload sem e-mail do comprador", { event });
    return null;
  }

  if (!purchase?.transaction) {
    logger.warn("Payload sem transaction ID", { event });
    return null;
  }

  const parsed: ParsedHotmartEvent = {
    transactionId: purchase.transaction,
    event,
    buyerName: buyer.name ?? "",
    buyerEmail: buyer.email.trim().toLowerCase(),
    buyerPhone: buyer.phone ?? "",
    productId: product?.id != null ? String(product.id) : "",
    productName: product?.name ?? "",
    purchaseStatus: purchase.status ?? "",
    approvedAt: nowISO(),
  };

  logger.info("Evento aprovado parseado", {
    transactionId: parsed.transactionId,
    email: parsed.buyerEmail,
    productId: parsed.productId,
    productName: parsed.productName,
  });

  return parsed;
}
