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
    - [x] Fecha planificada en tareas (opcional, validada)
    - [x] Duración estimada en tareas (opcional, validada)
    - [ ] Fecha objetivo en meta
    - [ ] Prioridad (tarea y/o meta)
    - [ ] Cambiar estado de meta (pausada/completada/abandonada)
- [ ] **Fase 2 — Tiempo**
  - [x] Sesiones de tiempo real (cronómetro manual, iniciar/detener) — total acumulado por tarea
  - [ ] Historial detallado de sesiones (lista, no solo el total)
  - [ ] Pomodoro con duraciones configurables de trabajo/descanso
  - [ ] Manejo robusto de sesión activa al cerrar la app (persistir en background)
- [ ] **Fase 3 — Planificación:** disponibilidad, horarios, reprogramación
- [ ] **Fase 4 — Adaptación**
  - [x] Comparación estimado vs. real por tarea individual
  - [x] Progreso agregado por meta (estimado vs. real, sumando todas sus tareas)
  - [ ] Detección de sobrecarga
  - [ ] Sugerencias de ajuste
  - [ ] Modo mínimo
  - [ ] Días libresmínimo, días libres
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

  ### 2026-08-19 — Historia 5: Fecha planificada en tareas

- Agregado campo opcional `fecha_planificada` a `tareas` vía `ALTER TABLE`
  (primera migración sobre tabla existente, no tabla nueva).
- Validación simple con regex (`AAAA-MM-DD`), sin librería de fechas ni
  date picker — texto plano por ahora.
- Verificado que tareas creadas antes de la migración (Historia 4)
  sobreviven intactas, con `fecha_planificada = NULL`.
- Validados los 5 criterios de aceptación de
  `docs/historias/historia-005-fecha-planificada-tareas.md`.
- Merge a main (--ff-only): commit `f70d4d0`.
- Siguiente: por definir — queda pendiente Áreas, o continuar
  desglosando "Estados, fechas, prioridades" (fecha objetivo en meta,
  prioridad, o cambio de estado de meta).

  ### 2026-08-19 — Historia 6: Duración estimada en tareas

- Agregado campo opcional `duracion_estimada_minutos` a `tareas` vía
  `ALTER TABLE` (segunda migración sobre tabla existente).
- Validación con regex (entero positivo, rechaza 0/decimales/negativos),
  sin librería adicional.
- Verificado que tareas de historias 4 y 5 (con y sin fecha planificada)
  sobreviven intactas tras la migración.
- Con esto quedan capturados los dos lados de la comparación futura
  planificado-vs-real (fecha + duración estimada), que es el prerequisito
  para el sistema adaptativo (Fase 4) una vez exista tiempo real
  trabajado (Fase 2).
- Validados los 6 criterios de aceptación de
  `docs/historias/historia-006-duracion-estimada-tareas.md`.
- Merge a main (--ff-only): commit `bfd5a55`.
- Siguiente: por definir — evaluar saltar a un timer mínimo de Fase 2
  (registrar una sesión de tiempo real ligada a una tarea) en vez de
  terminar todo el pulido restante de Fase 1.

  ### 2026-08-19 — Historia 7: Sesiones de tiempo real

- Implementado cronómetro manual (iniciar/detener) ligado a una tarea,
  tabla `sesiones` con FK `tarea_id`.
- Solo una sesión activa a la vez en toda la app (decisión deliberada,
  simplicidad sobre paralelismo).
- Sesiones que redondean a 0 minutos (menos de 30s) se descartan, no se
  guardan.
- `tiempoTotalPorTarea` suma en SQL (`SUM`), no en JavaScript.
- Limitación conocida y aceptada: una sesión activa se pierde si se cierra
  la app sin detenerla (sin persistencia de background todavía).
- Validados los 7 criterios de aceptación de
  `docs/historias/historia-007-sesiones-tiempo-real.md`.
- Merge a main (--ff-only): commit `5488547`.
- Con esto queda completo el modelo de datos central del producto:
  Idea → Meta → Objetivo → Tarea → Sesión, con fecha planificada,
  duración estimada, y tiempo real capturados. El siguiente paso natural
  es empezar a *usar* esos datos (comparación planificado-vs-real,
  Fase 4), o seguir puliendo Fase 1/2 primero — a decidir.

  ### 2026-08-19 — Tarea técnica 1: Refactor de App.tsx en componentes

