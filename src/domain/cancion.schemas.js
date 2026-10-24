import { z } from "zod";

const anioMaximo = new Date().getFullYear() + 1;

const campos = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(1, "El título es obligatorio")
      .max(255, "El título no puede exceder 255 caracteres"),
    artista: z
      .string()
      .trim()
      .min(2, "El artista debe tener al menos 2 caracteres")
      .max(255, "El artista no puede exceder 255 caracteres"),
    anioLanzamiento: z
      .number("El año debe ser un número")
      .int("El año debe ser un entero")
      .min(1900, "El año mínimo es 1900")
      .max(anioMaximo, `El año máximo es ${anioMaximo}`),
    genero: z
      .string()
      .trim()
      .min(2, "El género debe tener al menos 2 caracteres")
      .max(50, "El género no puede exceder 50 caracteres"),
  })
  .strict();

/** POST y PUT: todos los campos son obligatorios. */
export const cancionCompletaSchema = campos;

/** PATCH: al menos un campo. */
export const cancionParcialSchema = campos
  .partial()
  .refine((valor) => Object.keys(valor).length > 0, "Envía al menos un campo para actualizar");

export const ORDENES = ["recientes", "titulo", "anio"];

export const listadoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  genero: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  orden: z.enum(ORDENES).default("recientes"),
});
