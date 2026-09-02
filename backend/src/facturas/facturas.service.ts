// src/facturas/facturas.service.ts
import { Factura, ModalidadCompra, EstadoOcr, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

// Constante institucional — nunca se toma del body (ver comentario del schema).
const RECEPTOR = {
  nit: "6247520", // TODO: confirmar NIT real de la Municipalidad de Chiquimulilla
  nombre: "MUNICIPALIDAD DE CHIQUIMULILLA",
};

const CAMPOS_OBLIGATORIOS = [
  "proveedor_id",
  "numero_factura",
  "monto_total",
  "fecha_vencimiento",
  "modalidad_compra",
] as const;

export class ErrorNegocio extends Error {
  public readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.status = status;
  }
}

export type ColorSemaforo = "verde" | "amarillo" | "rojo";

export interface Semaforo {
  dias_restantes: number;
  color: ColorSemaforo;
}

export interface FiltrosFactura {
  page?: unknown;
  limit?: unknown;
  estado_pago?: unknown;
  estado_aprobacion?: unknown;
  estado_ocr?: unknown;
  modalidad_compra?: unknown;
  proveedor_id?: unknown;
  q?: unknown;
  orden?: unknown;
}

export interface ResultadoListado {
  data: (Factura & Semaforo)[];
  page: number;
  limit: number;
  total: number;
}

function validarCamposObligatorios(body: Record<string, unknown>): void {
  const faltantes = CAMPOS_OBLIGATORIOS.filter((campo) => !body[campo]);
  if (faltantes.length > 0) {
    throw new ErrorNegocio(
      400,
      `Faltan campos obligatorios: ${faltantes.join(", ")}`
    );
  }
}

export function calcularSemaforo(fechaVencimiento: Date | string): Semaforo {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasRestantes = Math.round((vencimiento.getTime() - hoy.getTime()) / msPorDia);

  let color: ColorSemaforo;
  if (diasRestantes > 30) color = "verde";
  else if (diasRestantes >= 15) color = "amarillo";
  else color = "rojo";

  return { dias_restantes: diasRestantes, color };
}

export async function crearFactura(
  body: Record<string, unknown>,
  usuarioId: number
): Promise<Factura> {
  validarCamposObligatorios(body);

  const proveedor = await prisma.proveedor.findUnique({
    where: { id: Number(body.proveedor_id) },
  });
  if (!proveedor) {
    throw new ErrorNegocio(404, "Proveedor no encontrado.");
  }

  const nitEmisor = (body.nit_emisor as string | undefined) || proveedor.nit;
  const nombreEmisor = (body.nombre_emisor as string | undefined) || proveedor.nombre;

  const nitReceptor = RECEPTOR.nit;
  const nombreReceptor = RECEPTOR.nombre;

  const estadoAprobacion =
    body.modalidad_compra === "baja_cuantia" ? "aprobada" : "pendiente";

  const montoTotal = Number(body.monto_total);
  const montoAbonado = 0;
  const saldoPendiente = montoTotal - montoAbonado;

  const factura = await prisma.factura.create({
    data: {
      proveedorId: proveedor.id,
      nitEmisor,
      nombreEmisor,
      nitReceptor,
      nombreReceptor,
      serie: (body.serie as string | undefined) || null,
      registradoPor: usuarioId,
      numeroFactura: body.numero_factura as string,
      montoTotal,
      montoAbonado,
      saldoPendiente,
      fechaEmision: body.fecha_emision ? new Date(body.fecha_emision as string) : new Date(),
      fechaVencimiento: new Date(body.fecha_vencimiento as string),
      estadoAprobacion,
      estadoOcr: (body.estado_ocr as EstadoOcr | undefined) || "no_aplica",
      modalidadCompra: body.modalidad_compra as ModalidadCompra,
      categoriaGasto: (body.categoria_gasto as string | undefined) || null,
      adjuntoUrl: (body.adjunto_url as string | undefined) || null,
    },
  });

  return factura;
}

export async function listarFacturas(query: FiltrosFactura): Promise<ResultadoListado> {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  const where: Prisma.FacturaWhereInput = {};
  if (query.estado_pago) where.estadoPago = query.estado_pago as Prisma.FacturaWhereInput["estadoPago"];
  if (query.estado_aprobacion)
    where.estadoAprobacion = query.estado_aprobacion as Prisma.FacturaWhereInput["estadoAprobacion"];
  if (query.estado_ocr) where.estadoOcr = query.estado_ocr as Prisma.FacturaWhereInput["estadoOcr"];
  if (query.modalidad_compra)
    where.modalidadCompra = query.modalidad_compra as Prisma.FacturaWhereInput["modalidadCompra"];
  if (query.proveedor_id) where.proveedorId = Number(query.proveedor_id);
  if (query.q) where.numeroFactura = { contains: query.q as string };

  const orderBy: Prisma.FacturaOrderByWithRelationInput =
    query.orden === "antiguedad"
      ? { fechaVencimiento: "asc" }
      : { fechaVencimiento: "asc" };

  const [total, filas] = await Promise.all([
    prisma.factura.count({ where }),
    prisma.factura.findMany({ where, orderBy, skip, take: limit }),
  ]);

  const data = filas.map((f) => ({
    ...f,
    ...calcularSemaforo(f.fechaVencimiento),
  }));

  return { data, page, limit, total };
}

export async function obtenerFactura(
  id: string | number
): Promise<Factura & Semaforo & { aprobacion_progreso: null }> {
  const factura = await prisma.factura.findUnique({ where: { id: Number(id) } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  const semaforo = calcularSemaforo(factura.fechaVencimiento);

  return { ...factura, ...semaforo, aprobacion_progreso: null };
}

export async function editarFactura(
  id: string | number,
  body: Record<string, unknown>
): Promise<Factura> {
  const factura = await prisma.factura.findUnique({ where: { id: Number(id) } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  if (factura.estadoAprobacion === "aprobada") {
    throw new ErrorNegocio(409, "No se puede editar una factura ya aprobada.");
  }

  const tienePagos = await prisma.pago.count({ where: { facturaId: factura.id } });
  if (tienePagos > 0) {
    throw new ErrorNegocio(
      409,
      "No se puede editar una factura con pagos registrados."
    );
  }

  const actualizada = await prisma.factura.update({
    where: { id: factura.id },
    data: {
      numeroFactura: (body.numero_factura as string | undefined) ?? factura.numeroFactura,
      montoTotal: body.monto_total ? Number(body.monto_total) : factura.montoTotal,
      fechaEmision: body.fecha_emision ? new Date(body.fecha_emision as string) : factura.fechaEmision,
      fechaVencimiento: body.fecha_vencimiento
        ? new Date(body.fecha_vencimiento as string)
        : factura.fechaVencimiento,
      categoriaGasto: (body.categoria_gasto as string | undefined) ?? factura.categoriaGasto,
    },
  });

  return actualizada;
}
