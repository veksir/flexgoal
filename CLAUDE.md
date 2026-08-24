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

- [x] **Fase 1 — Fundamentos**
  - [x] Bandeja de ideas (crear, listar, eliminar) — persistencia SQLite validada
  - [x] Convertir idea en meta
  - [x] Áreas — categoría/área textual opcional por meta (historia 13)
  - [x] Objetivos — jerarquía Meta→Objetivo con aislamiento por meta_id validado
  - [x] Tareas — con estado pendiente/completada, navegación de 3 niveles validada
  - [x] Estados, fechas, prioridades
    - [x] Fecha planificada en tareas (opcional, validada)
    - [x] Duración estimada en tareas (opcional, validada)
    - [x] Fecha objetivo en meta
    - [x] Prioridad (tarea y/o meta) — Alta/Media/Baja opcional, selector de botones (historia 14)
    - [x] Cambiar estado de meta (pausada/completada/abandonada) — visual atenuado en lista
- [x] **Fase 2 — Tiempo**
  - [x] Sesiones de tiempo real (cronómetro manual, iniciar/detener) — total acumulado por tarea
  - [x] Historial detallado de sesiones (modal con lista, ordenado por fecha)
  - [x] Pomodoro con duraciones configurables de trabajo/descanso
  - [x] Manejo robusto de sesión activa al cerrar la app (persistir en background)
- [x] **Fase 3 — Planificación**
  - [x] Vista "Hoy" (tareas pendientes con fecha de hoy o vencidas, de todas las metas)
  - [x] Disponibilidad declarada
  - [x] Horarios
  - [x] Reprogramación
- [ ] **Fase 4 — Adaptación**
  - [x] Comparación estimado vs. real por tarea individual
  - [x] Progreso agregado por meta (estimado vs. real, sumando todas sus tareas)
  - [x] Detección de sobrecarga
  - [ ] Sugerencias de ajuste
  - [ ] Modo mínimo
  - [ ] Días libre mínimo, días libres
- [ ] **Fase 5 — IA:** creación de metas en lenguaje natural, análisis de comportamiento
- [ ] **Fase 6 — Sincronización:** cuentas, backup, multi-dispositivo
- [ ] **Backlog:** editar una tarea ya creada (hoy solo se puede eliminar y recrear) — detectado durante pruebas de Historia 19, sin urgencia inmediata

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

  ### 2026-08-19 — Historia 10: Cambiar estado de una meta

- Agregado `actualizarEstadoMeta` (UPDATE simple, sin migración — la
  columna `estado` ya existía desde Historia 2).
- UI de 4 botones en el detalle de meta (Activa/Pausada/Completada/
  Abandonada), con el actual resaltado.
- Metas no activas se muestran atenuadas (gris) en la lista, sin
  ocultarse.
