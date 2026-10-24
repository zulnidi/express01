import { ConflictError, NotFoundError } from "../domain/errors.js";

/**
 * Casos de uso de canciones. Depende de un "repositorio" (create, findById,
 * findByTituloYArtista, list, update, delete), no de Mongoose: así se puede
 * probar sin base de datos y cambiar de motor sin tocar la lógica.
 */
export class CancionService {
  #repository;

  constructor({ repository }) {
    this.#repository = repository;
  }

  async crear(datos) {
    await this.#asegurarUnica(datos.titulo, datos.artista);
    return this.#repository.create(datos);
  }

  async listar({ page, limit, genero, q, orden }) {
    const { items, total } = await this.#repository.list({
      filtro: { genero, q },
      orden,
      skip: (page - 1) * limit,
      limit,
    });
    return { data: items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async obtener(id) {
    const cancion = await this.#repository.findById(id);
    if (!cancion) throw new NotFoundError("Canción no encontrada");
    return cancion;
  }

  /** PUT (reemplazo) y PATCH (parcial) comparten esta lógica. */
  async actualizar(id, cambios) {
    const actual = await this.obtener(id);
    const resultado = { ...actual, ...cambios };
    if (resultado.titulo !== actual.titulo || resultado.artista !== actual.artista) {
      await this.#asegurarUnica(resultado.titulo, resultado.artista, id);
    }
    return this.#repository.update(id, cambios);
  }

  async eliminar(id) {
    if (!(await this.#repository.delete(id))) throw new NotFoundError("Canción no encontrada");
  }

  async #asegurarUnica(titulo, artista, idActual) {
    const existente = await this.#repository.findByTituloYArtista(titulo, artista);
    if (existente && existente.id !== idActual) {
      throw new ConflictError("Ya existe una canción con ese título y artista");
    }
  }
}