- `App.tsx` había crecido a 666 líneas tras 7 historias. Dividido en
  `screens/` (IdeasScreen, MetasScreen, MetaDetalleScreen,
  ObjetivoDetalleScreen, FormularioTarea) + estilos compartidos.
  `App.tsx` quedó en 185 líneas como orquestador delgado (navegación +
  sesión activa).
- Regla aplicada: cero cambios de comportamiento. Se detectó y corrigió
  una desviación real durante la verificación (los borradores de
  formulario se perdían al navegar entre pantallas, porque cada screen
  monta/desmonta) — el estado de los 3 formularios se subió a `App.tsx`
  para preservar el comportamiento original.
- Lección de proceso: vale la pena declarar explícitamente "cero cambios
  de comportamiento" en tareas de refactor — permitió detectar una
  regresión real que un check superficial no habría atrapado.
- Verificada regresión completa de las 7 historias anteriores + el fix
  de drafts, todo sobre la instalación existente.
- Merge a main (--ff-only): commit `bf0802b`.
- `db/*.ts` sin cambios en todo este proceso.

### 2026-08-19 — Tarea técnica 2: Pulido de UX (tras revisión de capturas reales)

- Revisión de UX basada en capturas reales de la app (no solo criterios
  aislados) tras completar Historias 1-7 + refactor. Se detectaron y
  corrigieron 3 problemas:
  - Ruido visual: se quitó la fecha de creación de las listas de Ideas,
    Objetivos y Tareas (el dato sigue en BD, solo se dejó de mostrar).
  - Pérdida de contexto jerárquico: agregado breadcrumb en el detalle de
    objetivo ("Meta › Objetivo") y títulos más claros en el detalle de
    meta, con "Volver a X" en vez de solo "Volver".
  - Acción de eliminar invisible: agregado ícono 🗑️ visible en ideas y
    tareas, además del long-press existente.
- Desviación no planeada detectada durante la implementación: como
  Tareas nunca tuvo función de eliminar (fuera de alcance en Historia 4),
  hubo que crear `eliminarTarea` desde cero para cumplir la instrucción.
  Como esto borra en cascada las sesiones de tiempo asociadas, se agregó
  una advertencia explícita cuando la tarea tiene tiempo registrado
  (mensaje con minutos exactos, mismo cálculo que el "Total: X min" ya
  visible).
- El ícono de configuración (⚙️) y el warning de "SafeAreaView
  deprecated" se confirmaron como artefactos del menú de desarrollo de
  Expo Go, no del producto — no requirieron cambios.
- Lección de proceso: al escribir instrucciones para OpenCode, verificar
  contra las historias/criterios ya existentes antes de asumir que una
  funcionalidad (como "eliminar") ya existe en todas las entidades
  parecidas — el supuesto incorrecto generó una feature no planeada que
  hubo que revisar aparte.
- Merge a main (--ff-only): commit `8d3bfbd` (sobre `571fccc`).

### 2026-08-19 — Historia 8: Comparación estimado vs. real por tarea

- Primera entrega real de la promesa central del producto: comparar
  tiempo planificado contra tiempo real, aunque sea al nivel más simple
  (una tarea individual, sin agregados todavía).
- Sin migración de BD — cálculo puro sobre datos que ya existían
  (`duracion_estimada_minutos` + `tiempoTotalPorTarea`).
- Tono verificado como neutro: solo signo numérico (+15 min / -10 min /
  0 min), sin lenguaje de culpa ni alertas — coherente con el principio
  de "no castigar al usuario imperfecto" del documento original.
- Validadas las 6 combinaciones de datos/dirección de
  `docs/historias/historia-008-comparacion-estimado-real.md`.
- Merge a main (--ff-only): commit `b527ac2`.
- Con esto, el modelo de datos completo (Idea→Meta→Objetivo→Tarea→Sesión)
  ya entrega valor de punta a punta, aunque sea en su forma más mínima.
  Siguiente: por definir — opciones abiertas son historial de sesiones,
  Pomodoro configurable, agregación de la comparación a nivel de
  meta/objetivo, o retomar el resto de Fase 1 (Áreas, prioridad, fecha
  objetivo de meta, cambiar estado de meta).