/**
 * Tipos relacionados ao webhook da Hotmart.
 * Baseados na documentação oficial: https://developers.hotmart.com/docs/pt-BR/v2.0.0/
 */

export interface HotmartWebhookPayload {
  id?: string;
  creation_date?: number;
  event?: string;
  version?: string;
  data?: HotmartWebhookData;
}

export interface HotmartWebhookData {
  product?: HotmartProduct;
  purchase?: HotmartPurchase;
  buyer?: HotmartBuyer;
  producer?: HotmartProducer;
  affiliates?: HotmartAffiliate[];
  subscription?: HotmartSubscription;
}

export interface HotmartProduct {
  id?: number;
  ucode?: string;
  name?: string;
  has_co_production?: boolean;
}

export interface HotmartPurchase {
  transaction?: string;
  order_date?: number;
  approved_date?: number;
  status?: HotmartPurchaseStatus;
  payment?: HotmartPayment;
  price?: HotmartPrice;
  offer?: HotmartOffer;
}

export interface HotmartPayment {
  method?: string;
  installments_number?: number;
  type?: string;
}

export interface HotmartPrice {
  value?: number;
  currency_code?: string;
}

export interface HotmartOffer {
  code?: string;
  payment_mode?: string;
}

export interface HotmartBuyer {
  name?: string;
  ucode?: string;
  email?: string;
  phone?: string;
  phone_local_code?: string;
  document?: string;
  address?: HotmartAddress;
}

export interface HotmartAddress {
  country?: string;
  country_iso?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  address?: string;
  complement?: string;
  neighborhood?: string;
  number?: string;
}

export interface HotmartProducer {
  name?: string;
  ucode?: string;
  email?: string;
  document?: string;
}

export interface HotmartAffiliate {
  name?: string;
  ucode?: string;
}

export interface HotmartSubscription {
  subscriber?: { code?: string };
  plan?: { name?: string };
  status?: string;
}

/**
 * Status de compra possíveis na Hotmart.
 * Documentação: https://developers.hotmart.com/docs/pt-BR/v2.0.0/
 */
export type HotmartPurchaseStatus =
  | "APPROVED"
  | "BLOCKED"
  | "CANCELLED"
  | "CHARGEBACK"
  | "COMPLETE"
  | "DELAYED"
  | "EXPIRED"
  | "NO_FUNDS"
  | "OVERDUE"
  | "PARTIALLY_REFUNDED"
  | "PRE_ORDER"
  | "PRINTED_BILLET"
  | "PROCESSING_TRANSACTION"
  | "PROTESTED"
  | "REFUNDED"
  | "STARTED"
  | "UNDER_ANALISYS"
  | "WAITING_PAYMENT";

/**
 * Tipos de evento que indicam pagamento confirmado.
 */
export const HOTMART_APPROVED_EVENTS = [
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
] as const;

export type HotmartApprovedEvent = (typeof HOTMART_APPROVED_EVENTS)[number];

/**
 * Dados extraídos e normalizados de um webhook aprovado.
 * Usado internamente após parsing do payload bruto.
 */
export interface ParsedHotmartEvent {
  transactionId: string;
  event: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  productId: string;
  productName: string;
  purchaseStatus: string;
  approvedAt: string;
}
