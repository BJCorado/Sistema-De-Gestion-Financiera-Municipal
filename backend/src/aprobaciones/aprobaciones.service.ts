// src/aprobaciones/aprobaciones.service.ts
import { Factura, RolUsuario, aprobacion_decision } from "@prisma/client";
import prisma from "../lib/prisma";

// HU-27/HU-28: Q90,000 es el umbral que exige la segunda aprobación.
const UMBRAL_SEGUNDA_APROBACION = 90000;

export class ErrorNegocio extends Error {
  public readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.status = status;
  }
}

export interface CuerpoDecision {
  decision?: unknown;
  comentario?: unknown;
  codigo_otp?: unknown;
}

/** Facturas < Q90,000 requieren 1 aprobación; >= Q90,000 requieren 2 (RF de la Ficha 5.8). */
export function nivelesRequeridos(montoTotal: number): 1 | 2 {
  return montoTotal >= UMBRAL_SEGUNDA_APROBACION ? 2 : 1;
}

/**
 * HU-29: toda decisión de aprobación exige un PIN por correo (codigo_otp).
 * TODO (Fichas 8.8/8.9, aún no construidas): reemplazar por la validación real
 * contra la tabla otp_verificacion (hash, expiración, intentos_fallidos).
 * Mientras tanto, solo se exige que el campo llegue no vacío, para que el
 * contrato de la API quede listo y no haya que romperlo después.
 */
export function validarCodigoOtp(codigo: unknown): void {
  if (typeof codigo !== "string" || codigo.trim() === "") {
    throw new ErrorNegocio(400, "Se requiere un código OTP válido para esta acción (HU-29).");
  }
}

function validarCuerpoDecision(cuerpo: CuerpoDecision): {
  decision: aprobacion_decision;
  comentario: string | null;
} {
  if (cuerpo.decision !== "aprobado" && cuerpo.decision !== "rechazado") {
    throw new ErrorNegocio(400, "El campo 'decision' debe ser 'aprobado' o 'rechazado'.");
  }

  validarCodigoOtp(cuerpo.codigo_otp);

  const comentario = typeof cuerpo.comentario === "string" && cuerpo.comentario.trim() !== ""
    ? cuerpo.comentario.trim()
    : null;

  if (cuerpo.decision === "rechazado" && !comentario) {
    throw new ErrorNegocio(400, "El rechazo requiere un comentario explicando el motivo.");
  }

  return { decision: cuerpo.decision, comentario };
}

/** RF-5.8: registra una decisión (aprobación o rechazo) de un usuario administracion sobre una factura. */
export async function registrarDecision(
  facturaId: number,
  aprobadorId: number,
  rolAprobador: RolUsuario,
  cuerpo: CuerpoDecision
): Promise<Factura> {
  if (rolAprobador !== "administracion") {
    throw new ErrorNegocio(403, "Solo usuarios con rol administracion pueden aprobar o rechazar facturas.");
  }

  const { decision, comentario } = validarCuerpoDecision(cuerpo);

  const factura = await prisma.factura.findUnique({ where: { id: facturaId } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  if (factura.modalidadCompra === "baja_cuantia") {
    throw new ErrorNegocio(
      409,
      "Las facturas de Baja Cuantía ya quedan aprobadas automáticamente; no admiten aprobación manual."
    );
  }

  if (factura.estadoAprobacion !== "pendiente") {
    throw new ErrorNegocio(
      409,
      `La factura ya fue ${factura.estadoAprobacion === "aprobada" ? "aprobada" : "rechazada"}; no admite nuevas decisiones.`
    );
  }

  // HU-30: sin verificación SAT (o con discrepancia) no se puede aprobar.
  if (decision === "aprobado") {
    if (!factura.verificadoSat) {
      throw new ErrorNegocio(
        409,
        "No se puede aprobar: la factura aún no está verificada contra SAT (verificado_sat = false)."
      );
    }
    if (factura.discrepanciaSat) {
      throw new ErrorNegocio(
        409,
        "No se puede aprobar: existe una discrepancia con SAT (discrepancia_sat = true)."
      );
    }
  }

  const previas = await prisma.aprobacion.findMany({ where: { factura_id: facturaId } });

  if (previas.some((a) => a.aprobador_id === aprobadorId)) {
    throw new ErrorNegocio(
      409,
      "Este usuario ya registró una decisión sobre esta factura; se requiere un aprobador distinto."
    );
  }

  const requeridos = nivelesRequeridos(factura.montoTotal.toNumber());
  const nivel = previas.length + 1;

  if (nivel > requeridos) {
    throw new ErrorNegocio(409, "Esta factura ya alcanzó el número de aprobaciones requeridas.");
  }

  await prisma.aprobacion.create({
    data: {
      factura_id: facturaId,
      aprobador_id: aprobadorId,
      nivel,
      decision,
      comentario,
    },
  });

  if (decision === "rechazado") {
    // El comentario queda en la tabla aprobacion; la factura regresa a Compras/Servicios.
    return prisma.factura.update({
      where: { id: facturaId },
      data: { estadoAprobacion: "rechazada" },
    });
  }

  if (nivel < requeridos) {
    // Falta otro nivel de aprobación: la factura permanece pendiente.
    return factura;
  }

  return prisma.factura.update({
    where: { id: facturaId },
    data: { estadoAprobacion: "aprobada" },
  });
}

export interface ProgresoAprobacion {
  factura_id: number;
  monto_total: number;
  niveles_requeridos: 1 | 2;
  estado_aprobacion: Factura["estadoAprobacion"];
  decisiones: {
    nivel: number;
    aprobador_id: number;
    decision: aprobacion_decision;
    comentario: string | null;
    fecha_decision: Date;
  }[];
}

/** GET /facturas/:facturaId/aprobaciones — consulta el progreso de aprobación de una factura. */
export async function obtenerProgreso(facturaId: number): Promise<ProgresoAprobacion> {
  const factura = await prisma.factura.findUnique({ where: { id: facturaId } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");

  const decisiones = await prisma.aprobacion.findMany({
    where: { factura_id: facturaId },
    orderBy: { nivel: "asc" },
  });

  return {
    factura_id: factura.id,
    monto_total: factura.montoTotal.toNumber(),
    niveles_requeridos: nivelesRequeridos(factura.montoTotal.toNumber()),
    estado_aprobacion: factura.estadoAprobacion,
    decisiones: decisiones.map((d) => ({
      nivel: d.nivel,
      aprobador_id: d.aprobador_id,
      decision: d.decision,
      comentario: d.comentario,
      fecha_decision: d.fecha_decision,
    })),
  };
}

/**
 * Guardia reutilizable para el módulo de pagos: "Rechaza PAGO sobre
 * factura no aprobada" (criterio de aceptación de la Ficha 5.8).
 */
export async function verificarFacturaAprobadaParaPago(facturaId: number): Promise<Factura> {
  const factura = await prisma.factura.findUnique({ where: { id: facturaId } });
  if (!factura) throw new ErrorNegocio(404, "Factura no encontrada.");
  if (factura.estadoAprobacion !== "aprobada") {
    throw new ErrorNegocio(409, "No se puede registrar un pago sobre una factura que no está aprobada.");
  }
  return factura;
}
