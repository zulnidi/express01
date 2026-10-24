import { Router } from "express";

export function createCancionRouter(controller) {
  const router = Router();
  router.route("/").get(controller.listar).post(controller.crear);
  router
    .route("/:id")
    .get(controller.obtener)
    .put(controller.reemplazar)
    .patch(controller.actualizar)
    .delete(controller.eliminar);
  return router;
}
