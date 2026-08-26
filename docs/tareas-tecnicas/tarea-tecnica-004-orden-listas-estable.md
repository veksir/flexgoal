# Tarea técnica 4: Orden estable de listas (más antigua primero)

**Tipo:** Corrección de comportamiento — no agrega funcionalidad, no
cambia el modelo de datos.

## Contexto

Reportado por Kevin durante la verificación de Historia 25 (plantillas):
al agregar una tarea nueva dentro de un objetivo, la lista completa
"se corre" — la tarea nueva aparece arriba y empuja las demás hacia
abajo, en vez de quedarse fija la primera que se creó y agregarse la
nueva al final.

Causa: `ORDER BY creado_en DESC` (más reciente primero) en las queries
de listado. Se revisó dónde más aparece el mismo patrón:

| Archivo | Función | ¿Se invierte? |
|---|---|---|
| `db/tareas.ts` | `listarTareasPorObjetivo` | Sí |
| `db/objetivos.ts` | función de listar objetivos de una meta | Sí |
| `db/metas.ts` | función de listar metas | Sí |
| `db/ideas.ts` | función de listar ideas | Sí |
| `db/sesiones.ts` | historial de sesiones de una tarea | **No** — se deja igual |

**Decisión de Kevin y justificación:** Ideas, Metas, Objetivos y Tareas
son listas que el usuario arma y con las que vuelve a interactuar en
orden — tiene sentido que la primera que creó quede fija arriba y las
nuevas se vayan agregando abajo (orden estable, predecible). El
historial de sesiones es distinto: es un registro de eventos (como un
log), donde ver lo más reciente arriba es el comportamiento esperado y
además ya está cubierto por una prueba automatizada existente
(Historia 12, "orden DESC") que no debe romperse.

## Cambio

- `db/ideas.ts`, `db/metas.ts`, `db/objetivos.ts`, `db/tareas.ts`:
  cambiar `ORDER BY creado_en DESC` → `ORDER BY creado_en ASC` en las
  funciones de listado correspondientes.
- `db/sesiones.ts`: **sin cambios** — se mantiene `DESC`.
- Ningún otro comportamiento cambia (filtros, joins, columnas
  seleccionadas quedan iguales).

## Criterios de aceptación

1. Al crear una segunda idea, aparece debajo de la primera en la
   bandeja de Ideas (no arriba).
2. Al crear una segunda meta (por conversión de idea), aparece debajo
   de la primera en la lista de Metas.
3. Al crear un segundo objetivo dentro de una meta, aparece debajo del
   primero.
4. Al crear una segunda tarea dentro de un objetivo, aparece debajo de
   la primera — este es el caso puntual reportado.
5. El historial de sesiones de una tarea sigue mostrando la sesión más
   reciente arriba, sin cambios (verificar que la prueba existente de
   Historia 12 sobre este orden sigue pasando tal cual).
6. Ninguna prueba existente de las 142 actuales debería fallar por
   este cambio salvo las que dependían explícitamente del orden DESC en
   ideas/metas/objetivos/tareas — esas se actualizan para reflejar el
   nuevo orden ASC, no se eliminan.

## Alcance técnico adicional

- Revisar si alguna prueba en `__tests__/` asume el orden DESC en estas
  cuatro entidades (ideas, metas, objetivos, tareas) y actualizarla al
  nuevo orden esperado — no dejar pruebas rotas ni pruebas borradas sin
  reemplazo.
- Sin migración de base de datos — es un cambio de `ORDER BY`, no de
  schema.

## Definition of Done aplicable

- Verificar los 6 criterios de aceptación anteriores.
- Pruebas automatizadas actualizadas/pasando (142 + los ajustes que
  correspondan).
- Commit con Conventional Commits, rama `fix/orden-listas-estable`.
- **No mergear a main hasta confirmación visual/funcional explícita de
  Kevin.**
