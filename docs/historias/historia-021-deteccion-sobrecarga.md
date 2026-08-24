# Historia 21: Detección de sobrecarga al planificar

**Como** usuario que asigna fecha planificada y duración estimada a una tarea
**Quiero** saber, en el momento en que la estoy asignando (no después, revisando una vista aparte), si ese día ya está o quedaría sobrecargado frente a mi disponibilidad declarada
**Para** ajustar la planificación de entrada, en vez de descubrir la sobrecarga días después cuando ya es tarde para reorganizar

## Contexto de diseño

**Decisión tomada con el ADR-004 como guía:** la detección de sobrecarga es
determinística — reutiliza el motor de cálculo de carga ya construido en
Historia 19 (`calcularCargaDia`), no requiere IA.

**Punto de partida:** Historia 19 ya calcula `diferencia` (planificado −
disponible) por día, pero deliberadamente no lo interpretaba ("Detección de
sobrecarga... Fase 4, más adelante"). Esta historia toma ese mismo cálculo y
le da una interpretación explícita: `estaSobrecargado`.

**Dónde se muestra (decisión de esta historia, distinta de una vista pasiva):**
el aviso aparece **en el momento de organizar** — al crear una tarea con
fecha y duración (`FormularioTarea`) y al editar una tarea existente
(modal de edición de Historia 20) — no solo como un dato que se puede
consultar después en la vista Semana. La vista Semana (Historia 19) también
se actualiza para mostrar la misma marca, reutilizando el mismo cálculo,
pero el punto de intervención principal es el momento de planificar.

**Regla de sobrecarga (decisión explícita, para no confundir falta de dato
con sobrecarga real):**

> Un día se considera sobrecargado **solo si** tiene disponibilidad
> declarada para ese día de la semana (`minutosDisponibles > 0`) **y**
> los minutos planificados superan a los disponibles.
>
> Un día **sin ningún bloque de disponibilidad declarado** nunca se marca
> como sobrecargado — no hay información suficiente para afirmarlo, y
> tratarlo como sobrecarga sería un falso positivo constante para
> cualquiera que no haya declarado su horario todavía.

**Tono (coherente con Historia 8 y 19):** el aviso es informativo, no
bloqueante ni alarmista. El usuario puede guardar la tarea igual. Mismo
principio del documento original: "no castigar al usuario imperfecto".

## Criterios de aceptación (Given-When-Then)

1. **Given** un día de la semana con disponibilidad declarada
   **When** estoy creando una tarea con esa fecha planificada y una
   duración estimada tal que el total planificado de ese día (sumando
   las tareas ya existentes + esta nueva) supera los minutos disponibles
   **Then** veo un aviso neutro antes de guardar, con los minutos
   planificados y disponibles (ej. "Ese día quedaría con 3h 20min
   planificados de 3h disponibles (+20 min)"), sin bloquear el guardado.

2. **Given** las mismas condiciones que el criterio 1
   **When** el total planificado NO supera los minutos disponibles
   **Then** no aparece ningún aviso.

3. **Given** un día de la semana SIN ningún bloque de disponibilidad
   declarado
   **When** creo o edito una tarea con esa fecha, sin importar la
   duración
   **Then** no aparece ningún aviso de sobrecarga (falta de dato ≠
   sobrecarga).

4. **Given** una tarea ya existente con fecha y duración asignadas
   **When** la edito (modal de Historia 20) y cambio la fecha, la
   duración, o ambas
   **Then** el aviso se recalcula contra los nuevos valores, y la
   contribución original de esa misma tarea al día anterior **no** se
   cuenta dos veces ni se arrastra al nuevo día.

5. **Given** que estoy creando o editando una tarea sin fecha planificada
   o sin duración estimada
   **When** reviso el formulario
   **Then** no se muestra ningún aviso de sobrecarga (no hay suficiente
   información para calcularla).

6. **Given** un día que resulta sobrecargado según la regla anterior
   **When** lo veo en la vista Semana (Historia 19)
   **Then** ese día muestra una marca visual neutra ("Sobrecargado"),
   además de los totales que ya mostraba, reutilizando el mismo cálculo
   sin duplicar lógica.

7. **Given** un día sin disponibilidad declarada
   **When** lo veo en la vista Semana
   **Then** sigue mostrando "sin disponibilidad declarada" como hasta
   ahora (Historia 19), sin la marca de sobrecarga.

## Alcance técnico

- `app/db/carga.ts`:
  - Agregar `estaSobrecargado: boolean` a `DiaCarga`, calculado como
    `minutosDisponibles > 0 && diferencia > 0`. `calcularCargaDia` y
    `calcularCargaSemana` lo incluyen sin cambiar su firma actual.
  - Nueva función pura `calcularVistaPreviaSobrecarga(db, fecha,
    minutosAdicionales, excluirTareaId?)` → reutiliza `calcularCargaDia`
    para obtener el estado actual del día, resta la contribución de
    `excluirTareaId` si esa tarea ya estaba planificada ese mismo día
    (para ediciones), suma `minutosAdicionales`, y devuelve
    `{ minutosPlanificados, minutosDisponibles, diferencia,
    estaSobrecargado }` para ese escenario hipotético. No escribe nada
    en la base de datos — es solo cálculo para vista previa.
- `app/screens/FormularioTarea.tsx`:
  - Recibe `db` como prop nueva.
  - Cuando fecha y duración son válidas, calcula la vista previa (con
    `useEffect`, sin librería de debounce adicional) y muestra el aviso
    si `estaSobrecargado`.
- `app/screens/ObjetivoDetalleScreen.tsx` (modal de edición, Historia 20):
  - Mismo cálculo de vista previa en el modal de edición, pasando
    `excluirTareaId = tareaEditando.id` para no contar la propia tarea
    dos veces.
- `app/screens/SemanaScreen.tsx`:
  - Muestra la marca "Sobrecargado" cuando `dia.estaSobrecargado` es
    `true`, en el mismo tono neutro (sin color de alarma) usado para la
    diferencia numérica.
- Sin migración de base de datos — cálculo puro sobre datos existentes.

## Fuera de alcance (explícitamente)

- Sugerencias de ajuste o reprogramación automática — siguiente historia
  de Fase 4.
- Modo mínimo, días libres — historias separadas de Fase 4.
- Aviso agregado en la vista Hoy o a nivel de meta — esta historia se
  concentra en el momento de planificar (crear/editar tarea) y en la
  vista Semana que ya mostraba estos totales. Se puede evaluar más
  adelante si hace falta un resumen adicional en otras vistas.
- Cualquier bloqueo que impida guardar una tarea por estar sobrecargada
  — el usuario decide, coherente con Historia 10.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Pruebas automatizadas para `estaSobrecargado` en `calcularCargaDia`/
  `calcularCargaSemana` y para `calcularVistaPreviaSobrecarga` (con y sin
  disponibilidad, con y sin `excluirTareaId`, límite exacto sin superar).
- Verificar los 7 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`), en una rama creada
  explícitamente para esta historia (`feature/deteccion-sobrecarga`).
- Merge a `main` solo con `--ff-only`, tras verificación visual en
  dispositivo: crear/editar tareas en un día con disponibilidad
  declarada llevándolo a sobrecarga y confirmar el aviso; hacerlo en un
  día sin disponibilidad y confirmar que NO aparece aviso; revisar la
  vista Semana con al menos un día sobrecargado.
