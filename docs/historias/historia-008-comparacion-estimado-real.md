# Historia 8: Comparación estimado vs. real por tarea

**Como** usuario
**Quiero** ver, junto a cada tarea, cómo se compara el tiempo que estimé contra el tiempo que realmente usé
**Para** empezar a notar mis propios patrones (subestimo, sobreestimo, acierto) sin que nadie me lo tenga que explicar

## Contexto de diseño

Del documento original del producto (insight central): *"El plan ideal no
siempre coincide con la vida real. Por eso la aplicación debe aprender de
la diferencia entre lo planificado y lo realizado."* Esta historia es la
primera vez que el producto entrega esa promesa, aunque sea de forma
mínima — no hay todavía ningún análisis agregado ni sugerencias de
ajuste (eso es Fase 4 completa), solo la comparación cruda al nivel de
una tarea individual.

**No requiere tabla nueva.** `duracion_estimada_minutos` (Historia 6) y
el tiempo real vía `tiempoTotalPorTarea` (Historia 7) ya existen — esto
es puramente de presentación.

Del documento original (sección 5.2, "Diseñada para usuarios
imperfectos"): la app no debe castigar. Este principio aplica
directamente aquí — si el usuario se pasó del tiempo estimado, la
indicación debe ser neutra, no una alarma ni un tono de reproche.

## Criterios de aceptación (Given-When-Then)

1. **Given** una tarea con duración estimada Y con tiempo real registrado (mayor a 0)
   **When** la veo en la lista de tareas
   **Then** veo ambos valores juntos, con la diferencia entre ellos indicada de forma neutra (ej. "Estimado: 30 min · Real: 45 min · +15 min").

2. **Given** una tarea que solo tiene uno de los dos datos (estimado sin sesiones registradas, o sesiones registradas sin estimado)
   **When** la veo en la lista
   **Then** se muestra únicamente el dato que existe, sin inventar ni mostrar una comparación con un valor de 0.

3. **Given** que el tiempo real fue igual o menor al tiempo estimado
   **When** se muestra la comparación
   **Then** no aparece ningún indicador negativo, alarmante, ni de color rojo fuerte — tono neutro, igual de neutro que cuando se pasó del tiempo.

4. **Given** que el tiempo real superó el tiempo estimado
   **When** se muestra la comparación
   **Then** la diferencia se muestra de forma clara pero neutra (ej. "+15 min sobre lo estimado"), sin lenguaje de culpa ("te excediste", "fallaste") ni símbolos de alerta agresivos.

5. **Given** una tarea sin estimado y sin tiempo real
   **When** la veo en la lista
   **Then** no se muestra nada de esta sección (comportamiento ya existente, no debe cambiar).

## Alcance técnico

- Ninguna migración de base de datos — todo se calcula a partir de datos
  que ya existen.
- Función pura (sin acceso a BD) `calcularDiferencia(estimado: number |
  null, real: number): number | null` — retorna `null` si `estimado` es
  `null` (no hay nada que comparar), o la diferencia en minutos
  (`real - estimado`) en caso contrario.
- Ajustar el renderizado de cada fila de tarea en
  `ObjetivoDetalleScreen.tsx` para combinar lo que ya se muestra
  (duración estimada de la Historia 6, total real de la Historia 7) en
  una sola línea de comparación cuando ambos existen.

## Fuera de alcance (explícitamente)

- Cualquier análisis agregado por meta u objetivo (eso es Fase 4 completa).
- Sugerencias de ajuste de plan.
- Comparación a nivel de fecha/semana (eso depende de Fase 3, que no existe todavía).
- Cambios visuales más allá de esta línea de comparación (colores de
  toda la app, iconografía general, etc.).

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar los 4 casos de datos (ambos presentes, solo estimado, solo
  real, ninguno) y los 2 casos de dirección (real ≤ estimado, real >
  estimado) — 6 combinaciones en total, aunque algunas se solapen.
- Confirmar que el tono del mensaje cuando se excede el estimado es
  neutro, no punitivo (revisar el texto exacto antes de dar por
  terminada la historia — esto es tan de producto como de código).
- Funciona 100% offline (no depende de nada nuevo).
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57), sobre la instalación existente.
