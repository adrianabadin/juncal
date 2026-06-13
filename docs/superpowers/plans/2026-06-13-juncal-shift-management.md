# Juncal — Gestión de Guardias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el core de un sistema de gestión de ausencias y reemplazos de guardias médicas, con dominio rico, casos de uso testeados y UI Next.js.

**Architecture:** Screaming Architecture — el primer nivel (`src/modules/{users,specialties,shift-replacements}`) grita el negocio. Dentro de cada módulo, Hexagonal: `domain` (entidades + puertos + Zod), `application` (casos de uso), `infrastructure` (repos Prisma), `presentation` (Server Actions, Redux, componentes). La regla de dependencia apunta hacia adentro; el dominio no conoce Prisma ni Next.

**Tech Stack:** Next.js (App Router) + TypeScript (sin `any`) + Tailwind, Redux Toolkit, React Hook Form + Zod, Prisma + SQLite, Vitest para tests de dominio/aplicación.

---

## File Structure

```
prisma/schema.prisma                                   # SQLite, enums como String
src/shared/domain/Result.ts                            # Result<T,E> sin throw
src/shared/domain/DomainError.ts                       # errores tipados
src/shared/infrastructure/prisma/client.ts             # PrismaClient singleton
src/shared/presentation/store/{store,hooks}.ts         # Redux store + hooks tipados

src/modules/users/domain/enums/Role.ts
src/modules/users/domain/value-objects/Email.ts
src/modules/users/domain/entities/User.ts
src/modules/users/domain/ports/UserRepository.ts
src/modules/users/domain/schemas/user.schema.ts
src/modules/users/application/use-cases/{RegisterUser,ActivateUserWithSpecialties,AuthenticateUser}.ts
src/modules/users/infrastructure/{persistence/PrismaUserRepository,mappers/UserMapper}.ts
src/modules/users/presentation/{actions,components,store/auth.slice}.ts

src/modules/specialties/...   (idéntica forma)
src/modules/shift-replacements/...   (idéntica forma, con la máquina de estados)
```

---

## FASE 1 — Scaffolding, Arquitectura y Base de Datos

### Task 1: Scaffold del proyecto Next.js

**Files:**
- Create: proyecto Next.js (`package.json`, `tsconfig.json`, `src/app/`, `tailwind.config.ts`)

- [ ] **Step 1: Crear el proyecto**

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

- [ ] **Step 2: Verificar build base**

Run: `npm run build`
Expected: build exitoso de la app por defecto.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold next.js + ts + tailwind"
```

### Task 2: Dependencias del stack

**Files:** Modify: `package.json`

- [ ] **Step 1: Instalar dependencias de runtime**

```bash
npm i @reduxjs/toolkit react-redux react-hook-form zod @hookform/resolvers @prisma/client argon2
```

- [ ] **Step 2: Instalar dependencias de dev**

```bash
npm i -D prisma vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: add stack dependencies"
```

### Task 3: Configurar Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 2: Agregar script de test en `package.json`**

```json
"scripts": { "test": "vitest run", "test:watch": "vitest" }
```

- [ ] **Step 3: Smoke test**

Create `src/shared/domain/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => { it("runs", () => { expect(1 + 1).toBe(2); }); });
```

Run: `npm test`
Expected: PASS. Luego borrar `smoke.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: configure vitest"
```

### Task 4: Path aliases por módulo

**Files:** Modify: `tsconfig.json`

- [ ] **Step 1: Agregar paths**

```jsonc
"paths": {
  "@/*": ["./src/*"],
  "@shared/*": ["./src/shared/*"],
  "@users/*": ["./src/modules/users/*"],
  "@specialties/*": ["./src/modules/specialties/*"],
  "@shift-replacements/*": ["./src/modules/shift-replacements/*"]
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: add per-module path aliases"
```

### Task 5: Prisma + schema + migración

**Files:**
- Create: `prisma/schema.prisma`, `.env`
- Create: `src/shared/infrastructure/prisma/client.ts`

- [ ] **Step 1: Inicializar Prisma con SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: Escribir `prisma/schema.prisma`** (contenido completo: ver sección "Schema" abajo)

- [ ] **Step 3: Setear `DATABASE_URL` en `.env`**

```
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 4: Generar migración inicial**

Run: `npx prisma migrate dev --name init`
Expected: migración creada, `dev.db` generada, cliente Prisma generado.

- [ ] **Step 5: Crear singleton de PrismaClient** en `src/shared/infrastructure/prisma/client.ts`

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: prisma schema + initial migration"
```

#### Schema (`prisma/schema.prisma`)

```prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

// SQLite no soporta enums → String + enum de dominio (TS/Zod).

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  isActive  Boolean  @default(false)
  role      String   @default("BASE_PROFESSIONAL")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  specialties      UserSpecialty[]
  requestedShifts  ShiftReplacement[] @relation("Requester")
  postulatedShifts ShiftReplacement[] @relation("Applicant")
  resolvedShifts   ShiftReplacement[] @relation("Resolver")
}

model Specialty {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users    UserSpecialty[]
  requests ShiftReplacement[]
}

model UserSpecialty {
  userId      String
  specialtyId String
  assignedAt  DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialty Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade)

  @@id([userId, specialtyId])
}

model ShiftReplacement {
  id           String   @id @default(cuid())
  date         DateTime
  state        String   @default("OPEN")
  requesterId  String
  specialtyId  String
  applicantId  String?
  resolvedById String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  requester User      @relation("Requester", fields: [requesterId],  references: [id])
  applicant User?     @relation("Applicant", fields: [applicantId],  references: [id])
  resolver  User?     @relation("Resolver",  fields: [resolvedById], references: [id])
  specialty Specialty @relation(fields: [specialtyId], references: [id])

  @@index([state, specialtyId])
}
```

---

## FASE 2 — Dominio y Casos de Uso (Core)

### Task 6: Tipo Result y DomainError compartidos

**Files:**
- Create: `src/shared/domain/Result.ts`, `src/shared/domain/DomainError.ts`
- Test: `src/shared/domain/Result.test.ts`

- [ ] **Step 1: Test de `Result`**

```ts
import { describe, it, expect } from "vitest";
import { ok, err } from "@shared/domain/Result";

