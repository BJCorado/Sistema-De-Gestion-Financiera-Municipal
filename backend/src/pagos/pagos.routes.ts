// src/pagos/pagos.routes.ts
import { Router } from "express";
import * as controller from "./pagos.controller";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware";

const router = Router();

// Contrato 3.2: todas las rutas exigen JWT salvo /auth/login.
router.use(autenticar);

// Solo administracion registra pagos, según el contrato (avisado por Brayan).
router.post("/:facturaId/pagos", permitirRoles("administracion"), controller.registrar);

export default router;
