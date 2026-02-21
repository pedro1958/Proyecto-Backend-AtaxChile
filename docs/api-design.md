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

El sistema NO contempla:

- Ficha médica detallada.
- Registro de tratamientos.
- Registro de médicos.
- Evolución clínica.
- Prescripciones médicas.

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
- Contar con los siguientes campos obligatorios:
  - Nombre completo.
  - Documento de identidad.
  - Fecha de nacimiento.
  - Región.
  - Tipo de ataxia.
  - Consentimiento registrado.

Validaciones obligatorias en backend:

- Documento con formato válido.
- Normalización de texto.
- Validación de campos obligatorios.
- Prevención de duplicados.

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

### 7.2 Reportes Permitidos

- Cantidad por tipo de ataxia.
- Distribución por región.
- Distribución por rango etario.
- Evolución anual de registros.

---

## 8. Control de Acceso (RBAC)

### 8.1 Roles

Los roles aplican exclusivamente a **usuarios administrativos** (`users`). Los miembros no poseen rol en el sistema.

| Rol          | Descripción                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| `superadmin` | Gestión completa del sistema, incluida la administración de otros usuarios administrativos. |
| `admin`      | Administración general: miembros, catálogos, reportes y lectura completa.                   |
| `secretario` | Gestión de miembros: crear, actualizar y desactivar registros.                              |
| `tesorero`   | Acceso a membresías y cuotas.                                                               |

### 8.2 Reglas

- Autenticación obligatoria.
- Autorización validada en cada endpoint.
- Exportaciones restringidas.
- Acceso a datos sensibles limitado según rol.

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

Eventos auditables:

- Login / Logout.
- Creación de miembro.
- Modificación de datos.
- Cambio de tipo de ataxia.
- Eliminación lógica.
- Generación de reportes.
- Exportación de datos.
- Cambios en catálogo.

Reglas:

- Auditoría inmutable y no editable.
- Retención mínima configurable.
- Acceso restringido a Administrador.

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

| Método | Ruta | Acceso | Descripción |
| ------ | ---- | ------ | ----------- |
| `POST` | `/auth/login` | Público | Inicia sesión, retorna `access_token` (15 min) y `refresh_token` (7 días) |
| `POST` | `/auth/refresh` | Público | Renueva el `access_token` usando el `refresh_token` |
| `POST` | `/auth/logout` | Autenticado | Invalida el `refresh_token` en BD |
| `POST` | `/auth/forgot-password` | Público | Solicita recuperación de contraseña por email |
| `POST` | `/auth/reset-password` | Público | Restablece contraseña con token recibido por email |
| `POST` | `/auth/change-password` | Autenticado | Cambia contraseña conociendo la actual |

---

## 15. Endpoints de Usuarios Administrativos

| Método | Ruta | Acceso | Descripción |
| ------ | ---- | ------ | ----------- |
| `GET` | `/users` | superadmin, admin | Lista todos los usuarios |
| `GET` | `/users/:id` | Autenticado (propio) | Retorna perfil: `nombre`, `email`, `rol` |
| `POST` | `/users/register` | Público | Registra nuevo usuario, envía email de activación |
| `GET` | `/users/activar/:token` | Público | Activa cuenta desde enlace del correo |
| `PUT` | `/users/:id` | Autenticado (propio) | Modifica `nombre` o `email` — no modifica `rol` |
| `PATCH` | `/users/:id/rol` | superadmin | Cambia el rol del usuario |
| `PATCH` | `/users/:id/status` | superadmin | Activa o desactiva la cuenta |
| `DELETE` | `/users/:id` | superadmin | Eliminación lógica |

---

## 15.5 Endpoints de Geografía (Regiones y Comunas)

Datos de referencia estáticos para Chile. Lectura disponible para cualquier usuario autenticado; escritura solo para `superadmin`.

No se implementa `DELETE` — la eliminación de una región o comuna rompería los registros de miembros existentes. Si se requiere dar de baja una entrada, se aplica `PATCH /:id/status` (mismo patrón que `users`).

### Regiones

| Método | Ruta | Acceso | Descripción |
| ------ | ---- | ------ | ----------- |
| `GET` | `/geo/regiones` | Autenticado | Lista todas las regiones |
| `GET` | `/geo/regiones/:id` | Autenticado | Obtiene una región por id |
| `POST` | `/geo/regiones` | superadmin | Crea una nueva región |
| `PUT` | `/geo/regiones/:id` | superadmin | Modifica el nombre de una región |

### Comunas

| Método | Ruta | Acceso | Descripción |
| ------ | ---- | ------ | ----------- |
| `GET` | `/geo/regiones/:id/comunas` | Autenticado | Lista comunas de una región |
| `GET` | `/geo/comunas/:id` | Autenticado | Obtiene una comuna por id |
| `POST` | `/geo/comunas` | superadmin | Crea una nueva comuna |
| `PUT` | `/geo/comunas/:id` | superadmin | Modifica nombre o región de una comuna |

### Flujo típico del frontend al crear un miembro

```
1. GET /geo/regiones               → carga desplegable de regiones
2. GET /geo/regiones/:id/comunas   → carga comunas según región seleccionada
3. POST /miembros  { comunaId }    → guarda el miembro con FK a comuna
```

---

## 16. Endpoints de Miembros

```
GET    /members
GET    /members/{id}
POST   /members
PUT    /members/{id}
PATCH  /members/{id}
DELETE /members/{id}        (eliminación lógica)
```

Filtros permitidos:

```
GET /members?region=
GET /members?ataxiaType=
GET /members?yearOfBirth=
GET /members?active=true
```

---

## 17. Endpoints de Tipos de Ataxia (Catálogo)

El catálogo de tipos de ataxia es una tabla de referencia controlada: solo Administrador puede modificarla; los miembros solo pueden seleccionar desde este listado, sin texto libre.

