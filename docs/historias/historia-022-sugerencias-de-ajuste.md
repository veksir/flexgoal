# Historia 22: Sugerencias de ajuste ante sobrecarga

**Como** usuario que ve el aviso de sobrecarga de Historia 21 al planificar una tarea
**Quiero** que además del aviso se me sugiera un día alternativo con capacidad disponible, y poder aplicarlo con un toque
**Para** resolver la sobrecarga ahí mismo, sin tener que ir a revisar la disponibilidad de la semana a mano

## Contexto de diseño

**Decisión tomada con el ADR-004 como guía:** igual que la detección de
sobrecarga (Historia 21), esta historia es determinística — un heurístico
simple de búsqueda sobre datos existentes (`disponibilidad` + `tareas`),
sin IA. Encaja en el mismo motor determinístico.

**Punto de partida:** Historia 21 ya muestra un aviso neutro cuando
planificar una tarea sobrecargaría un día. Esta historia no cambia esa
detección — la extiende con una sugerencia accionable justo al lado del
aviso.

**Rango de búsqueda de la sugerencia (decisión explícita):** el modelo de
datos actual no tiene un campo de urgencia o flexibilidad por tarea, así
que no hay forma de saber si el usuario necesita esa fecha pronto o puede
esperar. Se resuelve con una búsqueda en dos pasos:

1. Buscar primero un día con capacidad disponible dentro de la **semana
   actual** (domingo–sábado de la fecha que el usuario eligió) — cubre el
   caso "lo quiero pronto".
2. Si no hay ningún día con hueco en esa semana, extender la búsqueda a
   la **semana siguiente completa** — cubre el caso "soy flexible".
3. Si tampoco hay hueco en esas dos semanas, no se sugiere nada (no se
   sigue extendiendo indefinidamente — una sugerencia muy lejana en el
   tiempo deja de ser útil).

**Qué cuenta como "capacidad disponible" en un día candidato:** mismo
cálculo de Historia 19/21 — el día debe tener disponibilidad declarada
(`minutosDisponibles > 0`) y, sumando la duración de la tarea que se está
planificando a lo ya planificado ese día, no debe quedar sobrecargado
(`estaSobrecargado === false` en el escenario hipotético). Se reutiliza
`calcularVistaPreviaSobrecarga` de Historia 21 para cada día candidato, sin
duplicar la lógica de cálculo.

**Cuál día se sugiere si hay varios con hueco:** el más cercano a la fecha
original (menor distancia en días), para minimizar el corrimiento del
plan.

**Interacción:** la sugerencia aparece como texto junto al aviso de
sobrecarga existente, con un botón "Usar esta fecha" que reemplaza el
valor del campo de fecha en el formulario (creación o edición) por la
fecha sugerida — sin guardar automáticamente; el usuario revisa y
confirma con el botón "Agregar tarea" / "Guardar cambios" como ya hace
hoy.

**Tono:** mismo principio de Historia 8/19/21 — la sugerencia es una
opción, no una corrección impuesta. El usuario puede ignorarla y guardar
la fecha original igual.

## Criterios de aceptación (Given-When-Then)

1. **Given** que el aviso de sobrecarga de Historia 21 se muestra para una
   fecha y duración dadas
   **When** existe algún día, dentro de la semana actual o la siguiente,
   con disponibilidad declarada y capacidad suficiente para esa duración
   sin quedar sobrecargado
   **Then** se muestra una sugerencia con ese día y su capacidad libre
   (ej. "Miércoles 26/08 tiene 2h 10min libres"), junto al aviso.

2. **Given** la sugerencia visible
   **When** presiono "Usar esta fecha"
   **Then** el campo de fecha del formulario (creación o edición) se
   actualiza con la fecha sugerida, sin guardar todavía, y el aviso/
   sugerencia se recalculan contra la nueva fecha.

3. **Given** que hay más de un día con capacidad suficiente
   **When** se calcula la sugerencia
   **Then** se sugiere el más cercano a la fecha original (menor
   distancia en días), no el primero por orden de fecha.

4. **Given** que ningún día de la semana actual tiene capacidad
   suficiente, pero sí hay al menos uno en la semana siguiente
   **When** se calcula la sugerencia
   **Then** se sugiere ese día de la semana siguiente.

