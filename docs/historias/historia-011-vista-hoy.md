# Historia 11: Vista "Hoy" — qué hacer ahora

**Como** usuario
**Quiero** ver, en un solo lugar, las tareas que me tocan hoy o que ya se atrasaron, sin importar de qué meta vengan
**Para** abrir la app y saber inmediatamente qué hacer, sin tener que navegar meta por meta

## Contexto de diseño

Del documento original del producto (sección 18): *"Cuando el usuario
abre la aplicación no debería tener que navegar entre muchas pantallas.
Debe poder ver: Tu próxima acción."* Esta historia implementa esa idea
en su forma más simple — sin recomendaciones de IA, sin "modo mínimo",
solo un filtro directo por fecha a través de toda la jerarquía.

Con esto, "Hoy" se convierte en la razón real para abrir la app todos
los días — hasta ahora no existía ese motivo, solo se navegaba para
seguir probando funcionalidad.

## Criterios de aceptación (Given-When-Then)

1. **Given** que tengo tareas pendientes con fecha planificada de hoy o anterior (vencidas)
   **When** abro la pestaña "Hoy"
   **Then** las veo listadas, ordenadas por fecha (las más atrasadas primero), cada una mostrando a qué meta pertenece.

2. **Given** que no tengo ninguna tarea pendiente para hoy ni vencida
   **When** abro "Hoy"
   **Then** veo un estado vacío apropiado, en tono neutro/positivo (ej. "No tienes tareas para hoy. Buen momento para planificar algo."), no un vacío que se sienta como fracaso.

3. **Given** una tarea en la vista "Hoy"
   **When** la marco como completada
   **Then** desaparece de esta vista, y el cambio se refleja igual en el detalle normal de su objetivo.

4. **Given** una tarea en la vista "Hoy"
   **When** inicio una sesión sobre ella
   **Then** funciona exactamente igual que desde el detalle de objetivo (cronómetro, bloqueo de sesión simultánea con cualquier otra tarea) — es la misma lógica ya construida, no una nueva.

5. **Given** tareas pendientes que nunca tuvieron fecha planificada asignada
   **When** estoy en "Hoy"
   **Then** NO aparecen — esta vista es específicamente por fecha, no un catálogo general de pendientes.

6. **Given** que cierro la app y la reabro (posiblemente otro día)
   **When** entro a "Hoy"
   **Then** la lista se recalcula correctamente contra la fecha actual del dispositivo.

## Alcance técnico

- Nueva función `tareasParaHoy(): Promise<TareaConContexto[]>` en
  `app/db/tareas.ts` (o archivo nuevo), con JOIN
  `tareas → objetivos → metas`, filtrando
  `estado = 'pendiente' AND fecha_planificada IS NOT NULL AND fecha_planificada <= [fecha de hoy en formato ISO]`,
  ordenado por `fecha_planificada ASC`. El tipo de retorno incluye el
  nombre de la meta y el objetivo para mostrar contexto.
- Nueva pantalla `screens/HoyScreen.tsx`.
- En `App.tsx`: agregar "Hoy" como una tercera opción del toggle
  (Hoy | Ideas | Metas), y que sea la vista por defecto al abrir la app
  (coherente con el principio de que la pantalla principal debe
  responder "qué hacer ahora").
- Reutilizar `alternarEstadoTarea` y la lógica de `sesionActiva` ya
  existentes — no duplicar código de sesión ni de estado.

## Fuera de alcance (explícitamente)

- Cualquier recomendación de IA o de priorización automática — solo
  orden por fecha.
- "Modo mínimo" o detección de sobrecarga (Fase 4 más adelante).
- Vista semanal o de cualquier otro rango — solo "hoy o vencido".
- Editar fecha/duración desde esta vista — si se necesita, se entra al
  detalle normal del objetivo.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Confirmar que la query es una sola consulta SQL (no N+1).
- Verificar los 6 criterios, incluyendo crear una tarea con fecha de
  ayer (vencida) y confirmar que aparece.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go sobre la instalación existente.
