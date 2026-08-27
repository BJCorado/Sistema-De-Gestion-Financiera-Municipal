// src/index.js
require("dotenv").config();
const express = require("express");
const facturasRoutes = require("./facturas/facturas.routes");

const app = express();
app.use(express.json());

app.use("/api/v1/facturas", facturasRoutes);

app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SIGEFI backend escuchando en el puerto ${PORT}`));