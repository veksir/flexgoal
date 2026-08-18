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

- [ ] **Fase 1 — Fundamentos:** ideas, metas, áreas, objetivos, tareas,
      estados, fechas, prioridades, DB local
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

_(Ir agregando aquí decisiones puntuales, bugs resueltos con hash de commit,
y lecciones de workflow — mismo patrón que en HydrApp.)_
