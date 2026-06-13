# Graph Report - juncal  (2026-06-13)

## Corpus Check
- 18 files · ~9,148 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 151 nodes · 137 edges · 23 communities (17 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `066da27e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `FASE 2 — Dominio y Casos de Uso (Core)` - 11 edges
3. `Juncal — Gestión de Guardias y Reemplazos — Especificación Funcional` - 9 edges
4. `Juncal — Gestión de Guardias — Implementation Plan` - 8 edges
5. `scripts` - 7 edges
6. `3. Entidades` - 7 edges
7. `paths` - 6 edges
8. `FASE 1 — Scaffolding, Arquitectura y Base de Datos` - 6 edges
9. `FASE 4 — Presentación y UI` - 5 edges
10. `"User"` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (23 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (18): Execution Handoff, FASE 2 — Dominio y Casos de Uso (Core), FASE 3 — Infraestructura y Adaptadores, File Structure, Juncal — Gestión de Guardias — Implementation Plan, Self-Review, Task 10: Puerto UserRepository, Task 11: Caso de uso RegisterUser (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (15): 1. Objetivo, 2. Stack tecnológico (obligatorio), 3. Entidades, 4. Máquina de estados de ShiftReplacement, 5. Flujos de trabajo, 6. Reglas de autorización, 7. Vistas (Presentation), 8. Out of scope (esta iteración) (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (14): devDependencies, dotenv, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, @types/node (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (13): dependencies, argon2, better-sqlite3, @hookform/resolvers, next, @prisma/adapter-better-sqlite3, @prisma/client, react (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (7): FASE 1 — Scaffolding, Arquitectura y Base de Datos, Schema (`prisma/schema.prisma`), Task 1: Scaffold del proyecto Next.js, Task 2: Dependencias del stack, Task 3: Configurar Vitest, Task 4: Path aliases por módulo, Task 5: Prisma + schema + migración

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): paths, @/*, @shared/*, @shift-replacements/*, @specialties/*, @users/*

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): installedAt, memoryDbPath, projectRoot, sourceRoot, version

### Community 9 - "Community 9"
Cohesion: 0.80
Nodes (4): "ShiftReplacement", "Specialty", "User", "UserSpecialty"

### Community 10 - "Community 10"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (5): FASE 4 — Presentación y UI, Task 18: Configurar Redux Toolkit, Task 19: Componentes de design system (Tailwind), Task 20: Formularios con React Hook Form + Zod, Task 21: Páginas y worklists

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (3): Mandatory Workflow (ENFORCED), PMC Commands, Session Autostart

### Community 13 - "Community 13"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **111 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 3` to `Community 5`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 4` to `Community 5`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `Juncal — Gestión de Guardias — Implementation Plan` connect `Community 0` to `Community 11`, `Community 6`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._