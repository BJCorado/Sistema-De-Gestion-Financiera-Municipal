// src/aprobaciones/aprobaciones.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./aprobaciones.controller";

const router = Router();

const USUARIO_PRUEBA_ID = 1;

/**
 * Mismo stub temporal que facturas.routes.ts (Ficha 5.10 aún no existe).
 * Aquí además se permite sobreescribir el id vía header x-usuario-id, porque
 * la regla de "aprobadores distintos" no se puede probar manualmente con un
 * único usuario fijo — se elimina en cuanto exista el login real.
 */
const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const idHeader = Number(req.headers["x-usuario-id"]);
  req.usuario = {
    id: Number.isInteger(idHeader) && idHeader > 0 ? idHeader : USUARIO_PRUEBA_ID,
    rol: "administracion",
  };
  next();
};

router.post("/:facturaId/aprobaciones", requireAuth, controller.decidir);
router.get("/:facturaId/aprobaciones", requireAuth, controller.progreso);

export default router;
