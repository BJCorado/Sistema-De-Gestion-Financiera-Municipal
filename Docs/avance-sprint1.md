# Avance del Sprint 1 — SIGEFI

El Sprint 1 marcó el paso de la etapa de análisis y diseño hacia una primera versión funcional de SIGEFI. Para esta fase ya se contaba con historias de usuario, modelo de datos, contrato de API, arquitectura y mockups.

El trabajo se concentró principalmente en la Gestión de Proveedores, Facturación y el Semáforo de Vencimientos. Estas funciones se desarrollaron de forma relacionada, ya que los proveedores sirven como base para registrar facturas y las fechas de vencimiento de esas facturas alimentan el semáforo mostrado en el sistema.

Este documento resume lo desarrollado en las tareas 5.1, 5.2, 5.3 y 5.4.

---

## 5.1 Backend — Gestión de Proveedores

Durante esta tarea se desarrolló el backend del módulo de Proveedores, permitiendo registrar, consultar, actualizar y cambiar el estado de los proveedores.

El módulo se organizó en:

- `proveedores.routes.ts`
- `proveedores.controller.ts`
- `proveedores.service.ts`
- `proveedores.service.test.ts`

### Rutas y control de acceso

Las principales operaciones implementadas fueron:

- `GET /proveedores`
- `GET /proveedores/:id`
- `POST /proveedores`
- `PUT /proveedores/:id`
- `PATCH /proveedores/:id/estado`

Todas las rutas requieren autenticación mediante JWT.

Los roles Compras, Servicios y Administración pueden consultar proveedores. La creación y edición están disponibles para Compras y Servicios, mientras que Administración también puede cambiar el estado de los registros.

### Separación por rol

Se implementó una regla para limitar la información según el rol:

- Compras trabaja con proveedores de tipo `bien`.
- Servicios trabaja con proveedores de tipo `servicio`.
- Administración puede consultar ambos tipos.

Esta restricción también se aplica en el backend, evitando que un usuario consulte información fuera de su área mediante llamadas directas a la API.

### Registro y validaciones

Los datos principales de un proveedor son:

- nombre;
- NIT;
- tipo;
- contacto;
- teléfono;
- correo;
- dirección.

Nombre, NIT y tipo son obligatorios. También se validan formatos de NIT, correo y teléfono.

El sistema evita NIT duplicados y normaliza algunos datos antes de guardarlos, por ejemplo, convirtiendo el correo a minúsculas.

### Edición y estado

La edición permite modificar únicamente los campos necesarios. El tipo de proveedor no puede cambiarse después de crear el registro.

En lugar de eliminar proveedores, se utiliza una baja lógica mediante el campo `activo`, permitiendo desactivar o reactivar registros sin perder su historial.

### Búsqueda y paginación

El listado permite buscar por nombre, NIT o contacto y filtrar por tipo y estado.

La respuesta utiliza paginación con 20 registros por página de forma predeterminada y un máximo de 100 por consulta.

### Integración con Prisma y MySQL

Las operaciones del módulo se realizan mediante Prisma sobre MySQL, utilizando consultas como `findMany`, `findUnique`, `create`, `update` y `count`.

También se implementaron pruebas para validar reglas como clasificación obligatoria, formato de NIT, restricción por rol, edición parcial y filtros.

### Resultado de la tarea 5.1

Al finalizar esta tarea quedó disponible un backend funcional para Proveedores, preparado para ser consumido por el frontend y utilizado posteriormente por el módulo de Facturación.

---

## 5.2 Backend — Gestión de Facturas

La tarea 5.2 correspondió al desarrollo del backend de Facturación. El módulo permite registrar, consultar y editar facturas asociadas a proveedores existentes.

La estructura principal quedó organizada en:

- `facturas.routes.ts`
- `facturas.controller.ts`
- `facturas.service.ts`
- `facturas.service.test.ts`

### Operaciones disponibles

Se implementaron:

- `GET /facturas`
- `GET /facturas/:id`
- `POST /facturas`
- `PUT /facturas/:id`

Compras, Servicios y Administración pueden consultar facturas. La creación y edición están disponibles para Compras y Servicios.

### Registro de facturas

Para crear una factura se requieren:

