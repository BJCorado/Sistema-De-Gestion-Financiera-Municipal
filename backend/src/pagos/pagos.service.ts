// src/pagos/pagos.service.ts
import { Pago } from "@prisma/client";
import prisma from "../lib/prisma";
import { ErrorNegocio, validarCodigoOtp, verificarFacturaAprobadaParaPago } from "../aprobaciones/aprobaciones.service";

export interface CuerpoPago {
  monto?: unknown;
  fecha_pago?: unknown;
  metodo_pago?: unknown;
  observaciones?: unknown;
  codigo_otp?: unknown;
}

export interface ResultadoPago {
  pago: Pago;
  saldo_pendiente: number;
  estado_pago: "pendiente" | "parcial" | "pagada";
}

/**
 * RF de la Ficha 5.8: "Rechaza PAGO sobre factura no aprobada". También exige
 * codigo_otp (HU-29, stub temporal — ver aprobaciones.service.ts) porque un
 * pago es una acción sensible igual que una aprobación.
 */
export async function registrarPago(
  facturaId: number,
  usuarioId: number,
  cuerpo: CuerpoPago
): Promise<ResultadoPago> {
  validarCodigoOtp(cuerpo.codigo_otp);

  const monto = Number(cuerpo.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new ErrorNegocio(400, "El monto del pago debe ser un número mayor a 0.");
  }

  const factura = await verificarFacturaAprobadaParaPago(facturaId);

  const saldoActual = factura.saldoPendiente.toNumber();
  if (monto > saldoActual) {
    throw new ErrorNegocio(
      409,
      `El monto (${monto}) supera el saldo pendiente de la factura (${saldoActual}).`
    );
  }

  const pago = await prisma.pago.create({
    data: {
      facturaId,
      registradoPor: usuarioId,
      monto,
      fechaPago: cuerpo.fecha_pago ? new Date(cuerpo.fecha_pago as string) : new Date(),
      metodoPago: typeof cuerpo.metodo_pago === "string" ? cuerpo.metodo_pago : null,
      observaciones: typeof cuerpo.observaciones === "string" ? cuerpo.observaciones : null,
    },
  });

  const nuevoSaldo = saldoActual - monto;
  const estadoPago = nuevoSaldo <= 0 ? "pagada" : "parcial";

  await prisma.factura.update({
    where: { id: facturaId },
    data: {
      montoAbonado: factura.montoAbonado.toNumber() + monto,
      saldoPendiente: nuevoSaldo,
      estadoPago,
    },
  });

  return { pago, saldo_pendiente: nuevoSaldo, estado_pago: estadoPago };
}
