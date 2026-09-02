// src/pagos/pagos.service.test.ts
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { registrarPago } from "./pagos.service";

jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: {
    factura: { findUnique: jest.fn(), update: jest.fn() },
    pago: { create: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  factura: { findUnique: jest.Mock; update: jest.Mock };
  pago: { create: jest.Mock };
};

const facturaAprobada = {
  id: 1,
  estadoAprobacion: "aprobada" as const,
  montoAbonado: new Prisma.Decimal(0),
  saldoPendiente: new Prisma.Decimal(1000),
};

const CUERPO_OTP_VALIDO = { codigo_otp: "123456" };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("registrarPago (Ficha 5.8: 'Rechaza PAGO sobre factura no aprobada')", () => {
  test("rechaza sin codigo_otp antes de tocar la base", async () => {
    await expect(registrarPago(1, 1, { monto: 100 })).rejects.toMatchObject({ status: 400 });
    expect(prismaMock.factura.findUnique).not.toHaveBeenCalled();
  });

  test("rechaza un monto <= 0", async () => {
    await expect(
      registrarPago(1, 1, { monto: 0, ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 400 });
  });

  test("rechaza el pago si la factura no está aprobada", async () => {
    prismaMock.factura.findUnique.mockResolvedValue({ ...facturaAprobada, estadoAprobacion: "pendiente" });

    await expect(
      registrarPago(1, 1, { monto: 100, ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.pago.create).not.toHaveBeenCalled();
  });

  test("rechaza si el monto supera el saldo pendiente", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(facturaAprobada); // saldo Q1,000

    await expect(
      registrarPago(1, 1, { monto: 5000, ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 409 });
  });

  test("pago parcial: deja la factura en estado_pago 'parcial'", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(facturaAprobada); // saldo Q1,000
    prismaMock.pago.create.mockResolvedValue({ id: 1, monto: new Prisma.Decimal(400) });

    const resultado = await registrarPago(1, 1, { monto: 400, ...CUERPO_OTP_VALIDO });

    expect(resultado.estado_pago).toBe("parcial");
    expect(resultado.saldo_pendiente).toBe(600);
    expect(prismaMock.factura.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { montoAbonado: 400, saldoPendiente: 600, estadoPago: "parcial" },
    });
  });

  test("pago que cubre el saldo completo: deja la factura en estado_pago 'pagada'", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(facturaAprobada); // saldo Q1,000
    prismaMock.pago.create.mockResolvedValue({ id: 2, monto: new Prisma.Decimal(1000) });

    const resultado = await registrarPago(1, 1, { monto: 1000, ...CUERPO_OTP_VALIDO });

    expect(resultado.estado_pago).toBe("pagada");
    expect(resultado.saldo_pendiente).toBe(0);
  });
});
