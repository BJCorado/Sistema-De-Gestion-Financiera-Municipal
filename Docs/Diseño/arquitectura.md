# Descripción de la Arquitectura Técnica — SIGEFI

La arquitectura del sistema SIGEFI está estructurada en un modelo de tres capas (Cliente/Frontend, Servidor/Backend y Base de Datos), diseñado para garantizar seguridad, escalabilidad y una clara separación de responsabilidades durante el desarrollo del Módulo de Cuentas por Pagar.

## 1. Capa de Cliente (Frontend PWA)
El usuario interactúa con la aplicación mediante un navegador web o la versión PWA para dispositivos Android. El frontend está construido con React, TypeScript y Tailwind CSS, apoyado por React Router para la navegación. La autenticación se gestiona a través de un estado centralizado JWT. Todas las solicitudes hacia el servidor se canalizan mediante un cliente HTTP configurado con Axios, el cual adjunta el token JWT en la cabecera "Authorization: Bearer" para validar cada operación.

## 2. Capa Servidor (Backend Express & Node.js)
El servidor expone una API REST con Express y TypeScript. Antes de procesar cualquier solicitud, las peticiones pasan por una cadena de middlewares de seguridad y trazabilidad:

* **Middleware JWT:** Valida la vigencia y firma del token del usuario.
* **Middleware de Roles:** Restringe el acceso a endpoints según el rol asignado (compras, servicios o administración).
* **Manejo de Errores y Bitácora de Auditoría:** Captura excepciones y registra de forma inmutable cada transacción crítica antes de pasar a la lógica de negocio.

La lógica está organizada en los siguientes módulos principales y sus endpoints:

* **Autenticación:** Inicia y cierra sesión, y valida el estado del usuario activo.
* **Proveedores:** Permite el mantenimiento CRUD de proveedores, clasificándolos obligatoriamente en bienes o servicios.
* **Facturas:** Gestiona el registro, consulta y actualización del estado de los documentos de cobro.
* **Pagos y Caja:** Administra los abonos parciales/totales, consulta el flujo de caja y calcula el semáforo de vencimiento según los días restantes.
* **Aprobaciones Multinivel:** Gestiona las solicitudes de aprobación. Si el monto es menor a Q90,000 requiere 1 aprobación; si es igual o mayor a Q90,000 exige la firma de 2 administradores distintos, conforme a la normativa vigente.
* **Notificaciones:** Genera alertas automáticas sobre eventos pendientes y permite marcarlas como leídas.
* **Procesamiento OCR:** Se integra con servicios externos (Tesseract.js / Google Vision API) para extraer datos de facturas físicas. Los datos pasan a un estado de revisión y solo se persisten tras la confirmación manual del usuario.
* **Reportes y Auditoría:** Genera consultas consolidadas del flujo de caja y permite consultar la bitácora de auditoría (la cual es de solo lectura).

## 3. Capa de Datos (MySQL + Prisma ORM)
La comunicación con la base de datos MySQL se realiza exclusivamente a través del ORM Prisma, lo que garantiza consultas tipadas y seguras contra inyecciones SQL. La base de datos almacena las entidades del sistema en tablas independientes para usuarios, roles, proveedores, facturas, pagos, aprobaciones, notificaciones y la bitácora de auditoría.