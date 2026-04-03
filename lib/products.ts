import { env } from "@/lib/env";
import type { ProductType } from "@/types/lead";

/**
 * Configuração de um produto da mentoria.
 */
export interface ProductConfig {
  /** Identificador interno usado na planilha e em lógica de negócio */
  key: Exclude<ProductType, "">;
  /** Nome exibido em e-mails e logs */
  displayName: string;
  /** ID numérico do produto na Hotmart */
  hotmartId: string;
  /** Nome do produto como registrado na Hotmart (usado como fallback de identificação) */
  hotmartName: string;
  /** Link da pasta do Google Drive com os materiais do produto */
  driveAssetsUrl: string;
  /** Assunto do e-mail de boas-vindas */
  emailSubject: string;
}

/**
 * Mapa de produtos suportados.
 * Configuração carregada das variáveis de ambiente.
 */
export const PRODUCTS: Record<Exclude<ProductType, "">, ProductConfig> = {
  passo_0: {
    key: "passo_0",
    displayName: env.HOTMART_PASSO0_PRODUCT_NAME,
    hotmartId: env.HOTMART_PASSO0_PRODUCT_ID,
    hotmartName: env.HOTMART_PASSO0_PRODUCT_NAME,
    driveAssetsUrl: env.PASSO0_DRIVE_ASSETS_URL,
    emailSubject: "Sua matrícula na Mentoria Passo 0 foi confirmada 🎓",
  },
  "0_a_100": {
    key: "0_a_100",
    displayName: env.HOTMART_0100_PRODUCT_NAME,
    hotmartId: env.HOTMART_0100_PRODUCT_ID,
    hotmartName: env.HOTMART_0100_PRODUCT_NAME,
    driveAssetsUrl: env.ZERO100_DRIVE_ASSETS_URL,
    emailSubject: "Sua matrícula na Mentoria 0 a 100 foi confirmada 🎓",
  },
};

/**
 * Identifica qual produto foi comprado com base nos dados do webhook da Hotmart.
 *
 * Estratégia:
 * 1. Tenta match por ID (mais confiável — nunca muda)
 * 2. Tenta match por nome (fallback — útil se ID não estiver configurado)
 *
 * @returns ProductConfig do produto encontrado, ou null se não reconhecido
 */
export function identifyProduct(
  productId?: string | number | null,
  productName?: string | null
): ProductConfig | null {
  const idStr = productId != null ? String(productId).trim() : "";
  const nameStr = productName ? productName.trim().toLowerCase() : "";

  for (const product of Object.values(PRODUCTS)) {
    if (idStr && product.hotmartId && idStr === product.hotmartId) {
      return product;
    }
  }

  for (const product of Object.values(PRODUCTS)) {
    if (
      nameStr &&
      product.hotmartName &&
      nameStr.includes(product.hotmartName.toLowerCase())
    ) {
      return product;
    }
  }

  return null;
}

/**
 * Retorna a config de um produto pelo key interno (ex: dado salvo na planilha).
 */
export function getProductByKey(
  key: string
): ProductConfig | null {
  if (key === "passo_0" || key === "0_a_100") {
    return PRODUCTS[key];
  }
  return null;
}
