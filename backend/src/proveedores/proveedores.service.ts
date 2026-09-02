// src/proveedores/proveedores.service.ts
import { Prisma, TipoProveedor, RolUsuario, Proveedor } from "@prisma/client";
import prisma from "../lib/prisma";

export const TIPOS: TipoProveedor[] = ["bien", "servicio"];

// HU-13 / HU-14 / HU-15: qué tipo de proveedor puede ver cada rol.
// null = sin restricción (Administración ve bienes y servicios).
export const TIPO_POR_ROL: Record<RolUsuario, TipoProveedor | null> = {
  compras: "bien",
  servicios: "servicio",
  administracion: null,
};

const RE_NIT = /^[0-9]{1,12}-?[0-9K]$/;
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFONO = /^[0-9+\-\s()]{8,20}$/;

/* ------------------------------------------------------------------ */
/* Tipos del módulo                                                    */
/* ------------------------------------------------------------------ */

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

export interface DatosProveedor {
  nombre: string;
  nit: string;
  tipo: TipoProveedor;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
}

export interface CambiosProveedor {
  nombre?: string;
  nit?: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}

export interface FiltrosProveedor {
  tipo: TipoProveedor | null;
  activo: boolean | null;
  busqueda: string | null;
  page: number;
  limit: number;
}

/** Error de negocio con código HTTP, para que el controller no adivine. */
export class ErrorNegocio extends Error {
  public readonly status: number;
  public readonly errores: ErrorCampo[] | null;

