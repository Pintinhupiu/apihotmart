/**
 * Utilitários gerais reutilizáveis no projeto.
 */

/**
 * Normaliza WhatsApp/telefone removendo caracteres não numéricos.
 * Mantém o + inicial se presente (útil para DDI internacional).
 */
export function normalizePhone(phone: string): string {
  const hasPlus = phone.trimStart().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normaliza e-mail para lowercase sem espaços.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Retorna o timestamp atual no formato ISO 8601 (UTC).
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Retorna o timestamp atual formatado para Brasília (UTC-3).
 * Usado para exibição em e-mails e na planilha.
 */
export function nowBrasilia(): string {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Converte qualquer valor para string, retornando fallback se nulo/undefined.
 */
export function toString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}
