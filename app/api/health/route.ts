import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import type { HealthCheckResponse } from "@/types/api";

const logger = createLogger("health");

export async function GET() {
  logger.info("Health check solicitado");

  const body: HealthCheckResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: env.APP_ENV,
  };

  return NextResponse.json(body, { status: 200 });
}
