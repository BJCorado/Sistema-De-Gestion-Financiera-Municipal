// src/proveedores/proveedores.controller.ts
import { Request, Response } from "express";
import { RolUsuario } from "@prisma/client";
import * as servicio from "./proveedores.service";
import { ErrorNegocio, ErrorCampo } from "./proveedores.service";

/** Cuerpo de error según Convenciones del contrato 3.2. */
interface CuerpoError {
  error: string;
  detalles?: ErrorCampo[];
}

/**
 * Rol del usuario. Temporal: hasta que exista POST /auth/login con JWT,
 * se toma de la cabecera x-rol-usuario. Cuando el middleware de autenticación
 * esté listo, esto pasa a ser req.usuario.rol y se elimina el fallback.
 */
function obtenerRol(req: Request): RolUsuario {
  const rol = req.headers["x-rol-usuario"];

  if (!servicio.esRolValido(rol)) {
    throw new ErrorNegocio(
      401,
      "Rol de usuario no identificado (envíe la cabecera x-rol-usuario mientras no exista el login)"
    );
  }

  return rol;
}

function obtenerId(req: Request): number {
  const crudo = req.params.id;
  const valor = Array.isArray(crudo) ? crudo[0] : crudo;
  const id = Number.parseInt(valor, 10);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorNegocio(400, "El id del proveedor debe ser un número entero positivo");
  }

  return id;
}

/** Formato de error según Convenciones del contrato 3.2: { "error": "mensaje" } */
function responderError(res: Response, error: unknown): Response {
  if (error instanceof ErrorNegocio) {
    const cuerpo: CuerpoError = { error: error.message };
    if (error.errores) cuerpo.detalles = error.errores;
    return res.status(error.status).json(cuerpo);
  }
  console.error("[proveedores]", error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const rol = obtenerRol(req);
    const filtros = servicio.validarFiltros(req.query as Record<string, unknown>);
    const { data, total } = await servicio.listar(filtros, rol);
    res.json({ data, page: filtros.page, limit: filtros.limit, total });
  } catch (error) {
    responderError(res, error);
  }
}

export async function obtener(req: Request, res: Response): Promise<void> {
  try {
    const proveedor = await servicio.obtenerPorId(obtenerId(req), obtenerRol(req));
    res.json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

export async function crear(req: Request, res: Response): Promise<void> {
  try {
    const rol = obtenerRol(req);
    const datos = servicio.validarCreacion(req.body);
    const proveedor = await servicio.crear(datos, rol);
    res.status(201).json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  try {
    const rol = obtenerRol(req);
    const cambios = servicio.validarActualizacion(req.body);
    const proveedor = await servicio.actualizar(obtenerId(req), cambios, rol);
    res.json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

/** PATCH /proveedores/:id/estado — body: { activo: boolean } */
export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  try {
    const rol = obtenerRol(req);
    const { activo } = (req.body ?? {}) as { activo?: unknown };

    if (typeof activo !== "boolean") {
      throw new ErrorNegocio(400, "El campo 'activo' es obligatorio y debe ser true o false");
    }

    const proveedor = await servicio.cambiarEstado(obtenerId(req), activo, rol);
    res.json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}