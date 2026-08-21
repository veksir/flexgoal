# Historia 16: Persistencia de sesión activa al cerrar la app

**Como** usuario que inicia una sesión de tiempo sobre una tarea
**Quiero** que la sesión no se pierda si la app se cierra antes de detenerla (batería, cambio de app, cierre accidental)
**Para** no perder el registro de tiempo trabajado solo por haber cerrado la app sin darme cuenta

## Contexto de diseño

Limitación conocida y aceptada desde Historia 7: *"una sesión activa se
pierde si se cierra la app sin detenerla (sin persistencia de
background todavía)"*. Esta historia la resuelve.

**Importante — alcance real de "persistencia en background":** esto NO
implementa un servicio nativo que siga corriendo con la app
completamente cerrada (eso requeriría un dev build nativo, contradice
ADR-002 que mantiene el proyecto en Expo Go durante Fase 1-2, y no está
justificado por YAGNI en este punto). Lo que sí resuelve: el inicio de
la sesión se persiste en SQLite de inmediato (no solo en memoria de
React), así que al reabrir la app después de haberse cerrado, el
cronómetro se puede **resumir con el tiempo real transcurrido**
(calculado contra el timestamp de inicio guardado), en vez de perderse
o reiniciar desde cero.

**Decisión de diseño:** nueva tabla `sesion_activa`, separada de
`sesiones` (que sigue guardando solo sesiones ya finalizadas, sin
cambios en su esquema). Se usa el **enfoque de "sin fila = sin sesión
activa"**: se inserta una fila al iniciar, se borra al finalizar — no
hace falta manejar una fila singleton con valores nulos.

## Criterios de aceptación (Given-When-Then)

1. **Given** que inicio una sesión de tiempo para una tarea
   **When** se inicia
   **Then** queda persistida de inmediato en SQLite (tabla
   `sesion_activa`, con `tarea_id` y timestamp de inicio), no solo en
   memoria de React.

2. **Given** una sesión activa persistida
   **When** cierro la app completamente (sin detenerla) y la reabro
   **Then** el cronómetro se resume automáticamente sobre la misma
   tarea, mostrando el tiempo transcurrido correcto — calculado desde
   el timestamp de inicio guardado, no desde cero.

3. **Given** una sesión resumida tras reabrir la app
   **When** la detengo
   **Then** se guarda en `sesiones` con la duración correcta (tiempo
   real transcurrido, incluyendo el tiempo que la app estuvo cerrada) y
   la fila de `sesion_activa` se elimina.

4. **Given** que detengo una sesión normalmente, sin haber cerrado la
   app en el proceso
   **When** se guarda
   **Then** el comportamiento es idéntico al de Historia 7 — ninguna
   regresión.

5. **Given** una sesión (resumida o no) cuyo tiempo total transcurrido
   es menor a 30 segundos
   **When** la detengo
   **Then** se descarta igual que antes (regla ya existente de
   Historia 7) y la fila de `sesion_activa` igual se elimina.

6. **Given** que no hay ninguna sesión activa al momento de abrir la
   app
   **When** abro la app
   **Then** no aparece ningún cronómetro activo — comportamiento normal
   sin cambios.

7. **Given** metas, tareas y sesiones creadas en historias anteriores
   (1 a 15)
   **When** se aplica esta migración
   **Then** sobreviven intactas — la tabla `sesion_activa` es nueva y
   no toca ninguna tabla existente.

## Alcance técnico

- Migración en `app/db/migraciones.ts`, subiendo `DATABASE_VERSION`
  (confirmar el valor actual antes de escribir la migración, no
  asumirlo):
  ```sql
  CREATE TABLE sesion_activa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarea_id INTEGER NOT NULL REFERENCES tareas(id),
    inicio TEXT NOT NULL
  );
  ```
- Nuevas funciones en `app/db/sesiones.ts` (confirmar el nombre real
  del archivo antes de escribir — no asumirlo):
  - `iniciarSesionActiva(db, tareaId): Promise<void>` — inserta la fila
    con `inicio = new Date().toISOString()`.
  - `obtenerSesionActiva(db): Promise<{ tareaId: number; inicio: string } | null>`
    — se llama al montar `App.tsx`; si hay fila, se usa para resumir el
    estado de sesión activa en memoria con el `inicio` real (no
    `Date.now()` del momento del resumen).
  - `finalizarSesionActiva(db, tareaId)` — calcula el tiempo
    transcurrido (`ahora - inicio`), aplica la misma regla de descarte
    de <30s ya existente, inserta en `sesiones` si corresponde, y
    borra la fila de `sesion_activa`.
- `App.tsx`: al iniciar sesión, llamar también a
  `iniciarSesionActiva`. Al montar la app, llamar a
  `obtenerSesionActiva` y, si hay resultado, restaurar el estado
  `sesionActiva` con el `tarea_id` e `inicio` reales para que el
  cronómetro calcule el tiempo transcurrido correctamente desde ese
  punto.
- Reutilizar el cálculo de duración y la regla de descarte de <30s ya
  existentes de Historia 7 — no duplicar esa lógica.

## Fuera de alcance (explícitamente)

- Servicio nativo en background / foreground service de Android o iOS
  que mantenga la app "viva" mientras está cerrada — no se necesita
  para cumplir los criterios de esta historia (solo se necesita
  recordar el inicio real, no ejecutar código mientras está cerrada).
- Notificaciones push o locales relacionadas con la sesión activa.
- Múltiples sesiones activas simultáneas (sigue siendo una sola sesión
  activa a la vez en toda la app, principio ya establecido en
  Historia 7).
- Cualquier cambio al esquema o comportamiento de la tabla `sesiones`
  ya existente.
- Pomodoro (historia separada, siguiente pendiente de Fase 2).

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe datos existentes de todas las
  historias anteriores.
- Verificar los 7 criterios de aceptación anteriores, incluyendo
  simular cierre/reapertura vía test (crear una fila en
  `sesion_activa` directamente, luego llamar `obtenerSesionActiva` y
  confirmar que devuelve los datos correctos).
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Merge a `main` solo con `--ff-only`, tras verificación visual real en
  dispositivo: iniciar una sesión, cerrar la app por completo (no solo
  minimizar), esperar unos segundos, reabrir, y confirmar que el
  cronómetro muestra el tiempo correcto y no se reinició.
- Pruebas automatizadas en `app/db/__tests__/` cubriendo: iniciar
  sesión activa la persiste, `obtenerSesionActiva` devuelve `null` si
  no hay ninguna, finalizar una sesión activa la mueve correctamente a
  `sesiones` (o la descarta si es <30s) y borra la fila de
  `sesion_activa`, y supervivencia de datos previos a la migración.

## Tarea adicional (fuera de esta historia, mismo commit de `docs:`)

El `README.md` quedó desactualizado: dice "🚧 En desarrollo — Fase 1
(Fundamentos) en curso", pero Fase 1 ya se cerró en Historia 15.
Actualizar esa línea a:

```markdown
🚧 En desarrollo — Fase 1 (Fundamentos) completa. Fase 2 (Tiempo) en curso.
```

No tocar nada más del README — el resto sigue vigente.
