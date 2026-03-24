# Documentación Técnica Consolidada

# AtaxChile Backend — Sistema Web de Registro de Pacientes

### Agrupación de Pacientes con Ataxia – Chile

---

# Parte I: Políticas de Negocio

---

## 1. Objetivo

Definir las políticas de negocio y lineamientos técnicos del backend para la gestión de miembros de la agrupación y el registro del tipo de ataxia, permitiendo generar estadísticas poblacionales en Chile, asegurando:

- Protección de datos personales y datos sensibles de salud.
- Integridad, trazabilidad y consistencia de la información.
- Uso responsable de datos con fines estadísticos.
- Cumplimiento de normativa vigente.
- Seguridad y control de acceso adecuado.

---

## 2. Alcance del Sistema

El sistema permite:

- Registro de miembros.
- Registro y clasificación del tipo de ataxia.
- Gestión de datos demográficos básicos.
- Generación de estadísticas agregadas.
- Gestión de usuarios internos.
- Gestión opcional de membresías o cuotas.
- Auditoría de acciones relevantes.

El sistema contempla adicionalmente:

- Diagnóstico clínico estructurado por miembro (tipo de ataxia confirmado, institución, médico tratante).
- Historial de evaluaciones funcionales periódicas (nivel de movilidad, puntuación SARA, síntomas).

El sistema NO contempla:

- Ficha médica completa.
- Registro de tratamientos o prescripciones médicas.
- Registro de médicos como entidad independiente.
- Telemedicina o comunicación médico-paciente.

---

## 3. Definiciones

- **Usuario Administrativo**: Persona con credenciales de acceso al sistema de gestión (staff interno o directivos de la agrupación). No necesariamente es miembro. Se gestiona en el módulo `users`.
- **Miembro**: Persona registrada como socio de la agrupación. No tiene acceso directo al sistema salvo que se le vincule explícitamente a un usuario administrativo. Se gestiona en el módulo `members`.
- **Tipo de Ataxia**: Clasificación diagnóstica declarada o confirmada.
- **Dato Sensible**: Información relacionada con salud.
- **Eliminación lógica**: Marcado como inactivo sin borrado físico.
- **Auditoría**: Registro inmutable de eventos del sistema.

---

## 4. Gestión de Miembros

### 4.1 Creación de Miembro

Cada miembro debe:

- Tener identificador único (UUID).
- No estar duplicado según documento de identidad.
- Declarar si es **paciente** (tiene ataxia) o **representante** (familiar, tutor o cuidador de una persona con ataxia). El campo `esRepresentante` determina qué campos son obligatorios.

**Campos obligatorios para paciente** (`esRepresentante: false`):

- Nombre completo y apellido.
- RUT (formato `"12345678-9"`).
- Fecha de nacimiento.
- Región / comuna.
- Tipo de ataxia (`tipoAtaxiaId`).
- Estado diagnóstico.
- Consentimiento registrado.

**Campos obligatorios para representante** (`esRepresentante: true`):

- Nombre completo y apellido.
- RUT (formato `"12345678-9"`).
- Fecha de nacimiento.
- Región / comuna.
- Tipo de representación (`tipoRepresentacion`).
- Consentimiento registrado.
- Al menos uno de:
  - `representadoId` — UUID de la persona representada si ya está registrada en el sistema.
  - `representadoNombre` + `representadoRut` — si la persona representada aún no está registrada.

Validaciones obligatorias en backend:

- RUT con formato y dígito verificador válidos (algoritmo de validación chileno).
- Normalización de texto (trim, mayúsculas consistentes).
- Prevención de duplicados por RUT.
- Si `esRepresentante: true`: `tipoAtaxiaId` y `estadoDiagnostico` deben ser `null`.
- Si `esRepresentante: true` y se informa `representadoId`: verificar que ese UUID exista en `members`.

### 4.2 Actualización de Datos

- Solo usuarios autorizados pueden modificar información.
- Toda modificación genera registro de auditoría.
- Se registra:
  - Usuario.
  - Fecha y hora.
  - Campo modificado.
  - Valor anterior.
  - Valor nuevo.

### 4.3 Eliminación

- No se permite eliminación física.
- Se aplica eliminación lógica (`is_active = false`).
- Se registra motivo, usuario y fecha.
- La información histórica permanece disponible para auditoría.

### 4.4 Representación

Un miembro representante es una persona que **no tiene ataxia** pero pertenece a la agrupación en calidad de familiar, tutor legal o cuidador de una persona con ataxia.

Reglas:

- Un representante puede referir a una persona ya registrada en el sistema (`representadoId`) o a alguien externo (`representadoNombre` + `representadoRut`).
- Una persona con ataxia puede tener más de un representante registrado.
- `tipoAtaxiaId` y `estadoDiagnostico` son exclusivos de miembros pacientes; en representantes estos campos deben ser `null`.
- El cambio del campo `esRepresentante` después del registro queda registrado en auditoría.
- Los representantes **no se incluyen** en estadísticas de tipos de ataxia ni distribución por diagnóstico.

---

## 5. Registro del Tipo de Ataxia

### 5.1 Reglas Generales

- Campo obligatorio.
- Puede incluir:
  - Tipo principal.
  - Subtipo.
  - Estado diagnóstico (confirmado, presuntivo, en estudio).

### 5.2 Catálogo Controlado

- Selección desde catálogo predefinido.
- No se permite texto libre.
- Solo Administrador puede modificar el catálogo.
- No se pueden eliminar tipos ya asociados a miembros.
- Cambios al catálogo deben quedar auditados.

### 5.3 Modificaciones

- Cambios al tipo de ataxia deben registrarse en auditoría.
- No se elimina historial de cambios.

---

## 6. Datos Demográficos para Estadística

El sistema puede almacenar:

- Región.
- Comuna.
- Fecha de nacimiento.
- Sexo.
- Año de diagnóstico.

Reglas:

- Los reportes deben utilizar datos agregados.
- No permitir combinaciones que permitan reidentificación en poblaciones pequeñas.
- Aplicar umbral mínimo configurable (no mostrar resultados menores a 5 personas).

---

## 7. Generación de Estadísticas

### 7.1 Principios

- Solo datos agregados.
- No exponer datos individuales.
- Control de acceso por rol.
- Registro de generación de reportes en auditoría.
- Los reportes de distribución por tipo de ataxia, grupo diagnóstico y estado diagnóstico excluyen a los miembros con `esRepresentante: true`.
- Se pueden generar estadísticas separadas sobre cantidad de representantes por región.

### 7.2 Reportes Permitidos

- Cantidad por tipo de ataxia.
- Distribución por región.
- Distribución por rango etario.
- Evolución anual de registros.
- Distribución por nivel de movilidad (última evaluación funcional por miembro).
- Estado de cuotas por miembro: pagadas vs. impagas por año (cuando módulo cuotas esté activo).

---

## 8. Control de Acceso (RBAC)

### 8.1 Roles

Los roles aplican exclusivamente a **usuarios administrativos** (`users`). Los miembros no poseen rol en el sistema.