- proveedor;
- número de factura;
- monto total;
- fecha de vencimiento;
- modalidad de compra.

El sistema comprueba que el proveedor exista y, si no se ingresan manualmente, utiliza su NIT y nombre como datos del emisor.

También se registra el usuario que creó la factura.

### Modalidad de compra

Se contemplan cuatro modalidades:

- Baja Cuantía;
- Compra Directa;
- Cotización;
- Licitación.

Las facturas de Baja Cuantía se crean con estado de aprobación `aprobada`. Las demás se registran como `pendiente`, quedando listas para el flujo de aprobación posterior.

### Información financiera

Toda factura nueva inicia con:

- monto abonado: `0`;
- saldo pendiente igual al monto total.

Esto deja preparada la información para el módulo de pagos parciales.

### Consulta y filtros

El listado permite filtrar por:

- estado de pago;
- estado de aprobación;
- estado OCR;
- modalidad de compra;
- proveedor;
- número de factura.

También utiliza paginación y orden por fecha de vencimiento.

Compras consulta facturas asociadas a proveedores de Bienes, Servicios consulta las de proveedores de Servicios y Administración puede consultar ambas.

### Restricciones de edición

No se permite editar una factura cuando:

- ya fue aprobada;
- tiene pagos registrados.

En esos casos el backend devuelve un conflicto `409`.

### Cálculo de vencimiento

El backend calcula los días restantes entre la fecha actual y la fecha de vencimiento.

La clasificación utilizada es:

- Verde: más de 30 días.
- Amarillo: entre 15 y 30 días.
- Rojo: menos de 15 días o factura vencida.

El resultado se devuelve mediante `dias_restantes` y `color`.

### Pruebas

Se incluyeron pruebas para la lógica del semáforo y para la separación de información según el rol.

Quedaron identificados como pendientes algunos escenarios de pruebas automáticas relacionados con Baja Cuantía y restricciones de edición, aunque la lógica ya está implementada.

### Resultado de la tarea 5.2

Al finalizar esta tarea quedó disponible una primera versión funcional del backend de Facturación, conectada a Proveedores, Prisma y MySQL, y preparada para continuar con pagos, aprobaciones, OCR y verificación SAT.

---

## 5.3 Frontend — Proveedores y Facturas

Después de contar con los servicios principales del backend, se desarrollaron las pantallas necesarias para utilizar SIGEFI desde el navegador.

La interfaz fue construida con React, TypeScript y Tailwind CSS.

### Proveedores

El módulo permite:

- consultar el listado;
- buscar proveedores;
- aplicar filtros;
- registrar nuevos proveedores;
- editar información;
- revisar el detalle;
- desactivar y reactivar registros.

El listado muestra NIT, nombre, tipo, contacto, teléfono y estado.

La búsqueda permite utilizar nombre, NIT o contacto. También se puede filtrar por tipo y estado.

La interfaz se adapta al rol autenticado. Compras trabaja con Bienes, Servicios con Servicios y Administración puede consultar ambos.

El formulario valida información básica antes de enviarla al backend y muestra errores asociados a los campos correspondientes.

En modo edición, el tipo de proveedor permanece bloqueado.

También se incorporaron mensajes de confirmación, estados de carga, listados vacíos y cuadros de diálogo antes de cambiar el estado de un proveedor.

### Facturas

El módulo de Facturas permite:

- consultar el listado;
- aplicar filtros;
- registrar nuevas facturas;
- editar facturas permitidas;
- revisar el detalle financiero.

El listado muestra información como:

- número de factura;
- proveedor;
- monto;
- emisión;
- vencimiento;
- aprobación;
- pago;
- OCR;
- modalidad;
- semáforo.

Los montos se muestran en quetzales y las fechas en un formato más fácil de leer.

### Registro de facturas

El formulario permite seleccionar un proveedor existente y registrar:

- número de factura;
- modalidad;
- serie;
- NIT y nombre del emisor;
- monto total;
- categoría de gasto;
- fecha de emisión;
- fecha de vencimiento;
- referencia documental.

Si el NIT y nombre del emisor se dejan vacíos, el backend utiliza la información del proveedor seleccionado.

### Edición y detalle

Durante la edición, proveedor y modalidad se mantienen como datos de solo lectura.

