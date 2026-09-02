// src/auth/auth.service.test.ts
process.env.JWT_SECRET = "secreto_de_prueba_con_longitud_suficiente_1234567890";

import { verificarToken, ErrorNegocio, hashearPassword } from "./auth.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRETO = process.env.JWT_SECRET as string;

describe("Auth — token y contraseñas (RNF-03)", () => {
  test("un token válido devuelve el usuario en sesión", () => {
    const token = jwt.sign(
      { nombre: "Ana López", correo: "ana@muni.gob.gt", rol: "compras" },
      SECRETO,
      { subject: "7", expiresIn: "1h" }
    );

    const usuario = verificarToken(token);
    expect(usuario.id).toBe(7);
    expect(usuario.rol).toBe("compras");
  });

  test("un token firmado con otro secreto se rechaza con 401", () => {
    const token = jwt.sign({ rol: "administracion" }, "otro_secreto_totalmente_distinto", {
      subject: "1",
      expiresIn: "1h",
    });

    expect.assertions(1);
    try {
      verificarToken(token);
    } catch (e) {
      expect((e as ErrorNegocio).status).toBe(401);
    }
  });

  test("un token expirado se rechaza con 401", () => {
    const token = jwt.sign(
      { nombre: "Ana", correo: "ana@muni.gob.gt", rol: "compras" },
      SECRETO,
      { subject: "7", expiresIn: "-1s" }
    );

    expect.assertions(1);
    try {
      verificarToken(token);
    } catch (e) {
      expect((e as ErrorNegocio).status).toBe(401);
    }
  });

  test("un token sin rol se rechaza con 401", () => {
    const token = jwt.sign({ nombre: "Ana", correo: "ana@muni.gob.gt" }, SECRETO, {
      subject: "7",
      expiresIn: "1h",
    });

    expect.assertions(1);
    try {
      verificarToken(token);
    } catch (e) {
      expect((e as ErrorNegocio).status).toBe(401);
    }
  });

  test("la contraseña se guarda hasheada, nunca en texto plano", async () => {
    const hash = await hashearPassword("clave-segura-123");
    expect(hash).not.toBe("clave-segura-123");
    expect(await bcrypt.compare("clave-segura-123", hash)).toBe(true);
    expect(await bcrypt.compare("otra-clave", hash)).toBe(false);
  });
});