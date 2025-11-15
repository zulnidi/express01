import { Router } from "express";
import {
  crearCancion,
  obtenerCanciones,
  obtenerCancion,
  actualizarCancion,
  eliminarCancion
} from "../controllers/canciones.controller.js";

const router = Router();

router.post("/", crearCancion);
router.get("/", obtenerCanciones);
router.get("/:id", obtenerCancion);
router.put("/:id", actualizarCancion);
router.delete("/:id", eliminarCancion);

export default router;
