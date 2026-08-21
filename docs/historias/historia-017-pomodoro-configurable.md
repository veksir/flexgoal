# Historia 17: Pomodoro configurable

**Como** usuario que quiere trabajar en bloques de tiempo con descansos
**Quiero** iniciar una sesión en modo Pomodoro (trabajo + descanso, con duraciones configurables) sobre una tarea
**Para** mantener el ritmo de trabajo sin tener que vigilar el reloj yo mismo

## Contexto de diseño

**No especificado en el TDD ni en el roadmap:** el alcance exacto de
"Pomodoro configurable" y si debe notificar en segundo plano. Se
decidió explícitamente, en conversación, ir con la versión mínima
viable:

- Solo duración de trabajo + duración de descanso configurables (sin
  ciclos de descanso largo cada N pomodoros — se difiere a una historia
  futura si hace falta).
- Sin notificaciones push ni sonido: solo vibración mientras la app
  está abierta (usa la API `Vibration` de React Native, disponible en
  Expo Go, sin necesidad de dev build ni permisos adicionales — mantiene
  ADR-002).

**Reutiliza y extiende Historia 16** (persistencia de sesión activa) en
vez de crear un mecanismo aparte: el modo Pomodoro es una sesión activa
con dos campos adicionales (`modo` y `fase`) y un timestamp de "fin
esperado de la fase actual". Esto permite que, igual que en Historia
16, si la app se cierra a mitad de una fase y se reabre, el sistema
detecte cuánto tiempo pasó y actúe en consecuencia (ver criterio 7).

**Configuración persistida, sin pantalla nueva:** en vez de crear una
`ConfiguracionScreen` separada (innecesaria por ahora, YAGNI), los
campos de duración de trabajo/descanso se editan directamente en el
mismo lugar donde se inicia el Pomodoro, prellenados con el último
valor usado (persistido en una tabla de una sola fila).

## Criterios de aceptación (Given-When-Then)

1. **Given** que voy a iniciar una sesión sobre una tarea
   **When** elijo "Modo Pomodoro" en vez de sesión libre
   **Then** veo los campos de duración de trabajo y descanso
   prellenados con el último valor usado (25/5 min por defecto la
   primera vez), editables antes de iniciar.

2. **Given** que inicio un Pomodoro con duraciones X (trabajo) e Y
   (descanso)
   **When** se inicia
   **Then** arranca un cronómetro regresivo en fase "Trabajo" desde X
   minutos, y esas duraciones quedan guardadas como las últimas usadas
   para la próxima vez.

3. **Given** que el cronómetro de fase "Trabajo" llega a cero con la
   app abierta
   **When** termina
   **Then** vibra, se guarda automáticamente una sesión de tiempo sobre
   la tarea con duración X (reutilizando la lógica de guardado ya
   existente), y el cronómetro pasa a fase "Descanso" desde Y minutos,
   sin intervención del usuario.

4. **Given** que el cronómetro de fase "Descanso" llega a cero con la
   app abierta
   **When** termina
   **Then** vibra y la pantalla vuelve al estado inicial (sin sesión
   activa), lista para iniciar otro Pomodoro manualmente — no reinicia
   solo la fase de trabajo automáticamente.

5. **Given** un Pomodoro en curso (cualquier fase)
   **When** el usuario elige cancelarlo antes de que termine la fase
   **Then** si estaba en fase "Trabajo", se guarda el tiempo
   transcurrido hasta ese momento como sesión (aplicando la regla de
   descarte de <30s ya existente); si estaba en fase "Descanso", no se
   guarda nada — y en ambos casos vuelve al estado inicial.

6. **Given** que detengo una sesión libre (no Pomodoro), como ya
   funcionaba en Historias 7 y 16
   **When** se guarda
   **Then** el comportamiento es idéntico al actual — ninguna
   regresión.

7. **Given** un Pomodoro activo en fase "Trabajo" o "Descanso"
   **When** cierro la app completamente y la reabro después de que la
   fase actual ya debería haber terminado (según el timestamp de fin
   esperado)
   **Then** el sistema resuelve la fase vencida como si hubiera
   terminado a tiempo (guarda la sesión de trabajo si correspondía,
   avanza a la fase siguiente o vuelve al estado inicial si la fase
   vencida era "Descanso") — no deja el cronómetro colgado ni en
   negativo.

8. **Given** un Pomodoro activo en fase "Trabajo" o "Descanso"
   **When** cierro la app y la reabro antes de que la fase actual
   termine
   **Then** el cronómetro se resume mostrando el tiempo restante
   correcto de esa fase, igual que en Historia 16.

## Alcance técnico

