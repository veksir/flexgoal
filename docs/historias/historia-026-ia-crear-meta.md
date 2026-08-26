# Historia 26: Crear estructura de meta con IA (Gemini)

**Como** usuario que tiene una idea y quiere que se la organicen sin tener que elegir una categoría fija
**Quiero** poder pedirle a la IA que proponga objetivos y tareas a partir del texto libre de mi idea, revisar/editar esa propuesta, y recién ahí guardarla
**Para** obtener algo pensado específicamente para mi idea, no un molde genérico

## Contexto de diseño

Depende de **ADR-003 (Aprobado, 2026-08-25): Gemini API, tier
gratuito**. Sin conexión a internet o sin una clave configurada, este
flujo no está disponible — la app sigue funcionando normalmente con
Historia 25 (plantillas) como alternativa siempre presente, nunca
bloqueante (ADR-004: la app funciona sin IA).

**Flujo de decisión, acordado con Kevin:**

1. Al convertir una idea, lo primero que se ve es una elección entre
   dos caminos: **"Automático" (IA)** o **"Plantillas"**. Elegir
   "Plantillas" entra al flujo ya existente de Historia 25 (4
   categorías + "Empezar vacío"), sin cambios.
2. Elegir "Automático" dispara la llamada a Gemini con el texto de la
   idea. Mientras responde, se muestra un estado de carga.
3. La respuesta de la IA **nunca se guarda directo** — se muestra como
   una propuesta editable (objetivos + tareas) en una pantalla de
   revisión: se puede editar el nombre de cada objetivo/tarea,
   eliminar cualquiera, y agregar nuevas a mano antes de confirmar.
   Recién al tocar "Guardar" se escribe en la base de datos (meta +
   objetivos + tareas, transacción atómica, mismo patrón que Historia
   25).
4. Si no hay internet, no hay clave configurada, o la IA falla
   (timeout, respuesta inválida, error de la API), se muestra un
   mensaje claro y se ofrece pasar directo al flujo de "Plantillas" en
   el mismo momento — sin dejar al usuario en un callejón sin salida.

**Configuración de la clave de API:** nueva pantalla de Configuración
(no existía) donde el usuario pega su propia clave de Gemini (obtenida
en Google AI Studio, gratis). Se guarda **solo en el dispositivo**, con
`expo-secure-store` (almacenamiento cifrado, compatible con Expo Go —
a diferencia de otros módulos nativos, este sí es parte del set
soportado por Expo Go, no rompe el patrón de Historia 18 de evitar
dependencias que obliguen a salir de Expo Go). Nunca se envía a
ningún lado ni se commitea al repo — cada quien usa la suya (mismo
principio que ADR-003 deja anotado para cuando haya más de un usuario).

**Alcance de lo que la IA propone (deliberadamente acotado, primera
versión):** solo nombres de objetivos y tareas — igual que las
plantillas de Historia 25, sin inferir fecha planificada, duración
estimada, ni prioridad. Reduce la superficie de error de una respuesta
mal formada y mantiene paridad con lo que ya existe. Límite razonable
para evitar respuestas desbordadas: entre 2 y 4 objetivos, cada uno con
1 a 3 tareas.

## Criterios de aceptación (Given-When-Then)

1. **Given** una idea en la bandeja, sin clave de Gemini configurada
   **When** elijo convertirla y toco "Automático"
   **Then** veo un mensaje claro indicando que falta configurar la
   clave, con acceso directo a la pantalla de Configuración, y la
   opción de usar "Plantillas" en su lugar sin perder el flujo.

2. **Given** clave configurada y conexión a internet
   **When** elijo "Automático" para una idea
   **Then** veo un estado de carga y, al responder la IA, una pantalla
   de revisión con los objetivos/tareas propuestos, todos editables.

3. **Given** la pantalla de revisión de la propuesta de IA
   **When** edito un nombre, elimino un objetivo/tarea, o agrego uno
   nuevo a mano, y luego confirmo
   **Then** se guarda exactamente lo que quedó en pantalla en ese
   momento (no la respuesta original de la IA sin editar) — meta,
   objetivos y tareas, en una transacción atómica; la idea se borra de
   la bandeja.

