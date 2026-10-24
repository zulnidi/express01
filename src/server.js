import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import {
  createMongoCancionRepository,
  CancionModel,
} from "./repositories/cancion.mongo.repository.js";

// Punto de composición: aquí se eligen las implementaciones reales.
const config = loadConfig();
await mongoose.connect(config.mongoUri);
await CancionModel.init(); // crea los índices (incluido el de unicidad)

const app = createApp({
  repository: createMongoCancionRepository(),
  corsOrigins: config.corsOrigins,
  rateLimitPerMinute: config.rateLimitPerMinute,
});

const server = app.listen(config.port, () => {
  console.log(`Servidor escuchando en el puerto ${config.port}`);
});

const apagar = async () => {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
};
process.on("SIGTERM", apagar);
process.on("SIGINT", apagar);
