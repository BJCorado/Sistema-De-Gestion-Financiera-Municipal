// src/index.ts
import "dotenv/config";
import express, { Request, Response } from "express";
import proveedoresRoutes from "./proveedores/proveedores.routes";

// TODO: facturas sigue en JavaScript. Cuando Javier migre el módulo,
// reemplazar este require por: import facturasRoutes from "./facturas/facturas.routes";
// y quitar allowJs/checkJs del tsconfig.json.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const facturasRoutes = require("./facturas/facturas.routes");

const app = express();
app.use(express.json());

app.use("/api/v1/facturas", facturasRoutes);
app.use("/api/v1/proveedores", proveedoresRoutes);

app.get("/api/v1/health", (_req: Request, res: Response) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`SIGEFI backend escuchando en el puerto ${PORT}`));