| Rol          | Descripción                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPERADMIN` | Bypass global — acceso implícito a todos los endpoints vía `RolesGuard`. Gestión completa del sistema incluida administración de otros usuarios. |
| `ADMIN`      | Administración general: miembros, catálogos, reportes y lectura completa.                                                                        |
| `SECRETARIO` | Gestión de miembros: crear, actualizar y registrar evaluaciones.                                                                                 |
| `TESORERO`   | Lectura de miembros y cuotas. Sin escritura en datos clínicos.                                                                                   |
| `USUARIO`    | Rol por defecto al registrarse. Sin acceso a funciones administrativas.                                                                          |

> SUPERADMIN no se repite en la matriz — su bypass opera a nivel de guard.

---

### 8.2 Matriz de Acceso por Endpoint

#### Autenticación

| Endpoint                   | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas           |
| -------------------------- | :-----: | :--------: | :------: | :---: | --------------- |
| POST /auth/login           |    ✓    |     ✓      |    ✓     |   ✓   | Público         |
| POST /auth/refresh         |    ✓    |     ✓      |    ✓     |   ✓   | Público         |
| POST /auth/logout          |    ✓    |     ✓      |    ✓     |   ✓   | Solo JWT válido |
| POST /auth/forgot-password |    ✓    |     ✓      |    ✓     |   ✓   | Público         |
| POST /auth/reset-password  |    ✓    |     ✓      |    ✓     |   ✓   | Público         |
| POST /auth/change-password |    ✓    |     ✓      |    ✓     |   ✓   | Solo JWT válido |

#### Usuarios

| Endpoint                          | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas           |
| --------------------------------- | :-----: | :--------: | :------: | :---: | --------------- |
| POST /users/register              |    ✓    |     ✓      |    ✓     |   ✓   | Público         |
| GET /users/confirmar-email/:token |    ✓    |     ✓      |    ✓     |   ✓   | Público         |
| GET /users                        |    —    |     —      |    —     |   ✓   |                 |
| GET /users/:id                    | propio  |     —      |    —     |   ✓   | SelfGuard       |
| PUT /users/:id                    | propio  |     —      |    —     |   ✓   | SelfGuard       |
| PATCH /users/:id/rol              |    —    |     —      |    —     |   —   | Solo SUPERADMIN |
| PATCH /users/:id/status           |    —    |     —      |    —     |   —   | Solo SUPERADMIN |
| DELETE /users/:id                 |    —    |     —      |    —     |   —   | Solo SUPERADMIN |

#### Miembros

| Endpoint                             | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas                              |
| ------------------------------------ | :-----: | :--------: | :------: | :---: | ---------------------------------- |
| GET /miembros                        |    —    |     ✓      |    ✓     |   ✓   |                                    |
| GET /miembros/:id                    |    —    |     ✓      |    —     |   ✓   | TESORERO solo ve lista, no detalle |
| POST /miembros                       |    —    |     ✓      |    —     |   ✓   |                                    |
| PATCH /miembros/:id                  |    —    |     ✓      |    —     |   ✓   |                                    |
| PATCH /miembros/:id/estado           |    —    |     —      |    —     |   ✓   |                                    |
| PATCH /miembros/:id/vincular-usuario |    —    |     —      |    —     |   ✓   |                                    |

#### Diagnóstico Clínico

| Endpoint                        | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas                           |
| ------------------------------- | :-----: | :--------: | :------: | :---: | ------------------------------- |
| POST /miembros/:id/diagnostico  |    —    |     ✓      |    —     |   ✓   | 1:1, falla con 409 si ya existe |
| GET /miembros/:id/diagnostico   |    —    |     ✓      |    ✓     |   ✓   |                                 |
| PATCH /miembros/:id/diagnostico |    —    |     ✓      |    —     |   ✓   |                                 |

#### Evaluación Funcional

| Endpoint                              | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas       |
| ------------------------------------- | :-----: | :--------: | :------: | :---: | ----------- |
| POST /miembros/:id/evaluaciones       |    —    |     ✓      |    —     |   ✓   | Append-only |
| GET /miembros/:id/evaluaciones        |    —    |     ✓      |    ✓     |   ✓   |             |
| GET /miembros/:id/evaluaciones/ultima |    —    |     ✓      |    ✓     |   ✓   |             |

#### Catálogo de Ataxia

| Endpoint                       | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas       |
| ------------------------------ | :-----: | :--------: | :------: | :---: | ----------- |
| GET /ataxia-types              |    ✓    |     ✓      |    ✓     |   ✓   | Público     |
| GET /ataxia-types/:id          |    ✓    |     ✓      |    ✓     |   ✓   | Público     |
| POST /ataxia-types             |    —    |     —      |    —     |   ✓   |             |
| PATCH /ataxia-types/:id        |    —    |     —      |    —     |   ✓   |             |
| PATCH /ataxia-types/:id/status |    —    |     —      |    —     |   ✓   | Soft-delete |

#### Geografía

| Endpoint                      | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas   |
| ----------------------------- | :-----: | :--------: | :------: | :---: | ------- |
| GET /geo/regiones             |    ✓    |     ✓      |    ✓     |   ✓   | Público |
| GET /geo/regiones/:id         |    ✓    |     ✓      |    ✓     |   ✓   | Público |
| GET /geo/regiones/:id/comunas |    ✓    |     ✓      |    ✓     |   ✓   | Público |
| GET /geo/comunas/:id          |    ✓    |     ✓      |    ✓     |   ✓   | Público |
| POST/PATCH /geo/\*            |    —    |     —      |    —     |   ✓   |         |

#### Estadísticas

| Endpoint                | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas                   |
| ----------------------- | :-----: | :--------: | :------: | :---: | ----------------------- |
| GET /stats/resumen      |    —    |     ✓      |    ✓     |   ✓   |                         |
| GET /stats/miembros     |    —    |     ✓      |    —     |   ✓   |                         |
| GET /stats/diagnosticos |    —    |     ✓      |    —     |   ✓   | Excluye representantes  |
| GET /stats/funcional    |    —    |     ✓      |    —     |   ✓   | Excluye representantes  |
| GET /stats/geografico   |    —    |     ✓      |    —     |   ✓   |                         |
| GET /stats/cuotas       |    —    |     —      |    ✓     |   ✓   | Pendiente módulo cuotas |

---

#### Exportaciones

| Endpoint                               | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas                             |
| -------------------------------------- | :-----: | :--------: | :------: | :---: | --------------------------------- |
| GET /exports/miembros                  |    —    |     ✓      |    ✓     |   ✓   | CSV/XLSX con columnas según rol   |
| GET /exports/miembros/:id/evaluaciones |    —    |     ✓      |    —     |   ✓   | PDF con historial de evaluaciones |

---

#### Finanzas

| Endpoint                                     | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas                          |
| -------------------------------------------- | :-----: | :--------: | :------: | :---: | ------------------------------ |
| POST /finanzas/tarifas-anuales               |    —    |     —      |    ✓     |   ✓   |                                |
| GET  /finanzas/tarifas-anuales               |    —    |     —      |    ✓     |   ✓   |                                |
| GET  /finanzas/cuotas                        |    —    |     —      |    ✓     |   ✓   | Reporte de morosos             |
| GET  /miembros/:id/cuotas                    |    —    |     —      |    ✓     |   ✓   |                                |
| POST /miembros/:id/cuotas/:cuotaId/pagos     |    —    |     —      |    ✓     |   ✓   | Registrar abono                |
| GET  /miembros/:id/cuotas/:cuotaId/pagos     |    —    |     —      |    ✓     |   ✓   | Historial de abonos            |
| POST /finanzas/aportes                       |    —    |     —      |    ✓     |   ✓   |                                |
| GET  /finanzas/aportes                       |    —    |     —      |    ✓     |   ✓   |                                |
| GET  /miembros/:id/aportes                   |    —    |     —      |    ✓     |   ✓   |                                |
| POST /finanzas/donaciones                    |    —    |     —      |    ✓     |   ✓   | Pendiente diseño de Donante    |
| GET  /finanzas/donaciones                    |    —    |     —      |    ✓     |   ✓   | Pendiente diseño de Donante    |

---

#### Auditoría

| Endpoint            | USUARIO | SECRETARIO | TESORERO | ADMIN | Notas           |
| ------------------- | :-----: | :--------: | :------: | :---: | --------------- |
| GET /audit-logs     |    —    |     —      |    —     |   —   | Solo SUPERADMIN |
| GET /audit-logs/:id |    —    |     —      |    —     |   —   | Solo SUPERADMIN |

### 8.3 Reglas

- Autenticación obligatoria salvo endpoints marcados como Público.
- SUPERADMIN tiene bypass global en `RolesGuard` — no requiere `@Roles`.
- `SelfGuard` permite a cualquier usuario autenticado operar sobre su propio recurso.
- Exportaciones restringidas a roles con acceso explícito.
- Acceso a datos sensibles (diagnóstico, evaluación) limitado a SECRETARIO y ADMIN.

---

## 9. Protección de Datos y Consentimiento

El tipo de ataxia es considerado dato de salud. El backend debe:

- Cifrar datos sensibles en base de datos.
- Forzar HTTPS.
- Utilizar hash seguro de contraseñas (bcrypt, mínimo 10 rounds).
- Implementar bloqueo tras múltiples intentos fallidos.
- Registrar exportaciones.
- Evitar exposición de datos sensibles en logs.

Respecto al consentimiento, debe registrarse:

- Consentimiento para almacenamiento.
- Consentimiento para uso estadístico.
- Fecha de aceptación.
- Versión del texto aceptado.

Reglas:

- Sin consentimiento válido no se incluye en estadísticas públicas.
- El consentimiento debe ser versionado.
- Debe poder registrarse revocación.

---

## 10. Auditoría

### 10.1 Entidad `AuditLog`

| Campo       | Tipo              | Descripción                                             |
| ----------- | ----------------- | ------------------------------------------------------- |
| `id`        | uuid              | PK                                                      |
| `usuarioId` | FK → User \| null | Quién ejecutó la acción (null si no hay sesión)         |
| `accion`    | enum              | Tipo de evento (ver §10.2)                              |
| `entidad`   | varchar           | Nombre de la tabla afectada (`miembros`, `users`, etc.) |
| `entidadId` | varchar \| null   | ID del registro afectado                                |
| `detalle`   | json \| null      | Datos adicionales del evento (campos cambiados, etc.)   |
| `ip`        | varchar \| null   | IP del cliente                                          |
| `createdAt` | timestamp         | Fecha del evento                                        |

> Sin `updatedAt`. Registro inmutable — sin UPDATE ni DELETE.

### 10.2 Eventos auditables

| Acción (`accion`)        | Cuándo se registra              |
| ------------------------ | ------------------------------- |
| `LOGIN`                  | Login exitoso                   |
| `LOGOUT`                 | Cierre de sesión                |
| `LOGIN_FALLIDO`          | Intento fallido de login        |
| `CREAR_MIEMBRO`          | POST /miembros                  |
| `MODIFICAR_MIEMBRO`      | PATCH /miembros/:id             |
| `CAMBIAR_ESTADO_MIEMBRO` | PATCH /miembros/:id/estado      |
| `CREAR_DIAGNOSTICO`      | POST /miembros/:id/diagnostico  |
| `MODIFICAR_DIAGNOSTICO`  | PATCH /miembros/:id/diagnostico |
| `CREAR_EVALUACION`       | POST /miembros/:id/evaluaciones |
| `MODIFICAR_CATALOGO`     | POST/PATCH /ataxia-types        |
| `GENERAR_REPORTE`        | GET /stats/\*                   |
| `EXPORTAR_DATOS`         | GET /exports/\*                 |
| `CAMBIAR_ROL`            | PATCH /users/:id/rol            |

### 10.3 Reglas

- Registro inmutable — sin UPDATE ni DELETE en la tabla.
- `AuditService` es de uso exclusivamente interno — ningún controller externo llama a `create` directamente.
- Fallo en auditoría no debe interrumpir la operación principal (fire-and-forget).
- Acceso de lectura restringido a SUPERADMIN.
- Retención mínima configurable por la organización.

---

## 11. Backups

- Backups automáticos diarios.
- Cifrados.
- Pruebas periódicas de restauración.
- Política de retención definida por la agrupación.

---

## 12. Gobernanza de Datos

- Designar responsable de protección de datos.
- Revisión periódica de permisos.
- Procedimiento documentado ante brechas.
- Política interna de uso de información.
- Revisión anual de seguridad.

---

# Parte II: Definición de API REST

---

## 13. Base URL y Versionado

```
/api/v1
```

Toda API debe estar versionada.

---

## 14. Endpoints de Autenticación

| Método | Ruta                    | Acceso      | Descripción                                                               |
| ------ | ----------------------- | ----------- | ------------------------------------------------------------------------- |
| `POST` | `/auth/login`           | Público     | Inicia sesión, retorna `access_token` (15 min) y `refresh_token` (7 días) |
| `POST` | `/auth/refresh`         | Público     | Renueva el `access_token` usando el `refresh_token`                       |
| `POST` | `/auth/logout`          | Autenticado | Invalida el `refresh_token` en BD                                         |
| `POST` | `/auth/forgot-password` | Público     | Solicita recuperación de contraseña por email                             |
| `POST` | `/auth/reset-password`  | Público     | Restablece contraseña con token recibido por email                        |
| `POST` | `/auth/change-password` | Autenticado | Cambia contraseña conociendo la actual                                    |

---

## 15. Endpoints de Usuarios Administrativos

| Método   | Ruta                    | Acceso               | Descripción                                                                     |
| -------- | ----------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `GET`    | `/users`                | superadmin, admin    | Lista todos los usuarios                                                        |
| `GET`    | `/users/:id`            | Autenticado (propio) | Retorna perfil: `nombre`, `email`, `rol`                                        |
| `POST`   | `/users/register`       | Público              | Registra nuevo usuario con rol `usuario` por defecto, envía email de activación |
| `GET`    | `/users/activar/:token` | Público              | Activa cuenta desde enlace del correo                                           |
| `PUT`    | `/users/:id`            | Autenticado (propio) | Modifica `nombre` o `email` — no modifica `rol`                                 |
| `PATCH`  | `/users/:id/rol`        | superadmin           | Cambia el rol del usuario                                                       |
| `PATCH`  | `/users/:id/status`     | superadmin           | Activa o desactiva la cuenta                                                    |
| `DELETE` | `/users/:id`            | superadmin           | Eliminación lógica                                                              |

---

## 15.5 Endpoints de Geografía (Regiones y Comunas)

Datos de referencia estáticos para Chile. Lectura disponible para cualquier usuario autenticado; escritura solo para `superadmin`.

No se implementa `DELETE` — la eliminación de una región o comuna rompería los registros de miembros existentes. Si se requiere dar de baja una entrada, se aplica `PATCH /:id/status` (mismo patrón que `users`).

### Regiones

| Método | Ruta                | Acceso      | Descripción                      |
| ------ | ------------------- | ----------- | -------------------------------- |
| `GET`  | `/geo/regiones`     | Autenticado | Lista todas las regiones         |
| `GET`  | `/geo/regiones/:id` | Autenticado | Obtiene una región por id        |
| `POST` | `/geo/regiones`     | superadmin  | Crea una nueva región            |
| `PUT`  | `/geo/regiones/:id` | superadmin  | Modifica el nombre de una región |

### Comunas

| Método | Ruta                        | Acceso      | Descripción                            |
| ------ | --------------------------- | ----------- | -------------------------------------- |
| `GET`  | `/geo/regiones/:id/comunas` | Autenticado | Lista comunas de una región            |
| `GET`  | `/geo/comunas/:id`          | Autenticado | Obtiene una comuna por id              |
| `POST` | `/geo/comunas`              | superadmin  | Crea una nueva comuna                  |
| `PUT`  | `/geo/comunas/:id`          | superadmin  | Modifica nombre o región de una comuna |

### Flujo típico del frontend al crear un miembro

```
1. GET /geo/regiones               → carga desplegable de regiones
2. GET /geo/regiones/:id/comunas   → carga comunas según región seleccionada
3. POST /miembros  { comunaId }    → guarda el miembro con FK a comuna
```

---

## 16. Endpoints de Miembros

| Método  | Ruta                             | Roles                             | Descripción                                                                                                                     |
| ------- | -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/miembros`                      | `admin`, `secretario`, `tesorero` | Lista socios; acepta filtro `?estado=`                                                                                          |
| `GET`   | `/miembros/:id`                  | `admin`, `secretario`             | Detalle de un socio con relaciones (región, comuna, tipo de ataxia)                                                             |
| `POST`  | `/miembros`                      | `admin`, `secretario`             | Registra nuevo socio. El RUT se normaliza y valida automáticamente.                                                             |
| `PATCH` | `/miembros/:id`                  | `admin`, `secretario`             | Actualiza datos del socio. El RUT no se puede modificar.                                                                        |
| `PATCH` | `/miembros/:id/estado`           | `admin`                           | Cambia `estado` del socio (`activo` → `renunciado` / `suspendido` / `fallecido`). Registra `fechaCambioEstado` automáticamente. |
| `PATCH` | `/miembros/:id/vincular-usuario` | `admin`                           | Vincula una cuenta de sistema (`userId`) al socio. Un `userId` solo puede estar vinculado a un socio a la vez.                  |

