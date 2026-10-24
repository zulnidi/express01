import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "../src/domain/errors.js";
import { createMemoryCancionRepository } from "../src/repositories/cancion.memory.repository.js";
import { CancionService } from "../src/services/cancion.service.js";
import { cancionValida, createClock } from "./helpers.js";

let service;
beforeEach(() => {
  service = new CancionService({
    repository: createMemoryCancionRepository({ now: createClock() }),
  });
});

const listar = (extra = {}) => service.listar({ page: 1, limit: 10, orden: "recientes", ...extra });

describe("CancionService", () => {
  it("crea y obtiene una canción", async () => {
    const creada = await service.crear(cancionValida());
    expect(creada.id).toBeTruthy();
    expect(await service.obtener(creada.id)).toEqual(creada);
  });

  it("no permite duplicados de título+artista sin distinguir mayúsculas", async () => {
    await service.crear(cancionValida());
    await expect(
      service.crear(cancionValida({ titulo: "WAKA WAKA", artista: "shakira" })),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("lanza NotFoundError con ids inexistentes", async () => {
    await expect(service.obtener("nope")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.actualizar("nope", { genero: "Rock" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.eliminar("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("actualiza parcialmente y conserva el resto", async () => {
    const { id } = await service.crear(cancionValida());
    const actualizada = await service.actualizar(id, { genero: "Latino" });
    expect(actualizada).toMatchObject({ titulo: "Waka Waka", genero: "Latino" });
  });

  it("permite guardar la misma canción sin chocar consigo misma, pero no con otra", async () => {
    const a = await service.crear(cancionValida());
    await service.crear(cancionValida({ titulo: "Hips Don't Lie" }));
    await expect(service.actualizar(a.id, { titulo: "Waka Waka" })).resolves.toBeTruthy();
    await expect(service.actualizar(a.id, { titulo: "Hips Don't Lie" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("elimina", async () => {
    const { id } = await service.crear(cancionValida());
    await service.eliminar(id);
    await expect(service.obtener(id)).rejects.toBeInstanceOf(NotFoundError);
  });

  describe("listado", () => {
    beforeEach(async () => {
      await service.crear(
        cancionValida({
          titulo: "Bailando",
          artista: "Enrique Iglesias",
          anioLanzamiento: 2014,
          genero: "Pop",
        }),
      );
      await service.crear(
        cancionValida({
          titulo: "Zombie",
          artista: "The Cranberries",
          anioLanzamiento: 1994,
          genero: "Rock",
        }),
      );
      await service.crear(
        cancionValida({
          titulo: "Antología",
          artista: "Shakira",
          anioLanzamiento: 2020,
          genero: "Pop",
        }),
      );
    });

    it("ordena por recientes (por defecto), título y año", async () => {
      expect((await listar()).data.map((c) => c.titulo)).toEqual([
        "Antología",
        "Zombie",
        "Bailando",
      ]);
      expect((await listar({ orden: "titulo" })).data.map((c) => c.titulo)).toEqual([
        "Antología",
        "Bailando",
        "Zombie",
      ]);
      expect((await listar({ orden: "anio" })).data.map((c) => c.anioLanzamiento)).toEqual([
        2020, 2014, 1994,
      ]);
    });

    it("filtra por género y busca por texto", async () => {
      expect((await listar({ genero: "pop" })).total).toBe(2);
      expect((await listar({ q: "cranberries" })).data[0].titulo).toBe("Zombie");
    });

    it("pagina y calcula el total de páginas", async () => {
      const pagina = await listar({ page: 2, limit: 2 });
      expect(pagina).toMatchObject({ page: 2, limit: 2, total: 3, pages: 2 });
      expect(pagina.data).toHaveLength(1);
    });
  });
});
