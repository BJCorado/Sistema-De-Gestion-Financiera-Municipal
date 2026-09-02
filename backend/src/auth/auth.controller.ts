// src/auth/auth.controller.ts
import { Request, Response } from "express";
import * as servicio from "./auth.service";
import { ErrorNegocio } from "./auth.service";

function responderError(res: Response, error: unknown): void {
  if (error instanceof ErrorNegocio) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error("[auth]", error);
  res.status(500).json({ error: "Error interno del servidor" });
}

/** POST /auth/login — público (contrato 3.2). */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { correo, password } = (req.body ?? {}) as Record<string, unknown>;
    const resultado = await servicio.iniciarSesion(correo, password);
    res.json(resultado);
  } catch (error) {
    responderError(res, error);
  }
}

/** GET /auth/me — cualquiera autenticado (contrato 3.2). */
export function me(req: Request, res: Response): void {
  if (!req.usuario) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  res.json(req.usuario);
}