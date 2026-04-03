/**
 * Logger simples com níveis e contexto estruturado.
 * Em produção, a Vercel captura stdout/stderr automaticamente nos Function Logs.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function createLogger(context: string) {
  return {
    info: (message: string, data?: unknown) =>
      log("info", context, message, data),
    warn: (message: string, data?: unknown) =>
      log("warn", context, message, data),
    error: (message: string, data?: unknown) =>
      log("error", context, message, data),
    debug: (message: string, data?: unknown) => {
      if (process.env.APP_ENV !== "production") {
        log("debug", context, message, data);
      }
    },
  };
}
