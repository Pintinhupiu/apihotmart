import { NextRequest, NextResponse } from "next/server";
import { formSubmitSchema, formatZodErrors } from "@/lib/validators";
import { insertLead, leadExists } from "@/lib/google-sheets";
import { normalizeEmail, normalizePhone } from "@/lib/utils";
import { createLogger } from "@/lib/logger";
import { env } from "@/lib/env";
import type { ApiResponse } from "@/types/api";

const logger = createLogger("forms/submit");

// ─── CORS ─────────────────────────────────────────────────────────────────────

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowed = env.ALLOWED_ORIGIN;

  // Se ALLOWED_ORIGIN for "*", reflete qualquer origem.
  // Caso contrário, só reflete se a origem bater exatamente.
  const allowedOrigin =
    allowed === "*"
      ? "*"
      : origin && origin === allowed
      ? origin
      : null;

  if (!allowedOrigin) {
    // Origem não permitida — não inclui o header ACAO
    return {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get("origin")),
  });
}

// ─── POST /api/forms/submit ───────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Parsear JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Payload inválido — esperado JSON" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validar campos
  const parsed = formSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Dados inválidos",
        errors: formatZodErrors(parsed.error),
      },
      { status: 422, headers: corsHeaders }
    );
  }

  const data = parsed.data;
  const email = normalizeEmail(data.email);

  logger.info("Novo lead recebido via forms", { email });

  try {
    // Verificar duplicidade antes de inserir
    const exists = await leadExists(email);
    if (exists) {
      logger.info("Lead duplicado ignorado", { email });
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: "Seus dados já foram registrados. Verifique seu e-mail.",
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Inserir na planilha
    await insertLead({
      nome: data.nome,
      whatsapp: normalizePhone(data.whatsapp),
      instagram: data.instagram,
      email,
      horario: data.horario,
      dia: data.dia,
      objetivo: data.objetivo,
    });

    logger.info("Lead salvo com sucesso", { email });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message:
          "Dados recebidos com sucesso! Você será redirecionado para o checkout.",
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    logger.error("Erro ao processar submissão do forms", {
      email,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Erro interno. Tente novamente em instantes.",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