Filtro disponible en `GET /miembros`:

```
GET /miembros?estado=activo|renunciado|suspendido|fallecido
```

---

## 16.5 Endpoints de Diagnóstico Clínico

Cada miembro puede tener **un único** diagnóstico clínico estructurado. Rutas anidadas bajo `/miembros/:miembroId/diagnostico`.

| Método  | Ruta                               | Roles                 | Descripción                                                                   |
| ------- | ---------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `POST`  | `/miembros/:miembroId/diagnostico` | `admin`, `secretario` | Crea el diagnóstico del miembro. Falla con 409 si ya existe uno.              |
| `GET`   | `/miembros/:miembroId/diagnostico` | `admin`, `secretario` | Retorna el diagnóstico con relación `tipoAtaxia`. Falla con 404 si no existe. |
| `PATCH` | `/miembros/:miembroId/diagnostico` | `admin`, `secretario` | Actualiza campos del diagnóstico existente.                                   |

**Enum `ConfirmacionDiagnostico`:**

| Valor      | Descripción                                     |
| ---------- | ----------------------------------------------- |
| `genetico` | Confirmado por prueba genética                  |
| `clinico`  | Confirmado por evaluación clínica               |
| `probable` | Diagnóstico presuntivo, sin confirmación formal |

---

## 16.6 Endpoints de Evaluación Funcional (Append-Only)

