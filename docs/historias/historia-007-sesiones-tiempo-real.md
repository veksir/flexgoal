# Historia 7: Registrar sesión de tiempo real en una tarea

**Como** usuario
**Quiero** iniciar y detener un cronómetro simple mientras trabajo en una tarea
**Para** empezar a registrar cuánto tiempo real le dedico, y algún día compararlo contra lo que estimé

## Contexto de diseño

Del TDD (jerarquía funcional): Meta → Objetivo → Tarea → **Sesión**. Esta
historia implementa el último nivel de la jerarquía, con la versión más
simple posible: un cronómetro manual (iniciar/detener), **no** un Pomodoro
completo con duraciones configurables de trabajo/descanso — eso es una
historia posterior, solo si se necesita.

Con esta historia, junto con la Historia 5 (fecha planificada) y la
Historia 6 (duración estimada), quedan capturados ambos lados de la
comparación planificado-vs-real que es el corazón del sistema adaptativo
(Fase 4) — aunque el cálculo/comparación en sí sigue sin implementarse
todavía, eso viene más adelante.

## Criterios de aceptación (Given-When-Then)

1. **Given** una tarea (pendiente o completada)
   **When** presiono "Iniciar sesión" sobre ella
   **Then** se muestra un cronómetro corriendo (tiempo transcurrido, actualizado cada segundo) asociado a esa tarea específica.

2. **Given** una sesión en curso en una tarea
   **When** presiono "Detener"
   **Then** se guarda una sesión con la duración real transcurrida (redondeada al minuto más cercano) asociada a esa tarea, y el cronómetro desaparece.

3. **Given** que ya hay una sesión activa en una tarea
   **When** intento iniciar una sesión en otra tarea distinta (de cualquier objetivo/meta)
   **Then** veo un mensaje indicando que ya hay una sesión activa y debo detenerla primero — solo una sesión activa a la vez en toda la app.

4. **Given** que detengo una sesión que duró menos de 30 segundos
   **When** se procesa el "Detener"
   **Then** la sesión NO se guarda (evita ensuciar los datos con sesiones de 0 minutos), y veo un aviso breve de que fue muy corta.

5. **Given** una tarea con una o más sesiones ya guardadas
   **When** veo su detalle
   **Then** veo el tiempo total acumulado en esa tarea (suma de la duración de todas sus sesiones).

6. **Given** que cierro la app completamente mientras hay una sesión activa (sin haber presionado "Detener")
   **When** la reabro
   **Then** esa sesión en curso se pierde — es el comportamiento esperado en esta versión (no se persiste el cronómetro en curso, solo las sesiones ya detenidas). Esto es una limitación conocida, no un bug; el manejo robusto de background queda para una historia futura si se vuelve un problema real de uso.

7. **Given** tareas con sesiones ya guardadas (detenidas correctamente)
   **When** cierro la app completamente y la reabro
   **Then** esas sesiones y su duración persisten correctamente, y el tiempo total acumulado se sigue calculando bien.

## Alcance técnico

- Nueva tabla:
  ```sql
  CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarea_id INTEGER NOT NULL REFERENCES tareas(id),
    duracion_minutos INTEGER NOT NULL,
    creado_en TEXT NOT NULL
  );
  ```
- Estado global de la app (no en base de datos): `sesionActiva:
  { tareaId: number, inicioTimestamp: number } | null`. Solo una sesión
  activa a la vez.
- `crearSesion(tareaId, duracionMinutos)` — rechaza si `duracionMinutos < 1`.
- `tiempoTotalPorTarea(tareaId)` — `SUM(duracion_minutos)` de todas las
  sesiones de esa tarea.
- El cronómetro visual se actualiza con `setInterval` mientras
  `sesionActiva` no es null; al detener, se calcula
  `Math.round((Date.now() - inicioTimestamp) / 60000)`.
- Sigue sin librerías de navegación ni de manejo de estado adicional —
  todo con `useState`/`useEffect`.

## Fuera de alcance (explícitamente)

- Pomodoro con duraciones configurables de trabajo/descanso.
- Persistencia de una sesión en curso al cerrar la app (criterio 6 lo
  deja explícito: se pierde, y está bien así por ahora).
- Cualquier comparación planificado-vs-real (Fase 4).
- Editar o eliminar sesiones ya guardadas.
- Historial detallado de sesiones (solo el total acumulado, no la lista).

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar específicamente: (a) que no se pueden tener 2 sesiones activas
  a la vez, (b) que sesiones menores a 30 segundos no se guardan, (c) que
  el total acumulado por tarea suma correctamente con 2+ sesiones.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go (build SDK 57), sobre la instalación existente,
  antes de dar por terminada la historia.
