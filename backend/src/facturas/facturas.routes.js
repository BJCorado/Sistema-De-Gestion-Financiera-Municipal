// src/facturas/facturas.routes.js
const express = require("express");
const router = express.Router();
const controller = require("./facturas.controller");

const USUARIO_PRUEBA_ID = 1;
const requireAuth = (req, res, next) => {
  req.usuario = { id: USUARIO_PRUEBA_ID, rol: "administracion" };
  next();
};
const requireRol = (...roles) => (req, res, next) => next(); 

router.get("/", requireAuth, requireRol("compras", "servicios", "administracion"), controller.listar);
router.get("/:id", requireAuth, requireRol("compras", "servicios", "administracion"), controller.obtener);
router.post("/", requireAuth, requireRol("compras", "servicios"), controller.crear);
router.put("/:id", requireAuth, requireRol("compras", "servicios"), controller.editar);

module.exports = router;