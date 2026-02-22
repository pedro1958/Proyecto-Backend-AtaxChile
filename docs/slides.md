---
marp: true
theme: default
paginate: true
style: |
  section {
    font-family: 'Segoe UI', sans-serif;
    background: #ffffff;
    color: #1a1a2e;
  }
  section.lead {
    background: #1a1a2e;
    color: #ffffff;
    text-align: center;
  }
  section.lead h1 {
    font-size: 2.4rem;
    color: #e0e0ff;
  }
  section.lead p {
    color: #aaaacc;
    font-size: 1rem;
  }
  section.modulo {
    background: #f0f4ff;
  }
  h1 { color: #1a1a2e; border-bottom: 3px solid #4a90d9; padding-bottom: 0.3rem; }
  h2 { color: #2d5fa6; }
  code { background: #eef2ff; color: #1a1a2e; padding: 2px 6px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { background: #1a1a2e; color: #ffffff; padding: 6px 10px; }
  td { border: 1px solid #dde; padding: 5px 10px; }
  tr:nth-child(even) td { background: #f5f7ff; }
  ul li { margin-bottom: 0.3rem; }
  .badge {
    display: inline-block;
    background: #4a90d9;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    margin-right: 4px;
  }
---

<!-- _class: lead -->

# AtaxChile Backend
## Sistema de Registro de Pacientes con Ataxia

REST API · NestJS · TypeScript · TypeORM · PostgreSQL

---

# Objetivo del Sistema

Plataforma de gestión para la **Agrupación AtaxChile** que permite:

- Registro y seguimiento de **socios** (pacientes y representantes)
- Clasificación del **tipo de ataxia** por catálogo controlado
- Generación de **estadísticas agregadas** poblacionales en Chile
- Gestión de **usuarios administrativos** con control de acceso por roles
- Trazabilidad completa mediante **auditoría inmutable**

> El sistema **no** contempla ficha médica, tratamientos ni prescripciones.

---

# Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | TypeORM 0.3 |
| BD Producción | PostgreSQL (Supabase) |
| BD Desarrollo | SQLite en archivo (`./db/dev.db`) |
| Autenticación | JWT (Passport) — access + refresh tokens |
| Validación | class-validator + class-transformer |
| Email | Resend |
| Documentación | @nestjs/swagger + Swagger UI |
| Testing | Jest + Supertest |

---

# Arquitectura de Módulos

```
src/
├── auth/          Autenticación JWT, guards, decoradores
├── users/         Usuarios administrativos (staff y directivos)
├── geo/           Regiones y comunas de Chile (datos de referencia)
├── members/       Socios de la agrupación — pacientes y representantes
├── ataxia-types/  Catálogo controlado de tipos de ataxia
├── stats/         Estadísticas agregadas (solo lectura)
├── audit/         Registro de auditoría inmutable
└── common/        Filtros, interceptores y pipes compartidos
```

**Separación clave:** `users` (acceso al sistema) ≠ `members` (socios registrados)

---

# Autenticación y Control de Acceso

## Estrategia JWT dual

| Token | Duración | Almacenamiento |
|---|---|---|
| `access_token` | 15 minutos | Solo en cliente |
| `refresh_token` | 7 días | Hasheado en BD |

## Roles (RBAC)

| Rol | Permisos |
|---|---|
| `superadmin` | Gestión completa del sistema y usuarios |
| `admin` | Miembros, catálogos, reportes |
| `secretario` | Crear, actualizar y desactivar miembros |
| `tesorero` | Membresías y cuotas |
| `usuario` | Rol por defecto al registrarse — sin acceso administrativo |

---

# Flujos de Autenticación

## Login y sesión persistente
```
POST /auth/login        → access_token (15 min) + refresh_token (7 días)
POST /auth/refresh      → nuevo access_token sin volver a loguearse
POST /auth/logout       → invalida el refresh_token en BD
```

## Recuperación de contraseña
```
POST /auth/forgot-password  → genera token, envía email (respuesta genérica)
POST /auth/reset-password   → valida token, hashea nueva contraseña con bcrypt
POST /auth/change-password  → cambia contraseña conociendo la actual
```

> El `refresh_token` se almacena **hasheado** en `users.refreshToken`. La app falla al iniciar si faltan `JWT_SECRET` o `JWT_REFRESH_SECRET`.

---

# Registro y Activación de Cuenta

**Rutas:** `POST /users/register` → `GET /users/activar/:token` (ambas públicas)

```
1. Cliente envía: nombre, email, password
       ↓
2. Backend verifica que el email no esté registrado (409 si existe)
       ↓
3. Hashea password con bcrypt (10 rounds)
       ↓
4. Asigna rol = 'usuario' automáticamente (no se acepta rol en el body)
       ↓
5. Genera token de activación con randomUUID()
       ↓
6. Almacena token + expiración (24 h) en BD (users.tokenActivacion)
       ↓
7. Envía email con enlace: /activar?token=<token>
       ↓
8. Responde: "Hemos enviado un correo a {email} para activar la cuenta"
       ↓
9. Usuario hace clic → GET /users/activar/:token
       ↓
10. Backend valida token + expiración → activa cuenta (cuentaActivada = true)
       ↓
11. Limpia tokenActivacion y tokenExpiracion de la BD
```

> Hasta que la cuenta **no esté activada**, el login es rechazado.

---

# Recuperación de Contraseña

**Flujo en dos pasos** — ambas rutas son públicas.

```
── Paso 1: Solicitar recuperación ──────────────────────────────────────
POST /auth/forgot-password  { email }
  → Busca usuario por email
  → Genera token con crypto.randomBytes(32)
  → Almacena HASH del token + expiración (1 hora) en BD
  → Envía email con enlace al frontend:
      /reset-password?token=<token-en-claro>
  → Responde SIEMPRE con mensaje genérico
    (no confirma si el email existe → previene enumeración de usuarios)

── Paso 2: Restablecer contraseña ──────────────────────────────────────
POST /auth/reset-password  { token, nuevaPassword }
  → Busca usuario por HASH del token recibido
  → Verifica que el token no haya expirado (400 si expiró)
  → Hashea la nueva contraseña con bcrypt (10 rounds)
  → Guarda nueva contraseña en BD
  → Limpia resetPasswordToken y resetPasswordExpires
  → Registra evento en auditoría
```

---

<!-- _class: modulo -->

# Módulo Geo
## Regiones y Comunas de Chile

- Datos de referencia **estáticos** — 16 regiones + 346 comunas
- Poblados automáticamente con un **seeder** al iniciar la app (solo si las tablas están vacías)
- Al crear un miembro se envía `comunaId`; la **región se obtiene** vía `comuna → region`

## Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| `GET` | `/geo/regiones` | Público |
| `GET` | `/geo/regiones/:id/comunas` | Público |
| `POST` | `/geo/regiones` | superadmin, admin |
| `PATCH` | `/geo/regiones/:id` | superadmin, admin |
| `POST` / `PATCH` | `/geo/comunas` | superadmin, admin |

> No se implementa `DELETE` — la eliminación rompería FKs de miembros existentes.

---

<!-- _class: modulo -->

# Módulo Tipos de Ataxia
## Catálogo Controlado

- **59 tipos** clasificados en 4 grupos
- Migrado desde el sistema legado SQL (`tipo_ataxia`) y enriquecido con terminología clínica actual

## Grupos (`GrupoAtaxia`)

| Grupo | Descripción | Ejemplos |
|---|---|---|
| `hereditaria` | Origen genético | Friedreich, SCA1–SCA30, DRPLA, FXTAS |
| `adquirida` | Causas externas | MSA-C, alcohólica, paraneoplásica, CANVAS |
| `idiopatica` | Sin causa identificada | SAOA, esporádica no clasificada |
| `otra` | En investigación | Origen combinado, sin diagnóstico |

> El `estadoDiagnostico` (`confirmado` / `presuntivo` / `en_estudio`) pertenece al **miembro**, no al catálogo.

---

# Seeder de Tipos de Ataxia

Migración desde tabla SQL legacy (`tipo_ataxia`, 46 registros) al nuevo seeder TypeScript:

| Origen | Destino | Acción |
|---|---|---|
| `SCA1`–`SCA30` (con gaps) | `GrupoAtaxia.HEREDITARIA` | Incorporados con nombre clínico |
| `EA1`–`EA7` | `GrupoAtaxia.HEREDITARIA` | Completados (SQL solo tenía 7) |
| `DRPLA`, `FXTAS`, `MIRAS`, `MSS` | `GrupoAtaxia.HEREDITARIA` | Incorporados con descripción |
| `ATAXIA CEREBELOSA ADQUIRIDA` | `GrupoAtaxia.ADQUIRIDA` | Incorporado |
| `DESCONOCIDA` | `GrupoAtaxia.OTRA` | Renombrado con descripción |
| MSA-C, CANVAS, AVED, etc. | Nuevo sistema | Agregados (no estaban en SQL) |

**32 registros** previos → **59 registros** en el seeder actualizado

---

<!-- _class: modulo -->

# Módulo Members
## Socios de la Agrupación

Entidad `Member` con dos perfiles diferenciados:

| Campo | Paciente (`esRepresentante: false`) | Representante (`esRepresentante: true`) |
|---|---|---|
| `tipoAtaxiaId` | **Obligatorio** | `null` |
| `estadoDiagnostico` | **Obligatorio** | `null` |
| `tipoRepresentacion` | `null` | **Obligatorio** |
| `representadoId` o `representadoNombre` | `null` | Al menos uno |

---

# Entidad Member — Campos Clave

Campos incorporados desde el sistema SQL legado (`socio`):

| Campo nuevo | Origen | Tipo |
|---|---|---|
| `celular` | `celular` en SQL | `string` nullable |
| `profesion` | `profesion` en SQL | `string` nullable |
| `estadoCivil` | `id_estado_civil` en SQL | enum `EstadoCivil` (8 valores) |
| `estado` | `id_estado_socio` en SQL | enum `EstadoSocio` (activo/renunciado/suspendido/fallecido) |
| `fechaCambioEstado` | `fecha_cambio_estado` en SQL | `Date` nullable — auto-actualizada |

> `anio_inscripcion` y `anio_cambio_estado` **no se almacenan** — se derivan de `.getFullYear()`.

---

# Representación de Socios

Un **representante** es un familiar, tutor o cuidador de una persona con ataxia.

```typescript
export enum TipoRepresentacion {
  PADRE_MADRE  = 'padre_madre',
  CONYUGE      = 'conyuge',
  HIJO_HIJA    = 'hijo_hija',
  TUTOR_LEGAL  = 'tutor_legal',
  CUIDADOR     = 'cuidador',
  OTRO         = 'otro',
}
```

- Si la persona representada **está registrada** → `representadoId` (UUID, relación auto-referencial)
- Si **no está registrada** → `representadoNombre` + `representadoRut` (campos de texto)
- Los representantes se **excluyen** de las estadísticas de diagnóstico de ataxia

---

# API REST — Endpoints por Módulo

| Módulo | Base | Operaciones |
|---|---|---|
| Auth | `/auth` | login, refresh, logout, forgot/reset/change-password |
| Usuarios | `/users` | CRUD + activar cuenta + cambio de rol/status |
| Geo | `/geo` | Regiones y comunas (lectura pública, escritura admin) |
| Tipos de Ataxia | `/ataxia-types` | Catálogo con filtro `?grupo=` + soft delete |
| Miembros | `/members` | CRUD + `PATCH /:id/estado` + filtros |
| Estadísticas | `/stats` | Por tipo, región, rango etario, crecimiento anual |
| Auditoría | `/audit-logs` | Solo lectura, acceso superadmin |
| Exportaciones | `/exports` | CSV / XLSX — solo roles autorizados |

**Base URL:** `/api/v1`

---

# Documentación Swagger

## Configuración aplicada

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('AtaxChile API')
  .setDescription('Sistema de registro de miembros de la Agrupación AtaxChile')
  .setVersion('1.0')
  .addBearerAuth()
  .build()
SwaggerModule.setup('api/docs', app, document)
```

**UI disponible en:** `http://localhost:5000/api/docs`

## Cobertura

- ✅ `@ApiProperty` en todos los DTOs con ejemplos reales
- ✅ `@ApiTags` agrupa endpoints por módulo
- ✅ `@ApiBearerAuth` en rutas protegidas
- ✅ `@ApiOperation` + `@ApiResponse` en cada endpoint
- ✅ `PartialType` migrado de `@nestjs/mapped-types` → `@nestjs/swagger`

---

# Estado Actual del Proyecto

| Módulo | Estado |
|---|---|
| `auth` | ✅ Implementado y testeado |
| `users` | ✅ Implementado y testeado |
| `geo` | ✅ Implementado y testeado |
| `ataxia-types` | ✅ Implementado y testeado |
| `members` | 🔲 Diseñado — pendiente implementación |
| `stats` | 🔲 Pendiente |
| `audit` | 🔲 Pendiente |
| `exports` | 🔲 Pendiente |
| **Swagger** | ✅ Configurado en todos los módulos implementados |

---

<!-- _class: lead -->

# Próximos Pasos

1. Implementar módulo `members` (entidad, DTOs, service, controller)
2. Implementar módulo `audit` (registro inmutable de eventos)
3. Implementar módulo `stats` (reportes agregados)
4. Implementar módulo `exports` (CSV / XLSX)
5. Agregar Swagger al módulo `members` una vez implementado

---

<!-- _class: lead -->

# AtaxChile Backend

**Repositorio:** `backend/`
**Documentación técnica:** `docs/api-design.md`
**Guía para agentes IA:** `AGENTS.md`
**Swagger UI:** `http://localhost:5000/api/docs`

_Agrupación de Pacientes con Ataxia – Chile_
