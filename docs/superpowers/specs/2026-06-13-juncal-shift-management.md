# Juncal — Gestión de Guardias y Reemplazos — Especificación Funcional

> Sistema web para gestión de asistencia, ausencias programadas y reemplazos de
> guardias de profesionales de salud en un sanatorio.

## 1. Objetivo

Permitir que profesionales de salud soliciten ausencias para sus guardias, que
otros profesionales habilitados se postulen como reemplazo, y que un Coordinador
valide cuentas, administre especialidades y resuelva los reemplazos.

## 2. Stack tecnológico (obligatorio)

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Estado client-side | Redux Toolkit |
| Formularios + validación | React Hook Form + Zod (`zodResolver`) |
| ORM | Prisma |
| Base de datos (dev) | SQLite |
| Arquitectura | N-Capas (Domain, Application, Infrastructure, Presentation) bajo Screaming Architecture + Hexagonal (Puertos y Adaptadores) |

**Restricciones de código:**
- Prohibido `any` en TypeScript.
- Lógica de negocio **solo** en Casos de Uso (Application). Nunca en componentes ni endpoints.
- Regla de dependencia: `presentation` y `infrastructure` dependen de `domain`; `domain` no depende de nada externo.

## 3. Entidades

### User (Aggregate Root)
| Campo | Tipo | Notas |
|---|---|---|
| id | string (cuid) | |
| email | string | único |
| password | string | hash (argon2/bcrypt) |
| name | string | |
| isActive | boolean | default `false` |
| role | Role | default `BASE_PROFESSIONAL` |

**Invariantes:** un `User` inactivo no puede solicitar ausencias ni postularse.

### Role (enum de dominio)
`BASE_PROFESSIONAL` | `COORDINATOR`

### Specialty (Aggregate Root / ABM)
| Campo | Tipo | Notas |
|---|---|---|
| id | string (cuid) | |
| name | string | único |
| description | string? | |
| isActive | boolean | default `true` |

### UserSpecialty (relación N:M)
PK compuesta `(userId, specialtyId)`. Un usuario cubre varias especialidades.

### ShiftReplacement (Aggregate Root)
| Campo | Tipo | Notas |
|---|---|---|
| id | string (cuid) | |
| date | DateTime | fecha de la guardia a cubrir |
| state | RequestState | default `OPEN` |
| requesterId | string | quien pide la ausencia |
| specialtyId | string | especialidad requerida |
| applicantId | string? | postulante (opcional) |
| resolvedById | string? | coordinador que resolvió |

### RequestState (enum de dominio)
`OPEN` | `POSTULATED` | `CONFIRMED` | `REJECTED`

> **SQLite + Prisma no soportan enums nativos.** `role` y `state` se persisten
> como `String` y el enum real se fuerza en el dominio (enum TS + Zod).

## 4. Máquina de estados de ShiftReplacement

| Acción | Transición | Actor | Efecto |
|---|---|---|---|
| `requestAbsence` | (nuevo) → `OPEN` | Profesional activo | crea solicitud para una de SUS especialidades |
| `postulate` | `OPEN` → `POSTULATED` | Profesional activo con la misma especialidad | setea `applicantId` |
| `rejectPostulation` | `POSTULATED` → `OPEN` | Coordinador | limpia `applicantId`, oferta sigue viva |
| `confirmReplacement` | `POSTULATED` → `CONFIRMED` | Coordinador | setea `resolvedById` (terminal) |
| `rejectRequest` | `OPEN`/`POSTULATED` → `REJECTED` | Coordinador | terminal, sale del flujo |
| `assignCompulsory` | (nuevo) → `CONFIRMED` | Coordinador | reemplazo compulsivo, omite ciclo |

Transiciones inválidas (ej. confirmar un `OPEN`, postularse a un `CONFIRMED`)
deben fallar en el dominio con un error tipado.

## 5. Flujos de trabajo

1. **Registro**: usuario crea cuenta → `isActive = false`.
2. **Validación**: `COORDINATOR` activa la cuenta y asigna `Specialty[]` permitidas.
3. **Solicitud de ausencia**: profesional activo pide ausencia para una especialidad suya → `OPEN`.
4. **Postulación**: profesional con la misma especialidad ve la oferta en su "Worklist de Especialidad" y se postula → `POSTULATED`.
5. **Resolución**: `COORDINATOR` desde su "Worklist General":
   - confirma → `CONFIRMED`
   - rechaza postulación → `OPEN`
   - rechaza solicitud → `REJECTED`
6. **Reemplazo compulsivo**: `COORDINATOR` asigna un reemplazo manual → nace `CONFIRMED`.
7. **ABM de especialidades**: `COORDINATOR` crea/edita/elimina especialidades.

## 6. Reglas de autorización

| Acción | BASE_PROFESSIONAL | COORDINATOR |
|---|---|---|
| Registrarse | ✅ | ✅ |
| Activar cuentas / asignar especialidades | ❌ | ✅ |
| Solicitar ausencia (especialidad propia) | ✅ (activo) | ✅ (activo) |
| Postularse (misma especialidad) | ✅ (activo) | ✅ (activo) |
| Confirmar / rechazar postulación / rechazar solicitud | ❌ | ✅ |
| Reemplazo compulsivo | ❌ | ✅ |
| ABM especialidades | ❌ | ✅ |

## 7. Vistas (Presentation)

- **Registro / Login**
- **Worklist de Especialidad** (profesional): ofertas `OPEN` de sus especialidades + sus propias solicitudes/postulaciones.
- **Worklist General** (coordinador): solicitudes en `POSTULATED` para resolver + creación de compulsivos.
- **ABM Especialidades** (coordinador).
- **Validación de cuentas** (coordinador): usuarios inactivos → activar + asignar especialidades.

## 8. Out of scope (esta iteración)

- Notificaciones push/email.
- Calendario visual de guardias.
- Reportería / métricas.
- Multi-sanatorio / multi-tenant.
