# Historia 9: Progreso agregado por meta (estimado vs. real)

**Como** usuario
**Quiero** ver, en la lista de Metas, cuánto tiempo estimé vs. cuánto tiempo real llevo en cada una
**Para** tener una sensación de progreso real de un vistazo, sin tener que entrar a cada objetivo/tarea

## Contexto de diseño

Esta es la Query A que se validó en el spike de base de datos
(ADR-002): progreso agregado por meta, sumando tiempo a través de
Tarea → Objetivo → Meta. Ya estaba probado que SQLite la resuelve en
SQL directo (1-2 ms medidos) — esta historia simplemente la usa.

Es la continuación natural de la Historia 8 (comparación por tarea
individual), llevada un nivel más arriba en la jerarquía.

## Criterios de aceptación (Given-When-Then)

1. **Given** una meta cuyas tareas (a través de sus objetivos) tienen
   duración estimada y/o tiempo real registrado en al menos una
   **When** veo la lista de Metas
   **Then** esa meta muestra un resumen agregado (ej. "Estimado: 120 min · Real: 95 min · -25 min"), sumando todas sus tareas.

2. **Given** una meta cuyas tareas no tienen ningún dato de tiempo (ni estimado ni real en ninguna)
   **When** la veo en la lista
   **Then** no se muestra esta sección — comportamiento limpio, sin mostrar ceros.

3. **Given** una meta con solo estimado en sus tareas (sin ninguna sesión registrada todavía)
   **When** la veo
   **Then** se muestra solo el total estimado, sin inventar una comparación con 0.

4. **Given** una meta con solo tiempo real (tareas sin duración estimada, pero con sesiones)
   **When** la veo
   **Then** se muestra solo el total real.

5. **Given** que el tiempo real total supera el estimado total
   **When** se muestra
   **Then** el tono sigue siendo neutro, mismo patrón que la Historia 8 (signo numérico, sin lenguaje de culpa).

## Alcance técnico

- Nueva función `progresoPorMeta(metaId: number): Promise<{ estimadoTotal: number | null, realTotal: number }>`
  en `app/db/metas.ts`, con una query SQL que haga JOIN
  `metas → objetivos → tareas → sesiones` y agregue con `SUM`,
  siguiendo el patrón validado en el spike (Query A). El estimado se sums
  desde `tareas.duracion_estimada_minutos` (ignorando NULLs), el real
  desde `sesiones.duracion_minutos`.
- **No** se agrega N+1 (no se calcula en JavaScript recorriendo objetivos
  uno por uno) — una sola query por meta.
- En `MetasScreen.tsx`: al listar las metas, para cada una llama a
  `progresoPorMeta` y muestra el resumen si aplica, reusando el mismo
  formato/tono de la Historia 8.

## Fuera de alcance (explícitamente)

- Progreso agregado a nivel de Objetivo (solo Meta por ahora).
- Cualquier sugerencia de ajuste o detección de sobrecarga (Fase 4 más adelante).
- Barra de progreso visual/gráfica — texto simple, igual que la Historia 8.
- Cambiar el orden de la lista de Metas según su progreso.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Confirmar que la query es una sola consulta SQL con SUM (no N+1).
- Verificar los 4 casos de datos (ambos, solo estimado, solo real, ninguno).
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57), sobre la instalación existente.
