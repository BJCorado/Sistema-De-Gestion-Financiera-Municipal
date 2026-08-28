// src/facturas/facturas.service.js
const prisma = require("../lib/prisma");

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
];

class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function validarCamposObligatorios(body) {
  const faltantes = CAMPOS_OBLIGATORIOS.filter((campo) => !body[campo]);
  if (faltantes.length > 0) {
    throw new ErrorNegocio(
      400,
      `Faltan campos obligatorios: ${faltantes.join(", ")}`
    );
  }
}

function calcularSemaforo(fechaVencimiento) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const msPorDia = 1000 * 60 * 60 * 24;
  const diasRestantes = Math.round((vencimiento - hoy) / msPorDia);

  let color;
  if (diasRestantes > 30) color = "verde";
  else if (diasRestantes >= 15) color = "amarillo";
  else color = "rojo";

  return { dias_restantes: diasRestantes, color };
}

async function crearFactura(body, usuarioId) {
  validarCamposObligatorios(body);

  const proveedor = await prisma.proveedor.findUnique({
    where: { id: Number(body.proveedor_id) },
  });
  if (!proveedor) {
    throw new ErrorNegocio(404, "Proveedor no encontrado.");
  }

  const nitEmisor = body.nit_emisor || proveedor.nit;
  const nombreEmisor = body.nombre_emisor || proveedor.nombre;

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
      serie: body.serie || null,
      registradoPor: usuarioId,
      numeroFactura: body.numero_factura,
      montoTotal,
      montoAbonado,
      saldoPendiente,
      fechaEmision: body.fecha_emision ? new Date(body.fecha_emision) : new Date(),
      fechaVencimiento: new Date(body.fecha_vencimiento),
      estadoAprobacion,
      estadoOcr: body.estado_ocr || "no_aplica",
      modalidadCompra: body.modalidad_compra,
      categoriaGasto: body.categoria_gasto || null,
      adjuntoUrl: body.adjunto_url || null,
    },
  });


  return factura;
}

async function listarFacturas(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  const where = {};
  if (query.estado_pago) where.estadoPago = query.estado_pago;
  if (query.estado_aprobacion) where.estadoAprobacion = query.estado_aprobacion;
  if (query.estado_ocr) where.estadoOcr = query.estado_ocr;
  if (query.modalidad_compra) where.modalidadCompra = query.modalidad_compra;
  if (query.proveedor_id) where.proveedorId = Number(query.proveedor_id);
  if (query.q) where.numeroFactura = { contains: query.q };

  const orderBy =
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

/**
 * GET /facturas/:id
 */
async function obtenerFactura(id) {
  const factura = await prisma.factura.findUnique({ where: { id: Number(id) } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  const semaforo = calcularSemaforo(factura.fechaVencimiento);

  return { ...factura, ...semaforo, aprobacion_progreso: null };
}

async function editarFactura(id, body) {
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
      numeroFactura: body.numero_factura ?? factura.numeroFactura,
      montoTotal: body.monto_total ? Number(body.monto_total) : factura.montoTotal,
      fechaEmision: body.fecha_emision ? new Date(body.fecha_emision) : factura.fechaEmision,
      fechaVencimiento: body.fecha_vencimiento
        ? new Date(body.fecha_vencimiento)
        : factura.fechaVencimiento,
      categoriaGasto: body.categoria_gasto ?? factura.categoriaGasto,
    },
  });

  return actualizada;
}

module.exports = {
  ErrorNegocio,
  crearFactura,
  listarFacturas,
  obtenerFactura,
  editarFactura,
  calcularSemaforo,
};
