import { RolUsuario } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: number; rol: RolUsuario };
    }
  }
}

export {};
