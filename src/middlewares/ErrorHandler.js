export const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    const errores = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ errores });
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ error: "ID inválido" });
  }

  return res.status(500).json({ error: err.message || "Error del servidor" });
};
