// src/facturas/facturas.service.test.ts
import { calcularSemaforo } from "./facturas.service";

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
});

// TODO (con Prisma mockeado):
// - crearFactura(): modalidad_compra = "baja_cuantia" -> estado_aprobacion "aprobada"
// - crearFactura(): las otras 3 modalidades -> estado_aprobacion "pendiente"
// - editarFactura(): rechaza 409 si la factura ya tiene pagos registrados (RF-17)
// - editarFactura(): rechaza 409 si la factura ya está aprobada
