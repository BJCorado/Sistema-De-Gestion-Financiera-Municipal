// src/proveedores/proveedores.routes.ts
import { Router } from "express";
import * as controlador from "./proveedores.controller";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware";

const router = Router();

// Contrato 3.2: todas las rutas exigen JWT salvo /auth/login.
router.use(autenticar);

// Rutas y roles según contrato 3.2, sección Proveedores.
router.get("/", permitirRoles("compras", "servicios", "administracion"), controlador.listar);
router.get("/:id", permitirRoles("compras", "servicios", "administracion"), controlador.obtener);
router.post("/", permitirRoles("compras", "servicios"), controlador.crear);
router.put("/:id", permitirRoles("compras", "servicios"), controlador.actualizar);
router.patch(
  "/:id/estado",
  permitirRoles("compras", "servicios", "administracion"),
  controlador.cambiarEstado
);

export default router;