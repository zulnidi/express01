import {
  cancionCompletaSchema,
  cancionParcialSchema,
  listadoSchema,
} from "../domain/cancion.schemas.js";

/**
 * Capa HTTP: valida la entrada (zod), llama al servicio y arma la respuesta.
 * No contiene reglas de negocio ni sabe qué base de datos se usa.
 * Los errores async llegan solos al middleware de errores (Express 5).
 */
export function createCancionController(service) {
  return {
    crear: async (req, res) => {
      const cancion = await service.crear(cancionCompletaSchema.parse(req.body));
      res.status(201).location(`/canciones/${cancion.id}`).json(cancion);
    },
    listar: async (req, res) => {
      res.json(await service.listar(listadoSchema.parse(req.query)));
    },
    obtener: async (req, res) => {
      res.json(await service.obtener(req.params.id));
    },
    reemplazar: async (req, res) => {
      res.json(await service.actualizar(req.params.id, cancionCompletaSchema.parse(req.body)));
    },
    actualizar: async (req, res) => {
      res.json(await service.actualizar(req.params.id, cancionParcialSchema.parse(req.body)));
    },
    eliminar: async (req, res) => {
      await service.eliminar(req.params.id);
      res.status(204).end();
    },
  };
}
