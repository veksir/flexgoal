# Historia 20: Editar una tarea (incluye reprogramación de fecha)

**Como** usuario que ya creó una tarea y luego necesita ajustarla
**Quiero** poder editar su nombre, fecha planificada, duración estimada y prioridad sin tener que eliminarla y recrearla
**Para** corregir errores o reprogramar mi plan cuando mi disponibilidad real cambia

## Contexto de diseño

Esta historia resuelve dos pendientes con el mismo trabajo:

1. **Backlog detectado en verificación de Historia 19:** hoy no existe
   forma de editar una tarea ya creada — solo eliminar y recrear.
2. **"Reprogramación", ítem final de Fase 3 (TDD):** el documento la
   describe como una acción específica de cambiar la fecha planificada
   de una tarea, distinta de eliminarla o completarla (la métrica de
   éxito del TDD habla de "% de tareas reprogramadas vs. eliminadas vs.
   completadas").

**Decisión:** editar cualquier campo de la tarea (nombre, fecha
planificada, duración estimada, prioridad) desde una sola pantalla —
no solo la fecha. "Reprogramar" queda como el caso específico de
cambiar la fecha planificada dentro de esa misma edición; no requiere
una UI ni una función separada de "editar todo lo demás". Ambos
conceptos conviven sin conflicto: reprogramar es simplemente editar el
campo `fecha_planificada`.

**Fuera de esta historia:** llevar un contador o historial de "veces
reprogramada" para la métrica del TDD — eso es analítica de Fase 4/5,
no bloquea esta historia y se puede agregar después sin romper nada de
lo implementado aquí (el dato de fecha ya queda persistido, solo
faltaría contar los cambios si se decide medirlo más adelante).

## Criterios de aceptación (Given-When-Then)

1. **Given** una tarea ya creada
   **When** entro a editarla
   **Then** veo sus valores actuales precargados: nombre, fecha
   planificada, duración estimada y prioridad (cada uno vacío si nunca
   se asignó).

2. **Given** que estoy editando una tarea
   **When** cambio el nombre y guardo
   **Then** el nuevo nombre se persiste y se refleja en todas las
   listas donde aparece (detalle de objetivo, vista Hoy, vista Semana).

3. **Given** que estoy editando una tarea con fecha planificada ya
   asignada
   **When** cambio la fecha a una distinta y guardo
   **Then** la tarea se reprograma — desaparece de la vista Hoy/Semana
   del día anterior y aparece en el nuevo día, sin duplicarse.

4. **Given** que estoy editando una tarea
   **When** cambio la fecha planificada a vacío (quitarla)
   **Then** la tarea deja de aparecer en Hoy/Semana (mismo
   comportamiento que una tarea que nunca tuvo fecha).

5. **Given** que estoy editando una tarea
   **When** cambio la duración estimada o la prioridad (o las vacío)
   **Then** el nuevo valor se persiste y se refleja donde corresponda
   (vista Semana recalcula minutos planificados con el nuevo valor).

6. **Given** que estoy editando una tarea con sesiones de tiempo ya
   registradas
   **When** guardo cualquier cambio
   **Then** las sesiones y el tiempo total registrado no se ven
   afectados — solo cambian los campos editados.

7. **Given** que estoy editando el nombre y lo dejo vacío
   **When** intento guardar
   **Then** se rechaza (el nombre es obligatorio, igual que al crear
   la tarea) y no se guarda el cambio.

8. **Given** una fecha o duración con formato inválido al editar
   **When** intento guardar
   **Then** se rechaza con el mismo criterio de validación ya usado al
   crear la tarea (regex de `AAAA-MM-DD` y entero positivo).

## Alcance técnico

- Sin migración de base de datos — todos los campos ya existen en
  `tareas` desde Historias 4, 5, 6 y 14.
- Nueva función `actualizarTarea(db, tareaId, cambios)` en
  `app/db/tareas.ts` (confirmar nombre real del archivo), donde
  `cambios` es un objeto parcial con los campos editables:
  `{ nombre?, fechaPlanificada?, duracionEstimadaMinutos?, prioridad? }`.
  Reutilizar las mismas validaciones ya existentes (`esFechaValida`,
  validación de duración, nombre no vacío) — no duplicar esa lógica.
- UI: agregar una forma de entrar a "editar" una tarea desde donde ya
  se listan (confirmar la pantalla exacta — probablemente
  `ObjetivoDetalleScreen`, donde vive `FormularioTarea`). Puede
  reutilizarse el mismo formulario de creación, precargado con los
  valores actuales y en modo edición (guardar vs. crear), en vez de
  construir una pantalla nueva desde cero.
- Confirmar que la vista Semana y la vista Hoy consultan los datos en
  vivo (no cacheados) para que una tarea reprogramada aparezca/
  desaparezca correctamente sin necesidad de cerrar y reabrir la app.

## Fuera de alcance (explícitamente)

- Historial o contador de cuántas veces se reprogramó una tarea (queda
  para cuando se implemente la métrica de Fase 4/5, si se decide
  medirla).
- Editar el objetivo al que pertenece la tarea (mover una tarea a otro
  objetivo) — no forma parte de esta historia.
- Cualquier lógica de sobrecarga o alertas al reprogramar hacia un día
  ya cargado — eso es Fase 4.
- Deshacer una edición (no hay historial de cambios, solo el estado
  actual).

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar los 8 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`), en una rama creada
  explícitamente para esta historia (`feature/editar-tarea`).
- Merge a `main` solo con `--ff-only`, tras verificación visual en
  dispositivo: editar el nombre de una tarea existente, reprogramar su
  fecha a otro día y confirmar que se mueve correctamente entre Hoy y
  Semana, y confirmar que sus sesiones de tiempo ya registradas siguen
  intactas tras la edición.
- Pruebas automatizadas en `app/db/__tests__/` cubriendo:
  `actualizarTarea` con cada campo individual, edición de varios campos
  a la vez, rechazo de nombre vacío, rechazo de fecha/duración
  inválida, y que las sesiones de una tarea no se alteran al editarla.
