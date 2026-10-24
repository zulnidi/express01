import request from "supertest";
import { createApp } from "../src/app.js";
import { createMemoryCancionRepository } from "../src/repositories/cancion.memory.repository.js";

export const silentLogger = { error: () => {} };

/** Reloj controlado: cada llamada avanza un segundo, así el orden "recientes" es determinista. */
export function createClock(start = Date.UTC(2030, 0, 1)) {
  let tick = 0;
  return () => new Date(start + 1000 * tick++);
}

export function buildApp(overrides = {}) {
  const repository = overrides.repository ?? createMemoryCancionRepository({ now: createClock() });
  const app = createApp({ repository, rateLimitPerMinute: 0, logger: silentLogger, ...overrides });
  return { app, api: request(app), repository };
}

export const cancionValida = (extra = {}) => ({
  titulo: "Waka Waka",
  artista: "Shakira",
  anioLanzamiento: 2010,
  genero: "Pop",
  ...extra,
});