Historial de evaluaciones periódicas del estado funcional del miembro. **No se permite editar ni eliminar registros** — la inmutabilidad del historial clínico es un requisito de negocio. Rutas anidadas bajo `/miembros/:miembroId/evaluaciones`.

| Método | Ruta                                       | Roles                 | Descripción                                                                                       |
| ------ | ------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------- |
| `POST` | `/miembros/:miembroId/evaluaciones`        | `admin`, `secretario` | Registra una nueva evaluación. Captura automáticamente `registradoPorId` del usuario autenticado. |
| `GET`  | `/miembros/:miembroId/evaluaciones`        | `admin`, `secretario` | Retorna el historial completo ordenado por fecha DESC.                                            |
| `GET`  | `/miembros/:miembroId/evaluaciones/ultima` | `admin`, `secretario` | Retorna la evaluación más reciente. Falla con 404 si no hay ninguna.                              |

**Enum `NivelMovilidad`:**

| Valor                        | Descripción                             |
| ---------------------------- | --------------------------------------- |
| `ambulatorio_independiente`  | Camina sin apoyo                        |
| `ambulatorio_con_apoyo`      | Camina con bastón, andador u otro apoyo |
| `silla_de_ruedas_parcial`    | Usa silla de ruedas parte del tiempo    |
| `silla_de_ruedas_permanente` | Usa silla de ruedas de forma permanente |
| `postrado`                   | No puede desplazarse                    |

**Escala SARA** (`puntuacionSara`): valor entre 0 y 40 que cuantifica la severidad de la ataxia (0 = sin alteración, 40 = máxima afectación).

**Por qué append-only:**

| Patrón               | Diagnóstico clínico | Evaluación funcional                          |
| -------------------- | ------------------- | --------------------------------------------- |
| ¿Se puede corregir?  | Sí (PATCH)          | No — cada evaluación es una foto en el tiempo |
| ¿Se puede eliminar?  | No                  | No                                            |
| Cantidad por miembro | 1                   | N (historial)                                 |
| Propósito            | Diagnóstico formal  | Seguimiento longitudinal                      |

---

## 17. Endpoints de Tipos de Ataxia (Catálogo)

El catálogo de tipos de ataxia es una tabla de referencia controlada: solo Administrador puede modificarla; los miembros solo pueden seleccionar desde este listado, sin texto libre.

El campo `estadoDiagnostico` (`confirmado` / `presuntivo` / `en_estudio`) pertenece al **miembro**, no al tipo — es un dato clínico del paciente, no del catálogo.

No se implementa `DELETE` — si un tipo ya tiene miembros asociados, eliminarlo rompería la FK histórica. Se usa `PATCH /:id/status` para desactivarlo.

| Método  | Ruta                       | Acceso                | Descripción                                  |
| ------- | -------------------------- | --------------------- | -------------------------------------------- |
| `GET`   | `/ataxia-types`            | Autenticado           | Lista tipos activos; acepta filtro `?grupo=` |
| `GET`   | `/ataxia-types/:id`        | Autenticado           | Detalle de un tipo                           |
| `POST`  | `/ataxia-types`            | `superadmin`, `admin` | Crea un tipo en el catálogo                  |
| `PATCH` | `/ataxia-types/:id`        | `superadmin`, `admin` | Modifica nombre, grupo o descripción         |
| `PATCH` | `/ataxia-types/:id/status` | `superadmin`, `admin` | Activa o desactiva el tipo (soft delete)     |

### Grupos de ataxia (`GrupoAtaxia`)

| Valor         | Descripción                             | Ejemplos clínicos                                                       |
| ------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `hereditaria` | Ataxias de origen genético              | Friedreich, SCA1–SCA17, Ataxia-Telangiectasia, AOA1, AOA2, ARSACS, AVED |
| `adquirida`   | Ataxias secundarias a causas externas   | MSA-C, alcohólica, paraneoplásica, por gluten, inmunomediada, CANVAS    |
| `idiopatica`  | Sin causa identificada                  | SAOA (ataxia cerebelosa de inicio tardío), esporádica no clasificada    |
| `otra`        | Otros tipos o en investigación genética | En investigación, origen combinado                                      |

### Flujo típico del frontend al crear un miembro

```
1. GET /ataxia-types                   → carga dropdown de tipos (agrupados por grupo)
2. El usuario selecciona:
   - tipoAtaxiaId  → FK al catálogo (obligatorio)
   - estadoDiagnostico: 'confirmado' | 'presuntivo' | 'en_estudio'
3. POST /members { tipoAtaxiaId, estadoDiagnostico, ... }
```

---

## 18. Endpoints de Estadísticas

> **Nota:** SUPERADMIN tiene acceso implícito a todos los endpoints mediante bypass global en `RolesGuard`. No se lista en cada fila.

| Endpoint                  | Roles autorizados           | Descripción                                                                         |
| ------------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `GET /stats/resumen`      | ADMIN, SECRETARIO, TESORERO | Panel principal: totales y variaciones recientes                                    |
| `GET /stats/miembros`     | ADMIN, SECRETARIO           | Desglose por estado (activo, fallecido, etc.)                                       |
| `GET /stats/diagnosticos` | ADMIN, SECRETARIO           | Distribución por tipo de ataxia y confirmación diagnóstica. Excluye representantes. |
| `GET /stats/funcional`    | ADMIN, SECRETARIO           | Distribución por nivel de movilidad (última evaluación por miembro)                 |
| `GET /stats/geografico`   | ADMIN, SECRETARIO           | Distribución por región                                                             |
| `GET /stats/cuotas`       | ADMIN, TESORERO             | Morosos vs. al día, filtrable por `?año=`                                           |

Reglas:

- Solo datos agregados (nunca registros individuales).
- Aplicar umbral mínimo de 5 registros para publicar una categoría (anonimización).
- Cada acceso se registra en auditoría.
- Los representantes (`esRepresentante: true`) se excluyen de los reportes de diagnóstico y funcionalidad.

---

## 19. Endpoints de Exportaciones

Genera archivos con datos de miembros para roles autorizados. Todo acceso se registra en auditoría.

### Formatos soportados

| Formato | Extensión | Librería    |
| ------- | --------- | ----------- |
| CSV     | `.csv`    | Native (fs) |
| XLSX    | `.xlsx`   | `exceljs`   |
| PDF     | `.pdf`    | `pdfkit`    |

### Endpoints

| Método | Ruta                                 | Roles                       | Descripción                                    |
| ------ | ------------------------------------ | --------------------------- | ---------------------------------------------- |
| `GET`  | `/exports/miembros`                  | ADMIN, SECRETARIO, TESORERO | Exporta lista de miembros                      |
| `GET`  | `/exports/miembros/:id/evaluaciones` | ADMIN, SECRETARIO           | Ficha individual con historial de evaluaciones |

### Query params comunes

| Parámetro      | Tipo                                                    | Descripción                           |
| -------------- | ------------------------------------------------------- | ------------------------------------- |
| `formato`      | `csv` \| `xlsx` \| `pdf`                                | Formato del archivo (default: `csv`)  |
| `estado`       | `activo` \| `renunciado` \| `suspendido` \| `fallecido` | Filtrar por estado del socio          |
| `regionId`     | number                                                  | Filtrar por región                    |
| `tipoAtaxiaId` | number                                                  | Filtrar por tipo de ataxia            |
| `fechaDesde`   | ISO date                                                | Filtrar por fecha de ingreso (inicio) |
| `fechaHasta`   | ISO date                                                | Filtrar por fecha de ingreso (fin)    |

### Columnas por rol

| Columna                  | ADMIN / SECRETARIO | TESORERO |
| ------------------------ | :----------------: | :------: |
| RUT                      |         ✅         |    ✅    |
| Nombre completo          |         ✅         |    ✅    |
| Email                    |         ✅         |    ✅    |
| Celular                  |         ✅         |    ❌    |
| Región / Comuna          |         ✅         |    ✅    |
| Tipo de ataxia           |         ✅         |    ❌    |
| Fecha de ingreso         |         ✅         |    ✅    |
| Estado socio             |         ✅         |    ✅    |
| Diagnóstico clínico      |         ✅         |    ❌    |
| Evaluaciones funcionales |         ✅         |    ❌    |

### PDF — Informe general

Genera un documento PDF con:

- Encabezado con logo y nombre de la agrupación
- Tabla paginada con datos de los miembros filtrados
- Totales y resumen estadístico
- Fecha de generación

### PDF — Ficha individual

Genera un documento PDF por miembro (`/exports/miembros/:id/evaluaciones`):

