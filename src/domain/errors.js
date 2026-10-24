/** Errores de negocio: el middleware de errores los traduce a códigos HTTP. */
export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404);
  }
}
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}
