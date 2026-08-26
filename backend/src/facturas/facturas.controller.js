// src/facturas/facturas.controller.js
const service = require("./facturas.service");

async function crear(req, res) {
  try {
    const factura = await service.crearFactura(req.body, req.usuario.id);
    res.status(201).json(factura);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function listar(req, res) {
  try {
    const resultado = await service.listarFacturas(req.query);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function obtener(req, res) {
  try {
    const factura = await service.obtenerFactura(req.params.id);
    res.status(200).json(factura);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function editar(req, res) {
  try {
    const factura = await service.editarFactura(req.params.id, req.body);
    res.status(200).json(factura);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { crear, listar, obtener, editar };
