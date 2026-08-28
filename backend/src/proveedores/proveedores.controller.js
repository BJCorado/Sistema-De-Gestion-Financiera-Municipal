// src/proveedores/proveedores.controller.js
const servicio = require("./proveedores.service");

/**
 * Rol del usuario. Temporal: hasta que exista POST /auth/login con JWT,
 * se toma de la cabecera x-rol-usuario. Cuando el middleware de autenticación
 * esté listo, esto pasa a ser req.usuario.rol y se elimina el fallback.
 */
function obtenerRol(req) {
  const rol = req.usuario?.rol || req.headers["x-rol-usuario"];
  if (!servicio.TIPO_POR_ROL.hasOwnProperty(rol)) {
    throw new servicio.ErrorNegocio(
      401,
      "Rol de usuario no identificado (envíe la cabecera x-rol-usuario mientras no exista el login)"
    );
  }
  return rol;
}

function obtenerId(req) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new servicio.ErrorNegocio(400, "El id del proveedor debe ser un número entero positivo");
  }
  return id;
}

/** Formato de error según Convenciones del contrato 3.2: { "error": "mensaje" } */
function responderError(res, error) {
  if (error instanceof servicio.ErrorNegocio) {
    const cuerpo = { error: error.message };
    if (error.errores) cuerpo.detalles = error.errores;
    return res.status(error.status).json(cuerpo);
  }
  console.error("[proveedores]", error);
  return res.status(500).json({ error: "Error interno del servidor" });
}

async function listar(req, res) {
  try {
    const rol = obtenerRol(req);
    const filtros = servicio.validarFiltros(req.query);
    const { data, total } = await servicio.listar(filtros, rol);
    res.json({ data, page: filtros.page, limit: filtros.limit, total });
  } catch (error) {
    responderError(res, error);
  }
}

async function obtener(req, res) {
  try {
    const proveedor = await servicio.obtenerPorId(obtenerId(req), obtenerRol(req));
    res.json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

async function crear(req, res) {
  try {
    const rol = obtenerRol(req);
    const datos = servicio.validarCreacion(req.body);
    const proveedor = await servicio.crear(datos, rol);
    res.status(201).json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

async function actualizar(req, res) {
  try {
    const rol = obtenerRol(req);
    const cambios = servicio.validarActualizacion(req.body);
    const proveedor = await servicio.actualizar(obtenerId(req), cambios, rol);
    res.json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

/** PATCH /proveedores/:id/estado — body: { activo: boolean } */
async function cambiarEstado(req, res) {
  try {
    const rol = obtenerRol(req);
    const { activo } = req.body || {};

    if (typeof activo !== "boolean") {
      throw new servicio.ErrorNegocio(400, "El campo 'activo' es obligatorio y debe ser true o false");
    }

    const proveedor = await servicio.cambiarEstado(obtenerId(req), activo, rol);
    res.json(proveedor);
  } catch (error) {
    responderError(res, error);
  }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado };