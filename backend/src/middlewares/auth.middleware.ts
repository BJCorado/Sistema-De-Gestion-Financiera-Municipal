// src/middlewares/auth.middleware.ts
import { NextFunction, Request, Response } from "express";
import { RolUsuario } from "@prisma/client";
import { ErrorNegocio, verificarToken } from "../auth/auth.service";

/**
 * RNF-03: exige un JWT válido. Contrato 3.2: header
 * `Authorization: Bearer <JWT>` en todas las rutas salvo /auth/login.
 */
export function autenticar(req: Request, res: Response, next: NextFunction): void {
  const cabecera = req.headers.authorization;

  if (typeof cabecera !== "string" || !cabecera.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token no proporcionado" });
    return;
  }

  try {
    req.usuario = verificarToken(cabecera.slice(7).trim());
    next();
  } catch (error) {
    const status = error instanceof ErrorNegocio ? error.status : 401;
    const mensaje = error instanceof ErrorNegocio ? error.message : "No autenticado";
    res.status(status).json({ error: mensaje });
  }
}

/** RNF-04: la autorización por rol se valida en el backend, no solo en la UI. */
export function permitirRoles(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({
        error: `El rol "${req.usuario.rol}" no tiene acceso a esta operación`,
      });
      return;
    }

    next();
  };
}