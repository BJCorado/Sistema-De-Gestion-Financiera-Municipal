import type { RolUsuario } from "./types";

/** A dónde redirigir justo después de iniciar sesión, según el rol del usuario. */
export const rutaInicioPorRol: Record<RolUsuario, string> = {
  compras: "/",
  servicios: "/",
  administracion: "/",
};

export const nombreRol: Record<RolUsuario, string> = {
  compras: "Compras",
  servicios: "Servicios",
  administracion: "Administración / Gerencia",
};
