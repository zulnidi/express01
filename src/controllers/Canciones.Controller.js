import Cancion from "../models/Cancion.js";

export const crearCancion = async (req, res, next) => {
  try {
    const cancion = await Cancion.create(req.body);
    return res.status(201).json(cancion);
  } catch (err) {
    return next(err);
  }
};

export const obtenerCanciones = async (req, res, next) => {
  try {
    const canciones = await Cancion.find().sort({ createdAt: -1 });
    return res.json(canciones);
  } catch (err) {
    return next(err);
  }
};

export const obtenerCancion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancion = await Cancion.findById(id);
    if (!cancion) return res.status(404).json({ error: "Canción no encontrada" });
    return res.json(cancion);
  } catch (err) {
    return next(err);
  }
};

export const actualizarCancion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancion = await Cancion.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!cancion) return res.status(404).json({ error: "Canción no encontrada" });
    return res.json(cancion);
  } catch (err) {
    return next(err);
  }
};

export const eliminarCancion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancion = await Cancion.findByIdAndDelete(id);
    if (!cancion) return res.status(404).json({ error: "Canción no encontrada" });
    return res.json({ mensaje: "Canción eliminada" });
  } catch (err) {
    return next(err);
  }
};