- Datos personales del miembro
- Diagnóstico clínico (si existe)
- Historial completo de evaluaciones funcionales (tabla con fecha, nivel movilidad, puntuación SARA, síntomas)
- Firma del profesional que generó el reporte

### Reglas

- El header `Content-Disposition: attachment` fuerza la descarga del archivo
- TESORERO recibe columnas reducidas para proteger datos clínicos sensibles
- Cada exportación genera un evento `EXPORTAR_DATOS` en auditoría

---

## 19.5 Endpoints de Finanzas

> Roles: `TESORERO` (responsable principal) y `ADMIN` (reemplazo). `SUPERADMIN` por bypass global. Ningún otro rol tiene acceso de escritura.

### Tarifas Anuales

| Método | Ruta                          | Roles           | Descripción                                                           |
| ------ | ----------------------------- | --------------- | --------------------------------------------------------------------- |
| `POST` | `/finanzas/tarifas-anuales`   | TESORERO, ADMIN | Fijar tarifa del año — genera cuotas para todos los miembros activos  |
| `GET`  | `/finanzas/tarifas-anuales`   | TESORERO, ADMIN | Historial de tarifas                                                  |

### Cuotas

| Método | Ruta                                     | Roles           | Descripción                                    |
| ------ | ---------------------------------------- | --------------- | ---------------------------------------------- |
| `GET`  | `/finanzas/cuotas`                       | TESORERO, ADMIN | Reporte filtrable de cuotas                    |
| `GET`  | `/miembros/:id/cuotas`                   | TESORERO, ADMIN | Cuotas de un miembro                           |
| `POST` | `/miembros/:id/cuotas/:cuotaId/pagos`    | TESORERO, ADMIN | Registrar abono (parcial o total)              |
| `GET`  | `/miembros/:id/cuotas/:cuotaId/pagos`    | TESORERO, ADMIN | Historial de abonos de una cuota               |

Query params `GET /finanzas/cuotas`: `?año=2026`, `?estado=IMPAGA`, `?tipo=SEMESTRE_1`, `?miembroId=uuid`

Reglas de negocio:
- Al crear `TarifaAnual` para el año N → el sistema genera `SEMESTRE_1` y `SEMESTRE_2` para todos los miembros activos.
- Al incorporar un nuevo miembro → se generan `INSCRIPCION` + `SEMESTRE_1` + `SEMESTRE_2` del año en curso.
- `Cuota.estado` pasa a `PAGADA` y se registra `fecha_pago_completo` cuando `SUM(PagoCuota.monto_clp) >= monto_asignado_clp`.
- No existe exoneración en esta versión — decisión reservada a la directiva.
- **No implementar UPDATE ni DELETE** en `Cuota` ni `PagoCuota` — el historial financiero es inmutable.

### Aportes Voluntarios

| Método | Ruta                      | Roles           | Descripción                               |
| ------ | ------------------------- | --------------- | ----------------------------------------- |
| `POST` | `/finanzas/aportes`       | TESORERO, ADMIN | Registrar aporte voluntario de un miembro |
| `GET`  | `/finanzas/aportes`       | TESORERO, ADMIN | Listar aportes con filtros                |
| `GET`  | `/miembros/:id/aportes`   | TESORERO, ADMIN | Aportes de un miembro específico          |

Regla: solo miembros registrados pueden realizar aportes voluntarios.

### Donaciones

> Pendiente diseño de entidad `Donante`.

| Método | Ruta                      | Roles           | Descripción         |
| ------ | ------------------------- | --------------- | ------------------- |
| `POST` | `/finanzas/donaciones`    | TESORERO, ADMIN | Registrar donación  |
| `GET`  | `/finanzas/donaciones`    | TESORERO, ADMIN | Listar donaciones   |

### Egresos

> Pendiente — se diseñará tras completar los submódulos de ingresos.

---

## 20. Endpoints de Auditoría

> **Nota:** SUPERADMIN tiene acceso implícito a todos los endpoints mediante bypass global en `RolesGuard`. No se lista en cada fila.

| Endpoint              | Roles autorizados | Descripción                                           |
| --------------------- | ----------------- | ----------------------------------------------------- |
| `GET /audit-logs`     | —                 | Solo SUPERADMIN (bypass) — lista paginada con filtros |
| `GET /audit-logs/:id` | —                 | Solo SUPERADMIN — detalle de un evento                |

Filtros disponibles en `GET /audit-logs`:

- `?accion=LOGIN` — filtrar por tipo de evento
- `?entidad=miembros` — filtrar por tabla afectada
- `?usuarioId=1` — filtrar por usuario
- `?desde=2026-01-01&hasta=2026-12-31` — rango de fechas
- `?page=1&limit=20` — paginación estándar

---

# Parte III: Políticas de Diseño Técnico

---

## 21. Arquitectura en Capas

Toda nueva funcionalidad debe respetar la siguiente separación de responsabilidades:

```
Routes → Middleware (validación + auth) → Controllers → Services → Models
```

| Capa            | Responsabilidad                                                       | Prohibiciones                                              |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Routes**      | Definir endpoints, encadenar middlewares                              | No contiene lógica de negocio ni acceso a BD               |
| **Middleware**  | Validación de inputs, autenticación JWT, autorización por roles       | No accede a BD directamente (excepto auth si es necesario) |
| **Controllers** | Recibir `req`, delegar al service, formatear `res`                    | No contiene hashing, cálculos, ni envío de emails          |
| **Services**    | Lógica de negocio pura: hashing, validaciones complejas, orquestación | No accede a `req` ni `res` — recibe y retorna datos planos |
| **Models**      | Esquema Sequelize, asociaciones, scopes                               | No contiene lógica de negocio                              |

**Ejemplo — Flujo de registro:**

```
POST /api/usuarios
  → express-validator (valida nombre, email, password)
  → usuarioController.nuevaCuenta(req, res)
    → usuarioService.registrar({ nombre, email, password })
      → bcrypt.hash(password)
      → crypto.randomInt(100000, 999999)
      → Usuario.create(datos)
      → emailService.enviarBienvenida(email, codigo)
      → return resultado
    → res.json({ success: true, data: resultado })
```

---

## 22. Autenticación y Autorización (Implementación)

**Autenticación** — El middleware `src/Middleware/auth.ts` ya existe y debe aplicarse a toda ruta protegida:

```typescript
import { autenticar } from '../Middleware/auth';
router.get('/perfil', autenticar, UsuarioController.perfil);
```

El token se envía como `Authorization: Bearer <token>`. El middleware decodifica el JWT y adjunta los datos del usuario en `req.usuario`.

**Autorización por roles** — Crear `src/Middleware/authorize.ts`:

```typescript
export const autorizar = (...rolesPermitidos: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!rolesPermitidos.includes(req.usuario.role)) {
      return res
        .status(403)
        .json({ msg: 'No tiene permisos para esta accion' });
    }
    next();
  };
};
```

**Uso combinado:**

```typescript
router.delete('/:id', autenticar, autorizar(1), UsuarioController.eliminar);
// Solo usuarios con role 1 (admin) pueden eliminar
```

**Reglas:**

- Las rutas públicas son solo: `POST /api/auth` (login) y `POST /api/usuarios` (registro).
- Toda otra ruta debe llevar `autenticar` como mínimo.
- Las rutas administrativas deben llevar `autenticar` + `autorizar(roles)`.

---

## 23. Entidades y Relaciones (TypeORM)

**`User`** — usuarios administrativos del sistema:

```typescript
export enum Rol {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SECRETARIO = 'secretario',
  TESORERO = 'tesorero',
  USUARIO = 'usuario', // rol por defecto al registrarse
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) email: string;
  @Column() nombre: string;
  @Column() password: string; // bcrypt
  @Column({ type: 'simple-enum', enum: Rol, default: Rol.USUARIO })
  rol: Rol;
  @Column({ default: true }) activo: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

**`Region`** — regiones de Chile (datos de referencia):

```typescript
@Entity('regiones')
export class Region {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) nombre: string;
  @OneToMany(() => Comuna, (comuna) => comuna.region)
  comunas: Comuna[];
}
```

**`Comuna`** — comunas de Chile, cada una pertenece a una región:

```typescript
@Entity('comunas')
export class Comuna {
  @PrimaryGeneratedColumn() id: number;
  @Column() nombre: string;
  @Column() regionId: number;
  @ManyToOne(() => Region, (region) => region.comunas)
  @JoinColumn({ name: 'regionId' })
  region: Region;
}
```

**`AtaxiaType`** — catálogo controlado de tipos de ataxia:

```typescript
export enum GrupoAtaxia {
  HEREDITARIA = 'hereditaria',
  ADQUIRIDA = 'adquirida',
  IDIOPATICA = 'idiopatica',
  OTRA = 'otra',
}

