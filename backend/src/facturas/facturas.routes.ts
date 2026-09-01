import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { RolUsuario } from "@prisma/client";
import * as controlador from "./facturas.controller";

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: number; rol: RolUsuario };
    }
  }
}

const router = Router();
const USUARIO_PRUEBA_ID = 1;

const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  req.usuario = { id: USUARIO_PRUEBA_ID, rol: RolUsuario.administracion };
  next();
};

const requireRol = (..._roles: RolUsuario[]): RequestHandler =>
  (_req, _res, next): void => next();

router.get(
  "/",
  requireAuth,
  requireRol(RolUsuario.compras, RolUsuario.servicios, RolUsuario.administracion),
  controlador.listar
);
router.get(
  "/:id",
  requireAuth,
  requireRol(RolUsuario.compras, RolUsuario.servicios, RolUsuario.administracion),
  controlador.obtener
);
router.post(
  "/",
  requireAuth,
  requireRol(RolUsuario.compras, RolUsuario.servicios),
  controlador.crear
);
router.put(
  "/:id",
  requireAuth,
  requireRol(RolUsuario.compras, RolUsuario.servicios),
  controlador.editar
);

export default router;
