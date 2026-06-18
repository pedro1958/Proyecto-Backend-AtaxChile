# AtaxChile — Backend

API REST para la gestión de socios de la Asociación AtaxChile.
Stack: **NestJS 11 · TypeORM · PostgreSQL 16 · JWT · Resend**

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Diseño de API](docs/api-design.md) | Decisiones de diseño y estructura de endpoints |
| [Presentación](docs/slides.md) | Slides del proyecto |

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 20.x          |
| npm         | 10.x          |
| Docker      | 24.x          |

---

## Configuración inicial

### 1. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y completa los valores obligatorios:

```env
JWT_SECRET=<cadena aleatoria larga>
JWT_REFRESH_SECRET=<cadena distinta a JWT_SECRET>
DB_PASSWORD=postgres
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxxxx
```

> Los valores de `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_NAME` ya están
> preconfigurados para el contenedor Docker de desarrollo.

### 2. Dependencias

```bash
npm install
```

---

## Base de datos — contenedor Docker

```bash
# Levantar PostgreSQL en segundo plano
docker compose up -d

# Verificar que está corriendo
docker compose ps

# Ver logs
docker compose logs -f db

# Detener (sin borrar datos)
docker compose stop

# Detener y eliminar contenedor (datos persisten en el volumen)
docker compose down

# Eliminar contenedor Y volumen (reset completo)
docker compose down -v
```

El contenedor expone PostgreSQL en el puerto **5434** (evita conflictos con
instalaciones locales en 5432/5433).

| Parámetro | Valor          |
|-----------|----------------|
| Host      | localhost      |
| Puerto    | 5434           |
| Usuario   | postgres       |
| Password  | postgres       |
| Base      | ataxchile_dev  |

---

## Servidor de desarrollo

```bash
# Modo watch (recompila en cada cambio)
npm run start:dev

# Modo normal
npm run start
```

El servidor queda disponible en `http://localhost:5000`.

### Documentación interactiva (Swagger)

```
http://localhost:5000/api
```

---

## Tests

```bash
# Unitarios
npm run test

# Unitarios en modo watch
npm run test:watch

# E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

---

## Build de producción

```bash
npm run build
npm run start:prod
```

---

## Variables de entorno — referencia completa

| Variable             | Descripción                                            | Requerida |
|----------------------|--------------------------------------------------------|-----------|
| `NODE_ENV`           | `development` o `production`                           | Sí        |
| `PORT`               | Puerto del servidor (default: 5000)                    | No        |
| `JWT_SECRET`         | Secreto para access tokens (expiran en 15 min)         | Sí        |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (expiran en 7 días)        | Sí        |
| `DB_HOST`            | Host de PostgreSQL                                     | Sí        |
| `DB_PORT`            | Puerto de PostgreSQL (dev: 5434, prod: 5432)           | Sí        |
| `DB_USER`            | Usuario de la base de datos                            | Sí        |
| `DB_PASSWORD`        | Contraseña de la base de datos                         | Sí        |
| `DB_NAME`            | Nombre de la base de datos                             | Sí        |
| `FRONTEND_URL`       | URL permitida por CORS                                 | Sí        |
| `RESEND_API_KEY`     | API key de Resend para envío de emails                 | Sí        |
| `RESEND_FROM`        | Dirección remitente de emails                          | No        |
| `APP_URL`            | URL base del backend (para links en emails)            | No        |

---

## Flujo de inicio rápido

```bash
cp .env.example .env      # 1. Configurar variables
# editar .env ...
npm install               # 2. Instalar dependencias
docker compose up -d      # 3. Levantar base de datos
npm run start:dev         # 4. Iniciar servidor
```
