import { describe, expect, it } from "vitest";
import {
  cancionCompletaSchema,
  cancionParcialSchema,
  listadoSchema,
} from "../src/domain/cancion.schemas.js";
import { cancionValida } from "./helpers.js";

const mensajes = (resultado) => resultado.error.issues.map((i) => i.message);

describe("cancionCompletaSchema", () => {
  it("acepta una canción válida y recorta espacios", () => {
    const resultado = cancionCompletaSchema.parse(cancionValida({ titulo: "  Hips  " }));
    expect(resultado.titulo).toBe("Hips");
  });

  it.each([
    [{ titulo: "" }, "El título es obligatorio"],
    [{ artista: "S" }, "El artista debe tener al menos 2 caracteres"],
    [{ anioLanzamiento: 1800 }, "El año mínimo es 1900"],
    [{ anioLanzamiento: 2010.5 }, "El año debe ser un entero"],
    [{ anioLanzamiento: "2010" }, "El año debe ser un número"],
    [{ genero: "P" }, "El género debe tener al menos 2 caracteres"],
  ])("rechaza %j", (cambio, mensaje) => {
    const resultado = cancionCompletaSchema.safeParse(cancionValida(cambio));
    expect(resultado.success).toBe(false);
    expect(mensajes(resultado)).toContain(mensaje);
  });

  it("rechaza campos desconocidos y faltantes", () => {
    expect(cancionCompletaSchema.safeParse(cancionValida({ extra: 1 })).success).toBe(false);
    expect(cancionCompletaSchema.safeParse({ titulo: "Solo título" }).success).toBe(false);
  });
});

describe("cancionParcialSchema", () => {
  it("acepta un subconjunto de campos pero no un objeto vacío", () => {
    expect(cancionParcialSchema.parse({ genero: "Rock" })).toEqual({ genero: "Rock" });
    expect(cancionParcialSchema.safeParse({}).success).toBe(false);
  });
});

describe("listadoSchema", () => {
  it("aplica valores por defecto y convierte textos a números", () => {
    expect(listadoSchema.parse({})).toEqual({ page: 1, limit: 10, orden: "recientes" });
    expect(listadoSchema.parse({ page: "2", limit: "5" })).toMatchObject({ page: 2, limit: 5 });
  });
  it("limita el tamaño de página y valida el orden", () => {
    expect(listadoSchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(listadoSchema.safeParse({ orden: "azar" }).success).toBe(false);
  });
});
