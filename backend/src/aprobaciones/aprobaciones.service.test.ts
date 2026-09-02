// src/aprobaciones/aprobaciones.service.test.ts
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import {
  nivelesRequeridos,
  validarCodigoOtp,
  registrarDecision,
  verificarFacturaAprobadaParaPago,
  ErrorNegocio,
} from "./aprobaciones.service";

jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: {
    factura: { findUnique: jest.fn(), update: jest.fn() },
    aprobacion: { findMany: jest.fn(), create: jest.fn() },
  },
}));

const prismaMock = prisma as unknown as {
  factura: { findUnique: jest.Mock; update: jest.Mock };
  aprobacion: { findMany: jest.Mock; create: jest.Mock };
};

const facturaBase = {
  id: 1,
  modalidadCompra: "cotizacion" as const,
  estadoAprobacion: "pendiente" as const,
  verificadoSat: true,
  discrepanciaSat: false,
  montoTotal: new Prisma.Decimal(50000),
};

const CUERPO_OTP_VALIDO = { codigo_otp: "123456" };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("nivelesRequeridos (Ficha 5.8)", () => {
  test("montos menores a Q90,000 requieren 1 aprobación", () => {
    expect(nivelesRequeridos(89999.99)).toBe(1);
  });

  test("Q90,000 exacto ya requiere 2 aprobaciones", () => {
    expect(nivelesRequeridos(90000)).toBe(2);
  });

  test("montos mayores a Q90,000 requieren 2 aprobaciones", () => {
    expect(nivelesRequeridos(150000)).toBe(2);
  });
});

describe("validarCodigoOtp (HU-29, stub temporal)", () => {
  test("rechaza si no viene codigo_otp", () => {
    expect.assertions(2);
    try {
      validarCodigoOtp(undefined);
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorNegocio);
      expect((e as ErrorNegocio).status).toBe(400);
    }
  });

  test("rechaza un codigo_otp vacío", () => {
    expect(() => validarCodigoOtp("   ")).toThrow(ErrorNegocio);
  });

  test("acepta un codigo_otp no vacío", () => {
    expect(() => validarCodigoOtp("123456")).not.toThrow();
  });
});

