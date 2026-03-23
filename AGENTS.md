# AGENTS.md

Este archivo proporciona orientación a agentes de IA (Claude Code, Codex, etc.) al trabajar con el código de este repositorio.

## Descripción del Proyecto

REST API para AtaxChile construida con **NestJS + TypeScript + TypeORM + PostgreSQL**. Gestiona el registro de miembros de la agrupación, clasificación de tipos de ataxia, estadísticas poblacionales, autenticación y permisos basados en roles.

**Separación de dominios clave:**

- `users` — usuarios administrativos del sistema (staff, directivos). Poseen rol y credenciales de acceso.
- `miembros` — socios de la agrupación. Entidad independiente, sin acceso al sistema por defecto.
- `diagnostico-clinico` — diagnóstico clínico del miembro (1:1, mutable). Incluye tipo de ataxia, subtipo, confirmación, institución y médico.
- `evaluacion-funcional` — evaluaciones periódicas de estado funcional (append-only, nunca se editan ni eliminan). Incluye nivel de movilidad, puntuación SARA y síntomas.

## Documentación de Referencia

Toda la documentación técnica y de negocio está consolidada en un único archivo:

```
docs/api-design.md
```

Contiene:

- **Parte I**: Políticas de negocio (gestión de miembros, auditoría, RBAC, consentimiento, protección de datos).
- **Parte II**: Definición completa de la API REST (endpoints, filtros, restricciones por rol).
- **Parte III**: Políticas de diseño técnico (arquitectura en capas, validación, respuestas estándar, seguridad, TypeScript estricto, estructura de carpetas).

Consultar ese archivo antes de implementar cualquier funcionalidad nueva.

---

## Comandos

- **Servidor de desarrollo**: `npm run start:dev` (NestJS con recarga automática)
- **Compilar**: `npm run build` (compila TypeScript a dist/)
- **Iniciar producción**: `npm run start:prod` (ejecuta JS compilado desde dist/)
- **Tests**: `npm run test` / `npm run test:e2e` / `npm run test:cov`
- **Lint**: `npm run lint`

---

## Arquitectura

### Estructura de módulos `src/`

```
src/
├── main.ts               # Bootstrap NestJS
├── app.module.ts         # Módulo raíz
├── auth/                 # Autenticación JWT + guards de roles
├── users/                # Usuarios administrativos (staff/directivos)
├── geo/                  # Datos de referencia: regiones y comunas de Chile
├── miembros/             # Socios de la agrupación (referencia comunaId)
├── ataxia-types/         # Catálogo controlado de tipos de ataxia
├── diagnostico-clinico/  # Diagnóstico clínico del miembro (1:1, mutable)
├── evaluacion-funcional/ # Historial funcional del miembro (append-only)
├── stats/                # Estadísticas agregadas
├── audit/                # Registro de auditoría inmutable
└── common/               # Filtros, interceptors, pipes compartidos
```

Ver estructura completa en `docs/api-design.md §29`.

### Capas por módulo

```
Controller → Service → Repository (TypeORM Entity)
```

### Flujos clave

- **Petición**: Controller (guards + pipes) → Service → TypeORM Repository
- **Autenticación**: `Authorization: Bearer <token>` → `JwtAuthGuard` → `RolesGuard` → Controller
- **Base URL**: `/api/v1`
- **Tokens JWT**: `access_token` (15 min, firmado con `JWT_SECRET`) + `refresh_token` (7 días, firmado con `JWT_REFRESH_SECRET`). El refresh token se almacena hasheado en BD. `JwtStrategy.validate()` consulta la BD en cada request para verificar que el usuario sigue activo.
- **Geografía**: El módulo `geo` expone regiones y comunas de Chile. Al crear un miembro se envía `comunaId`; la región se obtiene a través de la relación `comuna → region`. Las tablas se pueblan con un seeder al iniciar la app.
- **Catálogo de ataxia**: El módulo `ataxia-types` expone un catálogo controlado de tipos de ataxia. Los tipos se agrupan por `GrupoAtaxia` (`hereditaria`, `adquirida`, `idiopatica`, `otra`). El catálogo se puebla con un seeder al iniciar la app. Al crear un miembro se envían dos campos diferenciados: `tipoAtaxiaId` (FK al catálogo) y `estadoDiagnostico` (`confirmado` / `presuntivo` / `en_estudio`); el segundo es un dato clínico del paciente, no del catálogo. Los tipos no se eliminan físicamente — se desactivan con `PATCH /ataxia-types/:id/status`.
- **Módulo members**: Gestiona los socios de la agrupación. Campos clave del dominio:
  - `rut` — string formato `"12345678-9"` (incluye dígito verificador), único.
  - `nombre` / `apellido` — almacenados separados (no en un solo campo).
  - `telefono` (fijo) y `celular` (móvil) — ambos opcionales, campos independientes.
  - `profesion` — texto libre, opcional.
  - `estadoCivil` — enum `EstadoCivil`: `soltero`, `soltera`, `casado`, `casada`, `viudo`, `viuda`, `divorciado`, `divorciada`.
  - `estado` — enum `EstadoSocio`: `activo`, `renunciado`, `suspendido`, `fallecido`. Se modifica **exclusivamente** vía `PATCH /members/:id/estado`; ese endpoint registra `fechaCambioEstado` automáticamente.
  - `fechaIngreso` — fecha de inscripción en la asociación (no `createdAt`).
  - `fechaCambioEstado` — fecha del último cambio de `estado`; se actualiza automáticamente al usar el endpoint de cambio de estado.
  - Los años (`anio_inscripcion`, `anio_cambio_estado`) **no se almacenan** — se derivan de `fechaIngreso.getFullYear()` y `fechaCambioEstado.getFullYear()` cuando se necesiten en estadísticas.
  - `PUT /members/:id` actualiza solo datos personales (contacto, geografía, sociodemográficos, ataxia). No modifica `estado`.
  - Eliminación lógica vía `DELETE /members/:id` (`isActive = false`) — nunca borrado físico.
  - `esRepresentante` — `boolean` (default `false`). `false` = paciente con ataxia; `true` = representante (familiar, tutor o cuidador de una persona con ataxia).
  - Si `esRepresentante = true`: `tipoAtaxiaId` y `estadoDiagnostico` deben ser `null`; se requiere `tipoRepresentacion` y al menos uno de `representadoId` (UUID de miembro ya registrado) o `representadoNombre` + `representadoRut` (persona aún no registrada en el sistema).
  - `tipoRepresentacion` — enum `TipoRepresentacion`: `padre_madre`, `conyuge`, `hijo_hija`, `tutor_legal`, `cuidador`, `otro`. Solo aplica cuando `esRepresentante = true`.
  - `representado` es una relación auto-referencial (`Member → Member`); si la persona representada no está en el sistema se usan los campos de texto `representadoNombre` y `representadoRut`.
  - Los representantes se excluyen de las estadísticas de diagnóstico de ataxia. El filtro `GET /members?esRepresentante=true|false` permite listarlos separadamente.
