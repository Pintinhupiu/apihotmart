/**
 * Centraliza a leitura e validação de variáveis de ambiente.
 * Lança erro explícito se alguma variável obrigatória estiver faltando,
 * evitando falhas silenciosas em produção.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Variável de ambiente obrigatória não definida: ${name}`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // ── App ──────────────────────────────────────────────────────────────────
  APP_URL: optionalEnv("APP_URL", "http://localhost:3000"),
  APP_ENV: optionalEnv("APP_ENV", "development"),

  // ── Google Sheets ────────────────────────────────────────────────────────
  GOOGLE_SHEETS_SPREADSHEET_ID: requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: requireEnv(
    "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
  ),

  // ── Resend ───────────────────────────────────────────────────────────────
  RESEND_API_KEY: requireEnv("RESEND_API_KEY"),
  RESEND_FROM_EMAIL: requireEnv("RESEND_FROM_EMAIL"),
  RESEND_FROM_NAME: optionalEnv("RESEND_FROM_NAME", "Mentoria"),

  // ── Hotmart — Webhook ────────────────────────────────────────────────────
  // Opcional: em desenvolvimento pode ficar vazio para facilitar testes locais.
  // Em produção, deve ser preenchido — a validação é exigida automaticamente.
  HOTMART_WEBHOOK_TOKEN: optionalEnv("HOTMART_WEBHOOK_TOKEN", ""),

  // ── Hotmart — Produto: Mentoria Passo 0 ─────────────────────────────────
  HOTMART_PASSO0_PRODUCT_ID: optionalEnv("HOTMART_PASSO0_PRODUCT_ID", ""),
  HOTMART_PASSO0_PRODUCT_NAME: optionalEnv(
    "HOTMART_PASSO0_PRODUCT_NAME",
    "Mentoria Passo 0"
  ),

  // ── Hotmart — Produto: Mentoria 0 a 100 ─────────────────────────────────
  HOTMART_0100_PRODUCT_ID: optionalEnv("HOTMART_0100_PRODUCT_ID", ""),
  HOTMART_0100_PRODUCT_NAME: optionalEnv(
    "HOTMART_0100_PRODUCT_NAME",
    "Mentoria 0 a 100"
  ),

  // ── Drive — Assets por produto ───────────────────────────────────────────
  PASSO0_DRIVE_ASSETS_URL: optionalEnv("PASSO0_DRIVE_ASSETS_URL", ""),
  ZERO100_DRIVE_ASSETS_URL: optionalEnv("ZERO100_DRIVE_ASSETS_URL", ""),

  // ── CORS ─────────────────────────────────────────────────────────────────
  ALLOWED_ORIGIN: optionalEnv("ALLOWED_ORIGIN", "*"),

  // ── Helpers ──────────────────────────────────────────────────────────────
  isProduction: optionalEnv("APP_ENV", "development") === "production",
  isDevelopment: optionalEnv("APP_ENV", "development") === "development",
};