5. **Given** que ni la semana actual ni la siguiente tienen ningún día
   con capacidad suficiente
   **When** se muestra el aviso de sobrecarga
   **Then** no aparece ninguna sugerencia (solo el aviso existente de
   Historia 21) — no se inventa una fecha lejana sin sentido.

6. **Given** que el día original NO está sobrecargado (caso normal, sin
   aviso de Historia 21)
   **When** completo el formulario
   **Then** no se calcula ni se muestra ninguna sugerencia — esta
   historia solo actúa cuando ya hay sobrecarga detectada.

7. **Given** que estoy editando una tarea existente y la sugerencia
   considera los días candidatos
   **When** se evalúa la capacidad de cada día candidato
   **Then** la propia tarea que estoy editando no se cuenta dos veces si
   por coincidencia ya estuviera planificada ese día candidato (reutiliza
   `excluirTareaId`, igual que Historia 21).

## Alcance técnico

- `app/db/carga.ts`:
  - Nueva función pura `sugerirDiaAlternativo(db, fechaOriginal: string,
    minutosNecesarios: number, excluirTareaId?: number)` →
    `Promise<{ fecha: string; minutosDisponibles: number } | null>`.
  - Genera los días candidatos: los días de la semana de
    `fechaOriginal` (vía `inicioDeSemana` + 7 días, ya existente) más los
    7 días de la semana siguiente, excluyendo `fechaOriginal` misma.
  - Para cada candidato, reutiliza `calcularVistaPreviaSobrecarga` con
    `minutosNecesarios` y `excluirTareaId`; descarta los que no tengan
    disponibilidad (`minutosDisponibles === 0`) o queden sobrecargados.
  - De los candidatos válidos, retorna el de menor distancia en días
    respecto a `fechaOriginal` (empate → el más próximo cronológicamente).
  - Sin migración de base de datos — cálculo puro sobre datos existentes.
- `app/screens/FormularioTarea.tsx`:
  - Cuando `vistaPreviaSobrecarga.estaSobrecargado` es `true`, calcula
    también la sugerencia y la muestra debajo del aviso existente, con
    botón "Usar esta fecha" que llama a `setTextoFechaTarea` con la fecha
    sugerida.
- `app/screens/ObjetivoDetalleScreen.tsx` (modal de edición):
  - Mismo patrón, con botón que llama a `setEditFecha`.
- Formato de fecha en la sugerencia: reutilizar `formatearFecha` y
  `nombreDia`/`fechaADiaSemana` ya existentes (no crear un formateador
  nuevo).

## Fuera de alcance (explícitamente)

- Reasignar o mover automáticamente otras tareas ya planificadas para
  liberar espacio — esta historia solo sugiere una fecha distinta para la
  tarea que se está creando/editando, no reorganiza el resto del plan.
- Sugerencias en la vista Semana para tareas que ya quedaron
  sobrecargadas sin pasar por el formulario — fuera de alcance, posible
  historia futura.
- Cualquier campo nuevo de "urgencia" o "flexibilidad" en tareas — se
  resolvió con la búsqueda en dos pasos (semana actual → siguiente)
  descrita arriba, sin tocar el modelo de datos.
- Modo mínimo, días libres — historias separadas de Fase 4.
- Aplicar la sugerencia sin confirmación del usuario (autoguardado) — el
  botón solo llena el campo, el guardado sigue siendo manual.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Pruebas automatizadas para `sugerirDiaAlternativo`: día disponible en
  semana actual, ninguno en la actual pero sí en la siguiente, ninguno en
  ninguna de las dos, elección del más cercano ante varios candidatos, y
  `excluirTareaId` no contando la tarea propia dos veces.
- Verificar los 7 criterios de aceptación anteriores.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`), en una rama creada
  explícitamente para esta historia (`feature/sugerencias-ajuste`).
- Merge a `main` solo con `--ff-only`, tras verificación visual en
  dispositivo: provocar sobrecarga con disponibilidad declarada en otro
  día de la semana y confirmar que la sugerencia aparece y el botón
  "Usar esta fecha" llena el campo correctamente; probar también el caso
  sin ningún hueco disponible (no debe aparecer sugerencia).
