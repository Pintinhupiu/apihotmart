import { z } from "zod";

/**
 * Schema de validação do payload do formulário da landing page.
 * POST /api/forms/submit
 */
export const formSubmitSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  whatsapp: z.string().min(8, "WhatsApp inválido"),
  instagram: z.string().min(1, "Instagram é obrigatório"),
  email: z.email("E-mail inválido"),
  horario: z.string().min(1, "Informe o melhor horário"),
  dia: z.string().min(1, "Informe o melhor dia"),
  objetivo: z.string().min(5, "Descreva seu objetivo"),
});

export type FormSubmitInput = z.infer<typeof formSubmitSchema>;

/**
 * Formata erros do Zod em objeto chave → lista de mensagens.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!result[key]) result[key] = [];
    result[key].push(issue.message);
  }
  return result;
}
