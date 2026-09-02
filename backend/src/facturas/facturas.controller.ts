// src/facturas/facturas.controller.ts
import { Request, Response } from "express";
import * as service from "./facturas.service";
import { ErrorNegocio } from "./facturas.service";

function obtenerId(req: Request): string {
  const crudo = req.params.id;
  return Array.isArray(crudo) ? crudo[0] : crudo;
}

function responderError(res: Response, error: unknown): void {
  if (error instanceof ErrorNegocio) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
  res.status(500).json({ error: mensaje });
}

export async function crear(req: Request, res: Response): Promise<void> {
  try {
    const factura = await service.crearFactura(req.body, req.usuario!.id);
    res.status(201).json(factura);
  } catch (err) {
    responderError(res, err);
  }
}

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const resultado = await service.listarFacturas(req.query as Record<string, unknown>);
    res.status(200).json(resultado);
  } catch (err) {
    responderError(res, err);
  }
}

export async function obtener(req: Request, res: Response): Promise<void> {
  try {
    const factura = await service.obtenerFactura(obtenerId(req));
    res.status(200).json(factura);
  } catch (err) {
    responderError(res, err);
  }
}

export async function editar(req: Request, res: Response): Promise<void> {
  try {
    const factura = await service.editarFactura(obtenerId(req), req.body);
    res.status(200).json(factura);
  } catch (err) {
    responderError(res, err);
  }
}
