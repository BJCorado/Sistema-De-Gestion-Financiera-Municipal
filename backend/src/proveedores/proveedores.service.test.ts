// src/proveedores/proveedores.service.test.ts
import {
  validarCreacion,
  validarActualizacion,
  validarFiltros,
  verificarAlcance,
  ErrorNegocio,
} from "./proveedores.service";

const base = { nombre: "Ferretería El Progreso", nit: "1234567-8", tipo: "bien" };

/** En los catch, TypeScript entrega `unknown`: esto lo estrecha a ErrorNegocio. */
function comoErrorNegocio(e: unknown): ErrorNegocio {
  if (!(e instanceof ErrorNegocio)) throw e;
  return e;
}

describe("Proveedores — validaciones (tarea 5.1)", () => {
  test("acepta un proveedor válido y normaliza los campos", () => {
    const datos = validarCreacion({ ...base, correo: "  VENTAS@EP.COM ", telefono: "" });
    expect(datos.correo).toBe("ventas@ep.com");
    expect(datos.telefono).toBeNull();
    expect(datos.tipo).toBe("bien");
  });

  test("HU-01: rechaza el alta sin clasificación bien/servicio", () => {
    expect.assertions(2);
    try {
      validarCreacion({ nombre: base.nombre, nit: base.nit });
    } catch (e) {
      const error = comoErrorNegocio(e);
      expect(error).toBeInstanceOf(ErrorNegocio);
      expect(error.errores?.some((x) => x.campo === "tipo")).toBe(true);
    }
  });

  test("rechaza un NIT con formato inválido", () => {
    expect.assertions(1);
    try {
      validarCreacion({ ...base, nit: "abc" });
    } catch (e) {
      expect(comoErrorNegocio(e).errores?.some((x) => x.campo === "nit")).toBe(true);
    }
  });

  test("no permite cambiar el tipo en una edición", () => {
    expect.assertions(1);
    try {
      validarActualizacion({ tipo: "servicio" });
    } catch (e) {
      expect(comoErrorNegocio(e).errores?.some((x) => x.campo === "tipo")).toBe(true);
    }
  });

  test("la edición parcial solo devuelve los campos enviados", () => {
    expect(Object.keys(validarActualizacion({ telefono: "50221234" }))).toEqual(["telefono"]);
  });

  test("RF-09: filtros con valores por defecto", () => {
    const filtros = validarFiltros({});
    expect(filtros.activo).toBe(true);
    expect(filtros.page).toBe(1);
    expect(filtros.limit).toBe(20);
  });

  test("activo=todos desactiva el filtro de estado", () => {
    expect(validarFiltros({ activo: "todos" }).activo).toBeNull();
  });

  test("el límite no puede pasar de 100", () => {
    expect(validarFiltros({ limit: "500" }).limit).toBe(100);
  });

  test("HU-13: Compras no puede ver un proveedor de servicio", () => {
    expect.assertions(1);
    try {
      verificarAlcance({ tipo: "servicio" }, "compras");
    } catch (e) {
      expect(comoErrorNegocio(e).status).toBe(404);
    }
  });

  test("HU-15: Administración ve ambos tipos", () => {
    expect(() => verificarAlcance({ tipo: "servicio" }, "administracion")).not.toThrow();
    expect(() => verificarAlcance({ tipo: "bien" }, "administracion")).not.toThrow();
  });
});