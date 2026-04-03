import { Resend } from "resend";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const logger = createLogger("resend");

const resend = new Resend(env.RESEND_API_KEY);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WelcomeEmailParams {
  nome: string;
  email: string;
  produtoNome: string;
  horario: string;
  dia: string;
  driveUrl: string;
  emailSubject: string;
}

// ─── Template HTML ────────────────────────────────────────────────────────────

function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const { nome, produtoNome, horario, dia, driveUrl } = params;
  const primeiroNome = nome.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Matrícula confirmada — ${produtoNome}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Matrícula Confirmada</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">${produtoNome}</h1>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 0;">

              <!-- Saudação -->
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá,</p>
              <h2 style="margin:0 0 24px;color:#0f172a;font-size:22px;font-weight:700;">
                Bem-vindo(a), ${primeiroNome}! 🎉
              </h2>

              <p style="margin:0 0 24px;color:#334155;font-size:16px;line-height:1.7;">
                Sua matrícula na <strong>${produtoNome}</strong> foi confirmada com sucesso.
                Estamos muito felizes em ter você aqui e mal podemos esperar para começar essa jornada juntos.
              </p>

              <!-- Destaque de confirmação -->
              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
                <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">✅ Pagamento confirmado</p>
                <p style="margin:0;color:#166534;font-size:15px;font-weight:500;">
                  Sua vaga está garantida na <strong>${produtoNome}</strong>.
                </p>
              </div>

              <!-- O que está incluso -->
              <h3 style="margin:0 0 16px;color:#0f172a;font-size:17px;font-weight:700;">O que você tem acesso:</h3>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                ${[
                  "Mentoria personalizada ao vivo com feedback direto",
                  "Material de apoio exclusivo no Google Drive",
                  "Comunidade fechada de alunos",
                  "Gravações das sessões para revisão",
                  "Suporte contínuo durante toda a mentoria",
                ]
                  .map(
                    (item) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    <span style="color:#6366f1;font-size:16px;margin-right:10px;">→</span>
                    <span style="color:#334155;font-size:15px;line-height:1.5;">${item}</span>
                  </td>
                </tr>`
                  )
                  .join("")}
              </table>

              <!-- Horários informados -->
              <div style="background-color:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
                <p style="margin:0 0 12px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">📅 Sua disponibilidade informada</p>
                <p style="margin:4px 0;color:#0f172a;font-size:15px;"><strong>Dia:</strong> ${dia}</p>
                <p style="margin:4px 0;color:#0f172a;font-size:15px;"><strong>Horário:</strong> ${horario}</p>
                <p style="margin:12px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
                  Em breve entraremos em contato para agendar sua primeira sessão com base nessa disponibilidade.
                </p>
              </div>

              <!-- Botão Drive -->
              ${
                driveUrl
                  ? `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
                      Acesse agora os materiais da mentoria no Google Drive:
                    </p>
                    <a href="${driveUrl}"
                       style="display:inline-block;background-color:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;letter-spacing:0.3px;">
                      📁 Acessar materiais da mentoria
                    </a>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- Próximos passos -->
              <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px 24px;margin-bottom:40px;">
                <p style="margin:0 0 8px;color:#92400e;font-size:14px;font-weight:600;">⏳ Próximos passos</p>
                <p style="margin:0;color:#78350f;font-size:14px;line-height:1.6;">
                  Nossa equipe entrará em contato em breve para confirmar a data e horário da sua primeira sessão.
                  Fique atento(a) ao seu WhatsApp e e-mail.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:13px;">
                Este e-mail foi enviado para <strong>${params.email}</strong>
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:12px;">
                © ${new Date().getFullYear()} ${produtoNome}. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Envio ────────────────────────────────────────────────────────────────────

/**
 * Envia o e-mail de boas-vindas ao aluno após compra confirmada.
 *
 * @throws Error se o Resend retornar falha no envio
 */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<void> {
  const html = buildWelcomeEmailHtml(params);

  const { error } = await resend.emails.send({
    from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
    to: [params.email],
    subject: params.emailSubject,
    html,
  });

  if (error) {
    logger.error("Falha ao enviar e-mail de boas-vindas", {
      email: params.email,
      error,
    });
    throw new Error(`Resend error: ${error.message}`);
  }

  logger.info("E-mail de boas-vindas enviado", {
    email: params.email,
    produto: params.produtoNome,
  });
}
