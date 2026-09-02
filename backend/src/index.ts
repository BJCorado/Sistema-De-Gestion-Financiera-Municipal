// src/index.ts
import "dotenv/config";
import express, { Request, Response } from "express";
import authRoutes from "./auth/auth.routes";
import facturasRoutes from "./facturas/facturas.routes";
import aprobacionesRoutes from "./aprobaciones/aprobaciones.routes";
import pagosRoutes from "./pagos/pagos.routes";
import proveedoresRoutes from "./proveedores/proveedores.routes";

const app = express();
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/facturas", facturasRoutes);
app.use("/api/v1/facturas", aprobacionesRoutes);
app.use("/api/v1/facturas", pagosRoutes);
app.use("/api/v1/proveedores", proveedoresRoutes);

app.get("/api/v1/health", (_req: Request, res: Response) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`SIGEFI backend escuchando en el puerto ${PORT}`));