// src/aprobaciones/aprobaciones.controller.ts
import { Request, Response } from "express";
import * as service from "./aprobaciones.service";
import { ErrorNegocio } from "./aprobaciones.service";

function responderError(res: Response, error: unknown): void {
  if (error instanceof ErrorNegocio) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
  res.status(500).json({ error: mensaje });
}

function obtenerFacturaId(req: Request): number {
  const crudo = req.params.facturaId;
  const valor = Array.isArray(crudo) ? crudo[0] : crudo;
  const id = Number.parseInt(valor, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorNegocio(400, "El id de la factura debe ser un número entero positivo");
  }

  return id;
}

/** POST /facturas/:facturaId/aprobaciones — body: { decision, comentario?, codigo_otp } */
export async function decidir(req: Request, res: Response): Promise<void> {
  try {
    const facturaId = obtenerFacturaId(req);
    const usuario = req.usuario!;
    const factura = await service.registrarDecision(facturaId, usuario.id, usuario.rol, req.body);
    res.status(200).json(factura);
  } catch (error) {
    responderError(res, error);
  }
}

/** GET /facturas/:facturaId/aprobaciones — progreso de aprobación. */
export async function progreso(req: Request, res: Response): Promise<void> {
  try {
    const facturaId = obtenerFacturaId(req);
    const resultado = await service.obtenerProgreso(facturaId);
    res.status(200).json(resultado);
  } catch (error) {
    responderError(res, error);
  }
}
