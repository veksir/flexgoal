# Historia 5: Fecha planificada en tareas

**Como** usuario
**Quiero** asignarle una fecha planificada a una tarea (opcional)
**Para** poder saber más adelante qué me corresponde hacer en un día o semana específica

## Contexto de diseño

Del TDD/spike de base de datos: la query "tareas pendientes de una semana
específica" (Query B, validada en el spike SQLite vs. WatermelonDB) depende
de que las tareas tengan una fecha planificada. Esta historia agrega el
campo — **no** construye todavía la vista de "qué hacer hoy" (eso es
Fase 3, Planificación).

También es la primera historia que modifica una tabla ya existente con
`ALTER TABLE` en vez de crear una tabla nueva — buena prueba real del
patrón de migración validado en el spike (ADR-002).

## Criterios de aceptación (Given-When-Then)

1. **Given** que estoy en el formulario de agregar tarea
   **When** escribo el nombre y, opcionalmente, una fecha en formato `AAAA-MM-DD`
   **Then** la tarea se crea con esa fecha si es válida, o sin fecha si dejé el campo vacío.

2. **Given** que escribo una fecha con formato inválido (ej. "mañana", "20/08", texto suelto)
   **When** intento guardar la tarea
   **Then** veo un mensaje de error claro y la tarea NO se crea hasta que corrija el formato o deje el campo vacío.

3. **Given** una tarea con fecha planificada
   **When** la veo en la lista de tareas de su objetivo
   **Then** se muestra la fecha junto al nombre, en formato legible (ej. "Practicar SQL — 20/08/2026").

4. **Given** una tarea sin fecha planificada
   **When** la veo en la lista
   **Then** no se muestra ningún texto de fecha (ni "null", ni un espacio vacío raro).

5. **Given** tareas con fechas distintas (y algunas sin fecha)
   **When** cierro la app completamente y la reabro
   **Then** cada fecha persiste exactamente como se guardó (o la ausencia de fecha se mantiene).

## Alcance técnico

- Migración (subir `DATABASE_VERSION`):
  ```sql
  ALTER TABLE tareas ADD COLUMN fecha_planificada TEXT;
  ```
  (nullable — no todas las tareas necesitan fecha desde el día uno).
- `crearTarea` acepta un parámetro opcional `fechaPlanificada?: string`.
- Validación de formato: usa un regex simple (`/^\d{4}-\d{2}-\d{2}$/`) —
  no hace falta parseo de fechas real ni validar que el día exista (ej.
  "2026-02-30" pasa el regex aunque no sea válido); es suficiente para
  esta historia, no hace falta una librería de fechas.
- **No** se agrega un date picker nativo — sigue siendo un `TextInput` con
  placeholder `"AAAA-MM-DD (opcional)"`. Si más adelante la UX se siente
  mal, se evalúa agregar un picker en una historia aparte.
- Formatear la fecha guardada (`2026-08-20`) a un formato de visualización
  (`20/08/2026`) solo al mostrarla — se guarda siempre en ISO.

## Fuera de alcance (explícitamente)

- Cualquier vista o query que agrupe/filtre tareas por fecha (eso es Fase 3).
- Fecha objetivo en Meta.
- Prioridad (de tarea o meta).
- Categoría/área.
- Date picker nativo / calendario visual.
- Duración estimada de la tarea.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración `ALTER TABLE` no rompe tareas ya existentes
  (las creadas en la Historia 4 antes de este cambio deben seguir ahí,
  simplemente con `fecha_planificada` en `NULL`).
- Verificar los 3 casos: fecha válida, fecha inválida (rechazada), sin fecha.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57) antes de dar por terminada la historia.
