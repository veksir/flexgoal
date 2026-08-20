# Historia 12: Historial de sesiones de una tarea

**Como** usuario
**Quiero** ver la lista de sesiones individuales que registré en una tarea, no solo el total
**Para** entender cómo se distribuyó mi tiempo (ej. varias sesiones cortas vs. una larga)

## Contexto de diseño

Desde la Historia 7 existe `tiempoTotalPorTarea` (la suma), pero nunca se
mostró el detalle de cada sesión individual. Esta historia agrega esa
vista, sin cambiar nada de lo ya construido.

## Criterios de aceptación (Given-When-Then)

1. **Given** una tarea con 2 o más sesiones registradas
   **When** toco el texto "Total: X min" de esa tarea (o un botón "Ver historial")
   **Then** veo la lista de sus sesiones individuales, cada una con su duración y fecha, ordenadas de la más reciente a la más antigua.

2. **Given** una tarea sin ninguna sesión
   **When** no hay "Total: X min" que tocar (comportamiento ya existente)
   **Then** no hay forma de abrir un historial vacío — el botón/link solo aparece si hay al menos una sesión.

3. **Given** que estoy viendo el historial de sesiones de una tarea
   **When** cierro esa vista
   **Then** regreso a donde estaba, sin perder ningún otro dato en pantalla.

4. **Given** que registro una nueva sesión en una tarea que ya tenía historial
   **When** vuelvo a abrir su historial
   **Then** la nueva sesión aparece en la lista, en su posición correcta por fecha.

## Alcance técnico

- Nueva función `listarSesionesPorTarea(db, tareaId): Promise<Sesion[]>`
  en `app/db/sesiones.ts` (recuerda: ya recibe `db` como parámetro, por
  el refactor de la Tarea técnica 3), ordenado por `creado_en DESC`.
- Vista simple: puede ser un modal, o una sección que se expande dentro
  de `ObjetivoDetalleScreen.tsx` — lo que sea más simple de implementar
  sin agregar navegación nueva. Cada sesión se muestra como
  `"{duracion_minutos} min — {fecha formateada}"`.
- Agregar la prueba automatizada correspondiente en
  `app/db/__tests__/sesiones.test.ts` (orden correcto, tarea sin
  sesiones retorna lista vacía).

## Fuera de alcance

- Editar o eliminar sesiones individuales.
- Cualquier gráfico o visualización más allá de una lista de texto.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Prueba automatizada agregada y pasando (`npm test`).
- Verificación manual corta: solo confirmar que se ve bien y que abrir/cerrar el historial no rompe nada visualmente — la lógica ya la cubre la prueba automatizada.
- Commit con Conventional Commits (`feat: ...`).
