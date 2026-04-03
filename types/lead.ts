/**
 * Tipos relacionados a leads e à planilha Google Sheets.
 *
 * A planilha possui 12 colunas exatamente nesta ordem:
 *   nome | whatsapp | instagram | email | horario | dia | objetivo |
 *   status_compra | produto_comprado | email_enviado | transaction_id | data_pagamento
 */

// ─── Tipos base ──────────────────────────────────────────────────────────────

export type LeadStatus = "pendente" | "pago" | "cancelado" | "reembolsado";
export type SimNao = "sim" | "nao";
export type ProductType = "passo_0" | "0_a_100" | "";

// ─── Linha da planilha ───────────────────────────────────────────────────────

/**
 * Representa uma linha completa da planilha Google Sheets.
 * Cada campo mapeia diretamente a uma coluna, na ordem declarada em SHEET_COLUMNS.
 */
export interface LeadSheetRow {
  nome: string;
  whatsapp: string;
  instagram: string;
  email: string;
  horario: string;
  dia: string;
  objetivo: string;
  status_compra: LeadStatus;
  produto_comprado: ProductType;
  email_enviado: SimNao;
  transaction_id: string;
  data_pagamento: string;
}

/**
 * Colunas da planilha na ordem exata.
 * Esta lista é a fonte de verdade para todos os mapeamentos de leitura/escrita.
 */
export const SHEET_COLUMNS: (keyof LeadSheetRow)[] = [
  "nome",
  "whatsapp",
  "instagram",
  "email",
  "horario",
  "dia",
  "objetivo",
  "status_compra",
  "produto_comprado",
  "email_enviado",
  "transaction_id",
  "data_pagamento",
];

/** Índice (0-based) da coluna de e-mail na planilha. */
export const EMAIL_COLUMN_INDEX = SHEET_COLUMNS.indexOf("email");

// ─── Submissão do formulário ─────────────────────────────────────────────────

/**
 * Dados recebidos do formulário da landing page via POST /api/forms/submit.
 */
export interface LeadFormSubmission {
  nome: string;
  whatsapp: string;
  instagram: string;
  email: string;
  horario: string;
  dia: string;
  objetivo: string;
}

// ─── Updates parciais ────────────────────────────────────────────────────────

/**
 * Campos que podem ser atualizados após uma compra aprovada no webhook.
 */
export type LeadSheetUpdate = Partial<
  Pick<
    LeadSheetRow,
    | "status_compra"
    | "produto_comprado"
    | "email_enviado"
    | "transaction_id"
    | "data_pagamento"
  >
>;
