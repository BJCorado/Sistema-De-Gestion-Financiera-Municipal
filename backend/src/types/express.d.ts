// src/types/express.d.ts
import { RolUsuario } from "@prisma/client";

/** Extiende el Request de Express con el usuario autenticado por JWT. */
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        nombre: string;
        correo: string;
        rol: RolUsuario;
      };
    }
  }
}

export {};