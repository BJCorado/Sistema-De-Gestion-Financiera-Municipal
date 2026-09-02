// src/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RolUsuario } from "@prisma/client";
import prisma from "../lib/prisma";

/** Error de negocio con código HTTP. Misma convención que los otros módulos. */
export class ErrorNegocio extends Error {
  public readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.status = status;
  }
}

export interface UsuarioEnSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

export interface ResultadoLogin {
  token: string;
  usuario: UsuarioEnSesion;
}

/** Contenido del JWT. `sub` lleva el id como string (estándar JWT). */
export interface PayloadToken {
  sub: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

const RONDAS_BCRYPT = 10;

function obtenerSecreto(): string {
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error(
      "JWT_SECRET no está definido o es demasiado corto. Configúrelo en el archivo .env."
    );
  }
  return secreto;
}

/** RF-01 / HU-16: valida credenciales y emite el JWT. */
export async function iniciarSesion(
  correoCrudo: unknown,
  passwordCrudo: unknown
): Promise<ResultadoLogin> {
  const correo = typeof correoCrudo === "string" ? correoCrudo.trim().toLowerCase() : "";
  const password = typeof passwordCrudo === "string" ? passwordCrudo : "";

  if (!correo || !password) {
    throw new ErrorNegocio(400, "Correo y contraseña son obligatorios");
  }

  const usuario = await prisma.usuario.findUnique({ where: { correo } });

  // Mensaje genérico a propósito: no revelamos si el correo existe ni si la
  // cuenta está desactivada. Evita enumerar usuarios válidos.
  if (!usuario || !usuario.activo) {
    throw new ErrorNegocio(401, "Credenciales inválidas");
  }

  const coincide = await bcrypt.compare(password, usuario.passwordHash);
  if (!coincide) {
    throw new ErrorNegocio(401, "Credenciales inválidas");
  }

  const token = jwt.sign(
    { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    obtenerSecreto(),
    {
      subject: String(usuario.id),
      expiresIn: (process.env.JWT_EXPIRA ?? "8h") as jwt.SignOptions["expiresIn"],
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
}

/** Verifica el token y devuelve el usuario en sesión. Lanza 401 si es inválido. */
export function verificarToken(token: string): UsuarioEnSesion {
  let payload: unknown;

  try {
    payload = jwt.verify(token, obtenerSecreto());
  } catch {
    throw new ErrorNegocio(401, "Token inválido o expirado");
  }

  if (typeof payload !== "object" || payload === null) {
    throw new ErrorNegocio(401, "Token inválido o expirado");
  }

  const datos = payload as Partial<PayloadToken>;
  const id = Number.parseInt(datos.sub ?? "", 10);

  if (!Number.isInteger(id) || id <= 0 || !datos.rol || !datos.nombre || !datos.correo) {
    throw new ErrorNegocio(401, "Token inválido o expirado");
  }

  return { id, nombre: datos.nombre, correo: datos.correo, rol: datos.rol };
}

/** Genera el hash de una contraseña. Usado por el script de alta de usuarios. */
export function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, RONDAS_BCRYPT);
}