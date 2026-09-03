import { calcularSemaforo } from "./facturas.service";

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

// TODO (con Prisma mockeado):
// - crearFactura(): modalidad_compra = "baja_cuantia" -> estado_aprobacion "aprobada"
// - crearFactura(): las otras 3 modalidades -> estado_aprobacion "pendiente"
// - editarFactura(): rechaza 409 si la factura ya tiene pagos registrados (RF-17)
// - editarFactura(): rechaza 409 si la factura ya está aprobada
