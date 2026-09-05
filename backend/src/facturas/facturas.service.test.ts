import prisma from "../lib/prisma";
import {
  calcularSemaforo,
  construirAlcancePorRol,
  crearFactura,
  ErrorNegocio,
  listarFacturas,
  obtenerFactura,
} from "./facturas.service";

jest.mock("../lib/prisma", () => ({
  __esModule: true,
  default: {
    factura: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    proveedor: {
      findUnique: jest.fn(),
    },
  },
}));

const findFirstMock = jest.mocked(prisma.factura.findFirst);
const countMock = jest.mocked(prisma.factura.count);
const findManyMock = jest.mocked(prisma.factura.findMany);
const createMock = jest.mocked(prisma.factura.create);
const proveedorFindUniqueMock = jest.mocked(prisma.proveedor.findUnique);

function fechaEn(dias: number): Date {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

describe("calcularSemaforo (HU-05)", () => {
  test("más de 30 días restantes -> verde", () => {
    const en40dias = new Date();
    en40dias.setDate(en40dias.getDate() + 40);
    expect(calcularSemaforo(en40dias).color).toBe("verde");
  });

  test("entre 15 y 30 días restantes -> amarillo", () => {
    const en20dias = new Date();
    en20dias.setDate(en20dias.getDate() + 20);
    expect(calcularSemaforo(en20dias).color).toBe("amarillo");
  });

  test("menos de 15 días o ya vencida -> rojo", () => {
    const hace5dias = new Date();
    hace5dias.setDate(hace5dias.getDate() - 5);
    expect(calcularSemaforo(hace5dias).color).toBe("rojo");
  });

  test.each<[number, "verde" | "amarillo" | "rojo"]>([
    [31, "verde"],
    [30, "amarillo"],
    [15, "amarillo"],
    [14, "rojo"],
    [0, "rojo"],
    [-1, "rojo"],
  ])("límite de %i días -> %s", (dias, colorEsperado) => {
    expect(calcularSemaforo(fechaEn(dias))).toEqual({
      dias_restantes: dias,
      color: colorEsperado,
    });
  });
});

describe("alcance de Facturas por rol", () => {
  beforeEach(() => {
    countMock.mockReset();
    findManyMock.mockReset();
    findFirstMock.mockReset();
  });

  test("administracion no restringe el tipo de proveedor", () => {
    expect(construirAlcancePorRol("administracion")).toEqual({});
  });

  test("compras limita las consultas a proveedores de bienes", () => {
    expect(construirAlcancePorRol("compras")).toEqual({
      proveedor: { tipo: "bien" },
    });
  });

  test("servicios limita las consultas a proveedores de servicios", () => {
    expect(construirAlcancePorRol("servicios")).toEqual({
      proveedor: { tipo: "servicio" },
    });
  });

  test.each([
    ["administracion", {}],
    ["compras", { proveedor: { tipo: "bien" } }],
    ["servicios", { proveedor: { tipo: "servicio" } }],
  ] as const)("el listado para %s aplica el alcance esperado", async (rol, where) => {
    countMock.mockResolvedValue(0);
    findManyMock.mockResolvedValue([]);

    await expect(listarFacturas({}, rol)).resolves.toEqual({
      data: [],
      page: 1,
      limit: 20,
      total: 0,
    });
    expect(countMock).toHaveBeenCalledWith({ where });
    expect(findManyMock).toHaveBeenCalledWith({
      where,
      orderBy: { fechaVencimiento: "asc" },
      skip: 0,
      take: 20,
    });
  });

  test.each([
    ["compras", "bien"],
    ["servicios", "servicio"],
  ] as const)(
    "%s no puede obtener el detalle de una factura ajena a su tipo",
    async (rol, tipo) => {
      findFirstMock.mockResolvedValue(null);

      await expect(obtenerFactura(25, rol)).rejects.toMatchObject<Partial<ErrorNegocio>>({
        status: 404,
        message: "Factura no encontrada.",
      });
      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 25, proveedor: { tipo } },
      });
    }
  );
});

const CUERPO_VALIDO = {
  proveedor_id: 1,
  numero_factura: "F-001",
  monto_total: 1000,
  fecha_vencimiento: "2026-12-01",
  modalidad_compra: "cotizacion" as const,
};

const PROVEEDOR_BASE = {
  activo: true,
  contacto: null,
  correo: null,
  creadoEn: new Date(),
  direccion: null,
  telefono: null,
};
const PROVEEDOR_BIEN = { ...PROVEEDOR_BASE, id: 1, nit: "12345678", nombre: "Proveedor de Bienes", tipo: "bien" as const };
const PROVEEDOR_SERVICIO = { ...PROVEEDOR_BASE, id: 2, nit: "87654321", nombre: "Proveedor de Servicios", tipo: "servicio" as const };

describe("crearFactura — diagnóstico QA 04/09/2026 (Cesar González)", () => {
  beforeEach(() => {
    proveedorFindUniqueMock.mockReset();
    createMock.mockReset();
  });

  // SPR1-CONTRATO01
  test("DEF-01: rol servicios + proveedor tipo bien -> 403, no crea la factura", async () => {
    proveedorFindUniqueMock.mockResolvedValue(PROVEEDOR_BIEN);

    await expect(
      crearFactura(CUERPO_VALIDO, 1, "servicios")
    ).rejects.toMatchObject<Partial<ErrorNegocio>>({ status: 403 });
    expect(createMock).not.toHaveBeenCalled();
  });

  // SPR1-RN08
  test("DEF-02: monto_total = -500 -> 400, no accede a persistencia", async () => {
    await expect(
      crearFactura({ ...CUERPO_VALIDO, monto_total: -500 }, 1, "compras")
    ).rejects.toMatchObject<Partial<ErrorNegocio>>({ status: 400 });
    expect(proveedorFindUniqueMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  // SPR1-RN09
  test("DEF-03: fecha_vencimiento inválida -> 400, no crea la factura", async () => {
    await expect(
      crearFactura({ ...CUERPO_VALIDO, fecha_vencimiento: "no-es-una-fecha" }, 1, "compras")
    ).rejects.toMatchObject<Partial<ErrorNegocio>>({ status: 400 });
    expect(proveedorFindUniqueMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  // Regresión válida
  test("rol, proveedor, monto y fecha válidos -> crea la factura (201)", async () => {
    proveedorFindUniqueMock.mockResolvedValue(PROVEEDOR_SERVICIO);
    createMock.mockResolvedValue({ id: 99 } as never);

    await expect(crearFactura(CUERPO_VALIDO, 1, "servicios")).resolves.toEqual({ id: 99 });
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  test("modalidad_compra = baja_cuantia -> estado_aprobacion 'aprobada'", async () => {
    proveedorFindUniqueMock.mockResolvedValue(PROVEEDOR_BIEN);
    createMock.mockResolvedValue({ id: 1 } as never);

    await crearFactura({ ...CUERPO_VALIDO, modalidad_compra: "baja_cuantia" }, 1, "compras");

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estadoAprobacion: "aprobada" }) })
    );
  });

  test("las otras modalidades -> estado_aprobacion 'pendiente'", async () => {
    proveedorFindUniqueMock.mockResolvedValue(PROVEEDOR_BIEN);
    createMock.mockResolvedValue({ id: 1 } as never);

    await crearFactura(CUERPO_VALIDO, 1, "compras");

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estadoAprobacion: "pendiente" }) })
    );
  });
});

// TODO (con Prisma mockeado):
// - editarFactura(): rechaza 409 si la factura ya tiene pagos registrados (RF-17)
// - editarFactura(): rechaza 409 si la factura ya está aprobada
