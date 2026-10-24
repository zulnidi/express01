import { describe, expect, it, vi } from "vitest";
import { buildApp, cancionValida } from "./helpers.js";

async function crear(api, datos = cancionValida()) {
  const respuesta = await api.post("/canciones").send(datos);
  expect(respuesta.status).toBe(201);
  return respuesta.body;
}

describe("infraestructura", () => {
  it("responde en /health y publica el contrato OpenAPI", async () => {
    const { api } = buildApp();
    expect((await api.get("/health")).body).toEqual({ status: "ok" });
    const doc = await api.get("/openapi.json");
    expect(doc.body.openapi).toBe("3.0.3");
    expect(Object.keys(doc.body.paths)).toContain("/canciones/{id}");
  });

  it("incluye cabeceras de seguridad y oculta x-powered-by", async () => {
    const { api } = buildApp();
    const respuesta = await api.get("/health");
    expect(respuesta.headers["x-content-type-options"]).toBe("nosniff");
    expect(respuesta.headers["x-powered-by"]).toBeUndefined();
  });

  it("responde 404 en rutas desconocidas y 400 con JSON inválido", async () => {
    const { api } = buildApp();
    expect((await api.get("/nada")).status).toBe(404);
    const malo = await api
      .post("/canciones")
      .set("content-type", "application/json")
      .send("{no json");
    expect(malo.status).toBe(400);
    expect(malo.body.error).toMatch(/JSON/);
  });

  it("limita las peticiones por minuto", async () => {
    const { api } = buildApp({ rateLimitPerMinute: 2 });
    await api.get("/health");
    await api.get("/health");
    expect((await api.get("/health")).status).toBe(429);
  });

  it("no filtra detalles internos en errores 500 y los registra", async () => {
    const logger = { error: vi.fn() };
    const repository = {
      list: async () => {
        throw new Error("secreto interno");
      },
    };
    const { api } = buildApp({ repository, logger });
    const respuesta = await api.get("/canciones");
    expect(respuesta.status).toBe(500);
    expect(JSON.stringify(respuesta.body)).not.toMatch(/secreto/);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it("traduce el error de índice único de Mongo (11000) a 409", async () => {
    const repository = {
      create: async () => {
        throw Object.assign(new Error("dup"), { code: 11000 });
      },
      findByTituloYArtista: async () => null,
    };
    const { api } = buildApp({ repository });
    expect((await api.post("/canciones").send(cancionValida())).status).toBe(409);
  });
});

describe("POST /canciones", () => {
  it("crea y devuelve 201 con Location", async () => {
    const { api } = buildApp();
    const respuesta = await api.post("/canciones").send(cancionValida());
    expect(respuesta.status).toBe(201);
    expect(respuesta.headers.location).toBe(`/canciones/${respuesta.body.id}`);
    expect(respuesta.body).toMatchObject({ titulo: "Waka Waka", artista: "Shakira" });
  });

  it("devuelve 400 con el detalle de cada campo inválido", async () => {
    const { api } = buildApp();
    const respuesta = await api
      .post("/canciones")
      .send({ titulo: "", artista: "S", anioLanzamiento: 1, genero: "" });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.detalles.map((d) => d.campo).sort()).toEqual([
      "anioLanzamiento",
      "artista",
      "genero",
      "titulo",
    ]);
  });

  it("devuelve 409 si ya existe", async () => {
    const { api } = buildApp();
    await crear(api);
    expect((await api.post("/canciones").send(cancionValida())).status).toBe(409);
  });
});

describe("GET /canciones", () => {
  it("lista con paginación, filtros y orden", async () => {
    const { api } = buildApp();
    await crear(api, cancionValida({ titulo: "Bailando", artista: "Enrique", genero: "Pop" }));
    await crear(api, cancionValida({ titulo: "Zombie", artista: "Cranberries", genero: "Rock" }));
    const respuesta = await api.get("/canciones?limit=1&orden=titulo");
    expect(respuesta.body).toMatchObject({ page: 1, limit: 1, total: 2, pages: 2 });
    expect(respuesta.body.data[0].titulo).toBe("Bailando");
    expect((await api.get("/canciones?genero=rock")).body.total).toBe(1);
    expect((await api.get("/canciones?q=zomb")).body.total).toBe(1);
  });

  it("devuelve 400 con parámetros inválidos", async () => {
    const { api } = buildApp();
    expect((await api.get("/canciones?page=0")).status).toBe(400);
    expect((await api.get("/canciones?orden=azar")).status).toBe(400);
  });
});

describe("GET/PUT/PATCH/DELETE /canciones/:id", () => {
  it("obtiene una canción y responde 404 si no existe", async () => {
    const { api } = buildApp();
    const { id } = await crear(api);
    expect((await api.get(`/canciones/${id}`)).body.id).toBe(id);
    expect((await api.get("/canciones/inexistente")).status).toBe(404);
  });

  it("PUT reemplaza (exige todos los campos) y PATCH actualiza parcialmente", async () => {
    const { api } = buildApp();
    const { id } = await crear(api);
    const put = await api.put(`/canciones/${id}`).send(cancionValida({ genero: "Latino" }));
    expect(put.body.genero).toBe("Latino");
    expect((await api.put(`/canciones/${id}`).send({ genero: "Rock" })).status).toBe(400);
    const patch = await api.patch(`/canciones/${id}`).send({ anioLanzamiento: 2011 });
    expect(patch.body).toMatchObject({ anioLanzamiento: 2011, genero: "Latino" });
    expect((await api.patch(`/canciones/${id}`).send({})).status).toBe(400);
  });

  it("PATCH devuelve 409 si choca con otra canción", async () => {
    const { api } = buildApp();
    await crear(api, cancionValida({ titulo: "Otra", artista: "Alguien" }));
    const { id } = await crear(api);
    expect(
      (await api.patch(`/canciones/${id}`).send({ titulo: "Otra", artista: "Alguien" })).status,
    ).toBe(409);
  });

  it("DELETE responde 204 y luego 404", async () => {
    const { api } = buildApp();
    const { id } = await crear(api);
    expect((await api.delete(`/canciones/${id}`)).status).toBe(204);
    expect((await api.delete(`/canciones/${id}`)).status).toBe(404);
  });
});
