# Historia 2: Convertir idea en meta

**Como** usuario
**Quiero** convertir una idea de mi bandeja en una meta
**Para** empezar a trabajar en ella de forma concreta, sin perder la idea original en el proceso

## Contexto de diseño

Del documento original del producto (sección 7): el usuario puede decidir
sobre una idea: *convertir en meta, guardar como idea, o descartar*. Esta
historia implementa la primera opción.

Del TDD (sección 3.3): una Meta tiene nombre, descripción, fecha de inicio,
fecha objetivo, prioridad, categoría/área, tiempo estimado, estado y
progreso. **Esta historia NO implementa todos esos campos** — solo el
mínimo necesario para que la meta exista y sea visible. Fecha objetivo,
prioridad, categoría y descripción se agregan en una historia posterior
("Estados, fechas, prioridades" — ya listada en el roadmap de Fase 1).

## Criterios de aceptación (Given-When-Then)

1. **Given** una idea en la bandeja
   **When** presiono la acción "Convertir en meta" sobre esa idea
   **Then** se crea una meta nueva con estado "Activa" y el texto de la idea como nombre, y la idea desaparece de la bandeja (no queda duplicada en ambos lados).

2. **Given** que estoy en la vista de Metas
   **When** abro la app
   **Then** veo la lista de metas creadas, cada una con su nombre y estado.

3. **Given** que no hay metas todavía
   **When** estoy en la vista de Metas
   **Then** veo un estado vacío apropiado (no una lista en blanco).

4. **Given** que convertí una idea en meta
   **When** cierro la app completamente y la reabro
   **Then** la meta sigue existiendo y la idea ya no aparece en la bandeja (persistencia real en ambas tablas).

5. **Given** que estoy en cualquiera de las dos vistas (Ideas / Metas)
   **When** cambio entre ellas
   **Then** veo el contenido correcto de cada una sin perder datos ni recargar de forma extraña.

## Alcance técnico

- Nueva tabla: `metas (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'activa', creado_en TEXT NOT NULL)`.
- La conversión (insertar en `metas` + eliminar de `ideas`) debe hacerse en una única transacción SQLite — si falla un paso, no debe quedar la idea eliminada sin su meta creada, ni viceversa.
- Para navegar entre "Ideas" y "Metas": **un toggle/tab simple dentro de la misma pantalla**, sin agregar `react-navigation` ni ninguna librería de navegación todavía. Dos vistas no justifican esa dependencia — se agrega cuando realmente haga falta (Fase 3 en adelante, probablemente).

## Fuera de alcance (explícitamente)

- Fecha objetivo, prioridad, categoría/área, descripción, tiempo estimado, progreso de la meta.
- Editar o eliminar una meta existente.
- Áreas, objetivos o tareas (siguientes historias del roadmap).
- Cualquier lógica de IA.

## Definition of Done aplicable

- Código en TypeScript, sin `any` innecesarios.
- Transacción atómica verificada (probar forzando un fallo simulado si es fácil, o al menos revisar el código).
- Funciona 100% offline.
- Commit siguiendo Conventional Commits (`feat: ...`).
- Verificado corriendo en Expo Go (build de SDK 57 vía expo.dev/go, ya que Play Store no lo tiene) antes de dar por terminada la historia.
