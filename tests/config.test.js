import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/env.js";
import { escaparRegex } from "../src/repositories/cancion.mongo.repository.js";

describe("loadConfig", () => {
  it("lee y normaliza las variables", () => {
    const config = loadConfig({
      MONGO_URI: "mongodb://x/y",
      PORT: "4000",
      CORS_ORIGINS: "http://a.co, http://b.co",
    });
    expect(config).toEqual({
      port: 4000,
      mongoUri: "mongodb://x/y",
      corsOrigins: ["http://a.co", "http://b.co"],
      rateLimitPerMinute: 100,
    });
  });
  it("falla con un mensaje claro si falta MONGO_URI o el puerto es inválido", () => {
    expect(() => loadConfig({})).toThrow(/MONGO_URI/);
    expect(() => loadConfig({ MONGO_URI: "x", PORT: "abc" })).toThrow(/PORT/);
  });
});

describe("escaparRegex", () => {
  it("neutraliza caracteres especiales para evitar inyección de expresiones", () => {
    expect(escaparRegex("a.b*c(d)")).toBe("a\\.b\\*c\\(d\\)");
    expect(new RegExp(escaparRegex(".*")).test("abc")).toBe(false);
  });
});
