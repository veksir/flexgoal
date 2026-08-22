# Historia 18: Disponibilidad declarada

**Como** usuario con un horario de vida propio (trabajo, estudio, tiempo libre variable)
**Quiero** declarar en qué días y horas de la semana suelo tener tiempo disponible, y poder editarlo cuando cambie
**Para** que el sistema tenga una base real de mi tiempo, sin asumir un horario típico que no me corresponde

## Contexto de diseño

**No especificado en el TDD:** el detalle de cómo se declara la
disponibilidad. Se decidió, en conversación, un horario **semanal
recurrente** (por día de la semana, uno o más bloques de hora inicio/
fin), totalmente editable en cualquier momento — sin fechas
específicas ni excepciones puntuales todavía.

**Importante — qué NO resuelve esta historia:** la flexibilidad ante
cambios de circunstancia (una semana con menos tiempo, un día libre
inesperado) está explícitamente reservada para Fase 4 ("modo mínimo" y
"días libres"). Esta historia solo captura el horario base — el
usuario mismo lo mantiene actualizado editándolo cuando su situación
cambie. No hay lógica automática de detección de cambios ni de
excepciones en esta historia.

Esta historia tampoco calcula nada todavía (carga de trabajo,
capacidad, choques de horario) — eso es "Horarios" y "Reprogramación",
los siguientes ítems de Fase 3, que consumirán este dato una vez
exista.

**Decisión de diseño:** tabla independiente `disponibilidad`, sin
relación (FK) con metas/tareas — es un dato del usuario en general, no
de una entidad específica. Múltiples bloques por día son válidos (ej.
mañana y noche del mismo día), para no forzar horarios partidos a
fusionarse en un solo rango.

## Criterios de aceptación (Given-When-Then)

1. **Given** que nunca he declarado disponibilidad
   **When** entro a la pantalla de Disponibilidad
   **Then** la veo vacía (sin bloques en ningún día), con opción de
   agregar uno.

2. **Given** que estoy agregando un bloque
   **When** elijo un día de la semana y una hora de inicio y fin
   válidas (ej. Lunes, 18:00–20:00)
   **Then** se guarda y aparece listado bajo ese día.

3. **Given** que estoy agregando un bloque
   **When** la hora de fin es menor o igual a la hora de inicio (ej.
   20:00–18:00, o 18:00–18:00)
   **Then** se rechaza con un mensaje claro y no se guarda nada.

4. **Given** que ya tengo un bloque guardado en un día (ej. Lunes
   mañana)
   **When** agrego otro bloque distinto en el mismo día (ej. Lunes
   noche)
   **Then** ambos bloques coexisten y se muestran, sin que uno
   sobreescriba al otro.

5. **Given** un bloque ya guardado
   **When** lo elimino
   **Then** desaparece de la lista y no vuelve a aparecer al reabrir la
   app.

6. **Given** disponibilidad ya declarada
   **When** cierro la app por completo y la reabro
   **Then** toda la disponibilidad persiste tal cual quedó (SQLite, no
   memoria).

7. **Given** cualquier día de la semana, incluyendo fines de semana
   **When** declaro disponibilidad ahí
   **Then** se acepta igual que cualquier día laboral — la app no
   asume ni favorece ningún patrón de horario "típico".

## Alcance técnico

- Migración en `app/db/migraciones.ts` (confirmar `DATABASE_VERSION`
  actual antes de escribir, no asumirlo):
  ```sql
  CREATE TABLE disponibilidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dia_semana INTEGER NOT NULL, -- 0=domingo .. 6=sábado (o el criterio
                                   -- que ya use el proyecto para fechas,
                                   -- confirmar consistencia)
    hora_inicio TEXT NOT NULL,   -- formato HH:MM
    hora_fin TEXT NOT NULL       -- formato HH:MM
  );
  ```
- Funciones nuevas, archivo nuevo `app/db/disponibilidad.ts` (seguir el
  patrón de inyección de dependencia ya establecido — recibir `db` como
  parámetro, no importarlo):
  - `agregarBloqueDisponibilidad(db, diaSemana, horaInicio, horaFin)` —
    valida formato `HH:MM` y que `horaInicio < horaFin` antes de
    insertar; lanza error o retorna resultado inválido si no cumple
    (seguir el mismo patrón de validación usado en
    `esFechaValida`/duración estimada).
  - `listarDisponibilidad(db)` — retorna todos los bloques, ordenados
    por día de semana y luego por hora de inicio.
  - `eliminarBloqueDisponibilidad(db, id)`.
- UI: nueva pantalla `DisponibilidadScreen`, con acceso desde la
  navegación de nivel superior (mismo patrón de toggle ya usado entre
  Hoy/Ideas/Metas — confirmar cómo está implementado ese toggle
  actualmente antes de agregar la cuarta opción).
  - Lista agrupada por día de la semana, mostrando los bloques de cada
    uno (o "sin disponibilidad" si un día no tiene ninguno).
  - Formulario simple para agregar bloque: selector de día + input hora
    inicio + input hora fin (texto con validación `HH:MM`, sin time
    picker nativo — mismo criterio que se usó con fechas en formato
    texto).
  - Botón/ícono eliminar por bloque (mismo patrón visual ya usado en
    ideas/tareas).

## Fuera de alcance (explícitamente)

- Cualquier cálculo de capacidad, carga de trabajo, o choques de
  horario contra tareas/sesiones — eso es "Horarios" (siguiente
  historia de Fase 3).
- Excepciones puntuales a la disponibilidad recurrente (un día distinto
  a lo normal) — eso es Fase 4 ("días libres").
- Detección automática de cambios de rutina — el usuario edita
  manualmente cuando su situación cambie.
- Validación de solapamiento entre bloques del mismo día (ej. dos
  bloques que se cruzan en horario) — se acepta tal cual por ahora, sin
  bloquear al usuario; se revisita si genera problemas reales en
  Horarios.
- Recordatorios o notificaciones basadas en disponibilidad.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar que la migración no rompe datos existentes de todas las
  historias anteriores (tabla nueva, sin tocar ninguna existente).
- Verificar los 7 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`), en una rama creada
  explícitamente para esta historia (`feature/disponibilidad`).
- Merge a `main` solo con `--ff-only`, tras verificación visual en
  dispositivo: agregar bloques en distintos días (incluyendo fin de
  semana), confirmar que varios bloques en un mismo día coexisten,
  eliminar uno, y cerrar/reabrir la app para confirmar persistencia.
- Pruebas automatizadas en `app/db/__tests__/` cubriendo: agregar
  bloque válido, rechazar hora_fin <= hora_inicio, múltiples bloques en
  el mismo día coexisten, listar ordenado por día y hora, eliminar un
  bloque, y supervivencia de datos previos a la migración.
