// src/proveedores/proveedores.routes.ts
import { Router } from "express";
import * as controlador from "./proveedores.controller";

const router = Router();

// Rutas y roles según contrato 3.2, sección Proveedores.
router.get("/", controlador.listar);
router.get("/:id", controlador.obtener);
router.post("/", controlador.crear);
router.put("/:id", controlador.actualizar);
router.patch("/:id/estado", controlador.cambiarEstado);

// TODO (ficha 8.2, Wayner): GET /proveedores/:id/estado-cuenta — HU-12, rol administracion.

export default router;