describe("registrarDecision (Ficha 5.8)", () => {
  test("rechaza si el rol no es administracion", async () => {
    await expect(
      registrarDecision(1, 1, "compras", { decision: "aprobado", ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 403 });
    expect(prismaMock.factura.findUnique).not.toHaveBeenCalled();
  });

  test("rechaza sin codigo_otp antes de tocar la base", async () => {
    await expect(
      registrarDecision(1, 1, "administracion", { decision: "aprobado" })
    ).rejects.toMatchObject({ status: 400 });
    expect(prismaMock.factura.findUnique).not.toHaveBeenCalled();
  });

  test("baja_cuantia -> 409, no admite aprobación manual", async () => {
    prismaMock.factura.findUnique.mockResolvedValue({ ...facturaBase, modalidadCompra: "baja_cuantia" });

    await expect(
      registrarDecision(1, 1, "administracion", { decision: "aprobado", ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 409 });
  });

  test("rechaza aprobar si verificado_sat = false (HU-30)", async () => {
    prismaMock.factura.findUnique.mockResolvedValue({ ...facturaBase, verificadoSat: false });

    await expect(
      registrarDecision(1, 1, "administracion", { decision: "aprobado", ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 409 });
  });

  test("rechaza aprobar si discrepancia_sat = true (HU-30)", async () => {
    prismaMock.factura.findUnique.mockResolvedValue({ ...facturaBase, discrepanciaSat: true });

    await expect(
      registrarDecision(1, 1, "administracion", { decision: "aprobado", ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 409 });
  });

  test("el mismo aprobador no puede decidir dos veces sobre la misma factura", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(facturaBase);
    prismaMock.aprobacion.findMany.mockResolvedValue([{ aprobador_id: 7, nivel: 1 }]);

    await expect(
      registrarDecision(1, 7, "administracion", { decision: "aprobado", ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 409 });
  });

  test("decision 'rechazado' sin comentario -> 400", async () => {
    await expect(
      registrarDecision(1, 1, "administracion", { decision: "rechazado", ...CUERPO_OTP_VALIDO })
    ).rejects.toMatchObject({ status: 400 });
  });

  test("rechazo válido: crea la aprobacion y pasa la factura a 'rechazada'", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(facturaBase);
    prismaMock.aprobacion.findMany.mockResolvedValue([]);
    prismaMock.factura.update.mockResolvedValue({ ...facturaBase, estadoAprobacion: "rechazada" });

    const resultado = await registrarDecision(1, 1, "administracion", {
      decision: "rechazado",
      comentario: "Falta cotización de respaldo",
      ...CUERPO_OTP_VALIDO,
    });

    expect(prismaMock.aprobacion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ factura_id: 1, aprobador_id: 1, nivel: 1, decision: "rechazado" }),
    });
    expect(prismaMock.factura.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estadoAprobacion: "rechazada" },
    });
    expect(resultado.estadoAprobacion).toBe("rechazada");
  });

  test("monto < Q90,000: una sola aprobación ya deja la factura 'aprobada'", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(facturaBase); // Q50,000
    prismaMock.aprobacion.findMany.mockResolvedValue([]);
    prismaMock.factura.update.mockResolvedValue({ ...facturaBase, estadoAprobacion: "aprobada" });

    await registrarDecision(1, 1, "administracion", { decision: "aprobado", ...CUERPO_OTP_VALIDO });

    expect(prismaMock.factura.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estadoAprobacion: "aprobada" },
    });
  });

  test("monto >= Q90,000, nivel 1 aprobado: la factura permanece 'pendiente'", async () => {
    const facturaGrande = { ...facturaBase, montoTotal: new Prisma.Decimal(150000) };
    prismaMock.factura.findUnique.mockResolvedValue(facturaGrande);
    prismaMock.aprobacion.findMany.mockResolvedValue([]);

    const resultado = await registrarDecision(1, 1, "administracion", {
      decision: "aprobado",
      ...CUERPO_OTP_VALIDO,
    });

    expect(prismaMock.factura.update).not.toHaveBeenCalled();
    expect(resultado.estadoAprobacion).toBe("pendiente");
  });

  test("monto >= Q90,000, nivel 2 aprobado por otro usuario: pasa a 'aprobada'", async () => {
    const facturaGrande = { ...facturaBase, montoTotal: new Prisma.Decimal(150000) };
    prismaMock.factura.findUnique.mockResolvedValue(facturaGrande);
    prismaMock.aprobacion.findMany.mockResolvedValue([{ aprobador_id: 1, nivel: 1 }]);
    prismaMock.factura.update.mockResolvedValue({ ...facturaGrande, estadoAprobacion: "aprobada" });

    await registrarDecision(1, 2, "administracion", { decision: "aprobado", ...CUERPO_OTP_VALIDO });

    expect(prismaMock.aprobacion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ nivel: 2, aprobador_id: 2 }),
    });
    expect(prismaMock.factura.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { estadoAprobacion: "aprobada" },
    });
  });
});

describe("verificarFacturaAprobadaParaPago (Ficha 5.8)", () => {
  test("rechaza si la factura no existe", async () => {
    prismaMock.factura.findUnique.mockResolvedValue(null);
    await expect(verificarFacturaAprobadaParaPago(999)).rejects.toMatchObject({ status: 404 });
  });

  test("rechaza si estado_aprobacion !== 'aprobada'", async () => {
    prismaMock.factura.findUnique.mockResolvedValue({ ...facturaBase, estadoAprobacion: "pendiente" });
    await expect(verificarFacturaAprobadaParaPago(1)).rejects.toMatchObject({ status: 409 });
  });

  test("permite el pago si la factura ya está aprobada", async () => {
    const facturaAprobada = { ...facturaBase, estadoAprobacion: "aprobada" };
    prismaMock.factura.findUnique.mockResolvedValue(facturaAprobada);
    await expect(verificarFacturaAprobadaParaPago(1)).resolves.toBe(facturaAprobada);
  });
});
