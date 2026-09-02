// src/pagos/pagos.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./pagos.controller";

const router = Router();

const USUARIO_PRUEBA_ID = 1;

// Mismo stub temporal que aprobaciones.routes.ts (Ficha 5.10 aún no existe).
const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const idHeader = Number(req.headers["x-usuario-id"]);
  req.usuario = {
    id: Number.isInteger(idHeader) && idHeader > 0 ? idHeader : USUARIO_PRUEBA_ID,
    rol: "administracion",
  };
  next();
};

router.post("/:facturaId/pagos", requireAuth, controller.registrar);

export default router;