@Entity('ataxia_types')
export class AtaxiaType {
  @PrimaryGeneratedColumn() id: number;
  @Column() nombre: string; // "Ataxia de Friedreich"
  @Column({ type: 'varchar' }) grupo: GrupoAtaxia; // agrupación para dropdowns y estadísticas
  @Column({ nullable: true }) descripcion: string; // descripción opcional para el frontend
  @Column({ default: true }) activo: boolean; // soft delete — nunca eliminación física
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

**`Member`** — socios de la agrupación. Puede ser paciente (tiene ataxia) o representante (familiar/tutor/cuidador):

```typescript
export enum EstadoDiagnostico {
  CONFIRMADO = 'confirmado',
  PRESUNTIVO = 'presuntivo',
  EN_ESTUDIO = 'en_estudio',
}

export enum EstadoSocio {
  ACTIVO = 'activo',
  RENUNCIADO = 'renunciado',
  SUSPENDIDO = 'suspendido',
  FALLECIDO = 'fallecido',
}

export enum EstadoCivil {
  SOLTERO = 'soltero',
  SOLTERA = 'soltera',
  CASADO = 'casado',
  CASADA = 'casada',
  VIUDO = 'viudo',
  VIUDA = 'viuda',
  DIVORCIADO = 'divorciado',
  DIVORCIADA = 'divorciada',
}

export enum TipoRepresentacion {
  PADRE_MADRE = 'padre_madre', // padre o madre
  CONYUGE = 'conyuge', // cónyuge o conviviente
  HIJO_HIJA = 'hijo_hija',
  TUTOR_LEGAL = 'tutor_legal',
  CUIDADOR = 'cuidador', // cuidador formal o informal
  OTRO = 'otro',
}

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid') id: string;

  // ── Identidad ──────────────────────────────────────────────────
  @Column({ unique: true }) rut: string; // formato "12345678-9" (incluye dígito verificador)
  @Column() nombre: string;
  @Column() apellido: string;
  @Column({ nullable: true }) sexo: string; // 'M' | 'F' | 'otro'
  @Column() fechaNacimiento: Date;

  // ── Contacto ───────────────────────────────────────────────────
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) telefono: string; // teléfono fijo
  @Column({ nullable: true }) celular: string; // teléfono móvil
  @Column({ nullable: true }) direccion: string;

  // ── Geografía ──────────────────────────────────────────────────
  @Column() comunaId: number;
  @ManyToOne(() => Comuna)
  @JoinColumn({ name: 'comunaId' })
  comuna: Comuna; // región se obtiene vía comuna → region

  // ── Datos sociodemográficos ────────────────────────────────────
  @Column({ nullable: true }) profesion: string;
  @Column({ type: 'varchar', nullable: true })
  estadoCivil: EstadoCivil;

  // ── Tipo de miembro ────────────────────────────────────────────
  @Column({ default: false }) esRepresentante: boolean; // false = paciente, true = representante

  // ── Ataxia (solo si esRepresentante = false) ───────────────────
  @Column({ nullable: true }) tipoAtaxiaId: number;
  @ManyToOne(() => AtaxiaType, { nullable: true })
  @JoinColumn({ name: 'tipoAtaxiaId' })
  tipoAtaxia: AtaxiaType;
  @Column({ type: 'varchar', nullable: true })
  estadoDiagnostico: EstadoDiagnostico; // dato del paciente, no del catálogo

  // ── Representación (solo si esRepresentante = true) ────────────
  @Column({ type: 'varchar', nullable: true })
  tipoRepresentacion: TipoRepresentacion;

  @Column({ nullable: true }) representadoId: string; // UUID de miembro ya registrado
  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'representadoId' })
  representado: Member; // relación auto-referencial

  @Column({ nullable: true }) representadoNombre: string; // si la persona no está registrada
  @Column({ nullable: true }) representadoRut: string; // si la persona no está registrada

  // ── Estado en la asociación ────────────────────────────────────
  @Column({ type: 'varchar', default: EstadoSocio.ACTIVO })
  estado: EstadoSocio; // activo | renunciado | suspendido | fallecido
  @Column() fechaIngreso: Date;
  @Column({ nullable: true }) fechaCambioEstado: Date; // se actualiza automáticamente al cambiar estado

  // ── Consentimiento ─────────────────────────────────────────────
  @Column({ default: true }) consentimientoAlmacenamiento: boolean;
  @Column({ default: false }) consentimientoEstadisticas: boolean;
  @Column({ nullable: true }) fechaConsentimiento: Date;

  // ── Metadatos ──────────────────────────────────────────────────
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;

  // Relación opcional: un miembro puede tener cuenta administrativa
  @Column({ nullable: true }) userId: number;
}
```

**`DiagnosticoClinico`** — diagnóstico clínico del miembro (relación 1:1 con `Miembro`):

```typescript
export enum ConfirmacionDiagnostico {
  GENETICO = 'genetico',
  CLINICO = 'clinico',
  PROBABLE = 'probable',
}

@Entity('diagnosticos_clinicos')
export class DiagnosticoClinico {
  @PrimaryGeneratedColumn() id: number;
  @Column() miembroId: number;
  @ManyToOne(() => Miembro) @JoinColumn({ name: 'miembroId' }) miembro: Miembro;
  @Column({ nullable: true }) tipoAtaxiaId: number;
  @ManyToOne(() => AtaxiaType, { nullable: true })
  @JoinColumn({ name: 'tipoAtaxiaId' })
  tipoAtaxia: AtaxiaType;
  @Column({ nullable: true }) subtipo: string; // "SCA2", "FRDA", etc.
  @Column({ type: 'varchar', nullable: true })
  confirmacion: ConfirmacionDiagnostico;
  @Column({ nullable: true }) fechaDiagnostico: string; // ISO date
  @Column({ nullable: true }) institucion: string;
  @Column({ nullable: true }) medico: string;
  @Column({ nullable: true }) observaciones: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

**`EvaluacionFuncional`** — evaluaciones periódicas del estado funcional (append-only):

```typescript
export enum NivelMovilidad {
  AMBULATORIO_INDEPENDIENTE = 'ambulatorio_independiente',
  AMBULATORIO_CON_APOYO = 'ambulatorio_con_apoyo',
  SILLA_DE_RUEDAS_PARCIAL = 'silla_de_ruedas_parcial',
  SILLA_DE_RUEDAS_PERMANENTE = 'silla_de_ruedas_permanente',
  POSTRADO = 'postrado',
}

@Entity('evaluaciones_funcionales')
export class EvaluacionFuncional {
  @PrimaryGeneratedColumn() id: number;
  @Column() miembroId: number;
  @ManyToOne(() => Miembro) @JoinColumn({ name: 'miembroId' }) miembro: Miembro;
  @Column() fecha: string; // ISO date
  @Column({ type: 'varchar' }) nivelMovilidad: NivelMovilidad;
  @Column({ nullable: true }) puntuacionSara: number; // 0–40
  @Column({ default: false }) disartria: boolean;
  @Column({ default: false }) disfagia: boolean;
  @Column({ default: false }) nistagmo: boolean;
  @Column({ default: false }) tieneCuidador: boolean;
  @Column({ nullable: true }) nombreCuidador: string;
  @Column({ nullable: true }) observaciones: string;
  @Column() registradoPorId: number; // FK al user que registró
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'registradoPorId' })
  registradoPor: User;
  @CreateDateColumn() createdAt: Date;
  // Sin @UpdateDateColumn — append-only, no se modifica jamás
}
```

**`TarifaAnual`** — montos fijados por la directiva cada año en base a la UF:

```typescript
export enum TipoCuota {
  INSCRIPCION = 'INSCRIPCION',
  SEMESTRE_1 = 'SEMESTRE_1',
  SEMESTRE_2 = 'SEMESTRE_2',
}

@Entity('tarifas_anuales')
export class TarifaAnual {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) año: number;
  @Column({ type: 'decimal' }) valor_uf: number;           // valor UF de referencia al momento de fijar
  @Column({ type: 'decimal' }) monto_cuota_uf: number;     // aplica igual a INSCRIPCION, SEMESTRE_1 y SEMESTRE_2 (actualmente 0.3 UF)
  @Column() definido_por_id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'definido_por_id' }) definido_por: User;
  @Column() fecha_definicion: Date;
  @CreateDateColumn() createdAt: Date;
}
```

**`Cuota`** — instancia de cuota por miembro, tipo y año:

```typescript
export enum EstadoCuota {
  IMPAGA = 'IMPAGA',
  PAGADA = 'PAGADA',
}