El campo `estadoDiagnostico` (`confirmado` / `presuntivo` / `en_estudio`) pertenece al **miembro**, no al tipo — es un dato clínico del paciente, no del catálogo.

No se implementa `DELETE` — si un tipo ya tiene miembros asociados, eliminarlo rompería la FK histórica. Se usa `PATCH /:id/status` para desactivarlo.

| Método | Ruta | Acceso | Descripción |
| ------ | ---- | ------ | ----------- |
| `GET` | `/ataxia-types` | Autenticado | Lista tipos activos; acepta filtro `?grupo=` |
| `GET` | `/ataxia-types/:id` | Autenticado | Detalle de un tipo |
| `POST` | `/ataxia-types` | `superadmin`, `admin` | Crea un tipo en el catálogo |
| `PATCH` | `/ataxia-types/:id` | `superadmin`, `admin` | Modifica nombre, grupo o descripción |
| `PATCH` | `/ataxia-types/:id/status` | `superadmin`, `admin` | Activa o desactiva el tipo (soft delete) |

### Grupos de ataxia (`GrupoAtaxia`)

| Valor | Descripción | Ejemplos clínicos |
|---|---|---|
| `hereditaria` | Ataxias de origen genético | Friedreich, SCA1–SCA17, Ataxia-Telangiectasia, AOA1, AOA2, ARSACS, AVED |
| `adquirida` | Ataxias secundarias a causas externas | MSA-C, alcohólica, paraneoplásica, por gluten, inmunomediada, CANVAS |
| `idiopatica` | Sin causa identificada | SAOA (ataxia cerebelosa de inicio tardío), esporádica no clasificada |
| `otra` | Otros tipos o en investigación genética | En investigación, origen combinado |

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

```
GET /stats/ataxia-types
GET /stats/regions
GET /stats/age-ranges
GET /stats/annual-growth
```

Reglas:

- Solo datos agregados.
- Aplicar umbral mínimo de anonimización.
- Registrar auditoría de acceso.

---

## 19. Endpoints de Exportaciones

```
GET /exports/members
GET /exports/stats
```

Reglas:

- Solo roles autorizados.
- Registro obligatorio en auditoría.
- Formatos permitidos: CSV, XLSX.

---

## 20. Endpoints de Auditoría

```
GET /audit-logs
GET /audit-logs/{id}
```

Acceso restringido a Administrador.

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
@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) email: string;
  @Column() nombre: string;
  @Column() password: string; // bcrypt
  @Column({
    type: 'enum',
    enum: ['superadmin', 'admin', 'secretario', 'tesorero'],
  })
  rol: string;
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
  ADQUIRIDA   = 'adquirida',
  IDIOPATICA  = 'idiopatica',
  OTRA        = 'otra',
}

@Entity('ataxia_types')
export class AtaxiaType {
  @PrimaryGeneratedColumn() id: number;
  @Column() nombre: string;                          // "Ataxia de Friedreich"
  @Column({ type: 'varchar' }) grupo: GrupoAtaxia;   // agrupación para dropdowns y estadísticas
  @Column({ nullable: true }) descripcion: string;   // descripción opcional para el frontend
  @Column({ default: true }) activo: boolean;        // soft delete — nunca eliminación física
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

**`Member`** — socios de la agrupación, referencia `comunaId` y `tipoAtaxiaId` como FK:

```typescript
export enum EstadoDiagnostico {
  CONFIRMADO  = 'confirmado',
  PRESUNTIVO  = 'presuntivo',
  EN_ESTUDIO  = 'en_estudio',
}

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) rut: string;
  @Column() nombre: string;
  @Column() apellido: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) telefono: string;
  @Column({ nullable: true }) direccion: string;
  @Column() comunaId: number;
  @ManyToOne(() => Comuna)
  @JoinColumn({ name: 'comunaId' })
  comuna: Comuna;
  @Column() fechaNacimiento: Date;
  @Column({ nullable: true }) sexo: string;
  @Column() tipoAtaxiaId: number;
  @ManyToOne(() => AtaxiaType)
  @JoinColumn({ name: 'tipoAtaxiaId' })
  tipoAtaxia: AtaxiaType;
  @Column({ type: 'varchar', default: EstadoDiagnostico.EN_ESTUDIO })
  estadoDiagnostico: EstadoDiagnostico;             // dato del paciente, no del catálogo
  @Column({ type: 'varchar', enum: ['activo', 'inactivo', 'pendiente'] })
  estado: string;
  @Column({ default: true }) consentimientoAlmacenamiento: boolean;
  @Column({ default: false }) consentimientoEstadisticas: boolean;
  @Column({ nullable: true }) fechaConsentimiento: Date;
  @Column() fechaIngreso: Date;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;

  // Relación opcional: un miembro puede tener cuenta administrativa
  @Column({ nullable: true }) userId: number;
}
```

**Reglas:**
- Las tablas `users` y `members` son independientes. No usar herencia ni tabla única.
- `members.comunaId` referencia a `comunas.id` — la región se obtiene a través de la relación `comuna → region`.
- `regiones` y `comunas` se pueblan mediante un seeder al iniciar la app (solo si las tablas están vacías).
- No se permite eliminación física de regiones ni comunas que tengan miembros asociados.

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
├── members/                        # Socios de la agrupación
│   ├── dto/
│   │   ├── create-member.dto.ts    # Incluye comunaId (FK)
│   │   └── update-member.dto.ts
│   ├── entities/
│   │   └── member.entity.ts        # Entidad TypeORM: rut, nombre, comunaId, tipoAtaxia, estado, etc.
│   ├── members.controller.ts       # Endpoints /members
│   ├── members.service.ts
│   └── members.module.ts
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
