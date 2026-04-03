import { google } from "googleapis";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { normalizeEmail } from "@/lib/utils";
import {
  SHEET_COLUMNS,
  EMAIL_COLUMN_INDEX,
  type LeadSheetRow,
  type LeadFormSubmission,
  type LeadSheetUpdate,
  type LeadStatus,
  type SimNao,
  type ProductType,
} from "@/types/lead";

const logger = createLogger("google-sheets");

const SHEET_NAME = "leads";
const COLUMN_COUNT = SHEET_COLUMNS.length; // 12

// ─── Autenticação ─────────────────────────────────────────────────────────────

/**
 * Cria um cliente autenticado do Google Sheets via Service Account.
 * A chave privada pode chegar do env com \n literais — substituídos aqui.
 */
function getSheetsClient() {
  const privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(
    /\\n/g,
    "\n"
  );

  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// ─── Helpers de mapeamento ────────────────────────────────────────────────────

function rowToLead(row: string[]): LeadSheetRow {
  const get = (i: number) => (row[i] ?? "").trim();

  return {
    nome: get(0),
    whatsapp: get(1),
    instagram: get(2),
    email: get(3),
    horario: get(4),
    dia: get(5),
    objetivo: get(6),
    status_compra: (get(7) || "pendente") as LeadStatus,
    produto_comprado: get(8) as ProductType,
    email_enviado: (get(9) || "nao") as SimNao,
    transaction_id: get(10),
    data_pagamento: get(11),
  };
}

function leadToRow(lead: LeadSheetRow): string[] {
  return SHEET_COLUMNS.map((col) => String(lead[col] ?? ""));
}

/** Ex: linha 5 → "leads!A5:L5" */
function rowRange(rowIndex: number): string {
  const endCol = String.fromCharCode(64 + COLUMN_COUNT); // 12 → "L"
  return `${SHEET_NAME}!A${rowIndex}:${endCol}${rowIndex}`;
}

// ─── Operações principais ─────────────────────────────────────────────────────

/**
 * Insere um novo lead como última linha da planilha.
 */
export async function insertLead(
  submission: LeadFormSubmission
): Promise<void> {
  const sheets = getSheetsClient();

  const lead: LeadSheetRow = {
    nome: submission.nome,
    whatsapp: submission.whatsapp,
    instagram: submission.instagram,
    email: normalizeEmail(submission.email),
    horario: submission.horario,
    dia: submission.dia,
    objetivo: submission.objetivo,
    status_compra: "pendente",
    produto_comprado: "",
    email_enviado: "nao",
    transaction_id: "",
    data_pagamento: "",
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:L`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [leadToRow(lead)] },
  });

  logger.info("Lead inserido na planilha", { email: lead.email });
}

/**
 * Busca um lead na planilha pelo e-mail.
 *
 * @returns { lead, rowIndex } onde rowIndex é 1-based (inclui o header),
 *          ou null se não encontrado.
 */
export async function findLeadByEmail(
  email: string
): Promise<{ lead: LeadSheetRow; rowIndex: number } | null> {
  const sheets = getSheetsClient();
  const normalizedEmail = normalizeEmail(email);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:L`,
  });

  const rows = response.data.values as string[][] | undefined;

  if (!rows || rows.length <= 1) {
    return null;
  }

  // Linha 0 é o cabeçalho — dados começam na linha 1 (rowIndex 2 no Sheets)
  for (let i = 1; i < rows.length; i++) {
    const rowEmail = (rows[i][EMAIL_COLUMN_INDEX] ?? "").trim().toLowerCase();
    if (rowEmail === normalizedEmail) {
      logger.debug("Lead encontrado", { email: normalizedEmail, rowIndex: i + 1 });
      return { lead: rowToLead(rows[i]), rowIndex: i + 1 };
    }
  }

  logger.info("Lead não encontrado na planilha", { email: normalizedEmail });
  return null;
}

/**
 * Atualiza uma linha diretamente pelo índice (1-based).
 *
 * Use esta função quando você já tem o lead e rowIndex em mãos
 * (ex: após um findLeadByEmail) para evitar uma segunda leitura da planilha.
 */
export async function updateLeadAtRow(
  rowIndex: number,
  currentLead: LeadSheetRow,
  updates: LeadSheetUpdate
): Promise<void> {
  const sheets = getSheetsClient();
  const updatedLead: LeadSheetRow = { ...currentLead, ...updates };

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: rowRange(rowIndex),
    valueInputOption: "RAW",
    requestBody: { values: [leadToRow(updatedLead)] },
  });

  logger.info("Lead atualizado na planilha", {
    email: updatedLead.email,
    rowIndex,
    updates,
  });
}

/**
 * Busca e atualiza um lead pelo e-mail em uma única operação.
 * Faz 2 chamadas ao Sheets (leitura + escrita).
 *
 * Prefira `findLeadByEmail` + `updateLeadAtRow` quando o lead
 * já foi buscado anteriormente no mesmo fluxo.
 *
 * @returns true se encontrado e atualizado, false se não encontrado.
 */
export async function updateLeadByEmail(
  email: string,
  updates: LeadSheetUpdate
): Promise<boolean> {
  const found = await findLeadByEmail(email);
  if (!found) {
    logger.warn("Tentativa de atualizar lead inexistente", { email });
    return false;
  }

  await updateLeadAtRow(found.rowIndex, found.lead, updates);
  return true;
}

/**
 * Verifica se já existe um lead com o e-mail informado.
 */
export async function leadExists(email: string): Promise<boolean> {
  const found = await findLeadByEmail(email);
  return found !== null;
}