4. **Given** la pantalla de revisión de la propuesta de IA
   **When** decido no continuar y cancelo
   **Then** no se guarda nada, la idea sigue intacta en la bandeja.

5. **Given** clave configurada
   **When** no hay conexión a internet, o la API de Gemini responde con
   error, timeout, o algo que no se puede interpretar como
   objetivos/tareas válidos
   **Then** se muestra un mensaje claro del problema (distinto al del
   criterio 1) y se ofrece pasar a "Plantillas" en el mismo momento.

6. **Given** la nueva pantalla de Configuración
   **When** pego mi clave de Gemini y la guardo
   **Then** queda disponible para las próximas veces que use
   "Automático", persistida solo en este dispositivo (`expo-secure-store`).

7. **Given** una meta creada por este flujo
   **When** reviso sus objetivos y tareas después
   **Then** son completamente editables/eliminables con las funciones
   ya existentes, sin ninguna marca especial de "generado por IA" que
   restrinja su edición (mismo criterio que Historia 25).

## Alcance técnico

- Nueva dependencia: `expo-secure-store` (compatible con Expo Go).
- Nueva pantalla `app/screens/ConfiguracionScreen.tsx`: campo para
  pegar/guardar/borrar la clave de Gemini. Nuevo tab o punto de acceso
  en `App.tsx` (a definir la ubicación exacta durante implementación,
  ej. un ícono de engranaje en vez de ocupar un tab completo del
  `ViewToggle` existente).
- Nuevo módulo `app/ia/gemini.ts` (o similar): función
  `generarEstructuraDesdeIdea(textoIdea: string): Promise<PropuestaIA>`
  que arma el prompt, llama a la API de Gemini (modelo Flash), valida
  que la respuesta tenga la forma esperada (2-4 objetivos, 1-3 tareas
  cada uno, todos con nombre no vacío) y lanza un error tipado y
  distinguible si falla la red, la clave, o el parseo — para poder
  mostrar el mensaje correcto en cada caso (criterios 1 vs. 5).
- Nueva pantalla/modal de revisión de propuesta (reutilizable, similar
  en espíritu al selector de plantillas de Historia 25 pero editable
  antes de guardar) — estado en memoria únicamente hasta confirmar.
- `app/db/conversiones.ts`: reutilizar `convertirIdeaEnMeta` (ya acepta
  estructura de objetivos/tareas desde Historia 25) o generalizarla
  para aceptar la propuesta editada de IA con la misma forma de datos
  que una plantilla — evitar duplicar la lógica de inserción atómica.
- Sin migración de base de datos para `tareas`/`metas`/`objetivos` —
  si se necesita una tabla nueva para guardar configuración (como la
  clave, aunque probablemente viva en `expo-secure-store` y no en
  SQLite), documentarlo explícitamente si aplica.

## Fuera de alcance (explícitamente)

- Cualquier otro uso de IA más allá de esta conversión puntual
  (análisis de comportamiento, detección de ambigüedad, etc. — quedan
  como historias futuras de Fase 5, no parte de esta).
- Inferir fecha planificada, duración estimada, o prioridad desde la
  IA — se deja para una historia futura si se decide ampliar el
  alcance.
- Multi-usuario / claves compartidas — anotado en ADR-003 como fuera
  de alcance hasta que sea relevante.
- Reintentos automáticos sofisticados o caché de respuestas — un
  fallo simplemente ofrece caer a Plantillas, sin lógica adicional.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Pruebas automatizadas para la validación de la respuesta de Gemini
  (forma correcta, forma inválida con distintos tipos de error) —
  mockeando la llamada de red, sin depender de la API real en los
  tests automatizados.
- Verificar los 7 criterios de aceptación anteriores manualmente en
  dispositivo (con clave real de Gemini configurada por Kevin).
- Funciona sin romper nada del resto de la app si no hay clave/internet
  (regresión de Historia 25 debe seguir intacta).
- Commit con Conventional Commits, rama `feature/ia-crear-meta`.
- **No mergear a main hasta confirmación visual/funcional explícita de
  Kevin**, incluyendo probar el caso reál con su propia clave de
  Gemini.
