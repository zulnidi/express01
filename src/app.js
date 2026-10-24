import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { createCancionController } from "./controllers/cancion.controller.js";
import { openapi } from "./docs/openapi.js";
import { createErrorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { createCancionRouter } from "./routes/cancion.routes.js";
import { CancionService } from "./services/cancion.service.js";

/**
 * Fábrica de la aplicación. Recibe el repositorio ya construido (inyección de
 * dependencias): server.js usa Mongoose; las pruebas usan memoria.
 */
export function createApp({
  repository,
  corsOrigins = [],
  rateLimitPerMinute = 100,
  logger = console,
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "100kb" }));
  if (rateLimitPerMinute > 0) {
    app.use(
      rateLimit({
        windowMs: 60_000,
        limit: rateLimitPerMinute,
        standardHeaders: "draft-7",
        legacyHeaders: false,
      }),
    );
  }

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/openapi.json", (_req, res) => res.json(openapi));

  const service = new CancionService({ repository });
  app.use("/canciones", createCancionRouter(createCancionController(service)));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));
  return app;
}
