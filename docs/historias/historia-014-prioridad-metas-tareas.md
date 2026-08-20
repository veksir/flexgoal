# Historia 14: Prioridad en metas y tareas

**Como** usuario con varias metas y tareas activas al mismo tiempo
**Quiero** poder asignarle una prioridad (Alta/Media/Baja) tanto a una meta como a una tarea, de forma opcional
**Para** poder distinguir visualmente qué es más importante, sin que el sistema decida nada por mí

## Contexto de diseño

El roadmap lista "Prioridad (tarea y/o meta)" sin resolver el alcance;
esta historia cubre ambas entidades a la vez, ya que comparten el mismo
diseño (mismo conjunto fijo de valores, misma UI de selección).

A diferencia de `categoria` (Historia 13, texto libre), `prioridad` es
un conjunto cerrado de 3 valores. Por eso se modela como selector de
botones (mismo patrón que `actualizarEstadoMeta`, que ya usa 4 botones
fijos), no como `TextInput` — evita valores inválidos o inconsistencias
de escritura ("alta", "Alta", "ALTA") sin necesitar validación de texto.

**Prioridad de meta** se edita desde `MetaDetalleScreen`, igual que
`categoria` (Historia 13) — la meta ya existe sin ese campo y necesita
una forma de asignarlo/cambiarlo después de creada.

**Prioridad de tarea** sigue el mismo patrón que `fecha_planificada`
(Historia 5) y `duracion_estimada_minutos` (Historia 6): se asigna solo
al crear la tarea en `FormularioTarea`, como campo opcional. No se
agrega edición posterior de prioridad de tarea — las tareas ya
existentes no tienen mecanismo de edición de sus campos (solo toggle de
estado y eliminar), y esta historia no lo introduce para no ampliar el
alcance sin necesidad real (YAGNI).

## Criterios de aceptación (Given-When-Then)

### Meta

1. **Given** una meta ya existente sin prioridad
   **When** entro a su detalle y elijo "Alta", "Media" o "Baja"
   **Then** la prioridad se guarda y el botón elegido queda resaltado
   (mismo patrón visual que el selector de estado).

2. **Given** una meta con prioridad ya asignada
   **When** entro a su detalle
   **Then** veo resaltada la prioridad actual, igual que el estado.

3. **Given** una meta sin prioridad asignada (recién convertida de idea)
   **When** la veo en la lista de metas
   **Then** no se muestra ningún texto de prioridad.

4. **Given** una meta con prioridad asignada
   **When** la veo en la lista de metas
   **Then** la prioridad aparece junto al nombre (ej. "Aprender SQL —
   Alta").

### Tarea

5. **Given** que estoy en el formulario de agregar tarea
   **When** escribo el nombre y, opcionalmente, elijo una prioridad
   **Then** la tarea se crea con esa prioridad si la elegí, o sin
   prioridad (`NULL`) si no elegí ninguna.

6. **Given** una tarea con prioridad asignada
   **When** la veo en la lista de tareas de su objetivo
   **Then** se muestra junto al nombre (ej. "Practicar SQL — 30 min —
   Alta", si también tiene duración estimada).

7. **Given** una tarea sin prioridad
   **When** la veo en la lista
   **Then** no se muestra ningún texto de prioridad.

### Migración

8. **Given** metas y tareas creadas en historias anteriores (1 a 13)
   **When** se aplica esta migración
   **Then** sobreviven intactas, con `prioridad = NULL` en ambas
   tablas, sin pérdida de datos.

## Alcance técnico

- Migración en `app/db/migraciones.ts`, subiendo `DATABASE_VERSION` de
  8 a 9:
  ```sql
  ALTER TABLE metas ADD COLUMN prioridad TEXT;
  ALTER TABLE tareas ADD COLUMN prioridad TEXT;
  ```
- Valores válidos: `'alta' | 'media' | 'baja'` (o `NULL`). Validación en
  la capa de app al guardar (no hace falta `CHECK` constraint en SQL,
  coherente con cómo se maneja `estado` de meta actualmente).
- `crearTarea` acepta un parámetro opcional adicional
  `prioridad?: 'alta' | 'media' | 'baja' | null`.
- Nueva función `actualizarPrioridadMeta(db, metaId, prioridad: 'alta' | 'media' | 'baja' | null)`
  en `app/db/metas.ts`, siguiendo el mismo patrón que
  `actualizarEstadoMeta` y `actualizarCategoriaMeta` ya existentes.
- UI meta: selector de 3 botones (Alta/Media/Baja) en
  `MetaDetalleScreen`, junto al selector de estado ya existente.
- UI tarea: mismo selector de 3 botones en `FormularioTarea`, junto a
  los inputs de fecha planificada y duración estimada ya existentes.
- Mostrar la prioridad junto al nombre en `MetasScreen` (metas) y en la
  lista de tareas del detalle de objetivo, solo si no es `NULL`.

## Fuera de alcance (explícitamente)

- Edición de prioridad de una tarea ya creada (las tareas no tienen
  edición de campos después de creadas, solo toggle de estado y
  eliminar — esta historia no cambia eso).
- Ordenar automáticamente metas o tareas por prioridad.
- Cualquier lógica de sugerencia o cálculo basado en prioridad (Fase 4).
- Fecha objetivo en meta (historia separada).
- Colores o iconografía específica por nivel de prioridad — texto plano
  por ahora, igual que categoría y duración estimada.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe metas ni tareas ya existentes de
  todas las historias anteriores.
- Verificar los 8 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Merge a `main` solo con `--ff-only`, tras verificación visual (que
  los selectores se vean bien en `MetaDetalleScreen` y en
  `FormularioTarea`, y que el texto de prioridad se vea bien en ambas
  listas).
- Pruebas automatizadas en `app/db/__tests__/` cubriendo: meta/tarea
  sin prioridad (`NULL`), meta/tarea con cada uno de los 3 valores, y
  supervivencia de metas/tareas previas a la migración.
