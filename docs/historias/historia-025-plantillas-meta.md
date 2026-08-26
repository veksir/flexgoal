# Historia 25: Plantillas de estructura al convertir una idea en meta

**Como** usuario que tiene una idea pero no sabe por dónde empezar a organizarla
**Quiero** poder elegir un patrón de estructura al convertir la idea en meta, que me cree un esqueleto de objetivos y tareas para editar
**Para** no enfrentarme a la pantalla vacía de "ahora armá todo a mano" cada vez

## Contexto de diseño

**Esto NO es la capa de IA de Fase 5.** Es determinístico: reglas fijas,
sin LLM, sin dependencia del spike pendiente de ADR-003. El usuario
elige la categoría — el sistema no interpreta el texto de la idea ni
finge entenderla. Se documenta explícitamente esta distinción para que
quede claro en el roadmap qué parte de "ayudar a organizar" ya está
resuelta sin IA, y qué parte (interpretar lenguaje libre) sigue
pendiente de ADR-003.

**Punto de partida:** hoy, `convertirIdeaEnMeta` (Historia 2) solo crea
la meta y borra la idea — cero objetivos, cero tareas. Esta historia
agrega un paso opcional intermedio: elegir una plantilla antes de
confirmar la conversión.

**Plantillas acordadas con Kevin (contenido fijo, deliberadamente
genérico — cada tarea es una pregunta a responder, no contenido
inventado sobre la idea específica del usuario):**

1. **Aprender una habilidad**
   - Fundamentos → "Investigar por dónde empezar / recursos básicos"
   - Práctica regular → "Definir primera sesión de práctica"
   - Primer resultado real → "Definir qué sería una primera prueba concreta"
2. **Proyecto con fecha límite**
   - Planificación → "Definir el alcance mínimo del proyecto"
   - Ejecución → "Definir el primer paso concreto"
   - Revisión y entrega → "Definir criterio de 'terminado'"
3. **Hábito / salud**
   - Rutina inicial → "Definir frecuencia y horario"
   - Sostenerlo → "Definir cómo voy a hacer seguimiento"
   - Evaluar y ajustar → "Definir fecha de revisión"
4. **Genérica / no encaja en las anteriores**
   - Primer paso → "Definir el primer paso concreto"
   - Avance → "Definir próximos pasos"
   - Cierre → "Definir cómo se ve terminado"

Cada plantilla crea exactamente 3 objetivos, cada uno con 1 tarea (sin
fecha planificada, sin duración estimada, sin prioridad — el usuario
completa esos campos si quiere, igual que con cualquier tarea creada a
mano).

**Opción de siempre:** "Empezar vacío" — mantiene el comportamiento
actual de Historia 2 exactamente igual (meta sin objetivos).

## Criterios de aceptación (Given-When-Then)

1. **Given** una idea en la bandeja
   **When** elijo convertirla en meta
   **Then** veo un selector con las 4 categorías de plantilla más la
   opción "Empezar vacío", antes de confirmar.

2. **Given** el selector de plantilla
   **When** elijo una de las 4 categorías y confirmo
   **Then** se crea la meta (igual que hoy) junto con sus 3 objetivos y
   3 tareas exactamente como están definidos arriba para esa categoría,
   y la idea se borra de la bandeja — todo en una misma operación
   atómica (ninguna combinación de éxito parcial: o se crea todo, o no
   se crea nada).

3. **Given** el selector de plantilla
   **When** elijo "Empezar vacío" y confirmo
   **Then** el comportamiento es idéntico al actual de Historia 2 —
   solo se crea la meta, sin objetivos ni tareas.

4. **Given** una meta creada desde una plantilla
   **When** reviso sus objetivos y tareas
   **Then** son completamente editables y eliminables con las
   funciones ya existentes (Historia 20 para tareas; edición de
   objetivos si existiera) — no llevan ninguna marca especial que
   restrinja su edición.

5. **Given** que elegí la plantilla equivocada para una idea
   **When** ya se creó la meta
   **Then** no hay una función de "cambiar de plantilla" — el usuario
   edita o borra manualmente lo que sobra (fuera de alcance rehacer
   la estructura automáticamente).

## Alcance técnico

- Nuevo archivo `app/db/plantillasMeta.ts`: datos puros (sin lógica),
  un array/objeto con las 4 plantillas y sus objetivos/tareas, tal como
  están definidos arriba. Fácil de ampliar a futuro sin tocar lógica de
  conversión.
- `app/db/conversiones.ts`: `convertirIdeaEnMeta` recibe un parámetro
  opcional `plantillaId?: string`. Dentro de la misma
  `withExclusiveTransactionAsync` ya existente, si se pasa una
  plantilla, además del `INSERT` de la meta se insertan sus objetivos
  (`objetivos`) y tareas (`tareas`) correspondientes, reutilizando el
  mismo patrón de queries ya usado en `db/objetivos.ts`/`db/tareas.ts`
  (no duplicar SQL a mano si se pueden llamar esas funciones dentro de
  la transacción).
- UI: en el flujo de conversión (`IdeasScreen.tsx` o donde viva hoy el
  botón/acción de convertir), agregar el selector de plantilla antes de
  ejecutar la conversión — puede ser un modal simple (mismo patrón que
  otros modales ya existentes en la app) con las 4 opciones + "Empezar
  vacío".
- Sin migración de base de datos — usa las tablas `metas`, `objetivos`,
  `tareas` ya existentes, sin columnas nuevas.

## Fuera de alcance (explícitamente)

- Cualquier interpretación del texto de la idea para sugerir qué
  plantilla usar — el usuario elige manualmente. Auto-sugerir la
  categoría según el texto sería ya un paso hacia IA (Fase 5, ADR-003),
  no parte de esta historia.
- Editar el contenido de una plantilla desde la UI (plantillas
  personalizadas) — quedan fijas en código por ahora.
- Aplicar plantillas a una meta ya existente (agregar objetivos de
  plantilla después de la conversión) — solo aplica en el momento de
  convertir.
- La capa de IA real que entienda lenguaje libre — eso sigue pendiente
  de resolver ADR-003 por separado, no se avanza en esta historia.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Pruebas automatizadas: cada una de las 4 plantillas crea exactamente
  3 objetivos y 3 tareas con el contenido esperado; "Empezar vacío"
  sigue creando solo la meta (regresión del comportamiento de Historia
  2); atomicidad de la transacción (si algo falla a mitad de camino, no
  debe quedar una meta sin sus objetivos, ni una idea borrada sin su
  meta).
- Verificar los 5 criterios de aceptación anteriores.
- Funciona 100% offline, sin dependencias nuevas.
- Commit con Conventional Commits, rama `feature/plantillas-meta`.
- **No mergear a main hasta confirmación visual/funcional explícita de
  Kevin.**
