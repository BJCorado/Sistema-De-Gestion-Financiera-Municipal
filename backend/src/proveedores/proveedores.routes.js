// src/proveedores/proveedores.routes.js
const express = require("express");
const controlador = require("./proveedores.controller");

const router = express.Router();

// Rutas y roles según contrato 3.2, sección Proveedores.
router.get("/", controlador.listar);
router.get("/:id", controlador.obtener);
router.post("/", controlador.crear);
router.put("/:id", controlador.actualizar);
router.patch("/:id/estado", controlador.cambiarEstado);

// TODO: GET /proveedores/:id/estado-cuenta — HU-12, rol administracion.

module.exports = router;