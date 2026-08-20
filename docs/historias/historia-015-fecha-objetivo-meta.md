# Historia 15: Fecha objetivo en meta

**Como** usuario que se propone metas de largo plazo
**Quiero** poder asignarle una fecha objetivo a una meta, de forma opcional
**Para** tener una referencia de cuándo me gustaría lograrla, sin que sea un plazo forzado por el sistema

## Contexto de diseño

Con esta historia se cierra casi por completo el pulido de Fase 1
(quedaría solo Áreas — ya resuelta en Historia 13 como campo
`categoria` — y esta pieza). El TDD (sección 3.3) incluye "fecha
objetivo" como atributo de meta, junto a prioridad y categoría/área.

Sigue el mismo patrón que `fecha_planificada` en tareas (Historia 5):
campo de texto validado con regex simple (`AAAA-MM-DD`), sin librería de
fechas ni date picker, opcional. Se edita desde `MetaDetalleScreen`,
igual que `categoria` (Historia 13) y `prioridad` (Historia 14) —
mismo lugar donde ya se agregaron esos dos campos, ya que la meta se
crea sin inputs propios (solo por conversión de idea) y necesita un
punto posterior de edición.

## Criterios de aceptación (Given-When-Then)

1. **Given** una meta ya existente sin fecha objetivo
   **When** entro a su detalle y escribo una fecha válida (`AAAA-MM-DD`)
   **Then** se guarda y se muestra junto al nombre de la meta en la
   lista de metas.

2. **Given** que escribo una fecha con formato inválido (texto, formato
   distinto a `AAAA-MM-DD`, fecha inexistente como `2026-13-40`)
   **When** intento guardar
   **Then** veo un mensaje de error claro y el valor NO se guarda hasta
   que corrija o deje el campo vacío.

3. **Given** una meta sin fecha objetivo
   **When** la veo en la lista de metas
   **Then** no se muestra ningún texto ni placeholder para la fecha
   objetivo.

4. **Given** una meta con fecha objetivo ya asignada
   **When** entro a su detalle
   **Then** veo la fecha actual precargada en el input.

5. **Given** una meta con fecha objetivo ya asignada
   **When** borro el valor del input y guardo
   **Then** queda en `NULL` (deja de mostrarse en la lista).

6. **Given** metas creadas en historias anteriores (1 a 14)
   **When** se aplica esta migración
   **Then** sobreviven intactas, con `fecha_objetivo = NULL`, sin
   pérdida de datos.

## Alcance técnico

- Migración en `app/db/migraciones.ts`, subiendo `DATABASE_VERSION` de
  9 a 10 (confirmar el valor actual antes de escribir la migración —
  no asumirlo):
  ```sql
  ALTER TABLE metas ADD COLUMN fecha_objetivo TEXT;
  ```
- Validación: mismo regex usado para `fecha_planificada` en
  `app/db/tareas.ts` (formato `AAAA-MM-DD`), reutilizado o replicado tal
  cual — no inventar una validación distinta.
- Nueva función `actualizarFechaObjetivoMeta(db, metaId, fechaObjetivo: string | null)`
  en `app/db/metas.ts`, siguiendo el patrón de `actualizarEstadoMeta`,
  `actualizarCategoriaMeta` y `actualizarPrioridadMeta` ya existentes.
  **Confirmar el nombre exacto de las funciones ya existentes en
  `metas.ts` antes de escribir esta, en vez de asumirlo.**
- UI: input de texto "Fecha objetivo (AAAA-MM-DD, opcional)" en
  `MetaDetalleScreen`, junto a los selectores de estado, categoría y
  prioridad ya existentes. Precargado con el valor actual si existe.
- Mostrar `fecha_objetivo` junto al nombre en `MetasScreen`, solo si no
  es `NULL`/vacío (ej. "Aprender SQL — Alta — 2026-12-31", si también
  tiene prioridad).

## Fuera de alcance (explícitamente)

- Date picker visual o librería de fechas — sigue siendo `TextInput`
  con regex, igual que `fecha_planificada`.
- Cualquier alerta, recordatorio o notificación basada en la fecha
  objetivo (eso sería Fase 3/4).
- Cálculo de tiempo restante o de desviación respecto a la fecha
  objetivo — esta historia solo captura el dato.
- Áreas como tabla/catálogo — ya resuelto como texto libre en Historia
  13, no se revisita aquí.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe metas ya existentes de todas las
  historias anteriores.
- Verificar los 6 criterios de aceptación anteriores, incluyendo fecha
  válida, inválida (rechazada), vacía, y borrado de un valor ya
  guardado.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Merge a `main` solo con `--ff-only`, tras verificación visual (que el
  input se vea bien en `MetaDetalleScreen` junto a los otros campos ya
  agregados, y que la fecha se muestre bien en la lista de metas).
- Pruebas automatizadas en `app/db/__tests__/` cubriendo: meta sin fecha
  objetivo (`NULL`), meta con fecha válida, rechazo de fecha inválida,
  borrado de una fecha ya asignada, y supervivencia de metas previas a
  la migración.

## Nota

Con esta historia se cierra Fase 1 casi por completo (Fundamentos:
ideas, metas, áreas, objetivos, tareas, estados, fechas, prioridades).
El pulido de UX general (selectores toscos de categoría/prioridad,
layout de `MetaDetalleScreen` con ya varios campos apilados) queda
explícitamente diferido para el final, como ya se hizo una vez en la
Tarea técnica 2 tras las Historias 1-7.
