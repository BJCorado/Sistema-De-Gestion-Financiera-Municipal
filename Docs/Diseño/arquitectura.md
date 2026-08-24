# Descripción de la Arquitectura Técnica — SIGEFI

La arquitectura del sistema SIGEFI está estructurada en un modelo de tres capas (Cliente/Frontend, Servidor/Backend y Base de Datos), integrado con servicios externos de procesamiento y almacenamiento. Está diseñada para garantizar seguridad, escalabilidad y una clara separación de responsabilidades durante el desarrollo del Módulo de Cuentas por Pagar.

## 1. Capa de Cliente (Frontend PWA)
El usuario interactúa con la aplicación mediante un navegador web o la versión PWA para dispositivos Android[cite: 8]. El frontend está construido con React, TypeScript y Tailwind CSS, apoyado por React Router para la navegación. La autenticación se gestiona a través de un estado centralizado JWT (`AuthContext`). Todas las solicitudes hacia el servidor se canalizan mediante un cliente HTTP configurado con Axios, el cual adjunta el token JWT en la cabecera `Authorization: Bearer <JWT>` para validar cada operación[cite: 6].

## 2. Capa Servidor (Backend Express & Node.js)
El servidor expone una API REST con Express y TypeScript[cite: 6]. Antes de procesar cualquier solicitud, las peticiones pasan por una cadena de middlewares de seguridad y trazabilidad:

* **Middleware JWT:** Valida la vigencia y firma del token enviado por el usuario[cite: 6].
* **Middleware de Roles (RBAC):** Restringe el acceso a endpoints específicos según el rol asignado (`compras`, `servicios` o `administracion`)[cite: 5, 6, 7].
* **Middleware de Auditoría Automática:** Intercepta las operaciones de escritura (`POST`, `PUT`, `PATCH`) para generar registros inmutables en la bitácora[cite: 5, 6, 7].
* **Manejador Global de Errores:** Captura excepciones y retorna respuestas estandarizadas con códigos HTTP de error (`400`, `401`, `403`, `404`, `409`)[cite: 6].

La lógica de negocio se divide en los siguientes módulos y endpoints principales:

* **Autenticación y Usuarios:** Inicia sesión (`POST /auth/login`), consulta al usuario activo (`GET /auth/me`) y gestiona el ciclo de vida de usuarios[cite: 6].
* **Dashboard:** Devuelve el resumen financiero filtrado según el rol del usuario (`GET /dashboard/resumen`)[cite: 6].
* **Proveedores:** Permite el mantenimiento CRUD, estado activo/inactivo y la consulta de su historial financiero/estado de cuenta (`GET /proveedores/:id/estado-cuenta`)[cite: 6].
* **Cuentas por Pagar / Facturas:** Registra facturas, gestiona sus estados (`pendiente`, `aprobada`, `rechazada`, `pagada`) y permite el marcado rápido de pago[cite: 5, 6, 7]. Las facturas clasificadas como `baja_cuantia` quedan exentas de aprobación previa y se aprueban automáticamente al registrarse[cite: 5, 6, 7, 8].
* **Módulo Financiero / Pagos:** Administra el historial y registro de abonos parciales o totales para facturas aprobadas (`POST /facturas/:id/pagos`)[cite: 6, 7, 8].
* **Aprobaciones Multinivel:** Administra la bandeja de facturas pendientes (`GET /aprobaciones/pendientes`)[cite: 6, 8]. Las facturas menores a Q90,000 requieren 1 aprobación; si el monto es mayor o igual a Q90,000, exige la aprobación de 2 usuarios distintos con rol `administracion`[cite: 6, 7, 8].
* **Notificaciones Automáticas:** Genera alertas sobre vencimientos próximos, facturas vencidas o aprobaciones pendientes (`GET /notificaciones`)[cite: 6, 7, 8].
* **Captura OCR:** Procesa imágenes o PDFs de facturas físicas mediante motores externos (`POST /facturas/ocr`), devolviendo los campos extraídos para su revisión humana antes de ser persistidos[cite: 6, 7, 8].
* **Reportes y Auditoría:** Genera consultas consolidadas, proyecciones de flujo de caja, reportes en PDF/Excel y la consulta de la bitácora de auditoría de solo lectura (`GET /auditoria`)[cite: 5, 6, 7, 8].

## 3. Servicios Externos Integrados
* **Motor OCR (Tesseract.js / Google Vision API):** Extrae datos clave de documentos adjuntos sin guardarlos automáticamente en la base de datos[cite: 6, 7, 8].
* **Almacenamiento en la Nube:** Guarda los archivos físicos (PDF o imagen) y proporciona la URL que se enlaza al registro de la factura (`adjunto_url`)[cite: 5, 6, 7].

## 4. Capa de Datos (MySQL + Prisma ORM)
La comunicación con la base de datos MySQL se realiza mediante el ORM Prisma, garantizando consultas tipadas[cite: 5]. El modelo de datos consta de 7 tablas relacionales principales[cite: 5]:

1. **`usuario`:** Contiene los datos de acceso y el campo `rol` mediante un tipo `ENUM('compras','servicios','administracion')`[cite: 5, 7].
2. **`proveedor`:** Guarda la información general y clasificación obligatoria por tipo (`bien` o `servicio`)[cite: 5, 7].
3. **`factura`:** Entidad central que vincula proveedor, registrador, montos, estados (`aprobacion`, `pago`, `ocr`) y modalidad de compra[cite: 5, 7].
4. **`pago`:** Almacena el historial de abonos vinculados a cada factura[cite: 5, 7].
5. **`aprobacion`:** Registra las decisiones y niveles de aprobación de los administradores[cite: 5, 7].
6. **`notificacion`:** Almacena los mensajes automáticos y su estado de lectura por usuario[cite: 5, 7].
7. **`auditoria_log`:** Tabla de solo escritura (sin permisos de edición o eliminación) que registra cada acción del sistema[cite: 5, 7].