Si la factura ya está aprobada o tiene pagos registrados, la interfaz bloquea la edición y muestra el motivo.

La pantalla de detalle presenta información del documento, proveedor, emisor, receptor, montos, fechas, estados, verificación SAT y referencia documental.

### Resultado de la tarea 5.3

Al finalizar esta tarea, los módulos de Proveedores y Facturas quedaron disponibles desde una interfaz funcional conectada al backend y a la base de datos.

Esto permitió comprobar el flujo completo entre React, Node.js/Express, Prisma y MySQL.

---

## 5.4 Semáforo Visual de Vencimientos

Durante el Sprint 1 se incorporó el Semáforo de Vencimientos para facilitar la identificación de facturas que requieren atención.

### Clasificación

La regla utilizada es:

- **Verde:** más de 30 días restantes.
- **Amarillo:** entre 15 y 30 días.
- **Rojo:** menos de 15 días o factura vencida.

El backend realiza el cálculo y devuelve `dias_restantes` y `color`.

### Integración en el Dashboard

El Dashboard principal presenta tres tarjetas de resumen:

- Rojo — Vencimiento crítico.
- Amarillo — Próximas a vencer.
- Verde — En tiempo.

Cada tarjeta muestra la cantidad de facturas correspondiente a su rango.

También se incluye una sección de **Facturas por vencimiento**, con filtros por:

- Todas;
- Rojo;
- Amarillo;
- Verde.

Cuando no existen facturas, el Dashboard muestra un estado vacío informando que el resumen aparecerá cuando haya registros.

### Integración en Facturación

El semáforo también aparece en:

- listado de facturas;
- detalle de factura.

Además del color, se muestran mensajes como:

- En tiempo;
- Próxima a vencer;
- Crítica;
- Vence en X días;
- Vence hoy;
- Vencida hace X días.

### Pruebas

Se validaron los principales límites:

- 31 días → Verde.
- 30 días → Amarillo.
- 15 días → Amarillo.
- 14 días → Rojo.
- 0 días → Rojo.
- factura vencida → Rojo.

### Resultado de la tarea 5.4

El Semáforo de Vencimientos quedó integrado en el Dashboard y en las pantallas de Facturación, permitiendo transformar las fechas de vencimiento en información visual más fácil de interpretar.

---

## Integración alcanzada durante el Sprint 1

El resultado principal del Sprint 1 fue comenzar a integrar los módulos dentro de un mismo flujo.

Un usuario puede iniciar sesión, acceder a las opciones correspondientes a su rol, consultar o registrar proveedores y utilizar esos mismos registros para crear facturas.

Las facturas se almacenan en MySQL mediante Prisma y el backend calcula su vencimiento para mostrarlo posteriormente en el frontend mediante el semáforo.

El flujo principal quedó organizado de la siguiente forma:

`React + TypeScript`

↓

`Node.js + Express`

↓

`Prisma`

↓

`MySQL`

Con esto se comprobó la comunicación entre las principales capas del sistema y se dejó una base funcional para continuar con los siguientes módulos.

---

## Aspectos pendientes de seguimiento

Durante la revisión del Sprint se identificaron algunos puntos que pueden continuar mejorándose:

- La opción de ordenamiento por antigüedad ya existe en la interfaz, pero en el backend todavía utiliza el mismo criterio que el orden por vencimiento.
- Algunas reglas de Facturación todavía requieren ampliar su cobertura de pruebas automáticas.
- El NIT configurado para el receptor mantiene una anotación pendiente de confirmación antes de utilizar datos definitivos.

Estos puntos no impiden el funcionamiento principal alcanzado durante el Sprint, pero quedan registrados para las siguientes iteraciones.

---

El Sprint 1 permitió pasar de los documentos de análisis y diseño a una primera versión funcional de SIGEFI.

La Gestión de Proveedores quedó conectada a la base de datos y adaptada a los roles del sistema. Facturación permitió comenzar a trabajar con cuentas por pagar asociadas a proveedores reales y el Semáforo de Vencimientos agregó una forma visual de identificar prioridades.

Con estos avances quedó establecida la base para continuar con pagos parciales, aprobación multinivel, flujo de caja, auditoría, notificaciones, reportes, OCR, verificación SAT y los demás módulos previstos para las siguientes fases.
