import { randomUUID } from "node:crypto";

const comparadores = {
  recientes: (a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1),
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, "es"),
  anio: (a, b) => b.anioLanzamiento - a.anioLanzamiento,
};

const normalizar = (texto) => texto.toLowerCase();

/** Repositorio en memoria: sirve para pruebas y para ejecutar la API sin MongoDB. */
export function createMemoryCancionRepository({ now = () => new Date() } = {}) {
  const items = new Map();

  return {
    async create(datos) {
      const fecha = now();
      const cancion = { id: randomUUID(), ...datos, createdAt: fecha, updatedAt: fecha };
      items.set(cancion.id, cancion);
      return { ...cancion };
    },
    async findById(id) {
      const cancion = items.get(id);
      return cancion ? { ...cancion } : null;
    },
    async findByTituloYArtista(titulo, artista) {
      const clave = `${normalizar(titulo)}|${normalizar(artista)}`;
      const found = [...items.values()].find(
        (c) => `${normalizar(c.titulo)}|${normalizar(c.artista)}` === clave,
      );
      return found ? { ...found } : null;
    },
    async list({ filtro = {}, orden = "recientes", skip = 0, limit = 10 }) {
      const { genero, q } = filtro;
      const filtradas = [...items.values()]
        .filter((c) => !genero || normalizar(c.genero) === normalizar(genero))
        .filter((c) => !q || normalizar(`${c.titulo} ${c.artista}`).includes(normalizar(q)))
        .sort(comparadores[orden]);
      return {
        items: filtradas.slice(skip, skip + limit).map((c) => ({ ...c })),
        total: filtradas.length,
      };
    },
    async update(id, cambios) {
      const actual = items.get(id);
      if (!actual) return null;
      const actualizada = { ...actual, ...cambios, updatedAt: now() };
      items.set(id, actualizada);
      return { ...actualizada };
    },
    async delete(id) {
      return items.delete(id);
    },
  };
}
