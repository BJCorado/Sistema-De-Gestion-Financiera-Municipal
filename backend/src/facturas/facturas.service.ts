import {
  EstadoAprobacion,
  EstadoOcr,
  EstadoPago,
  Factura,
  ModalidadCompra,
  Prisma,
  RolUsuario,
  TipoProveedor,
} from "@prisma/client";
import prisma from "../lib/prisma";

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

export interface CrearFacturaBody {
  proveedor_id?: number | string;
  numero_factura?: string;
  monto_total?: number | string;
  fecha_vencimiento?: string | Date;
  modalidad_compra?: ModalidadCompra;
  nit_emisor?: string;
  nombre_emisor?: string;
  serie?: string | null;
  fecha_emision?: string | Date;
  estado_ocr?: EstadoOcr;
  categoria_gasto?: string | null;
  adjunto_url?: string | null;
}

export interface EditarFacturaBody {
  numero_factura?: string;
  monto_total?: number | string;
  fecha_emision?: string | Date;
  fecha_vencimiento?: string | Date;
  categoria_gasto?: string | null;
}

export interface FiltrosFactura {
  estado_pago?: EstadoPago;
  estado_aprobacion?: EstadoAprobacion;
  estado_ocr?: EstadoOcr;
  modalidad_compra?: ModalidadCompra;
  proveedor_id?: string;
  q?: string;
  page?: string;
  limit?: string;
  orden?: string;
}

export type ColorSemaforo = "verde" | "amarillo" | "rojo";

export interface Semaforo {
  dias_restantes: number;
  color: ColorSemaforo;
}

export type FacturaConSemaforo = Factura & Semaforo;
export type DetalleFactura = FacturaConSemaforo & { aprobacion_progreso: null };

export interface ListadoFacturas {
  data: FacturaConSemaforo[];
  page: number;
  limit: number;
  total: number;
}

export class ErrorNegocio extends Error {
  public readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.status = status;
  }
}

const TIPO_PROVEEDOR_POR_ROL: Record<RolUsuario, TipoProveedor | null> = {
  compras: TipoProveedor.bien,
  servicios: TipoProveedor.servicio,
  administracion: null,
};

/**
 * Limita las facturas al tipo de proveedor visible para el rol autenticado.
 * Administración no recibe una condición adicional.
 */
export function construirAlcancePorRol(rol: RolUsuario): Prisma.FacturaWhereInput {
  const tipoProveedor = TIPO_PROVEEDOR_POR_ROL[rol];
  return tipoProveedor ? { proveedor: { tipo: tipoProveedor } } : {};
}

function validarCamposObligatorios(body: CrearFacturaBody): void {
  const faltantes = CAMPOS_OBLIGATORIOS.filter((campo) => !body[campo]);
  if (faltantes.length > 0) {
    throw new ErrorNegocio(400, `Faltan campos obligatorios: ${faltantes.join(", ")}`);
  }
}

export function calcularSemaforo(fechaVencimiento: Date | string): Semaforo {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasRestantes = Math.round(
    (vencimiento.getTime() - hoy.getTime()) / msPorDia
  );

  let color: ColorSemaforo;
  if (diasRestantes > 30) color = "verde";
  else if (diasRestantes >= 15) color = "amarillo";
  else color = "rojo";

  return { dias_restantes: diasRestantes, color };
}

