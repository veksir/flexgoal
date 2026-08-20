# Historia 13: Categoría/área en metas

**Como** usuario que maneja varias metas de distintos ámbitos de vida
**Quiero** poder asignarle una categoría/área a cada meta, de forma opcional (texto libre)
**Para** poder identificar visualmente a qué ámbito pertenece cada meta, sin necesitar un catálogo rígido

## Contexto de diseño

El TDD (sección 3.3) incluye "categoría/área" como uno de los atributos
de una meta, junto a prioridad y fecha objetivo — no como una entidad
separada. Esta historia sigue el mismo patrón que Historia 5
(`fecha_planificada`) e Historia 6 (`duracion_estimada_minutos`): un
campo opcional agregado vía `ALTER TABLE` sobre una tabla existente, sin
tabla nueva, sin FK, sin librería de selección.

Se descartó deliberadamente una tabla `areas` con catálogo reutilizable:
no hay todavía necesidad real de filtrar o agrupar por área (YAGNI), y
el proyecto ya trata `estado` de meta como string simple, no como
entidad. Si en el futuro se necesita filtrar metas por área o reusar
nombres de área entre metas, se revisita esta decisión en un ADR
posterior.

## Criterios de aceptación (Given-When-Then)

1. **Given** que convierto una idea en meta (único punto de creación de
   metas — no pide categoría)
   **When** la meta se crea
   **Then** se guarda con `categoria = NULL`, sin fallar.

2. **Given** que estoy en el detalle de una meta (`MetaDetalleScreen`)
   **When** escribo una categoría (ej. "Salud") y guardo
   **Then** se guarda tal cual, sin validación de formato ni longitud
   máxima artificial.

3. **Given** metas creadas en historias anteriores (1 a 12)
   **When** se aplica esta migración
   **Then** sobreviven intactas, con `categoria = NULL`, sin pérdida de
   datos.

4. **Given** una meta con categoría asignada
   **When** la veo en la lista de metas (`MetasScreen`)
   **Then** la categoría aparece junto al nombre de la meta.

5. **Given** una meta sin categoría
   **When** la veo en la lista de metas
   **Then** no se muestra ningún texto ni placeholder para la
   categoría (ej. nada de "Sin categoría").

6. **Given** una meta con categoría ya asignada
   **When** entro a su detalle y borro el valor del input
   **Then** puedo guardar el cambio y queda en `NULL` (vuelve a no
   mostrarse en la lista).

## Alcance técnico

- Migración en `app/db/migraciones.ts`, subiendo `DATABASE_VERSION` de
  7 a 8:
  ```sql
  ALTER TABLE metas ADD COLUMN categoria TEXT;
  ```
- `crearMeta` (en `app/db/metas.ts`) acepta `categoria?: string | null`
  como tercer parámetro opcional (la creación real, vía
  `convertirIdeaEnMeta`, siempre la deja en `NULL` — no se agrega input
  en ese flujo).
- Nueva función `actualizarCategoriaMeta(db, metaId, categoria: string | null)`
  en `app/db/metas.ts`, siguiendo el mismo patrón que
  `actualizarEstadoMeta` ya existente. **No existe una función genérica
  `actualizarMeta`** — no inventarla, agregar solo esta función
  específica.
- Sin validación de formato ni longitud — es texto libre.
- UI: agregar input "Categoría (opcional)" en `MetaDetalleScreen`,
  precargado con la categoría actual, con botón para guardar vía
  `actualizarCategoriaMeta`. Vaciar el input y guardar debe dejarlo en
  `NULL`. **No existe un formulario compartido de crear/editar meta** —
  las metas se crean solo por conversión de idea (sin inputs propios);
  el único punto de edición es este detalle.
- Mostrar `categoria` junto al nombre en `MetasScreen`, solo si no es
  `null`/vacío.

## Fuera de alcance (explícitamente)

- Tabla `areas`, catálogo, o cualquier tipo de FK.
- Filtrado o agrupación de metas por categoría.
- Prioridad de meta o de tarea (historia separada).
- Fecha objetivo en meta (historia separada).
- Selector visual (dropdown, chips) — sigue siendo `TextInput` simple.
- Pedir categoría en el flujo de conversión de idea a meta — esa
  creación se mantiene sin inputs adicionales, como ya funciona.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe metas ya existentes de todas las
  historias anteriores.
- Verificar los 3 casos: categoría vacía, con valor, y edición para
  borrar el valor (vuelta a `NULL`).
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Merge a `main` solo con `--ff-only`, tras verificación visual (que el
  campo se vea bien en el formulario y en la lista de metas).
- Pruebas automatizadas en `app/db/__tests__/` cubriendo los 3 casos
  anteriores más la supervivencia de metas previas a la migración.
