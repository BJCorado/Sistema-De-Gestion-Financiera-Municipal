// src/aprobaciones/aprobaciones.routes.ts
import { Router } from "express";
import * as controller from "./aprobaciones.controller";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware";

const router = Router();

// Contrato 3.2: todas las rutas exigen JWT salvo /auth/login.
router.use(autenticar);

// HU-22: solo administracion aprueba/rechaza.
router.post("/:facturaId/aprobaciones", permitirRoles("administracion"), controller.decidir);
// Consulta de progreso: visible para quien puede ver la factura (registrador y aprobador).
router.get(
  "/:facturaId/aprobaciones",
  permitirRoles("compras", "servicios", "administracion"),
  controller.progreso
);

export default router;