export async function crearFactura(
  body: CrearFacturaBody,
  usuarioId: number
): Promise<Factura> {
  validarCamposObligatorios(body);

  const proveedor = await prisma.proveedor.findUnique({
    where: { id: Number(body.proveedor_id) },
  });
  if (!proveedor) throw new ErrorNegocio(404, "Proveedor no encontrado.");

  const nitEmisor = body.nit_emisor || proveedor.nit;
  const nombreEmisor = body.nombre_emisor || proveedor.nombre;
  const estadoAprobacion: EstadoAprobacion =
    body.modalidad_compra === ModalidadCompra.baja_cuantia
      ? EstadoAprobacion.aprobada
      : EstadoAprobacion.pendiente;

  const montoTotal = Number(body.monto_total);
  const montoAbonado = 0;
  const saldoPendiente = montoTotal - montoAbonado;

  return prisma.factura.create({
    data: {
      proveedorId: proveedor.id,
      nitEmisor,
      nombreEmisor,
      nitReceptor: RECEPTOR.nit,
      nombreReceptor: RECEPTOR.nombre,
      serie: body.serie || null,
      registradoPor: usuarioId,
      numeroFactura: body.numero_factura!,
      montoTotal,
      montoAbonado,
      saldoPendiente,
      fechaEmision: body.fecha_emision ? new Date(body.fecha_emision) : new Date(),
      fechaVencimiento: new Date(body.fecha_vencimiento!),
      estadoAprobacion,
      estadoOcr: body.estado_ocr || EstadoOcr.no_aplica,
      modalidadCompra: body.modalidad_compra!,
      categoriaGasto: body.categoria_gasto || null,
      adjuntoUrl: body.adjunto_url || null,
    },
  });
}

export async function listarFacturas(
  query: FiltrosFactura,
  rol: RolUsuario
): Promise<ListadoFacturas> {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  const where: Prisma.FacturaWhereInput = construirAlcancePorRol(rol);
  if (query.estado_pago) where.estadoPago = query.estado_pago;
  if (query.estado_aprobacion) where.estadoAprobacion = query.estado_aprobacion;
  if (query.estado_ocr) where.estadoOcr = query.estado_ocr;
  if (query.modalidad_compra) where.modalidadCompra = query.modalidad_compra;
  if (query.proveedor_id) where.proveedorId = Number(query.proveedor_id);
  if (query.q) where.numeroFactura = { contains: query.q };

  const orderBy: Prisma.FacturaOrderByWithRelationInput =
    query.orden === "antiguedad"
      ? { fechaVencimiento: "asc" }
      : { fechaVencimiento: "asc" };

  const [total, filas] = await Promise.all([
    prisma.factura.count({ where }),
    prisma.factura.findMany({ where, orderBy, skip, take: limit }),
  ]);

  const data = filas.map((factura) => ({
    ...factura,
    ...calcularSemaforo(factura.fechaVencimiento),
  }));

  return { data, page, limit, total };
}

export async function obtenerFactura(
  id: number | string,
  rol: RolUsuario
): Promise<DetalleFactura> {
  const factura = await prisma.factura.findFirst({
    where: { id: Number(id), ...construirAlcancePorRol(rol) },
  });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  return {
    ...factura,
    ...calcularSemaforo(factura.fechaVencimiento),
    aprobacion_progreso: null,
  };
}

export async function editarFactura(
  id: number | string,
  body: EditarFacturaBody
): Promise<Factura> {
  const factura = await prisma.factura.findUnique({ where: { id: Number(id) } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  if (factura.estadoAprobacion === EstadoAprobacion.aprobada) {
    throw new ErrorNegocio(409, "No se puede editar una factura ya aprobada.");
  }

  const tienePagos = await prisma.pago.count({ where: { facturaId: factura.id } });
  if (tienePagos > 0) {
    throw new ErrorNegocio(409, "No se puede editar una factura con pagos registrados.");
  }

  const data: Prisma.FacturaUpdateInput = {
    numeroFactura: body.numero_factura ?? factura.numeroFactura,
    montoTotal: body.monto_total ? Number(body.monto_total) : factura.montoTotal,
    fechaEmision: body.fecha_emision ? new Date(body.fecha_emision) : factura.fechaEmision,
    fechaVencimiento: body.fecha_vencimiento
      ? new Date(body.fecha_vencimiento)
      : factura.fechaVencimiento,
    categoriaGasto: body.categoria_gasto ?? factura.categoriaGasto,
  };

  return prisma.factura.update({ where: { id: factura.id }, data });
}
