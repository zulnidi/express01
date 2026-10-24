import mongoose from "mongoose";

const cancionSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 255 },
    artista: { type: String, required: true, trim: true, maxlength: 255 },
    anioLanzamiento: { type: Number, required: true },
    genero: { type: String, required: true, trim: true, maxlength: 50 },
  },
  { timestamps: true },
);

// Evita duplicados título+artista sin distinguir mayúsculas (refuerza la regla del servicio).
cancionSchema.index(
  { titulo: 1, artista: 1 },
  { unique: true, collation: { locale: "es", strength: 2 } },
);

export const CancionModel = mongoose.models.Cancion ?? mongoose.model("Cancion", cancionSchema);

const ordenes = {
  recientes: { createdAt: -1, _id: -1 },
  titulo: { titulo: 1 },
  anio: { anioLanzamiento: -1 },
};

/** Escapa caracteres especiales para usar texto del usuario dentro de una RegExp. */
export const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const aDto = (doc) => ({
  id: String(doc._id),
  titulo: doc.titulo,
  artista: doc.artista,
  anioLanzamiento: doc.anioLanzamiento,
  genero: doc.genero,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const collation = { locale: "es", strength: 2 };

/** Adaptador de Mongoose: implementa el mismo contrato que el repositorio en memoria. */
export function createMongoCancionRepository(Model = CancionModel) {
  const idValido = (id) => mongoose.isValidObjectId(id);

  return {
    async create(datos) {
      return aDto(await Model.create(datos));
    },
    async findById(id) {
      if (!idValido(id)) return null; // un id mal formado equivale a "no existe"
      const doc = await Model.findById(id).lean();
      return doc ? aDto(doc) : null;
    },
    async findByTituloYArtista(titulo, artista) {
      const doc = await Model.findOne({ titulo, artista }).collation(collation).lean();
      return doc ? aDto(doc) : null;
    },
    async list({ filtro = {}, orden = "recientes", skip = 0, limit = 10 }) {
      const consulta = {};
      if (filtro.genero) consulta.genero = filtro.genero;
      if (filtro.q) {
        const patron = new RegExp(escaparRegex(filtro.q), "i");
        consulta.$or = [{ titulo: patron }, { artista: patron }];
      }
      const [docs, total] = await Promise.all([
        Model.find(consulta)
          .collation(collation)
          .sort(ordenes[orden])
          .skip(skip)
          .limit(limit)
          .lean(),
        Model.countDocuments(consulta).collation(collation),
      ]);
      return { items: docs.map(aDto), total };
    },
    async update(id, cambios) {
      if (!idValido(id)) return null;
      const doc = await Model.findByIdAndUpdate(id, cambios, {
        new: true,
        runValidators: true,
      }).lean();
      return doc ? aDto(doc) : null;
    },
    async delete(id) {
      if (!idValido(id)) return false;
      return (await Model.findByIdAndDelete(id)) !== null;
    },
  };
}
