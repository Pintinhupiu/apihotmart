/**
 * Tipos de resposta padronizados para as rotas da API.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
  version: string;
  environment: string;
}
