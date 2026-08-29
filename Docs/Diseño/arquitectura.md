# Descripción de la Arquitectura Técnica — SIGEFI

La arquitectura del sistema SIGEFI está estructurada en un modelo de tres capas (Cliente/Frontend, Servidor/Backend y Base de Datos), integrado con servicios externos de procesamiento, almacenamiento y notificación. Está diseñada para garantizar seguridad, trazabilidad y una clara separación de responsabilidades durante el desarrollo del Módulo de Cuentas por Pagar.

## 1. Capa de Cliente (Frontend PWA)

El usuario interactúa con la aplicación mediante un navegador web o la versión PWA para dispositivos Android. El frontend está construido con React, TypeScript y Tailwind CSS, apoyado por React Router para la navegación. La autenticación se gestiona a través de un estado centralizado JWT (`AuthContext`). Todas las solicitudes hacia el servidor se canalizan mediante un cliente HTTP configurado con Axios, el cual adjunta el token JWT en la cabecera `Authorization: Bearer <JWT>` para validar cada operación.

El cliente incluye además dos componentes transversales derivados de las historias HU-29 y HU-30:

- **Modal de verificación por PIN (OTP):** se muestra antes de confirmar un pago, un marcado de factura como pagada o una decisión de aprobación, y envía el campo `codigo_otp` junto con la petición.
- **Panel de verificación SAT:** permite al rol `administracion` registrar el número de autorización y el monto consultados manualmente en el Verificador Integrado de la SAT, y muestra una alerta visible cuando existe una discrepancia de monto.

Todos los listados consumen el sobre de paginación estándar del contrato de API: `{ data, page, limit, total }`.

## 2. Capa Servidor (Backend Express & Node.js)

El servidor expone una API REST con Express bajo la ruta base `/api/v1`. Antes de procesar cualquier solicitud, las peticiones pasan por una cadena de middlewares de seguridad y trazabilidad:

- **Middleware JWT:** valida la vigencia y firma del token enviado por el usuario.
- **Middleware de Roles (RBAC):** restringe el acceso a endpoints específicos según el rol asignado (`compras`, `servicios` o `administracion`).
- **Middleware de Verificación OTP (HU-29):** exige un `codigo_otp` válido en las tres operaciones sensibles del sistema — registro de pago, marcado de factura como pagada y registro de una decisión de aprobación. El PIN es de 6 dígitos, tiene una vigencia de 10 minutos, es de un solo uso y se invalida tras 3 intentos fallidos.
- **Middleware de Auditoría Automática:** intercepta las operaciones de escritura (`POST`, `PUT`, `PATCH`) para generar registros inmutables en la bitácora, sin que el frontend deba solicitarlo por separado.
- **Manejador Global de Errores:** captura excepciones y retorna respuestas estandarizadas con códigos HTTP de error (`400`, `401`, `403`, `404`, `409`).

La lógica de negocio se divide en los siguientes módulos y endpoints principales:

- **Autenticación y Verificación en Dos Pasos:** inicia sesión (`POST /auth/login`), consulta al usuario activo (`GET /auth/me`) y genera el PIN de verificación asociado a una acción y una entidad específicas (`POST /auth/otp/solicitar`).
- **Gestión de Usuarios:** administra el ciclo de vida de las cuentas (`GET`, `POST`, `PUT /usuarios`, `PATCH /usuarios/:id/estado`). Solo el rol `administracion` puede crear o editar usuarios, y ningún usuario puede modificar su propio rol.
- **Dashboard:** devuelve el resumen financiero filtrado según el rol del usuario (`GET /dashboard/resumen`).
- **Proveedores:** permite el mantenimiento CRUD, el estado activo/inactivo y la consulta de su historial financiero o estado de cuenta (`GET /proveedores/:id/estado-cuenta`).
- **Cuentas por Pagar / Facturas:** registra facturas con sus datos completos de emisor y receptor, gestiona sus estados (`estado_aprobacion`, `estado_pago`, `estado_ocr`), permite el marcado rápido de pago (`PATCH /facturas/:id/marcar-pagada`), la proyección de vencimientos (`GET /facturas/vencimientos`) y el registro de la verificación contra la SAT (`PATCH /facturas/:id/verificar-sat`). La edición de una factura (`PUT /facturas/:id`) se rechaza si ya está aprobada o si tiene al menos un abono registrado (RF-17).
- **Módulo Financiero / Pagos:** administra el historial y el registro de abonos parciales o totales sobre facturas aprobadas (`POST /facturas/:id/pagos`), recalculando automáticamente `monto_abonado`, `saldo_pendiente` y `estado_pago`.
- **Aprobaciones Multinivel:** administra la bandeja de facturas pendientes (`GET /aprobaciones/pendientes`) y el registro de decisiones (`POST /facturas/:id/aprobaciones`), incluyendo el progreso de aprobación y el nombre del aprobador anterior cuando se requieren dos niveles.
- **Notificaciones Automáticas:** expone las alertas generadas sobre vencimientos próximos, facturas vencidas o aprobaciones pendientes (`GET /notificaciones`, `PATCH /notificaciones/:id/leida`).
- **Captura OCR:** procesa imágenes o PDFs de facturas físicas mediante motores externos (`POST /facturas/ocr`), devolviendo los campos extraídos para su revisión humana antes de ser persistidos.
- **Reportes y Auditoría:** genera los tres reportes financieros con exportación en PDF y Excel (`?formato=pdf|excel`) y la consulta de la bitácora de auditoría, que es de solo lectura (`GET /auditoria`).