- Cambio siempre manual, sin lógica automática (coherente con "el
  usuario decide" del documento original).
- Validados los 4 criterios de aceptación de
  `docs/historias/historia-010-cambiar-estado-meta.md`.
- Merge a main (--ff-only): commit `14b4a6e`.
- Con esto se cierra casi por completo el pulido de Fase 1 — solo
  quedan Áreas, prioridad y fecha objetivo de meta.

  ### 2026-08-19 — Historia 11: Vista "Hoy"

- Primera implementación de "¿qué debería hacer ahora?" — tareas
  pendientes con fecha de hoy o vencidas, agregadas de todas las metas
  en un solo lugar, sin necesidad de navegar la jerarquía.
- Ahora es la vista por defecto al abrir la app (antes era Ideas).
- Reutiliza la lógica de sesión y de alternar estado ya existentes, sin
  duplicar código.
- Validados los 6 criterios de `docs/historias/historia-011-vista-hoy.md`.

### 2026-08-19 — Tarea técnica 3: Suite de pruebas automatizadas

- Refactor de inyección de dependencia en toda `db/*.ts`: las funciones
  reciben la conexión de base de datos como parámetro en vez de
  importarla internamente, permitiendo probarlas con `node:sqlite` sin
  necesitar Expo Go ni dispositivo.
- 34 pruebas automatizadas (`npm test`, en `app/db/__tests__/`) cubriendo
  aislamiento por FK, atomicidad de conversión idea→meta, validaciones de
  fecha/duración, descarte de sesiones cortas, suma de tiempo total,
  progreso agregado por meta, filtrado/orden de la vista Hoy, y que las
  migraciones no rompan datos existentes.
- Cambio de proceso a partir de ahora: la verificación manual en
  dispositivo se reduce a lo genuinamente visual (que se vea y se sienta
  bien) — toda la lógica de datos la cubren las pruebas automatizadas,
  no listas largas de pasos manuales.
- Merge a main (--ff-only), junto con la Historia 11 (misma rama):
  commit `d76a59d`.

  ### 2026-08-19 — Historia 12: Historial de sesiones de una tarea

- Agregado `listarSesionesPorTarea` + modal nativo en el detalle de
  objetivo que muestra el detalle de cada sesión (no solo el total).
- 2 pruebas automatizadas nuevas (orden DESC, tarea sin sesiones →
  vacío) — 36 pruebas totales.
- **Nota de proceso:** esta historia se mergeó SIN verificación visual
  en dispositivo (batería descargada). La lógica de datos está cubierta
  por pruebas automatizadas, pero el comportamiento visual del modal
  (abrir, cerrar, que no se pierda el estado de la pantalla al volver)
  no se confirmó a mano. Si algo se ve raro con el modal, revisar aquí
  primero.
- Merge a main (--ff-only): commit `0eead68`.

### 2026-08-20 — Historia 13: Categoría/área en metas

- Agregado campo opcional `categoria` a `metas` vía `ALTER TABLE`
  (`DATABASE_VERSION` 7 → 8).
- Nueva función `actualizarCategoriaMeta` (patrón `actualizarEstadoMeta`);
  `crearMeta` acepta `categoria?: string | null`. No existe ni se inventó
  `actualizarMeta` genérica (premisa falsa de la instrucción original,
  corregida antes de implementar).
- Corrección de contexto importante de esta historia: **no existe un
  formulario de crear/editar meta** — las metas se crean solo por
  conversión de idea (sin inputs), y el único punto de edición de una
  meta es `MetaDetalleScreen`. Por eso la UI quedó ahí (input "Categoría
  (opcional)" + guardar, vaciarlo → `NULL`), y la creación siempre deja
  `categoria = NULL`. El doc `historia-013.md` refleja esta realidad.
- También se corrigió una infraestructura de tests: `aplicarMigraciones`
  en `testDb.ts` re-ejecutaba todas las migraciones <= target en cada
  llamada; ahora es incremental (respeta `user_version`), igual que el
  `migrate()` real de `database.ts`. Sin esto no existía forma de probar
  supervivencia a través de un salto de versión con `ALTER TABLE`.
- 5 pruebas nuevas (4 en metas + 1 de supervivencia de migración) — 41
  pruebas totales, todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `839bfc0`.
- Siguiente: por definir — queda pendiente el resto de "Estados, fechas,
  prioridades" (fecha objetivo en meta, prioridad en tarea/meta), o
  avanzar Fase 2 (Pomodoro, persistencia de sesión activa en background).

### 2026-08-20 — Historia 14: Prioridad en metas y tareas

- Migración `DATABASE_VERSION` 8 → 9: `ALTER TABLE metas ADD COLUMN
  prioridad TEXT` y `ALTER TABLE tareas ADD COLUMN prioridad TEXT`.
- Nuevo type `Prioridad = 'alta' | 'media' | 'baja'` en `db/tareas.ts`,
  reutilizado por `Meta.prioridad` y `Tarea.prioridad`.
- `crearTarea` acepta 5º parámetro opcional `prioridad?: Prioridad | null`.
  `actualizarPrioridadMeta` en `metas.ts` (mismo patrón que
  `actualizarEstadoMeta` y `actualizarCategoriaMeta`).
- UI: selector de 3 botones (Alta/Media/Baja) en `MetaDetalleScreen`
  (igual que el de estado, se guarda al presionar) y en `FormularioTarea`
  (toggleable — presionar de nuevo lo deselecciona, satisface criterio 5
  de poder crear tarea sin prioridad). El estado de prioridad del
  formulario se sube a `App.tsx` (igual que los otros borradores) para
  preservarlo al navegar.
- Metas con prioridad se muestran en `MetasScreen` como
  "Nombre · Categoría · Prioridad" (solo lo que tenga asignado).
  Tareas con prioridad se muestran en el detalle de objetivo como
  "Nombre — Fecha — Duración — Prioridad".
- 9 pruebas nuevas (4 en metas, 3 en tareas, 1 supervivencia, 1
  actualización de test existente) — 50 pruebas totales, todas verdes
  + tsc sin errores.
- Merge a main (--ff-only): commit `983f5f4`.
- Siguiente: por definir — queda pendiente "Fecha objetivo en meta"
  (único ítem restante de Fase 1), o avanzar Fase 2 (Pomodoro,
  persistencia de sesión activa en background).

### 2026-08-20 — Historia 15: Fecha objetivo en meta

- Agregado campo opcional `fecha_objetivo` a `metas` vía `ALTER TABLE`
  (`DATABASE_VERSION` 9 → 10).
- Nueva función `actualizarFechaObjetivoMeta` en `metas.ts` (mismo patrón
  que `actualizarEstadoMeta`, `actualizarCategoriaMeta` y
  `actualizarPrioridadMeta`). Validación con `esFechaValida` reutilizada
  de `db/tareas.ts`.
- UI: input "Fecha objetivo (AAAA-MM-DD, opcional)" en
  `MetaDetalleScreen`, con validación de formato, precargado con el
  valor actual, y opción de vaciarlo (→ `NULL`). Se muestra junto al
  nombre en `MetasScreen` solo si no es `NULL`.
- Con esto se cierra Fase 1 (Fundamentos) — solo queda pulido de UX
  general diferido para el final.
- 5 pruebas nuevas (3 en metas, 2 actualizaciones en migraciones) — 53
  pruebas totales, todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `dba780e`.

### 2026-08-20 — Historia 16: Persistencia de sesión activa

- Nueva tabla `sesion_activa` (migración `DATABASE_VERSION` 10 → 11),
  separada de `sesiones` existente. Enfoque "sin fila = sin sesión
  activa": se inserta al iniciar, se borra al finalizar.
- 3 nuevas funciones en `db/sesiones.ts`: `iniciarSesionActiva`,
  `obtenerSesionActiva`, `finalizarSesionActiva`. La última reutiliza
  la lógica de duración y descarte de <30s de Historia 7, insertando en
  `sesiones` solo si corresponde.
- `App.tsx`: al iniciar sesión, se persiste en `sesion_activa`. Al montar
  la app, se consulta `obtenerSesionActiva` y se restaura el estado
  con el `inicio` real para que el cronómetro calcule el tiempo
  transcurrido correctamente.
- Actualizado README.md: "Fase 1 completa, Fase 2 en curso".
- 4 pruebas nuevas en sesiones (iniciar, obtener, finalizar, descarte) —
  57 pruebas totales, todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `8fd73d3`.
- Siguiente: Pomodoro (siguiente pendiente de Fase 2).

### 2026-08-21 — Historia 17: Pomodoro configurable

- Migración `DATABASE_VERSION` 11 → 12: columnas `modo`, `fase`,
  `fin_esperado` en `sesion_activa` (defaults preservan sesiones libres
  existentes); nueva tabla `configuracion_pomodoro` (fila única, defaults
  25/5 min).
- Funciones nuevas en `db/sesiones.ts`: `obtenerConfiguracionPomodoro`,
  `actualizarConfiguracionPomodoro`, `iniciarPomodoro`,
  `avanzarFasePomodoro`, `resolverSesionActivaAlAbrir` (cascada con
  while-loop para resolver múltiples fases vencidas de una).
- UI: selector "Sesión libre" / "Pomodoro" en `HoyScreen` y
  `ObjetivoDetalleScreen`, inputs de duración trabajo/descanso
  (prellenados desde config), fase visible ("☕ Trabajo" /
  "🏖️ Descanso"), cronómetro regresivo en modo Pomodoro, vibración
  (`Vibration.vibrate()`) al terminar cada fase.
- Fix durante implementación: race condition en el `setInterval` de
  primer plano — `avanzarFasePomodoro` era async pero el intervalo
  cada 1s podía llamarlo múltiples veces antes de que terminara
  (el ref todavía tenía el `finEsperadoTimestamp` viejo). Solucionado
  con guard `avanzando`.
- 10 tests nuevos (67 totales), todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `e9992f8` (sobre `8fd73d3`).
- Siguiente: por definir — Fase 2 completa (Pomodoro + persistencia
  de sesión activa), evaluar Fase 3 (Planificación) o retomar pulido
  de Fase 1.

### 2026-08-21 — Historia 18: Disponibilidad declarada

- Migración `DATABASE_VERSION` 12 → 13: tabla `disponibilidad` (dia_semana
  0-6, hora_inicio HH:MM, hora_fin HH:MM) — tabla nueva, sin tocar
  existentes.
- Funciones nuevas en `db/disponibilidad.ts`: `agregarBloqueDisponibilidad`
  (con validación de solapamiento y normalización de hora),
  `listarDisponibilidad` (orden día+hora), `eliminarBloqueDisponibilidad`,
  `normalizarHora`, `nombreDia`.
- UI: nueva pantalla `DisponibilidadScreen` con selector de día (Lu-Do +
  Do), picker manual de hora (botones ▲/▼ para hora 0-23 y minutos
  00/15/30/45), lista agrupada por día, eliminar por bloque.
- Nuevo tab "Horario" en la navegación principal.
- Ajustes post-verificación:
  - **Solapamiento:** rechaza bloques que se cruzan en el mismo día
    (al inicio, al final, contenidos, o que contienen); bloques
    consecutivos (fin == inicio del siguiente) se aceptan.
  - **Formato flexible:** acepta "7:00" y "07:00", normaliza a HH:MM
    de 2 dígitos antes de guardar.
  - **Picker manual:** sin `@react-native-community/datetimepicker`
    ni dependencias nuevas — selector con botones básicos de React
    Native, coherente con mantenerse en Expo Go (ADR-002).
  - **Scroll:** replicado patrón de `ObjetivoDetalleScreen` — header
    fijo fuera del `ScrollView`, `paddingBottom: 32`.
- 16 tests nuevos (92 totales), todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `0fdf22a` (sobre `5bfb57c`).
- Siguiente: "Horarios" (siguiente ítem de Fase 3).

### 2026-08-21 — Historia 19: Vista semanal con cálculo de carga

- Funciones puras en `db/carga.ts`: `calcularCargaDia` (tareas
  planificadas + disponibilidad por día), `calcularCargaSemana` (7 días
  desde una fecha inicio), `inicioDeSemana` (domingo de la semana dada).
- Sin migración — cálculo puro sobre datos existentes (tareas +
  disponibilidad).
- UI: nueva pantalla `SemanaScreen` con navegación anterior/siguiente,
  por cada día: tareas (marcadas "(sin estimar)" las que no tienen
  duración), disponibilidad, totales planificado/disponible, diferencia
  con tono neutro (solo signo numérico, sin colores de alarma — criterio
  4, igual que Historia 8).
- Nuevo tab "Semana" en la navegación principal.
- Separación visual entre tareas en la vista semana: cada tarea en su
  propia fila con borde inferior, mismo patrón que `estilos.item` de
  MetasScreen (fix durante verificación).
- **Fix teclado tapa inputs** (durante verificación de Historia 19):
  `KeyboardAvoidingView` agregado en `MetaDetalleScreen`,
  `ObjetivoDetalleScreen`, `IdeasScreen` y `HoyScreen`. Patrón:
  envuelve `ScrollView`/`FlatList`, `behavior="padding"` en iOS,
  `behavior="height"` en Android. FormularioTarea (fragment dentro del
  ScrollView de ObjetivoDetalleScreen) se beneficia indirectamente.
- Backlog: editar una tarea ya creada (detectado durante pruebas, sin
  urgencia inmediata) — agregado a roadmap en CLAUDE.md.
- 11 tests nuevos (103 totales), todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `9edb612` (sobre `5c63dc5`).

### 2026-08-21 — Historia 20: Editar tarea (incluye reprogramación)

- Nueva función `actualizarTarea` en `db/tareas.ts`: UPDATE parcial
  con validación (nombre no vacío, formato AAAA-MM-DD, entero positivo
  duración). Sin migración — campos ya existen desde Historias 4, 5, 6
  y 14. Resuelve el backlog de Historia 19 y el ítem "Reprogramación"
  de Fase 3.
- UI: botón de edición en cada tarea de `ObjetivoDetalleScreen` que
  abre un `Modal` nativo (mismo patrón que historial de sesiones de
  Historia 12) con fondo semitransparente. Campos precargados con
  valores actuales (nombre, fecha, duración, prioridad). Botones
  "Guardar cambios" (fondo `#333`, texto blanco) y "Cancelar" (fondo
  transparente, borde `#ccc`, texto `#555`), ambos `fontSize: 14` en
  una sola línea. Tap en fondo cierra sin guardar.
- **Problema visual resuelto:** los botones del modal heredaban
  estilos de `estilos.boton` (fondo azul, marginBottom) y
  `estilos.botonSecundario` (fondo verde `#2b8a3e`, texto blanco `#fff`)
  — causaba botones verdes gigantes y texto invisible. Solucionado con
  estilos inline completamente aislados, sin composición con estilos
  globales.
- `KeyboardAvoidingView` envuelve el fondo del modal para que suba
  con el teclado; botones con `marginTop: 'auto'` siempre visibles
  dentro de la caja blanca.
- 10 pruebas nuevas (113 totales): actualización de cada campo
  individual, varios campos a la vez, rechazo de nombre vacío/fecha
  inválida/duración inválida, sesiones no alteradas al editar.
- Merge a main (--ff-only): commit `0f3eeb5` (sobre `eed45bd`).

### 2026-08-24 — Historia 21: Detección de sobrecarga al planificar

- Primera entrega de Fase 4 más allá de los agregados de progreso: el
  aviso de sobrecarga aparece **al momento de planificar** (crear o
  editar una tarea), no solo como dato pasivo en una vista aparte.
- `app/db/carga.ts`: agregado `estaSobrecargado: boolean` a `DiaCarga`
  (`minutosDisponibles > 0 && diferencia > 0` — un día sin disponibilidad
  declarada nunca se marca sobrecargado, para no confundir falta de dato
  con sobrecarga real). Nueva función pura `calcularVistaPreviaSobrecarga`
  (vista previa hipotética sin escribir en BD, con `excluirTareaId` para
  no contar dos veces la propia tarea al editarla).
- `FormularioTarea.tsx` y el modal de edición de `ObjetivoDetalleScreen.tsx`
  (Historia 20) muestran el mismo aviso neutro y no bloqueante: "Ese día
  quedaría con X planificados de Y disponibles (+/-Z min)".
- `SemanaScreen.tsx` reutiliza el mismo cálculo para mostrar la marca
  "Sobrecargado" en el header de cada día, sin duplicar lógica.
- Sin migración de BD — cálculo puro sobre datos existentes.
- 10 pruebas nuevas (123 totales), todas verdes + tsc sin errores.
- Merge a main (--ff-only): commit `52c9a95`.
- Siguiente: por definir — queda pendiente "Sugerencias de ajuste" y
  "Modo mínimo / días libres" (resto de Fase 4), o retomar el spike de
  ADR-003 (runtime/modelo de IA local, pendiente desde el inicio).