- Migración en `app/db/migraciones.ts` (confirmar `DATABASE_VERSION`
  actual antes de escribir, no asumirlo):
  ```sql
  ALTER TABLE sesion_activa ADD COLUMN modo TEXT NOT NULL DEFAULT 'libre';
  ALTER TABLE sesion_activa ADD COLUMN fase TEXT;
  ALTER TABLE sesion_activa ADD COLUMN fin_esperado TEXT;

  CREATE TABLE configuracion_pomodoro (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    duracion_trabajo_minutos INTEGER NOT NULL DEFAULT 25,
    duracion_descanso_minutos INTEGER NOT NULL DEFAULT 5
  );
  ```
  `modo`: `'libre' | 'pomodoro'`. `fase`: `'trabajo' | 'descanso' | NULL`
  (NULL cuando `modo = 'libre'`). `fin_esperado`: timestamp ISO de
  cuándo debería terminar la fase actual (solo se usa en modo
  Pomodoro).

- Funciones nuevas en `app/db/sesiones.ts` (confirmar nombre real del
  archivo):
  - `obtenerConfiguracionPomodoro(db)` / `actualizarConfiguracionPomodoro(db, trabajoMin, descansoMin)`
    — leen/escriben la fila única de `configuracion_pomodoro`,
    creándola con los valores por defecto (25/5) si no existe.
  - `iniciarPomodoro(db, tareaId, trabajoMin, descansoMin)` — inserta en
    `sesion_activa` con `modo='pomodoro'`, `fase='trabajo'`,
    `inicio=ahora`, `fin_esperado = ahora + trabajoMin`. También llama a
    `actualizarConfiguracionPomodoro` para recordar los valores usados.
  - `avanzarFasePomodoro(db)` — cuando la fase "Trabajo" termina:
    finaliza la sesión de tiempo (reutilizando la lógica de
    `finalizarSesionActiva` de Historia 16) y actualiza la fila de
    `sesion_activa` a `fase='descanso'` con nuevo `fin_esperado`. Cuando
    la fase "Descanso" termina: borra la fila de `sesion_activa` (sin
    guardar nada de tiempo).
  - `resolverSesionActivaAlAbrir(db)` — se llama al montar `App.tsx`
    (reemplaza/extiende a `obtenerSesionActiva` de Historia 16): si hay
    una `sesion_activa` en modo Pomodoro cuyo `fin_esperado` ya pasó,
    resuelve en cascada (puede ser más de una fase vencida si pasó
    mucho tiempo) hasta llegar al estado real actual, aplicando
    `avanzarFasePomodoro` las veces que corresponda antes de devolver el
    estado a la UI.

- UI: en la pantalla donde ya se inicia una sesión sobre una tarea
  (confirmar cuál es exactamente antes de tocar código), agregar:
  - Selector "Sesión libre" / "Modo Pomodoro".
  - Si Pomodoro: dos inputs numéricos (minutos de trabajo / descanso),
    prellenados desde `obtenerConfiguracionPomodoro`.
  - Cronómetro regresivo con la fase actual ("Trabajo" / "Descanso") y
    tiempo restante, actualizado cada segundo mientras la app está
    abierta.
  - Vibración (`Vibration.vibrate()` de `react-native`) al terminar
    cada fase.
  - Botón para cancelar el Pomodoro en curso.

## Fuera de alcance (explícitamente)

- Ciclos de descanso largo cada N pomodoros — solo trabajo/descanso
  simples por ahora.
- Notificaciones push o locales (`expo-notifications`) — solo
  vibración mientras la app está en primer plano.
- Sonido/audio.
- Reinicio automático de un nuevo Pomodoro tras el descanso — requiere
  acción manual del usuario.
- Estadísticas o historial específico de Pomodoros completados (ya
  existe historial de sesiones de Historia 12; esta historia no le
  agrega distinción visual de "fue Pomodoro o libre" salvo que sea
  trivial hacerlo).
- Cualquier cambio al comportamiento de sesión libre ya existente.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe datos existentes de todas las
  historias anteriores (en particular, las sesiones activas en modo
  `'libre'` por defecto siguen funcionando exactamente igual).
- Verificar los 8 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Merge a `main` solo con `--ff-only`, en una rama creada explícitamente
  para esta historia (`feature/pomodoro`), tras verificación visual en
  dispositivo: completar un Pomodoro corto de prueba (ej. 1 minuto
  trabajo / 1 minuto descanso) de principio a fin, y probar cerrar la
  app a mitad de una fase para confirmar que se resuelve bien al
  reabrir.
- Pruebas automatizadas en `app/db/__tests__/` cubriendo: iniciar
  Pomodoro persiste modo/fase/fin_esperado correctamente, avanzar de
  fase trabajo a descanso guarda la sesión de tiempo, avanzar de
  descanso a fin borra la sesión activa sin guardar tiempo, cancelar a
  mitad de fase trabajo guarda el tiempo parcial (con regla de <30s),
  cancelar a mitad de descanso no guarda nada, resolver una fase
  vencida al reabrir la app (simulando `fin_esperado` en el pasado), y
  supervivencia de datos previos a la migración.