  constructor(status: number, mensaje: string, errores: ErrorCampo[] | null = null) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.status = status;
    this.errores = errores;
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const opcional = (v: unknown): string | null => {
  const t = texto(v);
  return t === "" ? null : t;
};

/** Valida que un string sea uno de los 3 roles del sistema. */
export function esRolValido(rol: unknown): rol is RolUsuario {
  return typeof rol === "string" && Object.prototype.hasOwnProperty.call(TIPO_POR_ROL, rol);
}

/** Detecta la violación de restricción única de Prisma (NIT duplicado). */
function esNitDuplicado(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

/* ------------------------------------------------------------------ */
/* Validaciones                                                        */
/* ------------------------------------------------------------------ */

/** HU-01 / RF-06 / RF-07: nombre, NIT y tipo obligatorios. */
export function validarCreacion(cuerpo: Record<string, unknown> = {}): DatosProveedor {
  const errores: ErrorCampo[] = [];

  const nombre = texto(cuerpo.nombre);
  const nit = texto(cuerpo.nit).toUpperCase().replace(/\s+/g, "");
  const tipo = texto(cuerpo.tipo).toLowerCase() as TipoProveedor;
  const correo = opcional(cuerpo.correo)?.toLowerCase() ?? null;
  const telefono = opcional(cuerpo.telefono);
  const contacto = opcional(cuerpo.contacto);
  const direccion = opcional(cuerpo.direccion);

  if (nombre.length < 3 || nombre.length > 150) {
    errores.push({ campo: "nombre", mensaje: "El nombre debe tener entre 3 y 150 caracteres" });
  }
  if (!nit) {
    errores.push({ campo: "nit", mensaje: "El NIT es obligatorio" });
  } else if (!RE_NIT.test(nit)) {
    errores.push({ campo: "nit", mensaje: "Formato de NIT inválido (ej. 1234567-8)" });
  }
  if (!TIPOS.includes(tipo)) {
    errores.push({ campo: "tipo", mensaje: "Debe seleccionar el tipo: 'bien' o 'servicio'" });
  }
  if (correo && !RE_CORREO.test(correo)) {
    errores.push({ campo: "correo", mensaje: "Formato de correo inválido" });
  }
  if (telefono && !RE_TELEFONO.test(telefono)) {
    errores.push({ campo: "telefono", mensaje: "Formato de teléfono inválido" });
  }
  if (contacto && contacto.length > 120) {
    errores.push({ campo: "contacto", mensaje: "Máximo 120 caracteres" });
  }
  if (direccion && direccion.length > 255) {
    errores.push({ campo: "direccion", mensaje: "Máximo 255 caracteres" });
  }

  if (errores.length) {
    throw new ErrorNegocio(400, "Datos del proveedor inválidos", errores);
  }

  return { nombre, nit, tipo, contacto, telefono, correo, direccion };
}

/** RF-11: edición parcial. El tipo NO se puede cambiar (ver README del módulo). */
export function validarActualizacion(cuerpo: Record<string, unknown> = {}): CambiosProveedor {
  const errores: ErrorCampo[] = [];
  const cambios: CambiosProveedor = {};

  if ("tipo" in cuerpo) {
    errores.push({
      campo: "tipo",
      mensaje: "El tipo (bien/servicio) no se puede modificar después de crear el proveedor",
    });
  }

  if ("nombre" in cuerpo) {
    const nombre = texto(cuerpo.nombre);
    if (nombre.length < 3 || nombre.length > 150) {
      errores.push({ campo: "nombre", mensaje: "El nombre debe tener entre 3 y 150 caracteres" });
    } else {
      cambios.nombre = nombre;
    }
  }

  if ("nit" in cuerpo) {
    const nit = texto(cuerpo.nit).toUpperCase().replace(/\s+/g, "");
    if (!RE_NIT.test(nit)) {
      errores.push({ campo: "nit", mensaje: "Formato de NIT inválido (ej. 1234567-8)" });
    } else {
      cambios.nit = nit;
    }
  }

  if ("correo" in cuerpo) {
    const correo = opcional(cuerpo.correo)?.toLowerCase() ?? null;
    if (correo && !RE_CORREO.test(correo)) {
      errores.push({ campo: "correo", mensaje: "Formato de correo inválido" });
    } else {
      cambios.correo = correo;
    }
  }

  if ("telefono" in cuerpo) {
    const telefono = opcional(cuerpo.telefono);
    if (telefono && !RE_TELEFONO.test(telefono)) {
      errores.push({ campo: "telefono", mensaje: "Formato de teléfono inválido" });
    } else {
      cambios.telefono = telefono;
    }
  }

  if ("contacto" in cuerpo) cambios.contacto = opcional(cuerpo.contacto);
  if ("direccion" in cuerpo) cambios.direccion = opcional(cuerpo.direccion);

  if (errores.length) throw new ErrorNegocio(400, "Datos del proveedor inválidos", errores);
  if (Object.keys(cambios).length === 0) {
    throw new ErrorNegocio(400, "No se envió ningún campo modificable");
  }

  return cambios;
}

/** RF-09: filtros del listado. */
export function validarFiltros(consulta: Record<string, unknown> = {}): FiltrosProveedor {
  const errores: ErrorCampo[] = [];

  let tipo: TipoProveedor | null = null;
  if (consulta.tipo) {
    tipo = texto(consulta.tipo).toLowerCase() as TipoProveedor;
    if (!TIPOS.includes(tipo)) {
      errores.push({ campo: "tipo", mensaje: "El filtro tipo debe ser 'bien' o 'servicio'" });
    }
  }

  // activo: true (por defecto) | false | todos
  let activo: boolean | null = true;
  if (consulta.activo !== undefined) {
    const valor = texto(consulta.activo).toLowerCase();
    if (valor === "todos") activo = null;
    else if (valor === "true" || valor === "1") activo = true;
    else if (valor === "false" || valor === "0") activo = false;
    else errores.push({ campo: "activo", mensaje: "Use true, false o todos" });
  }

  const page = Math.max(1, Number.parseInt(texto(consulta.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(texto(consulta.limit), 10) || 20));
  const busqueda = opcional(consulta.q);

  if (errores.length) throw new ErrorNegocio(400, "Filtros inválidos", errores);

  return { tipo, activo, busqueda, page, limit };
}

/**
 * HU-13 / HU-14: si el proveedor no es del tipo que el rol puede ver,
 * respondemos 404 y no 403, para no revelar que el registro existe.
 */
export function verificarAlcance(proveedor: { tipo: TipoProveedor }, rol: RolUsuario): void {
  const tipoPermitido = TIPO_POR_ROL[rol] ?? null;
  if (tipoPermitido && proveedor.tipo !== tipoPermitido) {
    throw new ErrorNegocio(404, "Proveedor no encontrado");
  }
}

/* ------------------------------------------------------------------ */
/* Operaciones                                                         */
/* ------------------------------------------------------------------ */

// RF-08 / RF-09 / HU-03
export async function listar(
  filtros: FiltrosProveedor,
  rol: RolUsuario
): Promise<{ data: Proveedor[]; total: number }> {
  const tipoPermitido = TIPO_POR_ROL[rol] ?? null;

  if (tipoPermitido && filtros.tipo && filtros.tipo !== tipoPermitido) {
    throw new ErrorNegocio(403, `Su rol solo puede consultar proveedores de tipo "${tipoPermitido}"`);
  }

  const where: Prisma.ProveedorWhereInput = {};
  const tipo = tipoPermitido || filtros.tipo;
  if (tipo) where.tipo = tipo;
  if (filtros.activo !== null) where.activo = filtros.activo;
  if (filtros.busqueda) {
    where.OR = [
      { nombre: { contains: filtros.busqueda } },
      { nit: { contains: filtros.busqueda } },
      { contacto: { contains: filtros.busqueda } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.proveedor.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.proveedor.count({ where }),
  ]);

  return { data, total };
}

// RF-10
export async function obtenerPorId(id: number, rol: RolUsuario): Promise<Proveedor> {
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) throw new ErrorNegocio(404, "Proveedor no encontrado");
  verificarAlcance(proveedor, rol);
  return proveedor;
}

// RF-06 / RF-07 / HU-01 / HU-02
export async function crear(datos: DatosProveedor, rol: RolUsuario): Promise<Proveedor> {
  const tipoPermitido = TIPO_POR_ROL[rol] ?? null;
  if (tipoPermitido && datos.tipo !== tipoPermitido) {
    throw new ErrorNegocio(403, `Su rol solo puede registrar proveedores de tipo "${tipoPermitido}"`);
  }

  try {
    return await prisma.proveedor.create({ data: datos });
  } catch (error) {
    if (esNitDuplicado(error)) {
      throw new ErrorNegocio(409, `Ya existe un proveedor registrado con el NIT ${datos.nit}`);
    }
    throw error;
  }
}

// RF-11
export async function actualizar(
  id: number,
  cambios: CambiosProveedor,
  rol: RolUsuario
): Promise<Proveedor> {
  await obtenerPorId(id, rol);

  try {
    return await prisma.proveedor.update({ where: { id }, data: cambios });
  } catch (error) {
    if (esNitDuplicado(error)) {
      throw new ErrorNegocio(409, "El NIT ya pertenece a otro proveedor");
    }
    throw error;
  }
}

// RF-12: baja lógica. Nunca se borra físicamente, para no perder el historial de facturas.
export async function cambiarEstado(
  id: number,
  activo: boolean,
  rol: RolUsuario
): Promise<Proveedor> {
  const actual = await obtenerPorId(id, rol);

  if (actual.activo === activo) {
    throw new ErrorNegocio(409, `El proveedor ya se encuentra ${activo ? "activo" : "inactivo"}`);
  }

  return prisma.proveedor.update({ where: { id }, data: { activo } });
}