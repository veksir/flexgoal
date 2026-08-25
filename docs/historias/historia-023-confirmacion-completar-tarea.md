# Historia 23: Confirmación al completar y exclusividad de sesión activa

**Como** usuario que ve sus tareas en Hoy y en el detalle de objetivo
**Quiero** que no se pueda completar una tarea por un toque accidental, y que mientras tengo una sesión corriendo no pueda tocar otras tareas ni completar la actual sin confirmar
**Para** no perder tiempo registrado por error ni terminar con una tarea "completada" mientras su cronómetro sigue corriendo en segundo plano

## Contexto — bug detectado

En `HoyScreen.tsx` y `ObjetivoDetalleScreen.tsx`, cada fila de tarea es
un único `<Pressable>` que envuelve toda la fila (nombre, cronómetro,
botón "Detener") con `onPress={() => alternarTarea(item)}`, sin ninguna
condición. Además, `alternarEstadoTarea` en `db/tareas.ts` solo hace el
`UPDATE`, sin validar nada contra sesiones activas.

Consecuencia verificada: se puede tocar la fila de la tarea que tiene el
cronómetro corriendo y queda "completada" mientras el tiempo sigue
contando en segundo plano (estado inconsistente), y lo mismo con
cualquier otra tarea del día mientras esa sesión sigue activa.

## Reglas de comportamiento (definidas por Kevin)

1. **Toda tarea, siempre:** marcar una tarea de pendiente → completada
   requiere **confirmación** (diálogo nativo), para no perder el
   registro por un toque accidental. Marcar de completada → pendiente
   (deshacer) no requiere confirmación — es la acción de corrección en
   sí misma.
2. **Si la tarea que se quiere completar es la misma que tiene la
   sesión activa:** se permite, pero el diálogo de confirmación debe
   dejar explícito que hay una sesión en curso y que, al confirmar, esa
   sesión se detiene y su tiempo se guarda (mismo camino que el botón
   "Detener" ya existente — no debe quedar una sesión huérfana corriendo
   en segundo plano). Cubre el caso de un usuario que se olvidó de que
   debía iniciar el cronómetro, o que se confió y no lo iba a tocar.
3. **Si hay una sesión activa para OTRA tarea (distinta a la que se
   toca):** no se permite ninguna interacción con esa fila — ni
   completar ni des-completar. Solo se puede interactuar con la tarea
   que tiene la sesión activa, hasta detenerla. Justificación: solo
   debería poder trabajarse una tarea a la vez.
4. **Sin ninguna sesión activa:** el comportamiento normal de
   completar/pendiente sigue igual que hoy, solo que ahora pasa por el
   diálogo de confirmación de la regla 1 al completar.

La forma exacta del toque (fila completa vs. checkbox aparte) queda a
criterio de implementación — lo que importa es que exista la
confirmación, no la superficie de toque.

## Criterios de aceptación (Given-When-Then)

1. **Given** ninguna sesión activa en toda la app
   **When** toco una tarea pendiente para completarla
   **Then** aparece un diálogo de confirmación; si confirmo, queda
   completada; si cancelo, no cambia nada.

2. **Given** ninguna sesión activa
   **When** toco una tarea ya completada
   **Then** vuelve a pendiente sin pedir confirmación.

3. **Given** una sesión activa corriendo para la tarea X
   **When** toco la fila de X para completarla
   **Then** aparece un diálogo que menciona explícitamente que hay una
   sesión en curso y que se detendrá y guardará su tiempo al confirmar;
   si confirmo, la sesión se detiene igual que con el botón "Detener"
   (mismo camino de guardado/descarte de sesiones <30s) y la tarea queda
   completada; si cancelo, ni la sesión ni el estado de la tarea
   cambian.

4. **Given** una sesión activa corriendo para la tarea X
   **When** toco la fila de cualquier otra tarea Y (completarla,
   des-completarla, o cualquier otra interacción de la fila)
   **Then** no pasa nada — la interacción está bloqueada mientras X
   tiene su sesión activa.

5. **Given** que ya detuve la sesión activa de X (con el botón
   "Detener" o vía la confirmación de la regla anterior)
   **When** toco cualquier otra tarea
   **Then** vuelve a funcionar normalmente (regla 4).

6. **Given** este comportamiento
   **When** lo reviso tanto en `HoyScreen` como en el detalle de
   objetivo (`ObjetivoDetalleScreen`)
   **Then** es idéntico en ambos lugares — mismo bug, mismo fix, sin
   duplicar lógica si es posible extraerla a un helper compartido.

## Alcance técnico

- Extraer la lógica de "¿se puede interactuar con esta tarea dada la
  sesión activa actual?" a una función pura y compartida (candidata:
  `db/tareas.ts` o un helper nuevo), reutilizable desde ambas pantallas,
  en vez de duplicar el condicional.
- `alternarTarea` en ambas pantallas pasa a: verificar la regla de
  exclusividad (bloquear si aplica) → si no está bloqueado y va a
  completar, mostrar `Alert.alert` con confirmación (texto distinto si
  hay sesión propia activa) → al confirmar, si corresponde detener
  sesión, reutilizar la función ya existente de detener sesión
  (`onDetenerSesion`/`finalizarSesionActiva`, la misma que usa el botón
  "Detener") antes o junto con `alternarEstadoTarea`.
- Sin migración de base de datos — es una regla de interacción en la
  capa de UI/handlers, no un cambio de schema.

## Fuera de alcance

- Cambiar la superficie de toque (fila completa vs. checkbox) — libre a
  criterio de implementación, no es el objetivo de esta historia.
- Cualquier cambio a la lógica de Pomodoro más allá de reutilizar el
  mismo camino de "detener sesión" ya existente.

## Definition of Done aplicable

- Pruebas automatizadas para la función de exclusividad (misma tarea
  con sesión propia / otra tarea con sesión ajena / sin sesión) si se
  puede aislar como función pura testeable.
- Verificar los 5 criterios de aceptación en ambas pantallas.
- Commit con Conventional Commits, rama `feature/confirmacion-completar-tarea`.
- **No mergear a main hasta confirmación visual/funcional explícita de
  Kevin** (recordatorio del proceso ya corregido antes).

---

## Nota aparte para OpenCode — pendiente de UI del rediseño visual

Independiente de esta historia: revisar que la barra de navegación
inferior (bottom nav) del rediseño visual reciente no quede tapada por
los botones/gestos del sistema del teléfono (safe area inferior). Usar
`useSafeAreaInsets` (o el equivalente que ya esté disponible en el
proyecto) para que la barra respete el inset inferior en vez de pegarse
al borde físico de la pantalla — revisar tanto Android (barra de
gestos/botones) como iOS (home indicator).
