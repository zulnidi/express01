import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI es obligatoria"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(0).default(100),
});

/** Valida las variables de entorno al arrancar: falla rápido y con un mensaje claro. */
export function loadConfig(env = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const detalle = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuración inválida: ${detalle}`);
  }
  const { PORT, MONGO_URI, CORS_ORIGINS, RATE_LIMIT_PER_MINUTE } = parsed.data;
  return {
    port: PORT,
    mongoUri: MONGO_URI,
    corsOrigins: CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    rateLimitPerMinute: RATE_LIMIT_PER_MINUTE,
  };
}
