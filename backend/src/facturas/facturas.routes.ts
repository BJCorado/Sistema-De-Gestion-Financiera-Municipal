// src/facturas/facturas.routes.ts
import { Router } from "express";
import * as controller from "./facturas.controller";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware";

const router = Router();

// Contrato 3.2: todas las rutas exigen JWT salvo /auth/login.
router.use(autenticar);

router.get("/", permitirRoles("compras", "servicios", "administracion"), controller.listar);
router.get("/:id", permitirRoles("compras", "servicios", "administracion"), controller.obtener);
router.post("/", permitirRoles("compras", "servicios"), controller.crear);
router.put("/:id", permitirRoles("compras", "servicios"), controller.editar);

export default router;