- **Diagnóstico clínico** (`diagnostico-clinico`): Cada miembro puede tener exactamente un diagnóstico clínico. Rutas anidadas bajo `/miembros/:miembroId/diagnostico`. Operaciones disponibles: `POST` (crear, falla con 409 si ya existe), `GET` (obtener con relación `tipoAtaxia`), `PATCH` (actualizar campos del diagnóstico). El servicio valida que el `miembroId` exista antes de crear.

- **Evaluación funcional** (`evaluacion-funcional`): Historial append-only de evaluaciones periódicas. Rutas anidadas bajo `/miembros/:miembroId/evaluaciones`. Operaciones: `POST` (registrar nueva evaluación), `GET` (listar historial ordenado por fecha DESC), `GET /ultima` (evaluación más reciente). **CRÍTICO — no implementar UPDATE ni DELETE**: el servicio deliberadamente no expone estos métodos; la integridad del historial clínico depende de que los registros sean inmutables una vez guardados. El campo `registradoPorId` se captura del usuario autenticado mediante `@CurrentUser()`.

- **Estadísticas** (`stats`): Módulo de solo lectura que agrega datos de otros módulos mediante `QueryBuilder` con `GROUP BY`. No tiene entidad propia ni tabla en BD. Endpoints bajo `/stats/`. Los representantes (`esRepresentante: true`) se excluyen de las estadísticas de diagnóstico y funcionalidad. Cada consulta registra un evento en auditoría. No implementar UPDATE ni DELETE.

- **Recuperación de contraseña**:
  1. `POST /auth/forgot-password` — recibe `email`; busca el usuario, genera token con `crypto.randomBytes(32)`, almacena el **hash** del token y su expiración (1 hora) en los campos `resetPasswordToken` / `resetPasswordExpires` de la entidad `User`; envía email con enlace al frontend (`/reset-password?token=<token-en-claro>`); responde siempre con mensaje genérico sin confirmar si el email existe (previene enumeración de usuarios).
  2. `POST /auth/reset-password` — recibe `token` + `nuevaPassword`; busca usuario por hash del token y verifica que no haya expirado; hashea la nueva contraseña con bcrypt (10 rounds); limpia `resetPasswordToken` y `resetPasswordExpires`; registra el evento en auditoría.

---

## Patrones Clave

- Entidades TypeORM basadas en clases con decoradores (`@Entity`, `@Column`, etc.).
- Controllers y Services son clases NestJS con decoradores (`@Controller`, `@Injectable`).
- Validación de inputs con `class-validator` en DTOs; aplicado globalmente con `ValidationPipe`.
- Passwords hasheados con bcrypt (10 rounds mínimo).
- Los tokens JWT llevan solo el `id` del usuario (`{ sub: id }`). El `email` y `rol` se obtienen desde BD en cada request vía `JwtStrategy.validate()`.
- `access_token` expira en 15 min (`JWT_SECRET`). `refresh_token` expira en 7 días (`JWT_REFRESH_SECRET`) y se almacena hasheado en `users.refreshToken`.
- Los secretos JWT se validan al iniciar — la app falla si faltan `JWT_SECRET` o `JWT_REFRESH_SECRET`.
- CORS configurado para permitir solo `FRONTEND_URL` desde env.
- Manejo de errores centralizado con `HttpExceptionFilter` global.
- Respuestas estandarizadas con `ResponseInterceptor`: `{ success, data, message }`.
- Nomenclatura del código en español: `nombre`, `socio`, `secretario`, `estado`, `fechaIngreso`.

---

## Variables de Entorno

Requeridas en `.env` (ver `.env.example`):

```
JWT_SECRET          # Secreto para firmar access tokens (15 min)
JWT_REFRESH_SECRET  # Secreto para firmar refresh tokens (7 días) — debe ser distinto a JWT_SECRET
DB_HOST             # Host de la base de datos
DB_PORT         # Puerto de la base de datos (5432 PostgreSQL)
DB_USER         # Usuario de la base de datos
DB_PASSWORD     # Contraseña de la base de datos
DB_NAME         # Nombre de la base de datos
FRONTEND_URL    # URL del frontend para CORS
RESEND_API_KEY  # API key de resend
RESEND_FROM     # Correo del dominio
APP_URL         # URL de uso de la app
```

---

## Idioma del Código

El código usa nomenclatura en español: `nombre`, `usuario`, `permiso`, `fecha`, `estado`, `codigo`, `nuevaCuenta`, `llave`, `autenticar`, `autorizar`.
