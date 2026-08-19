# Historia 6: Duración estimada en tareas

**Como** usuario
**Quiero** asignarle una duración estimada (en minutos) a una tarea, de forma opcional
**Para** poder comparar más adelante cuánto tiempo planifiqué contra cuánto tiempo realmente usé

## Contexto de diseño

Este es el segundo de los tres campos que el spike de base de datos usó
para validar Query C (desviación planificado vs. realizado). Ya tienes
`fecha_planificada` (Historia 5); esta historia agrega la otra mitad de
la comparación futura: cuánto tiempo pensabas que te iba a tomar.

**Esta historia NO implementa Sesiones ni tiempo real trabajado** — eso
es Fase 2 (Pomodoro/time tracking). Aquí solo se captura la estimación.

## Criterios de aceptación (Given-When-Then)

1. **Given** que estoy en el formulario de agregar tarea
   **When** escribo el nombre y, opcionalmente, una duración estimada en minutos (número entero positivo)
   **Then** la tarea se crea con esa duración si es válida, o sin duración si dejé el campo vacío.

2. **Given** que escribo un valor inválido (texto, número negativo, cero, o un decimal)
   **When** intento guardar la tarea
   **Then** veo un mensaje de error claro y la tarea NO se crea hasta que corrija el valor o deje el campo vacío.

3. **Given** una tarea con duración estimada
   **When** la veo en la lista de tareas de su objetivo
   **Then** se muestra junto al nombre (ej. "Practicar SQL — 30 min").

4. **Given** una tarea sin duración estimada
   **When** la veo en la lista
   **Then** no se muestra ningún texto de duración.

5. **Given** tareas con duraciones distintas (y algunas sin duración)
   **When** cierro la app completamente y la reabro
   **Then** cada duración persiste exactamente como se guardó.

6. **Given** tareas creadas en historias anteriores (antes de esta migración)
   **When** abro la app después de aplicar este cambio
   **Then** siguen existiendo intactas, con duración estimada en `NULL`.

## Alcance técnico

- Migración (subir `DATABASE_VERSION` a 6):
  ```sql
  ALTER TABLE tareas ADD COLUMN duracion_estimada_minutos INTEGER;
  ```
- `crearTarea` acepta un tercer parámetro opcional
  `duracionEstimadaMinutos?: number`.
- Validación: número entero positivo (regex `/^\d+$/` sobre el texto del
  input antes de convertir con `parseInt`, y rechazar `0`). No hace falta
  librería adicional.
- Mostrar como `"{minutos} min"` junto al nombre de la tarea (y junto a la
  fecha, si también tiene fecha planificada — ej. `"Practicar SQL —
  20/08/2026 — 30 min"`).

## Fuera de alcance (explícitamente)

- Sesiones, Pomodoro, tiempo real trabajado (Fase 2).
- Cualquier cálculo o comparación planificado-vs-real (Fase 4).
- Fecha objetivo en Meta, prioridad, categoría/área, cambiar estado de meta.
- Selector visual de duración (slider, stepper) — sigue siendo `TextInput`.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe tareas ya existentes (de todas las
  historias anteriores, especialmente las que ya tienen `fecha_planificada`).
- Verificar los 3 casos: duración válida, inválida (rechazada), vacía.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57), sobre la instalación existente
  (sin reinstalar), antes de dar por terminada la historia.