describe("Result", () => {
  it("ok carries a value", () => {
    const r = ok(42);
    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value).toBe(42);
  });
  it("err carries an error", () => {
    const r = err("boom");
    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error).toBe("boom");
  });
});
```

- [ ] **Step 2: Run → FAIL** (`Cannot find module`).

- [ ] **Step 3: Implementar `Result.ts`**

```ts
export type Result<T, E> =
  | { readonly isOk: true; readonly value: T }
  | { readonly isOk: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ isOk: true, value });
export const err = <E>(error: E): Result<never, E> => ({ isOk: false, error });
```

- [ ] **Step 4: Implementar `DomainError.ts`**

```ts
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "DomainError";
  }
}
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(shared): Result type and DomainError"
```

### Task 7: Enum Role y Value Object Email

**Files:**
- Create: `src/modules/users/domain/enums/Role.ts`, `src/modules/users/domain/value-objects/Email.ts`
- Test: `src/modules/users/domain/value-objects/Email.test.ts`

- [ ] **Step 1: Test de Email**

```ts
import { describe, it, expect } from "vitest";
import { Email } from "@users/domain/value-objects/Email";

describe("Email", () => {
  it("creates a valid email", () => {
    const r = Email.create("doc@sanatorio.com");
    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.value).toBe("doc@sanatorio.com");
  });
  it("rejects invalid email", () => {
    const r = Email.create("not-an-email");
    expect(r.isOk).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implementar `Role.ts`**

```ts
export const Role = {
  BASE_PROFESSIONAL: "BASE_PROFESSIONAL",
  COORDINATOR: "COORDINATOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const isRole = (v: string): v is Role =>
  v === Role.BASE_PROFESSIONAL || v === Role.COORDINATOR;
```

- [ ] **Step 4: Implementar `Email.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email, DomainError> {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized))
      return err(new DomainError("INVALID_EMAIL", `Email inválido: ${raw}`));
    return ok(new Email(normalized));
  }
}
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(users): Role enum and Email value object"
```

### Task 8: Entidad User con invariante de activación

**Files:**
- Create: `src/modules/users/domain/entities/User.ts`
- Test: `src/modules/users/domain/entities/User.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from "vitest";
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";

const base = {
  id: "u1", email: "doc@s.com", passwordHash: "h",
  name: "Doc", isActive: false, role: Role.BASE_PROFESSIONAL,
};

describe("User", () => {
  it("nace inactivo y se activa", () => {
    const u = User.fromPersistence(base);
    expect(u.isActive).toBe(false);
    u.activate();
    expect(u.isActive).toBe(true);
  });
  it("un usuario inactivo no puede actuar", () => {
    const u = User.fromPersistence(base);
    expect(u.canParticipate()).toBe(false);
  });
  it("un usuario activo puede actuar", () => {
    const u = User.fromPersistence({ ...base, isActive: true });
    expect(u.canParticipate()).toBe(true);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implementar `User.ts`**

```ts
import { Role } from "@users/domain/enums/Role";

interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  isActive: boolean;
  role: Role;
}

export class User {
  private constructor(private props: UserProps) {}

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get role(): Role { return this.props.role; }
  get isActive(): boolean { return this.props.isActive; }
  get passwordHash(): string { return this.props.passwordHash; }

  activate(): void { this.props.isActive = true; }
  isCoordinator(): boolean { return this.props.role === Role.COORDINATOR; }
  canParticipate(): boolean { return this.props.isActive; }
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(users): User entity with activation invariant"
```

### Task 9: Schemas Zod de usuario

**Files:**
- Create: `src/modules/users/domain/schemas/user.schema.ts`
- Test: `src/modules/users/domain/schemas/user.schema.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from "vitest";
import { registerUserSchema } from "@users/domain/schemas/user.schema";

describe("registerUserSchema", () => {
  it("acepta datos válidos", () => {
    const r = registerUserSchema.safeParse({
      email: "doc@s.com", password: "secret12", name: "Doc",
    });
    expect(r.success).toBe(true);
  });
  it("rechaza password corta", () => {
    const r = registerUserSchema.safeParse({
      email: "doc@s.com", password: "123", name: "Doc",
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implementar**

```ts
import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const activateUserSchema = z.object({
  userId: z.string().min(1),
  specialtyIds: z.array(z.string().min(1)).min(1, "Asigná al menos una especialidad"),
});
export type ActivateUserInput = z.infer<typeof activateUserSchema>;
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(users): zod schemas"
```

### Task 10: Puerto UserRepository

**Files:** Create: `src/modules/users/domain/ports/UserRepository.ts`

- [ ] **Step 1: Definir la interfaz**

```ts
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  activateWithSpecialties(userId: string, specialtyIds: string[]): Promise<User>;
  listInactive(): Promise<User[]>;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(users): UserRepository port"
```

### Task 11: Caso de uso RegisterUser

**Files:**
- Create: `src/modules/users/application/use-cases/RegisterUser.ts`
- Test: `src/modules/users/application/use-cases/RegisterUser.test.ts`

- [ ] **Step 1: Test con repo en memoria**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { RegisterUser } from "@users/application/use-cases/RegisterUser";
import { InMemoryUserRepository } from "@users/infrastructure/persistence/InMemoryUserRepository";

describe("RegisterUser", () => {
  let repo: InMemoryUserRepository;
  beforeEach(() => { repo = new InMemoryUserRepository(); });

  it("crea un usuario inactivo", async () => {
    const uc = new RegisterUser(repo, async (p) => `hash:${p}`);
    const r = await uc.execute({ email: "doc@s.com", password: "secret12", name: "Doc" });
    expect(r.isOk).toBe(true);
    if (r.isOk) {
      expect(r.value.isActive).toBe(false);
      expect(r.value.passwordHash).toBe("hash:secret12");
    }
  });

  it("rechaza email duplicado", async () => {
    const uc = new RegisterUser(repo, async (p) => `hash:${p}`);
    await uc.execute({ email: "doc@s.com", password: "secret12", name: "Doc" });
    const r = await uc.execute({ email: "doc@s.com", password: "secret12", name: "Doc2" });
    expect(r.isOk).toBe(false);
    if (!r.isOk) expect(r.error.code).toBe("EMAIL_TAKEN");
  });
});
```

- [ ] **Step 2: Crear `InMemoryUserRepository`** en `src/modules/users/infrastructure/persistence/InMemoryUserRepository.ts`

```ts
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";
import { CreateUserData, UserRepository } from "@users/domain/ports/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private seq = 0;

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async create(data: CreateUserData): Promise<User> {
    const user = User.fromPersistence({
      id: `u${++this.seq}`, email: data.email, passwordHash: data.passwordHash,
      name: data.name, isActive: false, role: data.role,
    });
    this.users.push(user);
    return user;
  }
  async activateWithSpecialties(userId: string): Promise<User> {
    const u = await this.findById(userId);
    if (!u) throw new Error("not found");
    u.activate();
    return u;
  }
  async listInactive(): Promise<User[]> {
    return this.users.filter((u) => !u.isActive);
  }
}
```

- [ ] **Step 3: Run → FAIL** (`RegisterUser` no existe).

- [ ] **Step 4: Implementar `RegisterUser.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { User } from "@users/domain/entities/User";
import { Role } from "@users/domain/enums/Role";
import { UserRepository } from "@users/domain/ports/UserRepository";
import { RegisterUserInput } from "@users/domain/schemas/user.schema";

export type PasswordHasher = (plain: string) => Promise<string>;

export class RegisterUser {
  constructor(
    private readonly repo: UserRepository,
    private readonly hash: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<Result<User, DomainError>> {
    const existing = await this.repo.findByEmail(input.email.toLowerCase());
    if (existing)
      return err(new DomainError("EMAIL_TAKEN", "El email ya está registrado"));

    const passwordHash = await this.hash(input.password);
    const user = await this.repo.create({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: Role.BASE_PROFESSIONAL,
    });
    return ok(user);
  }
}
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(users): RegisterUser use case + in-memory repo"
```

### Task 12: Caso de uso ActivateUserWithSpecialties

**Files:**
- Create: `src/modules/users/application/use-cases/ActivateUserWithSpecialties.ts`
- Test: `...ActivateUserWithSpecialties.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from "vitest";
import { ActivateUserWithSpecialties } from "@users/application/use-cases/ActivateUserWithSpecialties";
import { InMemoryUserRepository } from "@users/infrastructure/persistence/InMemoryUserRepository";
import { Role } from "@users/domain/enums/Role";

describe("ActivateUserWithSpecialties", () => {
  it("solo un coordinador activa cuentas", async () => {
    const repo = new InMemoryUserRepository();
    const target = await repo.create({ email: "a@s.com", passwordHash: "h", name: "A", role: Role.BASE_PROFESSIONAL });
    const uc = new ActivateUserWithSpecialties(repo);

    const denied = await uc.execute({ actorIsCoordinator: false, userId: target.id, specialtyIds: ["s1"] });
    expect(denied.isOk).toBe(false);

    const okR = await uc.execute({ actorIsCoordinator: true, userId: target.id, specialtyIds: ["s1"] });
    expect(okR.isOk).toBe(true);
    if (okR.isOk) expect(okR.value.isActive).toBe(true);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implementar**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { User } from "@users/domain/entities/User";
import { UserRepository } from "@users/domain/ports/UserRepository";

export interface ActivateUserCommand {
  actorIsCoordinator: boolean;
  userId: string;
  specialtyIds: string[];
}

export class ActivateUserWithSpecialties {
  constructor(private readonly repo: UserRepository) {}

  async execute(cmd: ActivateUserCommand): Promise<Result<User, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador puede activar cuentas"));
    if (cmd.specialtyIds.length === 0)
      return err(new DomainError("NO_SPECIALTIES", "Asigná al menos una especialidad"));

    const user = await this.repo.findById(cmd.userId);
    if (!user) return err(new DomainError("USER_NOT_FOUND", "Usuario inexistente"));

    const updated = await this.repo.activateWithSpecialties(cmd.userId, cmd.specialtyIds);
    return ok(updated);
  }
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(users): ActivateUserWithSpecialties use case"
```

### Task 13: Enum RequestState y entidad ShiftReplacement (máquina de estados)

**Files:**
- Create: `src/modules/shift-replacements/domain/enums/RequestState.ts`
- Create: `src/modules/shift-replacements/domain/entities/ShiftReplacement.ts`
- Test: `...ShiftReplacement.test.ts`

- [ ] **Step 1: Test de transiciones**

```ts
import { describe, it, expect } from "vitest";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

const open = () => ShiftReplacement.fromPersistence({
  id: "r1", date: new Date("2026-07-01"), state: RequestState.OPEN,
  requesterId: "u1", specialtyId: "s1", applicantId: null, resolvedById: null,
});

describe("ShiftReplacement state machine", () => {
  it("postular: OPEN → POSTULATED", () => {
    const r = open();
    const res = r.postulate("u2");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.POSTULATED);
    expect(r.applicantId).toBe("u2");
  });

  it("no se puede postular dos veces", () => {
    const r = open();
    r.postulate("u2");
    const res = r.postulate("u3");
    expect(res.isOk).toBe(false);
  });

  it("rechazar postulación: POSTULATED → OPEN, limpia postulante", () => {
    const r = open();
    r.postulate("u2");
    const res = r.rejectPostulation("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.OPEN);
    expect(r.applicantId).toBeNull();
  });

  it("confirmar: POSTULATED → CONFIRMED", () => {
    const r = open();
    r.postulate("u2");
    const res = r.confirm("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.CONFIRMED);
    expect(r.resolvedById).toBe("coord");
  });

  it("no se puede confirmar un OPEN", () => {
    const r = open();
    const res = r.confirm("coord");
    expect(res.isOk).toBe(false);
  });

  it("rechazar solicitud: OPEN/POSTULATED → REJECTED (terminal)", () => {
    const r = open();
    const res = r.rejectRequest("coord");
    expect(res.isOk).toBe(true);
    expect(r.state).toBe(RequestState.REJECTED);
  });

  it("no se puede actuar sobre un estado terminal", () => {
    const r = open();
    r.rejectRequest("coord");
    expect(r.postulate("u2").isOk).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implementar `RequestState.ts`**

```ts
export const RequestState = {
  OPEN: "OPEN",
  POSTULATED: "POSTULATED",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
} as const;

export type RequestState = (typeof RequestState)[keyof typeof RequestState];

export const isRequestState = (v: string): v is RequestState =>
  v === RequestState.OPEN || v === RequestState.POSTULATED ||
  v === RequestState.CONFIRMED || v === RequestState.REJECTED;
```

- [ ] **Step 4: Implementar `ShiftReplacement.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

interface ShiftProps {
  id: string;
  date: Date;
  state: RequestState;
  requesterId: string;
  specialtyId: string;
  applicantId: string | null;
  resolvedById: string | null;
}

type Transition = Result<void, DomainError>;

export class ShiftReplacement {
  private constructor(private props: ShiftProps) {}

  static fromPersistence(props: ShiftProps): ShiftReplacement {
    return new ShiftReplacement(props);
  }

  get id(): string { return this.props.id; }
  get state(): RequestState { return this.props.state; }
  get applicantId(): string | null { return this.props.applicantId; }
  get resolvedById(): string | null { return this.props.resolvedById; }
  get requesterId(): string { return this.props.requesterId; }
  get specialtyId(): string { return this.props.specialtyId; }
  get date(): Date { return this.props.date; }

  postulate(applicantId: string): Transition {
    if (this.props.state !== RequestState.OPEN)
      return err(new DomainError("INVALID_TRANSITION", "Solo se postula sobre una solicitud OPEN"));
    if (applicantId === this.props.requesterId)
      return err(new DomainError("SELF_POSTULATION", "No podés postularte a tu propia solicitud"));
    this.props.applicantId = applicantId;
    this.props.state = RequestState.POSTULATED;
    return ok(undefined);
  }

  rejectPostulation(coordinatorId: string): Transition {
    if (this.props.state !== RequestState.POSTULATED)
      return err(new DomainError("INVALID_TRANSITION", "No hay postulación para rechazar"));
    this.props.applicantId = null;
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.OPEN;
    return ok(undefined);
  }

  confirm(coordinatorId: string): Transition {
    if (this.props.state !== RequestState.POSTULATED)
      return err(new DomainError("INVALID_TRANSITION", "Solo se confirma una solicitud POSTULATED"));
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.CONFIRMED;
    return ok(undefined);
  }

  rejectRequest(coordinatorId: string): Transition {
    if (this.props.state === RequestState.CONFIRMED || this.props.state === RequestState.REJECTED)
      return err(new DomainError("INVALID_TRANSITION", "La solicitud ya está cerrada"));
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.REJECTED;
    return ok(undefined);
  }
}
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(shift-replacements): ShiftReplacement entity with state machine"
```

### Task 14: Puerto ShiftReplacementRepository + casos de uso del ciclo

**Files:**
- Create: `src/modules/shift-replacements/domain/ports/ShiftReplacementRepository.ts`
- Create: `src/modules/shift-replacements/domain/schemas/shift-replacement.schema.ts`
- Create use-cases: `RequestAbsence.ts`, `PostulateForReplacement.ts`, `ResolveReplacement.ts`, `AssignCompulsoryReplacement.ts`
- Create: `InMemoryShiftReplacementRepository.ts`
- Test: `...use-cases/ShiftLifecycle.test.ts`

- [ ] **Step 1: Definir el puerto**

```ts
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

export interface CreateShiftData {
  date: Date;
  requesterId: string;
  specialtyId: string;
  applicantId: string | null;
  state: RequestState;
  resolvedById: string | null;
}

export interface ShiftReplacementRepository {
  findById(id: string): Promise<ShiftReplacement | null>;
  create(data: CreateShiftData): Promise<ShiftReplacement>;
  save(shift: ShiftReplacement): Promise<ShiftReplacement>;
  listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]>;
  listByState(state: RequestState): Promise<ShiftReplacement[]>;
}
```

- [ ] **Step 2: Schema Zod**

```ts
import { z } from "zod";

export const requestAbsenceSchema = z.object({
  date: z.coerce.date(),
  specialtyId: z.string().min(1),
});
export type RequestAbsenceInput = z.infer<typeof requestAbsenceSchema>;

export const assignCompulsorySchema = z.object({
  date: z.coerce.date(),
  specialtyId: z.string().min(1),
  requesterId: z.string().min(1),
  applicantId: z.string().min(1),
});
export type AssignCompulsoryInput = z.infer<typeof assignCompulsorySchema>;
```

- [ ] **Step 3: Test del ciclo de vida completo** (puerto del repositorio de usuarios necesario para chequear especialidades — se inyecta un comprobador)

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryShiftReplacementRepository } from "@shift-replacements/infrastructure/persistence/InMemoryShiftReplacementRepository";
import { RequestAbsence } from "@shift-replacements/application/use-cases/RequestAbsence";
import { PostulateForReplacement } from "@shift-replacements/application/use-cases/PostulateForReplacement";
import { ResolveReplacement } from "@shift-replacements/application/use-cases/ResolveReplacement";
import { AssignCompulsoryReplacement } from "@shift-replacements/application/use-cases/AssignCompulsoryReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

// hasSpecialty(userId, specialtyId) → Promise<boolean>
const hasSpecialty = async (userId: string, specialtyId: string) =>
  specialtyId === "s1" && (userId === "req" || userId === "app");

describe("Shift lifecycle", () => {
  let repo: InMemoryShiftReplacementRepository;
  beforeEach(() => { repo = new InMemoryShiftReplacementRepository(); });

  it("flujo OPEN → POSTULATED → CONFIRMED", async () => {
    const created = await new RequestAbsence(repo, hasSpecialty).execute({
      requesterId: "req", isActive: true, date: new Date("2026-07-01"), specialtyId: "s1",
    });
    expect(created.isOk).toBe(true);
    if (!created.isOk) return;

    const post = await new PostulateForReplacement(repo, hasSpecialty).execute({
      shiftId: created.value.id, applicantId: "app", isActive: true,
    });
    expect(post.isOk).toBe(true);

    const conf = await new ResolveReplacement(repo).execute({
      shiftId: created.value.id, action: "CONFIRM", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(conf.isOk).toBe(true);
    if (conf.isOk) expect(conf.value.state).toBe(RequestState.CONFIRMED);
  });

  it("rechazar solicitud cierra el flujo", async () => {
    const created = await new RequestAbsence(repo, hasSpecialty).execute({
      requesterId: "req", isActive: true, date: new Date("2026-07-01"), specialtyId: "s1",
    });
    if (!created.isOk) return;
    const rej = await new ResolveReplacement(repo).execute({
      shiftId: created.value.id, action: "REJECT_REQUEST", coordinatorId: "coord", actorIsCoordinator: true,
    });
    expect(rej.isOk).toBe(true);
    if (rej.isOk) expect(rej.value.state).toBe(RequestState.REJECTED);
  });

  it("no se puede solicitar para una especialidad que no poseés", async () => {
    const r = await new RequestAbsence(repo, hasSpecialty).execute({
      requesterId: "req", isActive: true, date: new Date("2026-07-01"), specialtyId: "s2",
    });
    expect(r.isOk).toBe(false);
  });

  it("reemplazo compulsivo nace CONFIRMED", async () => {
    const r = await new AssignCompulsoryReplacement(repo).execute({
      actorIsCoordinator: true, coordinatorId: "coord",
      date: new Date("2026-07-01"), specialtyId: "s1", requesterId: "req", applicantId: "app",
    });
    expect(r.isOk).toBe(true);
    if (r.isOk) expect(r.value.state).toBe(RequestState.CONFIRMED);
  });
});
```

- [ ] **Step 4: `InMemoryShiftReplacementRepository`**

```ts
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { CreateShiftData, ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export class InMemoryShiftReplacementRepository implements ShiftReplacementRepository {
  private items: ShiftReplacement[] = [];
  private seq = 0;

  async findById(id: string): Promise<ShiftReplacement | null> {
    return this.items.find((s) => s.id === id) ?? null;
  }
  async create(data: CreateShiftData): Promise<ShiftReplacement> {
    const s = ShiftReplacement.fromPersistence({
      id: `r${++this.seq}`, date: data.date, state: data.state,
      requesterId: data.requesterId, specialtyId: data.specialtyId,
      applicantId: data.applicantId, resolvedById: data.resolvedById,
    });
    this.items.push(s);
    return s;
  }
  async save(shift: ShiftReplacement): Promise<ShiftReplacement> {
    this.items = this.items.map((s) => (s.id === shift.id ? shift : s));
    return shift;
  }
  async listOpenBySpecialty(specialtyId: string): Promise<ShiftReplacement[]> {
    return this.items.filter((s) => s.specialtyId === specialtyId && s.state === RequestState.OPEN);
  }
  async listByState(state: RequestState): Promise<ShiftReplacement[]> {
    return this.items.filter((s) => s.state === state);
  }
}
```

- [ ] **Step 5: `RequestAbsence.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export type HasSpecialty = (userId: string, specialtyId: string) => Promise<boolean>;

export interface RequestAbsenceCommand {
  requesterId: string;
  isActive: boolean;
  date: Date;
  specialtyId: string;
}

export class RequestAbsence {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly hasSpecialty: HasSpecialty,
  ) {}

  async execute(cmd: RequestAbsenceCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.isActive)
      return err(new DomainError("INACTIVE_USER", "Tu cuenta no está activa"));
    if (!(await this.hasSpecialty(cmd.requesterId, cmd.specialtyId)))
      return err(new DomainError("SPECIALTY_NOT_OWNED", "No tenés esa especialidad asignada"));

    const created = await this.repo.create({
      date: cmd.date, requesterId: cmd.requesterId, specialtyId: cmd.specialtyId,
      applicantId: null, state: RequestState.OPEN, resolvedById: null,
    });
    return ok(created);
  }
}
```

- [ ] **Step 6: `PostulateForReplacement.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";
import { HasSpecialty } from "@shift-replacements/application/use-cases/RequestAbsence";

export interface PostulateCommand {
  shiftId: string;
  applicantId: string;
  isActive: boolean;
}

export class PostulateForReplacement {
  constructor(
    private readonly repo: ShiftReplacementRepository,
    private readonly hasSpecialty: HasSpecialty,
  ) {}

  async execute(cmd: PostulateCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.isActive)
      return err(new DomainError("INACTIVE_USER", "Tu cuenta no está activa"));
    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift) return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));
    if (!(await this.hasSpecialty(cmd.applicantId, shift.specialtyId)))
      return err(new DomainError("SPECIALTY_NOT_OWNED", "No tenés la especialidad requerida"));

    const transition = shift.postulate(cmd.applicantId);
    if (!transition.isOk) return err(transition.error);

    return ok(await this.repo.save(shift));
  }
}
```

- [ ] **Step 7: `ResolveReplacement.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export type ResolveAction = "CONFIRM" | "REJECT_POSTULATION" | "REJECT_REQUEST";

export interface ResolveCommand {
  shiftId: string;
  action: ResolveAction;
  coordinatorId: string;
  actorIsCoordinator: boolean;
}

export class ResolveReplacement {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(cmd: ResolveCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador resuelve reemplazos"));
    const shift = await this.repo.findById(cmd.shiftId);
    if (!shift) return err(new DomainError("SHIFT_NOT_FOUND", "Solicitud inexistente"));

    const transition =
      cmd.action === "CONFIRM" ? shift.confirm(cmd.coordinatorId)
      : cmd.action === "REJECT_POSTULATION" ? shift.rejectPostulation(cmd.coordinatorId)
      : shift.rejectRequest(cmd.coordinatorId);

    if (!transition.isOk) return err(transition.error);
    return ok(await this.repo.save(shift));
  }
}
```

- [ ] **Step 8: `AssignCompulsoryReplacement.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { ShiftReplacement } from "@shift-replacements/domain/entities/ShiftReplacement";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";
import { ShiftReplacementRepository } from "@shift-replacements/domain/ports/ShiftReplacementRepository";

export interface AssignCompulsoryCommand {
  actorIsCoordinator: boolean;
  coordinatorId: string;
  date: Date;
  specialtyId: string;
  requesterId: string;
  applicantId: string;
}

export class AssignCompulsoryReplacement {
  constructor(private readonly repo: ShiftReplacementRepository) {}

  async execute(cmd: AssignCompulsoryCommand): Promise<Result<ShiftReplacement, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador asigna compulsivos"));

    const created = await this.repo.create({
      date: cmd.date, requesterId: cmd.requesterId, specialtyId: cmd.specialtyId,
      applicantId: cmd.applicantId, state: RequestState.CONFIRMED, resolvedById: cmd.coordinatorId,
    });
    return ok(created);
  }
}
```

- [ ] **Step 9: Run todos los tests → PASS. Commit**

```bash
git add -A && git commit -m "feat(shift-replacements): repository port + lifecycle use cases"
```

### Task 15: Especialidades — entidad, puerto, schema y ABM

**Files:**
- Create: `src/modules/specialties/domain/{entities/Specialty,ports/SpecialtyRepository,schemas/specialty.schema}.ts`
- Create: `src/modules/specialties/application/use-cases/{CreateSpecialty,UpdateSpecialty,DeleteSpecialty,ListSpecialties}.ts`
- Create: `InMemorySpecialtyRepository.ts`
- Test: `...use-cases/SpecialtyAbm.test.ts`

- [ ] **Step 1: Test del ABM (solo coordinador, nombre único)**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { InMemorySpecialtyRepository } from "@specialties/infrastructure/persistence/InMemorySpecialtyRepository";
import { CreateSpecialty } from "@specialties/application/use-cases/CreateSpecialty";

describe("CreateSpecialty", () => {
  let repo: InMemorySpecialtyRepository;
  beforeEach(() => { repo = new InMemorySpecialtyRepository(); });

  it("solo el coordinador crea especialidades", async () => {
    const uc = new CreateSpecialty(repo);
    const denied = await uc.execute({ actorIsCoordinator: false, name: "Pediatría" });
    expect(denied.isOk).toBe(false);
    const okR = await uc.execute({ actorIsCoordinator: true, name: "Pediatría" });
    expect(okR.isOk).toBe(true);
  });

  it("rechaza nombre duplicado", async () => {
    const uc = new CreateSpecialty(repo);
    await uc.execute({ actorIsCoordinator: true, name: "Clínica" });
    const dup = await uc.execute({ actorIsCoordinator: true, name: "Clínica" });
    expect(dup.isOk).toBe(false);
    if (!dup.isOk) expect(dup.error.code).toBe("NAME_TAKEN");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implementar entidad `Specialty.ts`**

```ts
interface SpecialtyProps {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export class Specialty {
  private constructor(private props: SpecialtyProps) {}
  static fromPersistence(props: SpecialtyProps): Specialty { return new Specialty(props); }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get isActive(): boolean { return this.props.isActive; }

  rename(name: string): void { this.props.name = name; }
  updateDescription(description: string | null): void { this.props.description = description; }
  deactivate(): void { this.props.isActive = false; }
}
```

- [ ] **Step 4: Puerto `SpecialtyRepository.ts`**

```ts
import { Specialty } from "@specialties/domain/entities/Specialty";

export interface CreateSpecialtyData { name: string; description: string | null; }

export interface SpecialtyRepository {
  findById(id: string): Promise<Specialty | null>;
  findByName(name: string): Promise<Specialty | null>;
  create(data: CreateSpecialtyData): Promise<Specialty>;
  save(specialty: Specialty): Promise<Specialty>;
  delete(id: string): Promise<void>;
  list(): Promise<Specialty[]>;
}
```

- [ ] **Step 5: Schema `specialty.schema.ts`**

```ts
import { z } from "zod";

export const createSpecialtySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});
export type CreateSpecialtyInput = z.infer<typeof createSpecialtySchema>;

export const updateSpecialtySchema = createSpecialtySchema.extend({
  id: z.string().min(1),
});
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;
```

- [ ] **Step 6: `InMemorySpecialtyRepository.ts`**

```ts
import { Specialty } from "@specialties/domain/entities/Specialty";
import { CreateSpecialtyData, SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export class InMemorySpecialtyRepository implements SpecialtyRepository {
  private items: Specialty[] = [];
  private seq = 0;

  async findById(id: string): Promise<Specialty | null> {
    return this.items.find((s) => s.id === id) ?? null;
  }
  async findByName(name: string): Promise<Specialty | null> {
    return this.items.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async create(data: CreateSpecialtyData): Promise<Specialty> {
    const s = Specialty.fromPersistence({
      id: `s${++this.seq}`, name: data.name, description: data.description, isActive: true,
    });
    this.items.push(s);
    return s;
  }
  async save(specialty: Specialty): Promise<Specialty> {
    this.items = this.items.map((s) => (s.id === specialty.id ? specialty : s));
    return specialty;
  }
  async delete(id: string): Promise<void> {
    this.items = this.items.filter((s) => s.id !== id);
  }
  async list(): Promise<Specialty[]> { return [...this.items]; }
}
```

- [ ] **Step 7: `CreateSpecialty.ts`**

```ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { Specialty } from "@specialties/domain/entities/Specialty";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export interface CreateSpecialtyCommand {
  actorIsCoordinator: boolean;
  name: string;
  description?: string;
}

export class CreateSpecialty {
  constructor(private readonly repo: SpecialtyRepository) {}

  async execute(cmd: CreateSpecialtyCommand): Promise<Result<Specialty, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra especialidades"));
    if (await this.repo.findByName(cmd.name))
      return err(new DomainError("NAME_TAKEN", "Ya existe una especialidad con ese nombre"));

    const created = await this.repo.create({ name: cmd.name, description: cmd.description ?? null });
    return ok(created);
  }
}
```

- [ ] **Step 8: `UpdateSpecialty.ts`, `DeleteSpecialty.ts`, `ListSpecialties.ts`** (mismo patrón de autorización)

```ts
// UpdateSpecialty.ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { Specialty } from "@specialties/domain/entities/Specialty";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export interface UpdateSpecialtyCommand {
  actorIsCoordinator: boolean;
  id: string;
  name: string;
  description?: string;
}

export class UpdateSpecialty {
  constructor(private readonly repo: SpecialtyRepository) {}
  async execute(cmd: UpdateSpecialtyCommand): Promise<Result<Specialty, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra especialidades"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Especialidad inexistente"));
    const byName = await this.repo.findByName(cmd.name);
    if (byName && byName.id !== cmd.id)
      return err(new DomainError("NAME_TAKEN", "Ya existe una especialidad con ese nombre"));
    found.rename(cmd.name);
    found.updateDescription(cmd.description ?? null);
    return ok(await this.repo.save(found));
  }
}
```

```ts
// DeleteSpecialty.ts
import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export interface DeleteSpecialtyCommand { actorIsCoordinator: boolean; id: string; }

export class DeleteSpecialty {
  constructor(private readonly repo: SpecialtyRepository) {}
  async execute(cmd: DeleteSpecialtyCommand): Promise<Result<void, DomainError>> {
    if (!cmd.actorIsCoordinator)
      return err(new DomainError("FORBIDDEN", "Solo el coordinador administra especialidades"));
    const found = await this.repo.findById(cmd.id);
    if (!found) return err(new DomainError("NOT_FOUND", "Especialidad inexistente"));
    await this.repo.delete(cmd.id);
    return ok(undefined);
  }
}
```

```ts
// ListSpecialties.ts
import { Specialty } from "@specialties/domain/entities/Specialty";
import { SpecialtyRepository } from "@specialties/domain/ports/SpecialtyRepository";

export class ListSpecialties {
  constructor(private readonly repo: SpecialtyRepository) {}
  async execute(): Promise<Specialty[]> { return this.repo.list(); }
}
```

- [ ] **Step 9: Run → PASS. Commit**

```bash
git add -A && git commit -m "feat(specialties): entity, port, schemas and ABM use cases"
```

---

## FASE 3 — Infraestructura y Adaptadores

### Task 16: Mappers y repositorios Prisma

**Files:**
- Create: `src/modules/users/infrastructure/mappers/UserMapper.ts`
- Create: `src/modules/users/infrastructure/persistence/PrismaUserRepository.ts`
- Create: equivalentes para specialties y shift-replacements

- [ ] **Step 1: `UserMapper.ts`** (Prisma row → entidad de dominio)

```ts
import { User as PrismaUser } from "@prisma/client";
import { User } from "@users/domain/entities/User";
import { Role, isRole } from "@users/domain/enums/Role";

export const UserMapper = {
  toDomain(row: PrismaUser): User {
    const role: Role = isRole(row.role) ? row.role : Role.BASE_PROFESSIONAL;
    return User.fromPersistence({
      id: row.id, email: row.email, passwordHash: row.password,
      name: row.name, isActive: row.isActive, role,
    });
  },
};
```

- [ ] **Step 2: `PrismaUserRepository.ts`**

```ts
import { prisma } from "@shared/infrastructure/prisma/client";
import { User } from "@users/domain/entities/User";
import { CreateUserData, UserRepository } from "@users/domain/ports/UserRepository";
import { UserMapper } from "@users/infrastructure/mappers/UserMapper";

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }
  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }
  async create(data: CreateUserData): Promise<User> {
    const row = await prisma.user.create({
      data: { email: data.email, password: data.passwordHash, name: data.name, role: data.role },
    });
    return UserMapper.toDomain(row);
  }
  async activateWithSpecialties(userId: string, specialtyIds: string[]): Promise<User> {
    const row = await prisma.$transaction(async (tx) => {
      await tx.userSpecialty.deleteMany({ where: { userId } });
      await tx.userSpecialty.createMany({
        data: specialtyIds.map((specialtyId) => ({ userId, specialtyId })),
      });
      return tx.user.update({ where: { id: userId }, data: { isActive: true } });
    });
    return UserMapper.toDomain(row);
  }
  async listInactive(): Promise<User[]> {
    const rows = await prisma.user.findMany({ where: { isActive: false } });
    return rows.map(UserMapper.toDomain);
  }
}
```

- [ ] **Step 3: Repositorios Prisma de specialties y shift-replacements** (mismo patrón: mapper + implementación del puerto). Para `ShiftReplacement`, `save` actualiza `state`, `applicantId`, `resolvedById`.

- [ ] **Step 4: Crear un helper `hasSpecialty` Prisma** en `src/modules/users/infrastructure/persistence/prismaHasSpecialty.ts`

```ts
import { prisma } from "@shared/infrastructure/prisma/client";

export const prismaHasSpecialty = async (userId: string, specialtyId: string): Promise<boolean> => {
  const link = await prisma.userSpecialty.findUnique({
    where: { userId_specialtyId: { userId, specialtyId } },
  });
  return link !== null;
};
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(infra): prisma repositories and mappers"
```

### Task 17: Server Actions (adaptadores de entrada)

**Files:**
- Create: `src/modules/users/presentation/actions/{registerUser,activateUser}.ts`
- Create: `src/modules/specialties/presentation/actions/specialtyActions.ts`
- Create: `src/modules/shift-replacements/presentation/actions/shiftActions.ts`

- [ ] **Step 1: Action `registerUser`** (valida con Zod, instancia repo + caso de uso, mapea Result a respuesta serializable)

```ts
"use server";

import argon2 from "argon2";
import { registerUserSchema } from "@users/domain/schemas/user.schema";
import { RegisterUser } from "@users/application/use-cases/RegisterUser";
import { PrismaUserRepository } from "@users/infrastructure/persistence/PrismaUserRepository";

export interface ActionResult { ok: boolean; error?: string }

export async function registerUserAction(formData: unknown): Promise<ActionResult> {
  const parsed = registerUserSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const useCase = new RegisterUser(
    new PrismaUserRepository(),
    (plain) => argon2.hash(plain),
  );
  const result = await useCase.execute(parsed.data);
  return result.isOk ? { ok: true } : { ok: false, error: result.error.message };
}
```

- [ ] **Step 2: Actions de activación, especialidades y reemplazos** siguiendo el mismo contrato `ActionResult`: validar con Zod → instanciar caso de uso → mapear `Result`. La autorización (`actorIsCoordinator`, `isActive`) se resuelve desde la sesión, no desde el body.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(presentation): server actions as input adapters"
```

---

## FASE 4 — Presentación y UI

### Task 18: Configurar Redux Toolkit

**Files:**
- Create: `src/shared/presentation/store/{store,hooks}.ts`
- Create: `src/modules/users/presentation/store/auth.slice.ts`
- Create: `src/modules/shift-replacements/presentation/store/worklist.slice.ts`
- Create: `src/app/providers.tsx`

- [ ] **Step 1: `auth.slice.ts`**

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Role } from "@users/domain/enums/Role";

interface AuthState {
  userId: string | null;
  name: string | null;
  role: Role | null;
  isActive: boolean;
}

const initialState: AuthState = { userId: null, name: null, role: null, isActive: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthState>) { return action.payload; },
    clearSession() { return initialState; },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
```

- [ ] **Step 2: `store.ts` y `hooks.ts`**

```ts
// store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@users/presentation/store/auth.slice";
import worklistReducer from "@shift-replacements/presentation/store/worklist.slice";

export const store = configureStore({
  reducer: { auth: authReducer, worklist: worklistReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```ts
// hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { RootState, AppDispatch } from "@shared/presentation/store/store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

- [ ] **Step 3: `worklist.slice.ts`** (estado de las ofertas visibles + filtros de especialidad).

- [ ] **Step 4: `providers.tsx`** envuelve la app con `<Provider store={store}>` y se monta en `layout.tsx`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(ui): redux toolkit store, slices and provider"
```

### Task 19: Componentes de design system (Tailwind)

**Files:** Create: `src/shared/presentation/ui/{Button,Input,Badge,Card,FieldError}.tsx`

- [ ] **Step 1: `Button.tsx`** con estados (loading deshabilita, `cursor-pointer`, focus ring visible, min-height táctil 44px). **Step 2: `Input.tsx`** con label visible + `FieldError`. **Step 3: `Badge.tsx`** por estado (`OPEN`/`POSTULATED`/`CONFIRMED`/`REJECTED`) usando color **+ texto** (no solo color). **Step 4: Commit.**

```bash
git add -A && git commit -m "feat(ui): tailwind design-system primitives"
```

> Antes de implementar esta tarea, correr la skill ui-ux-pro-max `--domain ux "accessibility forms loading"` y aplicar §1–§3 de la Quick Reference (contraste 4.5:1, touch targets, focus states).

### Task 20: Formularios con React Hook Form + Zod

**Files:**
- Create: `src/modules/users/presentation/components/RegisterForm.tsx`
- Create: `src/modules/specialties/presentation/components/SpecialtyForm.tsx`
- Create: `src/modules/shift-replacements/presentation/components/RequestAbsenceForm.tsx`

- [ ] **Step 1: `RegisterForm.tsx`** (cliente)

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, RegisterUserInput } from "@users/domain/schemas/user.schema";
import { registerUserAction } from "@users/presentation/actions/registerUser";

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } =
    useForm<RegisterUserInput>({ resolver: zodResolver(registerUserSchema) });

  const onSubmit = handleSubmit(async (data) => {
    const res = await registerUserAction(data);
    if (!res.ok) setError("root", { message: res.error });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Nombre</label>
        <input id="name" {...register("name")} className="w-full rounded border px-3 py-2" />
        {errors.name && <p role="alert" className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" type="email" {...register("email")} className="w-full rounded border px-3 py-2" />
        {errors.email && <p role="alert" className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
        <input id="password" type="password" {...register("password")} className="w-full rounded border px-3 py-2" />
        {errors.password && <p role="alert" className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting}
        className="min-h-[44px] w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        {isSubmitting ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: `SpecialtyForm.tsx` y `RequestAbsenceForm.tsx`** con el mismo patrón (`zodResolver`, labels visibles, error bajo el campo, botón con loading).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(ui): RHF + zod forms (register, specialty, absence)"
```

### Task 21: Páginas y worklists

**Files:**
- Create/Modify: `src/app/(auth)/register/page.tsx`, `src/app/(dashboard)/worklist/page.tsx`, `src/app/(dashboard)/coordinator/page.tsx`, `src/app/(dashboard)/specialties/page.tsx`

- [ ] **Step 1: Página de registro** renderiza `<RegisterForm />`. **Step 2: Worklist de Especialidad** lista ofertas `OPEN` de las especialidades del profesional con botón "Postularme". **Step 3: Worklist General** lista `POSTULATED` con acciones confirmar / rechazar postulación / rechazar solicitud + alta de compulsivo. **Step 4: ABM Especialidades.** **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(ui): pages and worklists"
```

---

## Self-Review

**Spec coverage:**
- Registro inactivo → Task 8 (invariante) + Task 11 (RegisterUser) + Task 20 (RegisterForm). ✅
- Validación/activación con especialidades → Task 12 + Task 16 (`activateWithSpecialties` transaccional). ✅
- Solicitud de ausencia (especialidad propia) → Task 14 (`RequestAbsence` + `hasSpecialty`). ✅
- Postulación (misma especialidad) → Task 14 (`PostulateForReplacement`). ✅
- Resolución (confirmar / rechazar postulación → OPEN / rechazar solicitud → REJECTED) → Task 13 (entidad) + Task 14 (`ResolveReplacement`). ✅
- Reemplazo compulsivo (nace CONFIRMED) → Task 14 (`AssignCompulsoryReplacement`). ✅
- ABM especialidades → Task 15. ✅
- Stack completo (Next/TS/Tailwind/Redux/RHF+Zod/Prisma/SQLite) → Tasks 1–5, 18–21. ✅
- Sin enums Prisma → String + enum dominio → Task 5 (schema) + Task 7/13 (enums) + mappers Task 16. ✅

**Placeholder scan:** Tasks 16, 17, 19, 20(step2), 21 describen variantes "mismo patrón" remitiendo a código completo ya mostrado en la misma fase. Al ejecutar cada fase con confirmación previa, esas variantes se materializan con código completo antes de implementar.

**Type consistency:** `Result<T,E>` con `isOk`; `HasSpecialty` reutilizado entre `RequestAbsence` y `PostulateForReplacement`; `ActionResult` uniforme en todas las actions; enums como objeto `as const` + type. Verificado.

---

## Execution Handoff

Plan guardado en `docs/superpowers/plans/2026-06-13-juncal-shift-management.md`.

Ejecución **fase por fase con confirmación** (según pedido del usuario): se ejecuta una fase, se valida, y se pide confirmación antes de la siguiente.
