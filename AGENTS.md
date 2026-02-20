# AGENTS.md

Este archivo proporciona orientación a agentes de IA (Claude Code, Codex, etc.) al trabajar con el código de este repositorio.

## Descripción del Proyecto

REST API para AtaxChile construida con **NestJS + TypeScript + TypeORM + PostgreSQL**. Gestiona el registro de miembros de la agrupación, clasificación de tipos de ataxia, estadísticas poblacionales, autenticación y permisos basados en roles.

**Separación de dominios clave:**
- `users` — usuarios administrativos del sistema (staff, directivos). Poseen rol y credenciales de acceso.
- `members` — socios de la agrupación. Entidad independiente, sin acceso al sistema por defecto.

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
├── members/              # Socios de la agrupación
├── ataxia-types/         # Catálogo controlado de tipos de ataxia
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
- **Recuperación de contraseña**:
  1. `POST /auth/forgot-password` — recibe `email`; busca el usuario, genera token con `crypto.randomBytes(32)`, almacena el **hash** del token y su expiración (1 hora) en los campos `resetPasswordToken` / `resetPasswordExpires` de la entidad `User`; envía email con enlace al frontend (`/reset-password?token=<token-en-claro>`); responde siempre con mensaje genérico sin confirmar si el email existe (previene enumeración de usuarios).
  2. `POST /auth/reset-password` — recibe `token` + `nuevaPassword`; busca usuario por hash del token y verifica que no haya expirado; hashea la nueva contraseña con bcrypt (10 rounds); limpia `resetPasswordToken` y `resetPasswordExpires`; registra el evento en auditoría.

---

## Patrones Clave

- Entidades TypeORM basadas en clases con decoradores (`@Entity`, `@Column`, etc.).
- Controllers y Services son clases NestJS con decoradores (`@Controller`, `@Injectable`).
- Validación de inputs con `class-validator` en DTOs; aplicado globalmente con `ValidationPipe`.
- Passwords hasheados con bcrypt (10 rounds mínimo).
- Los tokens JWT llevan solo datos mínimos (`id`, `email`, `rol`), expiran en 12h.
- El secreto JWT se valida al iniciar — la app falla si falta la variable de entorno `JWT_SECRET`.
- CORS configurado para permitir solo `FRONTEND_URL` desde env.
- Manejo de errores centralizado con `HttpExceptionFilter` global.
- Respuestas estandarizadas con `ResponseInterceptor`: `{ success, data, message }`.
- Nomenclatura del código en español: `nombre`, `socio`, `secretario`, `estado`, `fechaIngreso`.

---

## Variables de Entorno

Requeridas en `.env` (ver `.env.example`):

```
JWT_SECRET      # Secreto para firmar JWT (obligatorio al iniciar)
DB_HOST         # Host de la base de datos
DB_PORT         # Puerto de la base de datos (5432 PostgreSQL)
DB_USER         # Usuario de la base de datos
DB_PASSWORD     # Contraseña de la base de datos
DB_NAME         # Nombre de la base de datos
FRONTEND_URL    # URL del frontend para CORS
EMAIL_HOST      # Host SMTP
EMAIL_PORT      # Puerto SMTP
EMAIL_USER      # Usuario SMTP
EMAIL_PASS      # Contraseña SMTP
```

---

## Idioma del Código

El código usa nomenclatura en español: `nombre`, `usuario`, `permiso`, `fecha`, `estado`, `codigo`, `nuevaCuenta`, `llave`, `autenticar`, `autorizar`.
