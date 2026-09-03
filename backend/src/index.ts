// src/index.ts
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import authRoutes from "./auth/auth.routes";
import facturasRoutes from "./facturas/facturas.routes";
import proveedoresRoutes from "./proveedores/proveedores.routes";

const app = express();

// CORS: el frontend (Vite, puerto 5173 por defecto) corre en un origen distinto
// al backend (puerto 3000), así que el navegador bloquea las peticiones si el
// backend no responde explícitamente que las permite. Implementado a mano
// (sin el paquete "cors") para no depender de una instalación nueva.
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/facturas", facturasRoutes);
app.use("/api/v1/proveedores", proveedoresRoutes);

app.get("/api/v1/health", (_req: Request, res: Response) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`SIGEFI backend escuchando en el puerto ${PORT}`));
