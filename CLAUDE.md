# flexgoal — Estado del proyecto

> Este archivo es la fuente de verdad del proyecto: estado actual, decisiones
> resueltas, arquitectura y roadmap. Se mantiene fuera del historial público
> de commits cuando contiene contexto conversacional; el contenido estructural
> (como este) puede vivir en el repo.

## Qué es

Planificador adaptativo de metas, local-first, mobile-first. Ver
`docs/TDD.md` para el diseño técnico completo.

## Workflow de desarrollo

- Una rama por feature (`feature/nombre-corto`).
- Claude genera `.patch` files desde un clon sandboxed cuando se necesita
  implementación asistida; se aplican localmente.
- OpenCode maneja verificación de build y commits convencionales
  (`feat:`, `fix:`, `docs:`, `chore:`...).
- Merge a `main` solo con `--ff-only`, tras confirmación visual/funcional.
- Kevin actúa como arquitecto y control de calidad: planifica, verifica y
  documenta; delega implementación.

## Decisiones de arquitectura resueltas

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](docs/adr/ADR-001-local-first.md) | Enfoque local-first como base arquitectónica | ✅ Aprobado |
| [ADR-002](docs/adr/ADR-002-base-de-datos-local.md) | SQLite (`expo-sqlite`) como persistencia local | ✅ Aprobado (spike: 28/30 vs. 21/30 WatermelonDB) |
| [ADR-003](docs/adr/ADR-003-ia-local.md) | Runtime/modelo de IA local | ⏳ Pendiente de spike |
| [ADR-004](docs/adr/ADR-004-ia-hibrida.md) | Motor determinístico + LLM (híbrido) | ✅ Aprobado (principio de diseño) |

## Roadmap (resumen)

- [ ] **Fase 1 — Fundamentos**
  - [x] Bandeja de ideas (crear, listar, eliminar) — persistencia SQLite validada
  - [x] Convertir idea en meta
  - [ ] Áreas
  - [x] Objetivos — jerarquía Meta→Objetivo con aislamiento por meta_id validado
  - [x] Tareas — con estado pendiente/completada, navegación de 3 niveles validada
  - [ ] Estados, fechas, prioridades
- [ ] **Fase 2 — Tiempo:** Pomodoro, time tracking, sesiones, historial
- [ ] **Fase 3 — Planificación:** disponibilidad, horarios, reprogramación
- [ ] **Fase 4 — Adaptación:** plan vs. realidad, modo mínimo, días libres
- [ ] **Fase 5 — IA:** creación de metas en lenguaje natural, análisis de comportamiento
- [ ] **Fase 6 — Sincronización:** cuentas, backup, multi-dispositivo

## Explícitamente fuera de alcance (v1)

Red social, rankings, gamificación excesiva, chat de IA independiente,
colaboración multiusuario, marketplace, integraciones masivas, servidor
obligatorio, IA obligatoria, dependencia de APIs de pago.

## Notas de sesiones

### 2026-08-19 — Historia 1: Bandeja de ideas

- Implementada bandeja de ideas con persistencia SQLite (`expo-sqlite`).
- Validados los 5 criterios de aceptación de `docs/historias/historia-001-bandeja-ideas.md`,
  incluyendo persistencia real tras cierre completo de la app en Expo Go (SDK 57,
  build específico vía expo.dev/go — Play Store aún no tenía SDK 57 disponible).
- Merge a main (--ff-only): commit `1481580`.
- Siguiente: convertir una idea en meta (historia 2).

### 2026-08-19 — Historia 2: Convertir idea en meta

- Implementada conversión de idea a meta (`convertirIdeaEnMeta`), con
  transacción atómica vía `withExclusiveTransactionAsync` (expo-sqlite 57.0.1) —
  verificado que no puede quedar una idea eliminada sin su meta creada.
- Nueva tabla `metas` (nombre, estado, creado_en) — solo campos mínimos;
  fecha objetivo, prioridad, categoría y descripción quedan para la
  historia "Estados, fechas, prioridades".
- Toggle simple Ideas/Metas con `useState`, sin librería de navegación
  (no se justifica todavía con dos vistas).
- Validados los 5 criterios de aceptación de
  `docs/historias/historia-002-convertir-idea-meta.md`, incluyendo
  persistencia real tras cierre completo de la app.
- Merge a main (--ff-only): commit `f0d6011`.
- Siguiente: Áreas (siguiente ítem del roadmap de Fase 1).

### 2026-08-19 — Historia 3: Objetivos dentro de una meta

- Implementados Objetivos como hijos de Meta (tabla `objetivos`, FK `meta_id`
  con `PRAGMA foreign_keys = ON`).
- Navegación al detalle de meta sin librería externa (estado local
  `metaSeleccionada`).
- Validado el aislamiento por `meta_id` (criterio más delicado de esta
  historia): objetivos de metas distintas no se mezclan, ni antes ni
  después de cerrar/reabrir la app.
- Validados los 5 criterios de aceptación de
  `docs/historias/historia-003-objetivos.md`.
- Merge a main (--ff-only): commit `26cf316`.
- Siguiente: Tareas (siguiente nivel de la jerarquía).

### 2026-08-19 — Historia 4: Tareas dentro de un objetivo

- Implementadas Tareas como hijas de Objetivo (tabla `tareas`, FK
  `objetivo_id`), con estado pendiente/completada (a diferencia de
  Objetivos, aquí sí se incluyó estado desde el inicio porque es
  necesario para que la tarea cumpla su función).
- Navegación de 3 niveles (Metas → Objetivo → Tareas) con dos estados
  locales (`metaSeleccionada`, `objetivoSeleccionado`), sin librería de
  navegación. "Volver" respeta el nivel anterior correctamente.
- Toggle de estado verificado como persistente en SQLite (no solo en
  memoria de React) — cada cambio relee desde la BD.
- Validados los 6 criterios de aceptación de
  `docs/historias/historia-004-tareas.md`.
- Merge a main (--ff-only): commit `1da209a`.
- Siguiente: Áreas, o cerrar Fase 1 con "Estados, fechas, prioridades"
  (fecha objetivo, prioridad y categoría/área para Meta; fecha planificada
  y duración estimada para Tarea).