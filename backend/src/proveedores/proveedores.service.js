// src/proveedores/proveedores.service.js
const prisma = require("../lib/prisma");

const TIPOS = ["bien", "servicio"];

// HU-13 / HU-14 / HU-15: qué tipo de proveedor puede ver cada rol.
// null = sin restricción (Administración ve bienes y servicios).
const TIPO_POR_ROL = {
  compras: "bien",
  servicios: "servicio",
  administracion: null,
};

const RE_NIT = /^[0-9]{1,12}-?[0-9K]$/;
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFONO = /^[0-9+\-\s()]{8,20}$/;

/** Error de negocio con código HTTP, para que el controller no adivine. */
class ErrorNegocio extends Error {
  constructor(status, mensaje, errores = null) {
    super(mensaje);
    this.status = status;
    this.errores = errores;
  }
}

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const opcional = (v) => {
  const t = texto(v);
  return t === "" ? null : t;
};

/* ------------------------------------------------------------------ */
/* Validaciones                                                        */
/* ------------------------------------------------------------------ */

/** HU-01 / RF-06 / RF-07: nombre, NIT y tipo obligatorios. */
function validarCreacion(cuerpo = {}) {
  const errores = [];

  const nombre = texto(cuerpo.nombre);
  const nit = texto(cuerpo.nit).toUpperCase().replace(/\s+/g, "");
  const tipo = texto(cuerpo.tipo).toLowerCase();
  const correo = opcional(cuerpo.correo)?.toLowerCase() ?? null;
  const telefono = opcional(cuerpo.telefono);
  const contacto = opcional(cuerpo.contacto);
  const direccion = opcional(cuerpo.direccion);

  if (nombre.length < 3 || nombre.length > 150) {
    errores.push({ campo: "nombre", mensaje: "El nombre debe tener entre 3 y 150 caracteres" });
  }
  if (!nit) {
    errores.push({ campo: "nit", mensaje: "El NIT es obligatorio" });
  } else if (!RE_NIT.test(nit)) {
    errores.push({ campo: "nit", mensaje: "Formato de NIT inválido (ej. 1234567-8)" });
  }
  if (!TIPOS.includes(tipo)) {
    errores.push({ campo: "tipo", mensaje: "Debe seleccionar el tipo: 'bien' o 'servicio'" });
  }
  if (correo && !RE_CORREO.test(correo)) {
    errores.push({ campo: "correo", mensaje: "Formato de correo inválido" });
  }
  if (telefono && !RE_TELEFONO.test(telefono)) {
    errores.push({ campo: "telefono", mensaje: "Formato de teléfono inválido" });
  }
  if (contacto && contacto.length > 120) {
    errores.push({ campo: "contacto", mensaje: "Máximo 120 caracteres" });
  }
  if (direccion && direccion.length > 255) {
    errores.push({ campo: "direccion", mensaje: "Máximo 255 caracteres" });
  }

  if (errores.length) {
    throw new ErrorNegocio(400, "Datos del proveedor inválidos", errores);
  }

  return { nombre, nit, tipo, contacto, telefono, correo, direccion };
}

/** RF-11: edición parcial. El tipo NO se puede cambiar (ver README del módulo). */
function validarActualizacion(cuerpo = {}) {
  const errores = [];
  const cambios = {};

  if ("tipo" in cuerpo) {
    errores.push({
      campo: "tipo",
      mensaje: "El tipo (bien/servicio) no se puede modificar después de crear el proveedor",
    });
  }

  if ("nombre" in cuerpo) {
    const nombre = texto(cuerpo.nombre);
    if (nombre.length < 3 || nombre.length > 150) {
      errores.push({ campo: "nombre", mensaje: "El nombre debe tener entre 3 y 150 caracteres" });
    } else {
      cambios.nombre = nombre;
    }
  }

  if ("nit" in cuerpo) {
    const nit = texto(cuerpo.nit).toUpperCase().replace(/\s+/g, "");
    if (!RE_NIT.test(nit)) {
      errores.push({ campo: "nit", mensaje: "Formato de NIT inválido (ej. 1234567-8)" });
    } else {
      cambios.nit = nit;
    }
  }

  if ("correo" in cuerpo) {
    const correo = opcional(cuerpo.correo)?.toLowerCase() ?? null;
    if (correo && !RE_CORREO.test(correo)) {
      errores.push({ campo: "correo", mensaje: "Formato de correo inválido" });
    } else {
      cambios.correo = correo;
    }
  }

  if ("telefono" in cuerpo) {
    const telefono = opcional(cuerpo.telefono);
    if (telefono && !RE_TELEFONO.test(telefono)) {
      errores.push({ campo: "telefono", mensaje: "Formato de teléfono inválido" });
    } else {
      cambios.telefono = telefono;
    }
  }

  if ("contacto" in cuerpo) cambios.contacto = opcional(cuerpo.contacto);
  if ("direccion" in cuerpo) cambios.direccion = opcional(cuerpo.direccion);

  if (errores.length) throw new ErrorNegocio(400, "Datos del proveedor inválidos", errores);
  if (Object.keys(cambios).length === 0) {
    throw new ErrorNegocio(400, "No se envió ningún campo modificable");
  }

  return cambios;
}

