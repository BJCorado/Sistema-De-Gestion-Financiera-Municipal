import { Request, Response } from "express";
import * as servicio from "./facturas.service";
import {
  CrearFacturaBody,
  EditarFacturaBody,
  ErrorNegocio,
  FiltrosFactura,
} from "./facturas.service";

function responderError(res: Response, error: unknown): Response {
  if (error instanceof ErrorNegocio) {
    return res.status(error.status).json({ error: error.message });
  }

  const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
  return res.status(500).json({ error: mensaje });
}

export async function crear(
  req: Request<Record<string, never>, unknown, CrearFacturaBody>,
  res: Response
): Promise<void> {
  try {
    const factura = await servicio.crearFactura(req.body, req.usuario!.id, req.usuario!.rol);
    res.status(201).json(factura);
  } catch (error: unknown) {
    responderError(res, error);
  }
}

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const resultado = await servicio.listarFacturas(
      req.query as FiltrosFactura,
      req.usuario!.rol
    );
    res.status(200).json(resultado);
  } catch (error: unknown) {
    responderError(res, error);
  }
}

export async function obtener(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const factura = await servicio.obtenerFactura(req.params.id, req.usuario!.rol);
    res.status(200).json(factura);
  } catch (error: unknown) {
    responderError(res, error);
  }
}

export async function editar(
  req: Request<{ id: string }, unknown, EditarFacturaBody>,
  res: Response
): Promise<void> {
  try {
    const factura = await servicio.editarFactura(req.params.id, req.body);
    res.status(200).json(factura);
  } catch (error: unknown) {
    responderError(res, error);
  }
}
