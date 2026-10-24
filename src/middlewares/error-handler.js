import { ZodError } from "zod";
import { AppError } from "../domain/errors.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/** Traduce cada tipo de error a una respuesta HTTP en un único lugar. */
export const createErrorHandler = (logger) => (err, req, res, _next) => {
  if (err instanceof ZodError) {
    const detalles = err.issues.map((issue) => ({
      campo: issue.path.join(".") || "(cuerpo)",
      mensaje: issue.message,
    }));
    return res.status(400).json({ error: "Datos inválidos", detalles });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo no es un JSON válido" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "El cuerpo es demasiado grande" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Ya existe una canción con ese título y artista" });
  }
  logger.error(err); // el detalle va al log, no al cliente
  return res.status(500).json({ error: "Error interno del servidor" });
};