### 2.1 Capa de Reglas de Negocio

Los módulos de Facturas, Pagos y Aprobaciones comparten una capa de reglas que centraliza las validaciones críticas del dominio, evitando duplicarlas en cada controlador:

- Las facturas de modalidad `baja_cuantia` se crean directamente con `estado_aprobacion = 'aprobada'` y quedan exentas del bloqueo de aprobación previa al pago (HU-27, HU-28). Las modalidades `compra_directa`, `cotizacion` y `licitacion` sí exigen el flujo completo.
- Las facturas menores a Q90,000 requieren 1 aprobación; las de Q90,000 en adelante requieren 2 aprobaciones de dos usuarios distintos con rol `administracion`.
- No se permite registrar un pago sobre una factura que no esté aprobada (HU-21), salvo la excepción de Baja Cuantía.
- No se permite aprobar una factura sin `verificado_sat = true`, ni cuando `discrepancia_sat = true` (HU-30), salvo la excepción de Baja Cuantía.
- El color del semáforo se calcula como `días_restantes = fecha_vencimiento − fecha_actual`: verde si es mayor a 30 días, amarillo entre 15 y 30 días, y rojo si es menor a 15 días (HU-05).

### 2.2 Proceso Programado

Un job programado (node-cron) recorre periódicamente las facturas vigentes y genera de forma automática las notificaciones de vencimiento próximo o factura vencida (RF-41) y las de aprobación pendiente (RF-42), persistiéndolas en la tabla `notificacion` aunque el usuario no esté conectado.

## 3. Servicios Externos Integrados

- **Motor OCR (Tesseract.js / Google Vision API):** extrae los datos clave de los documentos adjuntos sin guardarlos automáticamente en la base de datos; la persistencia siempre requiere confirmación humana explícita (HU-26).
- **Almacenamiento en la Nube:** guarda los archivos físicos (PDF o imagen) y proporciona la URL que se enlaza al registro de la factura (`adjunto_url`).
- **Servicio de Correo Saliente (Nodemailer / SMTP institucional):** envía al correo del usuario el PIN de 6 dígitos requerido por la verificación en dos pasos (RF-65).
- **Generador de Reportes (PDFKit / ExcelJS):** produce los archivos descargables de los reportes consolidado, de vencimientos e historial de pagos (RF-35).

### 3.1 Verificación contra la SAT

La comprobación contra el Verificador Integrado de la SAT es **manual**: el sistema no consulta el portal de la SAT de forma automática. El usuario con rol `administracion` realiza la consulta por fuera del sistema y transcribe el número de autorización y el monto observado mediante `PATCH /facturas/:id/verificar-sat`. Si el monto reportado no coincide con `monto_total`, la factura queda marcada con `discrepancia_sat = true` y no puede aprobarse hasta que se resuelva. Tanto la verificación exitosa como el intento con discrepancia quedan registrados en la bitácora de auditoría (RF-70).

## 4. Capa de Datos (MySQL + Prisma ORM)

La comunicación con la base de datos MySQL se realiza mediante el ORM Prisma, garantizando consultas tipadas y el uso de transacciones en las operaciones que modifican varios registros a la vez (por ejemplo, insertar un pago y recalcular el saldo de la factura). El modelo de datos consta de 8 tablas relacionales:

1. **`usuario`:** contiene los datos de acceso y el campo `rol` mediante un tipo `ENUM('compras','servicios','administracion')`.
2. **`proveedor`:** guarda la información general y la clasificación obligatoria por tipo (`bien` o `servicio`).
3. **`factura`:** entidad central que vincula proveedor y registrador, y almacena los datos fiscales (`nit_emisor`, `nombre_emisor`, `nit_receptor`, `nombre_receptor`, `serie`), los montos (`monto_total`, `monto_abonado`, `saldo_pendiente`), los estados (`estado_aprobacion`, `estado_pago`, `estado_ocr`), la `modalidad_compra` y los campos de verificación fiscal (`numero_autorizacion_sat`, `verificado_sat`, `discrepancia_sat`, `verificado_por`, `fecha_verificacion_sat`).
4. **`pago`:** almacena el historial de abonos vinculados a cada factura.
5. **`aprobacion`:** registra las decisiones y niveles de aprobación, con una restricción única sobre `(factura_id, nivel)` que impide duplicar una decisión en el mismo nivel.
6. **`notificacion`:** almacena los mensajes automáticos y su estado de lectura por usuario.
7. **`auditoria_log`:** tabla de solo escritura, sin permisos de `UPDATE` ni `DELETE` para ningún rol de aplicación, que registra cada acción del sistema con usuario, fecha, campo modificado y valores anterior y nuevo.
8. **`otp_verificacion`:** conserva el hash del PIN emitido, la acción y entidad a la que aplica, su fecha de expiración, si ya fue usado y el número de intentos fallidos. El código nunca se almacena en texto plano.