const cancion = {
  type: "object",
  properties: {
    id: { type: "string" },
    titulo: { type: "string", example: "Waka Waka" },
    artista: { type: "string", example: "Shakira" },
    anioLanzamiento: { type: "integer", example: 2010 },
    genero: { type: "string", example: "Pop" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};
const entrada = {
  type: "object",
  required: ["titulo", "artista", "anioLanzamiento", "genero"],
  properties: Object.fromEntries(
    Object.entries(cancion.properties).filter(
      ([k]) => !["id", "createdAt", "updatedAt"].includes(k),
    ),
  ),
};
const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };
const respuesta = (descripcion) => ({ description: descripcion });

export const openapi = {
  openapi: "3.0.3",
  info: { title: "API de Canciones", version: "1.0.0" },
  paths: {
    "/health": { get: { summary: "Estado del servicio", responses: { 200: respuesta("OK") } } },
    "/canciones": {
      get: {
        summary: "Listar canciones (paginado)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
          { name: "genero", in: "query", schema: { type: "string" } },
          {
            name: "q",
            in: "query",
            description: "Busca en título y artista",
            schema: { type: "string" },
          },
          {
            name: "orden",
            in: "query",
            schema: { type: "string", enum: ["recientes", "titulo", "anio"] },
          },
        ],
        responses: {
          200: respuesta("Página de canciones"),
          400: respuesta("Parámetros inválidos"),
        },
      },
      post: {
        summary: "Crear canción",
        requestBody: { required: true, content: { "application/json": { schema: entrada } } },
        responses: {
          201: respuesta("Creada"),
          400: respuesta("Datos inválidos"),
          409: respuesta("Duplicada"),
        },
      },
    },
    "/canciones/{id}": {
      parameters: [idParam],
      get: {
        summary: "Obtener canción",
        responses: { 200: respuesta("OK"), 404: respuesta("No existe") },
      },
      put: {
        summary: "Reemplazar canción",
        responses: {
          200: respuesta("OK"),
          400: respuesta("Datos inválidos"),
          404: respuesta("No existe"),
          409: respuesta("Duplicada"),
        },
      },
      patch: {
        summary: "Actualizar parcialmente",
        responses: {
          200: respuesta("OK"),
          400: respuesta("Datos inválidos"),
          404: respuesta("No existe"),
          409: respuesta("Duplicada"),
        },
      },
      delete: {
        summary: "Eliminar canción",
        responses: { 204: respuesta("Eliminada"), 404: respuesta("No existe") },
      },
    },
  },
  components: { schemas: { Cancion: cancion, CancionEntrada: entrada } },
};
