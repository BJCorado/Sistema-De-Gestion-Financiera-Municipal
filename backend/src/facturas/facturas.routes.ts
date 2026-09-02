// src/facturas/facturas.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import { RolUsuario } from "@prisma/client";
import * as controller from "./facturas.controller";

const router = Router();

const USUARIO_PRUEBA_ID = 1;

const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  req.usuario = { id: USUARIO_PRUEBA_ID, rol: "administracion" };
  next();
};

const requireRol = (...roles: RolUsuario[]) => (_req: Request, _res: Response, next: NextFunction): void => {
  next();
};

router.get("/", requireAuth, requireRol("compras", "servicios", "administracion"), controller.listar);
router.get("/:id", requireAuth, requireRol("compras", "servicios", "administracion"), controller.obtener);
router.post("/", requireAuth, requireRol("compras", "servicios"), controller.crear);
router.put("/:id", requireAuth, requireRol("compras", "servicios"), controller.editar);

export default router;