/** RF-09: filtros del listado. */
function validarFiltros(consulta = {}) {
  const errores = [];

  let tipo = null;
  if (consulta.tipo) {
    tipo = texto(consulta.tipo).toLowerCase();
    if (!TIPOS.includes(tipo)) {
      errores.push({ campo: "tipo", mensaje: "El filtro tipo debe ser 'bien' o 'servicio'" });
    }
  }

  // activo: true (por defecto) | false | todos
  let activo = true;
  if (consulta.activo !== undefined) {
    const valor = texto(consulta.activo).toLowerCase();
    if (valor === "todos") activo = null;
    else if (valor === "true" || valor === "1") activo = true;
    else if (valor === "false" || valor === "0") activo = false;
    else errores.push({ campo: "activo", mensaje: "Use true, false o todos" });
  }

  const page = Math.max(1, Number.parseInt(consulta.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(consulta.limit, 10) || 20));
  const busqueda = opcional(consulta.q);

  if (errores.length) throw new ErrorNegocio(400, "Filtros inválidos", errores);

  return { tipo, activo, busqueda, page, limit };
}
/**
 * HU-13 / HU-14: si el proveedor no es del tipo que el rol puede ver,
 * respondemos 404 y no 403, para no revelar que el registro existe.
 */
function verificarAlcance(proveedor, rol) {
  const tipoPermitido = TIPO_POR_ROL[rol] ?? null;
  if (tipoPermitido && proveedor.tipo !== tipoPermitido) {
    throw new ErrorNegocio(404, "Proveedor no encontrado");
  }
}

/* ------------------------------------------------------------------ */
/* Operaciones                                                         */
/* ------------------------------------------------------------------ */

// RF-08 / RF-09 / HU-03
async function listar(filtros, rol) {
  const tipoPermitido = TIPO_POR_ROL[rol] ?? null;

  if (tipoPermitido && filtros.tipo && filtros.tipo !== tipoPermitido) {
    throw new ErrorNegocio(403, `Su rol solo puede consultar proveedores de tipo "${tipoPermitido}"`);
  }

  const where = {};
  const tipo = tipoPermitido || filtros.tipo;
  if (tipo) where.tipo = tipo;
  if (filtros.activo !== null) where.activo = filtros.activo;
  if (filtros.busqueda) {
    where.OR = [
      { nombre: { contains: filtros.busqueda } },
      { nit: { contains: filtros.busqueda } },
      { contacto: { contains: filtros.busqueda } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.proveedor.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.proveedor.count({ where }),
  ]);

  return { data, total };
}
// RF-10
async function obtenerPorId(id, rol) {
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) throw new ErrorNegocio(404, "Proveedor no encontrado");
  verificarAlcance(proveedor, rol);
  return proveedor;
}

// RF-06 / RF-07 / HU-01 / HU-02
async function crear(datos, rol) {
  const tipoPermitido = TIPO_POR_ROL[rol] ?? null;
  if (tipoPermitido && datos.tipo !== tipoPermitido) {
    throw new ErrorNegocio(403, `Su rol solo puede registrar proveedores de tipo "${tipoPermitido}"`);
  }

  try {
    return await prisma.proveedor.create({ data: datos });
  } catch (error) {
    if (error.code === "P2002") {
      throw new ErrorNegocio(409, `Ya existe un proveedor registrado con el NIT ${datos.nit}`);
    }
    throw error;
  }
}

// RF-11
async function actualizar(id, cambios, rol) {
  await obtenerPorId(id, rol);

  try {
    return await prisma.proveedor.update({ where: { id }, data: cambios });
  } catch (error) {
    if (error.code === "P2002") {
      throw new ErrorNegocio(409, "El NIT ya pertenece a otro proveedor");
    }
    throw error;
  }
}

// RF-12: baja lógica. Nunca se borra físicamente, para no perder el historial de facturas.
async function cambiarEstado(id, activo, rol) {
  const actual = await obtenerPorId(id, rol);

  if (actual.activo === activo) {
    throw new ErrorNegocio(409, `El proveedor ya se encuentra ${activo ? "activo" : "inactivo"}`);
  }

  return prisma.proveedor.update({ where: { id }, data: { activo } });
}

module.exports = {
  ErrorNegocio,
  TIPOS,
  TIPO_POR_ROL,
  validarCreacion,
  validarActualizacion,
  validarFiltros,
  verificarAlcance,
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
};