@Entity('cuotas')
@Unique(['miembro_id', 'tipo', 'año'])
export class Cuota {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() miembro_id: string;
  @ManyToOne(() => Member) @JoinColumn({ name: 'miembro_id' }) miembro: Member;
  @Column({ type: 'varchar' }) tipo: TipoCuota;
  @Column() año: number;
  @Column({ type: 'decimal' }) monto_asignado_uf: number;
  @Column({ type: 'decimal' }) monto_asignado_clp: number;  // UF × valor_uf al día de asignación
  @Column({ type: 'varchar', default: EstadoCuota.IMPAGA }) estado: EstadoCuota;
  @Column({ nullable: true }) fecha_pago_completo: Date;    // se registra automáticamente al completar
  @CreateDateColumn() createdAt: Date;
}
```

**`PagoCuota`** — abono individual a una cuota (historial inmutable):

```typescript
@Entity('pagos_cuota')
export class PagoCuota {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() cuota_id: string;
  @ManyToOne(() => Cuota) @JoinColumn({ name: 'cuota_id' }) cuota: Cuota;
  @Column() miembro_id: string;
  @ManyToOne(() => Member) @JoinColumn({ name: 'miembro_id' }) miembro: Member;  // quien realiza el pago
  @Column({ type: 'decimal' }) monto_clp: number;
  @Column() fecha_pago: Date;
  @Column() registrado_por_id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'registrado_por_id' }) registrado_por: User;
  @CreateDateColumn() createdAt: Date;
  // Sin @UpdateDateColumn — inmutable
}
```

**`AporteVoluntario`** — ingresos adicionales de miembros registrados:

```typescript
@Entity('aportes_voluntarios')
export class AporteVoluntario {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() miembro_id: string;
  @ManyToOne(() => Member) @JoinColumn({ name: 'miembro_id' }) miembro: Member;
  @Column({ type: 'decimal' }) monto_clp: number;
  @Column() fecha: Date;
  @Column() concepto: string;
  @Column() registrado_por_id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'registrado_por_id' }) registrado_por: User;
  @CreateDateColumn() createdAt: Date;
  // Sin @UpdateDateColumn — inmutable
}
```

**`Donacion`** — donaciones de donantes externos (entidad `Donante` pendiente de diseño):

```typescript
@Entity('donaciones')
export class Donacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() donante_id: string;             // FK → Donante (pendiente diseño)
  @Column({ type: 'decimal' }) monto_clp: number;
  @Column() fecha: Date;
  @Column() concepto: string;
  @Column() registrado_por_id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'registrado_por_id' }) registrado_por: User;
  @CreateDateColumn() createdAt: Date;
  // Sin @UpdateDateColumn — inmutable
}
```

**Reglas:**

- Las tablas `users` y `members` son independientes. No usar herencia ni tabla única.
- `members.comunaId` referencia a `comunas.id` — la región se obtiene a través de la relación `comuna → region`.
- `regiones` y `comunas` se pueblan mediante un seeder al iniciar la app (solo si las tablas están vacías).
- No se permite eliminación física de regiones ni comunas que tengan miembros asociados.
- `PagoCuota` y `AporteVoluntario` no tienen `@UpdateDateColumn` — son registros inmutables.

---

## 24. Validación Separada

Las reglas de express-validator deben extraerse de las rutas a archivos dedicados:

```
src/Validators/
├── usuario.validator.ts
└── auth.validator.ts
```

**Ejemplo:**

```typescript
// src/Validators/usuario.validator.ts
import { check } from 'express-validator';

export const registroValidator = [
  check('nombre', 'El nombre es obligatorio').not().isEmpty().trim().escape(),
  check('email', 'Agregue un email valido').isEmail().normalizeEmail(),
  check('password', 'La contrasena debe ser al menos 6 caracteres').isLength({
    min: 6,
  }),
];
```

**Middleware reutilizable para extraer errores:**

```typescript
// src/Middleware/validate.ts
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validar = (req: Request, res: Response, next: NextFunction) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};
```

**Uso en rutas:**

```typescript
import { registroValidator } from '../Validators/usuario.validator';
import { validar } from '../Middleware/validate';

router.post('/', registroValidator, validar, UsuarioController.nuevaCuenta);
```

**Reglas:**

- Los controllers nunca llaman a `validationResult()` directamente.
- Toda validación incluye sanitización: `trim()`, `escape()`, `normalizeEmail()`.
- Un archivo de validator por dominio.

---

## 25. Formato de Respuesta Estándar

Todas las respuestas de la API deben seguir este formato:

**Éxito:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operacion exitosa"
}
```

**Error de validación (400):**

```json
{
  "success": false,
  "errores": [
    { "msg": "El nombre es obligatorio", "param": "nombre", "location": "body" }
  ]
}
```

**Error de autenticación (401) / autorización (403):**

```json
{
  "success": false,
  "msg": "No hay token, acceso denegado"
}
```

**Error de servidor (500):**

```json
{
  "success": false,
  "msg": "Error interno del servidor"
}
```

**Reglas:**

- Nunca exponer stack traces, nombres de tablas, ni queries SQL en respuestas de error.
- Códigos HTTP semánticos: 200 éxito, 201 creación, 400 validación, 401 no autenticado, 403 sin permisos, 404 no encontrado, 409 conflicto, 500 error interno.
- En desarrollo (`NODE_ENV=development`) se puede incluir detalle del error; en producción nunca.

---

## 26. Seguridad Técnica

| Medida                           | Implementación                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Headers HTTP seguros**         | Instalar `helmet` y agregar `this.app.use(helmet())` en middleware                                                                 |
| **Rate limiting**                | Instalar `express-rate-limit`, aplicar en `/api/auth` (max 10 intentos / 15 min) y `/api/usuarios` (max 5 registros / hora por IP) |
| **Sanitización de inputs**       | Toda validación con express-validator debe incluir `trim()`, `escape()`, `normalizeEmail()`                                        |
| **CORS restrictivo**             | Mantener `origin` limitado a `FRONTEND_URL`; nunca usar `origin: '*'` en producción                                                |
| **Secrets**                      | Solo en `.env`, sin fallbacks hardcodeados. App debe fallar al inicio si faltan variables críticas                                 |
| **Passwords**                    | bcrypt con mínimo 10 rounds. Nunca almacenar ni loguear passwords en texto plano                                                   |
| **JWT**                          | Incluir solo datos mínimos en payload (id, role). No incluir password ni datos sensibles                                           |
| **Refresh tokens**               | Implementar tokens de refresco seguros                                                                                             |
| **Protección contra inyección**  | SQL Injection vía Sequelize ORM, XSS vía sanitización de inputs                                                                    |
| **Migraciones**                  | Usar `sequelize-cli` para cambios de esquema. Nunca `sequelize.sync({ force: true })` en producción                                |
| **Identificador de correlación** | Incluir ID de correlación en errores internos para trazabilidad                                                                    |

---

## 27. Manejo de Errores

**Reglas generales:**

- Todo controller debe estar envuelto en `try/catch`.
- El `catch` siempre debe responder al cliente con `res.status(500)` — nunca dejar la petición colgada.
- Usar `console.error()` para logging de errores, nunca `console.log()`.
- El error handler global en `app.ts` captura errores no manejados como última línea de defensa.

**Conexión a BD:**

- Si `sequelize.authenticate()` falla, la app debe terminar con `process.exit(1)`.

**Errores esperados vs inesperados:**

- Errores esperados (usuario no encontrado, credenciales inválidas): responder con código HTTP apropiado y mensaje descriptivo.
- Errores inesperados (fallo de BD, error de código): loguear el error completo y responder con mensaje genérico al cliente.

---

## 28. TypeScript Estricto

| Regla                      | Detalle                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| **Prohibir `any`**         | Toda función debe tipar sus parámetros y retorno. Usar interfaces definidas en `src/Interfaces/` |
| **Interfaces por dominio** | Un archivo de interfaces por entidad: `Usuario.ts`, `Auth.ts`, etc.                              |
| **Request tipados**        | Crear interfaces para bodies de request: `IRegistroBody`, `ILoginBody`                           |
| **Configuración TSConfig** | Activar `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`                                  |
| **Versión**                | Actualizar TypeScript de 3.9.7 a 5.x para acceder a tipos modernos de Sequelize                  |

**Ejemplo de tipado correcto:**

