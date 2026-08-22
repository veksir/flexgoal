# Historia 19: Vista semanal con cálculo de carga (Horarios)

**Como** usuario que ya declaró su disponibilidad y planifica tareas con fecha
**Quiero** ver, día por día de la semana, mis tareas planificadas junto a mi disponibilidad, con el total de minutos de cada lado
**Para** saber de un vistazo si lo que planifiqué es razonable frente al tiempo real que tengo, sin todavía recibir alertas ni sugerencias

## Contexto de diseño

**Decisión tomada con el ADR-004 como guía:** el ADR-004 agrupa
"horarios" y "cálculo de carga" bajo el mismo motor determinístico, lo
que indica que esta historia no debe ser solo una vista pasiva —
conviene calcular los totales ahora, porque **Fase 4 (detección de
sobrecarga) va a necesitar este mismo cálculo como base** de todas
formas. Hacerlo ahora evita reconstruirlo después.

**Lo que esta historia SÍ hace:** calcula, por día, minutos
planificados (suma de `duracion_estimada_minutos` de tareas con
`fecha_planificada` ese día) vs. minutos disponibles (suma de bloques
de `disponibilidad` para el día de la semana correspondiente), y
muestra la diferencia con un signo neutro — mismo tono que Historia 8
(comparación estimado vs. real), sin lenguaje de alerta ni culpa.

**Lo que esta historia NO hace (Fase 4, más adelante):** ninguna
detección de sobrecarga, ninguna sugerencia de ajuste, ninguna
reprogramación automática. Esta historia solo calcula y muestra los
números — interpretarlos y actuar sobre ellos es trabajo de historias
futuras.

**Dependencia a confirmar antes de implementar:** Historia 18 dejó
abierta la convención exacta de `dia_semana` (0=domingo..6=sábado, o
el criterio que se haya usado en la implementación real). Esta
historia necesita convertir una fecha (`AAAA-MM-DD`) a día de la semana
para cruzarla contra `disponibilidad` — **confirmar la convención real
implementada en Historia 18 antes de escribir esta conversión**, no
asumirla.

## Criterios de aceptación (Given-When-Then)

1. **Given** que tengo tareas con `fecha_planificada` esta semana y
   disponibilidad ya declarada
   **When** entro a la vista Semana
   **Then** veo cada uno de los 7 días con sus tareas planificadas y
   sus bloques de disponibilidad, lado a lado.

2. **Given** un día con tareas planificadas que tienen duración
   estimada
   **When** veo ese día
   **Then** veo el total de minutos planificados (suma de
   `duracion_estimada_minutos` de esas tareas).

3. **Given** un día con bloques de disponibilidad declarados
   **When** veo ese día
   **Then** veo el total de minutos disponibles (suma de la duración
   de todos los bloques de ese día de la semana).

4. **Given** ambos totales de un día
   **When** los veo
   **Then** también veo la diferencia (planificado − disponible), con
   signo, en el mismo tono neutro de Historia 8 — sin advertencias ni
   colores de alarma.

5. **Given** una tarea planificada sin duración estimada
   **When** aparece en la lista del día
   **Then** se muestra igual, pero marcada aparte (ej. "(sin
   estimar)") y NO se incluye en el total de minutos planificados —
   para no falsear el cálculo con un valor inventado.

6. **Given** un día sin ninguna tarea planificada
   **When** lo veo
   **Then** aparece vacío de tareas, pero igual muestra su
   disponibilidad si la tiene declarada.

7. **Given** un día sin ninguna disponibilidad declarada
   **When** lo veo
   **Then** muestra "sin disponibilidad declarada" y el total
   disponible es 0 — no se rompe ni se oculta el día.

8. **Given** que navego a la semana anterior o siguiente
   **When** cambio de semana
   **Then** veo los datos correctos de esa semana específica, no de la
   actual.

## Alcance técnico

- Confirmar la convención real de `dia_semana` usada en Historia 18
  antes de escribir cualquier conversión fecha → día.
- Nuevas funciones puras en `app/db/carga.ts` (archivo nuevo, mismo
  patrón de inyección de dependencia ya establecido):
  - `calcularCargaDia(db, fecha: string)` → retorna
    `{ tareas: Tarea[], minutosPlanificados: number, minutosDisponibles: number, diferencia: number }`.
    Reutiliza la query de tareas por fecha ya existente de Historia 11
    (vista Hoy) si aplica, y `listarDisponibilidad` filtrado por el día
    de semana correspondiente a `fecha`.
  - `calcularCargaSemana(db, fechaInicioSemana: string)` → llama a
    `calcularCargaDia` para los 7 días de esa semana.
- Sin migración de base de datos — esta historia es cálculo puro sobre
  datos que ya existen (`tareas.fecha_planificada`,
  `tareas.duracion_estimada_minutos`, `disponibilidad`).
- UI: nueva pantalla `SemanaScreen`, nuevo tab en la navegación
  principal (confirmar cómo está implementado el toggle actual antes
  de agregar una opción más, mismo cuidado que en Historia 18).
  - Navegación semana anterior/siguiente.
  - Por cada uno de los 7 días: lista de tareas planificadas (con
    marca "(sin estimar)" cuando corresponda), bloques de
    disponibilidad, y los 3 totales (planificado, disponible,
    diferencia).

## Fuera de alcance (explícitamente)

- Detección de sobrecarga, alertas, o cualquier lenguaje de
  advertencia — Fase 4.
- Sugerencias de ajuste o reprogramación automática — Fase 4 y
  "Reprogramación" (siguiente ítem de Fase 3, historia separada).
- Asignación de una tarea a un bloque específico dentro del día — el
  cálculo es agregado por día completo, no por bloque individual.
- Cualquier cambio a `disponibilidad`, `tareas`, o su UI existente —
  esta historia solo lee esos datos, no los modifica.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar los 8 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`), en una rama creada
  explícitamente para esta historia (`feature/vista-semana`).
- Merge a `main` solo con `--ff-only`, tras verificación visual en
  dispositivo: crear tareas planificadas en distintos días de la
  semana (algunas con duración estimada, alguna sin ella), declarar
  disponibilidad en algunos días y dejar otros sin disponibilidad, y
  confirmar que los totales y la diferencia se calculan y muestran
  correctamente, incluyendo al navegar a la semana anterior/siguiente.
- Pruebas automatizadas en `app/db/__tests__/` cubriendo:
  `calcularCargaDia` con tareas estimadas y sin estimar, día sin
  tareas, día sin disponibilidad, día con múltiples bloques de
  disponibilidad, y `calcularCargaSemana` retornando los 7 días
  correctos para una semana dada.
