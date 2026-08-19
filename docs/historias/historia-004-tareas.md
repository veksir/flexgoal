# Historia 4: Tareas dentro de un objetivo

**Como** usuario
**Quiero** dividir un objetivo en tareas concretas y marcarlas como completadas
**Para** saber exactamente qué puedo hacer hoy y ver progreso real

## Contexto de diseño

Del TDD (jerarquía funcional): Meta → Objetivo → Tarea → Sesión. Esta
historia implementa Tarea, como hijo de Objetivo.

Del documento original del producto (sección 14): una tarea debe responder
"¿qué puedo hacer concretamente?" — evitar tareas vagas tipo "Aprender
PostgreSQL" y preferir algo accionable tipo "Practicar SELECT y WHERE
durante 30 minutos".

**Diferencia con Objetivos:** a Tarea SÍ le agregamos estado
(pendiente/completada) en esta misma historia, porque sin eso una tarea es
solo texto estático — no cumple su función. Fecha planificada, duración
estimada y prioridad siguen fuera de alcance (van en la historia de
"Estados, fechas, prioridades" ya listada en el roadmap, que en este punto
se reduce a agregar esos 3 campos, ya que el estado básico se resuelve acá).

## Criterios de aceptación (Given-When-Then)

1. **Given** que estoy en el detalle de una meta, viendo sus objetivos
   **When** toco un objetivo de la lista
   **Then** entro al detalle de ese objetivo, con la lista de sus tareas.

2. **Given** que estoy en el detalle de un objetivo
   **When** escribo un texto y presiono "Agregar tarea"
   **Then** la tarea aparece en la lista con estado "pendiente".

3. **Given** una tarea pendiente
   **When** la toco (o marco su checkbox)
   **Then** su estado cambia a "completada", se refleja visualmente (ej. tachado o ícono), y persiste.

4. **Given** que un objetivo no tiene tareas todavía
   **When** entro a su detalle
   **Then** veo un estado vacío apropiado.

5. **Given** que estoy en el detalle de un objetivo
   **When** presiono "Volver"
   **Then** regreso al detalle de la **meta** (no a la lista de Metas directamente) — la navegación respeta el nivel anterior, no salta hasta la raíz.

6. **Given** que creé tareas en objetivos distintos (de la misma meta o de metas distintas) y marqué algunas como completadas
   **When** cierro la app completamente, la reabro, y navego de vuelta a cada objetivo
   **Then** las tareas siguen correctamente aisladas por `objetivo_id`, y su estado (pendiente/completada) se mantiene tal cual quedó.

## Alcance técnico

- Nueva tabla:
  ```sql
  CREATE TABLE IF NOT EXISTS tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objetivo_id INTEGER NOT NULL REFERENCES objetivos(id),
    nombre TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    creado_en TEXT NOT NULL
  );
  ```
- `crearTarea(objetivoId, nombre)`, `listarTareasPorObjetivo(objetivoId)`,
  y `alternarEstadoTarea(tareaId, nuevoEstado)` (toggle pendiente↔completada).
- Navegación: ahora hay 3 niveles (Metas → detalle Meta/Objetivos → detalle
  Objetivo/Tareas). Sigue sin librería de navegación — se necesitan **dos**
  estados (`metaSeleccionada` y `objetivoSeleccionado`), no uno. "Volver"
  desde el detalle de objetivo limpia solo `objetivoSeleccionado` (te deja
  en el detalle de la meta); "Volver" desde el detalle de meta limpia
  `metaSeleccionada` (te deja en la lista de Metas).

## Fuera de alcance (explícitamente)

- Fecha planificada, duración estimada, prioridad de la tarea.
- Editar o eliminar tareas.
- Sesiones / Pomodoro (siguiente nivel de la jerarquía, Fase 2).
- Áreas.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar específicamente: (a) aislamiento por `objetivo_id`, (b) que el
  toggle de estado persiste (no solo cambia visualmente en memoria), y
  (c) que "Volver" navega al nivel correcto, no salta niveles.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57) antes de dar por terminada la historia.