```typescript
// En lugar de:
export const crearToken = (usuario: any) => { ... }

// Usar:
interface ITokenPayload {
  id: number
  nombre: string
  email: string
  estado: number
  role: number
}
export const crearToken = (usuario: ITokenPayload): string => { ... }
```

---

## 29. Estructura de Carpetas

Arquitectura NestJS con módulos por dominio. La estructura objetivo a medida que crece el proyecto:

```
src/
├── main.ts                         # Bootstrap NestJS
├── app.module.ts                   # Módulo raíz: importa todos los módulos
│
├── auth/                           # Autenticación y emisión de tokens
│   ├── dto/
│   │   └── login.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # Verifica JWT en rutas protegidas
│   │   └── roles.guard.ts          # Verifica rol del usuario
│   ├── decorators/
│   │   └── roles.decorator.ts      # @Roles('superadmin', 'admin', ...)
│   ├── strategies/
│   │   └── jwt.strategy.ts         # Configuración Passport JWT
│   ├── auth.controller.ts          # POST /auth/login, /auth/refresh, etc.
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── users/                          # Usuarios administrativos del sistema
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── entities/
│   │   └── user.entity.ts          # Entidad TypeORM: id, email, nombre, password, rol, activo
│   ├── users.controller.ts         # Endpoints /users — acceso superadmin/admin
│   ├── users.service.ts
│   └── users.module.ts
│
├── geo/                            # Datos de referencia geográfica (regiones y comunas)
│   ├── entities/
│   │   ├── region.entity.ts        # Region: id, nombre, OneToMany comunas
│   │   └── comuna.entity.ts        # Comuna: id, nombre, regionId (FK)
│   ├── geo.controller.ts           # GET /geo/regiones, GET /geo/regiones/:id/comunas, etc.
│   ├── geo.service.ts              # findAllRegiones, findComunasByRegion, create, update
│   ├── geo.seeder.ts               # Puebla regiones y comunas al iniciar si las tablas están vacías
│   └── geo.module.ts
│
├── miembros/                       # Socios de la agrupación
│   ├── dto/
│   │   ├── create-miembro.dto.ts   # rut (validado), nombre, fechaInscripcion + campos opcionales
│   │   ├── update-miembro.dto.ts   # PartialType de create sin rut
│   │   ├── update-estado.dto.ts    # solo campo estado (EstadoSocio)
│   │   └── vincular-usuario.dto.ts # userId (int, positivo)
│   ├── entities/
│   │   └── miembro.entity.ts       # Entidad TypeORM: rut, nombre, estado, relaciones geo/ataxia/user
│   ├── miembros.controller.ts      # Endpoints /miembros
│   ├── miembros.service.ts
│   └── miembros.module.ts
│
├── ataxia-types/                   # Catálogo controlado de tipos de ataxia
│   ├── dto/
│   │   ├── create-ataxia-type.dto.ts  # nombre, grupo (GrupoAtaxia), descripcion?
│   │   └── update-ataxia-type.dto.ts  # PartialType(CreateAtaxiaTypeDto)
│   ├── entities/
│   │   └── ataxia-type.entity.ts      # id, nombre, grupo, descripcion, activo
│   ├── ataxia-types.seeder.ts         # puebla el catálogo inicial si la tabla está vacía
│   ├── ataxia-types.controller.ts     # GET /ataxia-types, POST, PATCH, PATCH /:id/status
│   ├── ataxia-types.service.ts
│   └── ataxia-types.module.ts
│
├── diagnostico-clinico/            # Diagnóstico clínico del miembro (1:1, mutable)
│   ├── dto/
│   │   ├── create-diagnostico-clinico.dto.ts  # tipoAtaxiaId?, subtipo?, confirmacion?, fechaDiagnostico?, etc.
│   │   └── update-diagnostico-clinico.dto.ts  # PartialType(CreateDiagnosticoClinicoDto)
│   ├── entities/
│   │   └── diagnostico-clinico.entity.ts      # ConfirmacionDiagnostico enum; 1:1 con Miembro
│   ├── diagnostico-clinico.controller.ts      # POST/GET/PATCH /miembros/:miembroId/diagnostico
│   ├── diagnostico-clinico.service.ts         # create (409 si existe), findByMiembro, update
│   └── diagnostico-clinico.module.ts
│
├── evaluacion-funcional/           # Historial funcional del miembro (append-only)
│   ├── dto/
│   │   └── create-evaluacion-funcional.dto.ts  # fecha, nivelMovilidad, puntuacionSara (0-40), síntomas
│   ├── entities/
│   │   └── evaluacion-funcional.entity.ts      # NivelMovilidad enum; sin @UpdateDateColumn
│   ├── evaluacion-funcional.controller.ts      # POST/GET/GET-ultima /miembros/:miembroId/evaluaciones
│   ├── evaluacion-funcional.service.ts         # create, findAllByMiembro, findUltimaByMiembro — sin update/delete
│   └── evaluacion-funcional.module.ts
│
├── stats/                          # Estadísticas agregadas (solo lectura)
│   ├── stats.controller.ts
│   ├── stats.service.ts
│   └── stats.module.ts
│
├── audit/                          # Registro de auditoría (inmutable)
│   ├── entities/
│   │   └── audit-log.entity.ts
│   ├── audit.service.ts            # Solo escritura interna; no expone creación externa
│   ├── audit.controller.ts         # GET /audit-logs — solo superadmin
│   └── audit.module.ts
│
├── exports/                        # Exportación de datos (CSV/XLSX/PDF)
│   ├── exports.controller.ts       # GET /exports/miembros, GET /exports/miembros/:id/evaluaciones
│   ├── exports.service.ts          # Lógica de generación de archivos
│   ├── exports.module.ts
│   └── exporters/
│       ├── csv.exporter.ts         # Generador de archivos CSV
│       ├── xlsx.exporter.ts        # Generador de archivos XLSX (exceljs)
│       └── pdf.exporter.ts         # Generador de archivos PDF (pdfkit)
│
├── finanzas/                       # Ingresos y egresos de la agrupación
│   ├── dto/
│   │   ├── create-tarifa-anual.dto.ts
│   │   ├── create-pago-cuota.dto.ts
│   │   ├── create-aporte-voluntario.dto.ts
│   │   ├── create-donacion.dto.ts
│   │   └── filtro-cuotas.dto.ts
│   ├── entities/
│   │   ├── tarifa-anual.entity.ts       # año, valor_uf, montos en UF, definido_por
│   │   ├── cuota.entity.ts              # tipo enum, estado enum, fecha_pago_completo; unique (miembro,tipo,año)
│   │   ├── pago-cuota.entity.ts         # miembro_id (quien paga) + registrado_por; inmutable
│   │   ├── aporte-voluntario.entity.ts  # miembro_id, monto_clp, concepto; inmutable
│   │   └── donacion.entity.ts           # donante_id (FK Donante pendiente); inmutable
│   ├── finanzas.controller.ts           # POST/GET /finanzas/tarifas-anuales, /finanzas/cuotas, /finanzas/aportes, /finanzas/donaciones
│   ├── finanzas.service.ts              # genera cuotas al crear TarifaAnual o miembro; calcula estado PAGADA
│   └── finanzas.module.ts
│
└── common/                         # Utilidades compartidas
    ├── dto/
    │   └── pagination.dto.ts
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── response.interceptor.ts  # Formato estándar { success, data, message }
    └── pipes/
        └── validation.pipe.ts
```

**Reglas:**

- Cada módulo es autocontenido: entidad, servicio, controlador y DTOs propios.
- `users/` y `members/` son módulos completamente independientes — no comparten entidad.
- El módulo `common/` solo contiene utilidades sin lógica de negocio.
- Un archivo por responsabilidad.

---

## 30. Calidad y Herramientas

| Herramienta                       | Propósito                                               | Configuración                          |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------- |
| **ESLint** + `@typescript-eslint` | Detectar errores, prohibir `any`, enforcar convenciones | `.eslintrc.json` en raíz               |
| **Prettier**                      | Formato automático consistente                          | `.prettierrc` en raíz                  |
| **Jest** + `ts-jest`              | Tests unitarios para services y libs                    | `jest.config.ts`, carpeta `__tests__/` |
| **Supertest**                     | Tests de integración para endpoints                     | Dentro de `__tests__/integration/`     |
| **Husky** + `lint-staged`         | Pre-commit hooks: lint + format antes de cada commit    | `.husky/`                              |

**Scripts sugeridos para `package.json`:**

```json
{
  "lint": "eslint src/ --ext .ts",
  "lint:fix": "eslint src/ --ext .ts --fix",
  "format": "prettier --write src/",
  "test": "jest",
  "test:watch": "jest --watch"
}
```
