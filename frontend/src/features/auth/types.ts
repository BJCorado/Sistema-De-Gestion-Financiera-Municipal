// Coincide con el enum RolUsuario de Prisma (backend/prisma/schema.prisma)
// y con la respuesta de POST /auth/login y GET /auth/me (contrato 3.2).
export type RolUsuario = "compras" | "servicios" | "administracion";

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
