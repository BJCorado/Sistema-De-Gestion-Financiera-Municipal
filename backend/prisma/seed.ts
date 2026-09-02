// prisma/seed.ts
import "dotenv/config";
import { RolUsuario } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { hashearPassword } from "../src/auth/auth.service";

/**
 * Usuarios semilla para desarrollo y pruebas.
 * NO son credenciales de producción: antes del despliegue (ficha 9.1) se
 * reemplazan por los usuarios reales de la Municipalidad con contraseñas propias.
 */
const USUARIOS: Array<{ nombre: string; correo: string; rol: RolUsuario }> = [
  { nombre: "Encargado de Compras", correo: "compras@sigefi.local", rol: "compras" },
  { nombre: "Encargado de Servicios", correo: "servicios@sigefi.local", rol: "servicios" },
  { nombre: "Administración", correo: "admin@sigefi.local", rol: "administracion" },
  // HU-23 exige 2 aprobadores distintos para facturas >= Q90,000.
  { nombre: "Administración (segundo aprobador)", correo: "admin2@sigefi.local", rol: "administracion" },
];

const PASSWORD_DEV = "Sigefi2026!";

async function main(): Promise<void> {
  const passwordHash = await hashearPassword(PASSWORD_DEV);

  for (const usuario of USUARIOS) {
    const creado = await prisma.usuario.upsert({
      where: { correo: usuario.correo },
      update: { nombre: usuario.nombre, rol: usuario.rol, activo: true },
      create: { ...usuario, passwordHash },
    });
    console.log(`  ${creado.correo.padEnd(26)} ${creado.rol}`);
  }

  console.log(`\nContraseña para los ${USUARIOS.length}: ${PASSWORD_DEV}`);
  console.log("Solo para desarrollo. No usar en el despliegue de la ficha 9.1.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());