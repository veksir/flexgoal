# Historia 26: Crear estructura de meta con IA (Gemini)

**Como** usuario que tiene una idea y quiere que se la organicen sin tener que elegir una categoría fija
**Quiero** poder pedirle a la IA que proponga objetivos y tareas a partir del texto libre de mi idea, revisar/editar esa propuesta, pedir correcciones, y recién ahí guardarla
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
2. Elegir "Automático" abre un paso de **configuración** donde el
   usuario elige cuántos objetivos (2-6) y cuántas tareas por objetivo
   (2-5) quiere que genere la IA.
3. La IA responde con la propuesta. El usuario ve una pantalla de
   **revisión** donde puede:
   - **Aceptar/rechazar** cada objetivo y tarea individualmente
     (checkboxes ✅/⬜).
   - **Editar** nombres y duraciones estimadas directamente.
   - **Agregar/eliminar** objetivos y tareas.
   - **Pedir corrección**: escribir feedback (ej. "demasiado difícil",
     "no me gusta el objetivo 2") y la IA regenera manteniendo solo lo
     que el usuario aceptó.
4. Recién al tocar **"Guardar"** se escribe en la base de datos (meta +
   objetivos + tareas, transacción atómica, mismo patrón que Historia
   25). Solo se guardan los elementos marcados como aceptados.

**Configuración de la clave de API:** nueva pantalla de Configuración
donde el usuario pega su propia clave de Gemini (obtenida en Google AI
Studio, gratis). Se guarda **solo en el dispositivo**, con
`expo-secure-store` (almacenamiento cifrado, compatible con Expo Go).
Nunca se envía a ningún lado ni se commitea al repo — cada quien usa la
suya.

**Alcance de lo que la IA propone:** nombres de objetivos y tareas, más
una **estimación de tiempo en minutos** por tarea (campo
`duracion_estimada_minutos`), que se guarda directamente en la BD.
El usuario puede editar o eliminar esa estimación antes de guardar.

## Criterios de aceptación (Given-When-Then)

1. **Given** una idea en la bandeja, sin clave de Gemini configurada
   **When** elijo convertirla y toco "Automático"
   **Then** veo un mensaje claro indicando que falta configurar la
   clave, con acceso directo a la pantalla de Configuración, y la
   opción de usar "Plantillas" en su lugar sin perder el flujo.

2. **Given** clave configurada y conexión a internet
   **When** elijo "Automático" para una idea
   **Then** veo un selector de cantidad de objetivos (2-6) y tareas por
   objetivo (2-5), y al confirmar veo la propuesta de la IA con
   checkboxes para aceptar/rechazar cada elemento.

3. **Given** la pantalla de revisión de la propuesta de IA
   **When** acepto/rechazo objetivos y tareas, edito nombres o
   duraciones, y toco "Guardar"
   **Then** se guardan solo los elementos aceptados — meta, objetivos y
   tareas, en una transacción atómica; la idea se borra de la bandeja.
   La duración estimada de cada tarea se guarda en
   `duracion_estimada_minutos`.

4. **Given** la pantalla de revisión de la propuesta de IA
   **When** escribo feedback y toco "Pedir corrección"
   **Then** la IA regenera la propuesta manteniendo solo lo que acepté
   previamente, aplicando mi feedback.

5. **Given** la pantalla de revisión de la propuesta de IA
   **When** decido no continuar y cancelo
   **Then** no se guarda nada, la idea sigue intacta en la bandeja.

6. **Given** clave configurada
   **When** no hay conexión a internet, o la API de Gemini responde con
   error, timeout, o algo que no se puede interpretar como
   objetivos/tareas válidos
   **Then** se muestra un mensaje claro del problema y se ofrece pasar
   a "Plantillas" en el mismo momento.

7. **Given** la nueva pantalla de Configuración
   **When** pego mi clave de Gemini y la guardo
   **Then** queda disponible para las próximas veces que use
   "Automático", persistida solo en este dispositivo.

8. **Given** una meta creada por este flujo
   **When** reviso sus objetivos y tareas después
   **Then** son completamente editables/eliminables con las funciones
   ya existentes, sin ninguna marca especial de "generado por IA".

## Alcance técnico

- Nueva dependencia: `expo-secure-store` (compatible con Expo Go).
- Nuevo módulo `app/ia/gemini.ts`:
  - `generarEstructuraDesdeIdea(textoIdea, configuracion?)` — genera
    propuesta con duración estimada por tarea.
  - `corregirEstructura(textoIdea, propuestaActual, feedback, configuracion?)` —
    regenera manteniendo elementos aceptados + aplicando feedback.
  - Interfaz `ConfiguracionIA` con `cantidadObjetivos` y
    `tareasPorObjetivo`.
  - Interfaz `PropuestaTarea` con `nombre` y
    `duracion_estimada_minutos?`.
- Nuevo módulo `app/screens/ConfiguracionScreen.tsx`: campo para
  pegar/guardar/borrar la clave, con verificación de modelos.
- `app/screens/IdeasScreen.tsx`:
  - Nuevo paso `'configuracion'` con selectores numéricos.
  - Nuevo paso `'corrigiendo'` para estado de carga de corrección.
  - Checkboxes ✅/⬜ por objetivo y tarea.
  - Campo de duración estimada editable por tarea.
  - Botón "Pedir corrección" con campo de feedback.
  - ScrollView en revisión (no FlatList) para ver todo el contenido.
- `app/db/conversiones.ts`:
  - `PropuestaEstructura` incluye `duracion_estimada_minutos?`.
  - `insertarPropuestaEnTxn` guarda la duración en BD.

## Fuera de alcance (explícitamente)

- Cualquier otro uso de IA más allá de esta conversión puntual.
- Multi-usuario / claves compartidas.
- Reintentos automáticos sofisticados o caché de respuestas.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Pruebas automatizadas para validación de respuesta de Gemini
  (mockeando la llamada de red).
- Verificar los 8 criterios de aceptación manualmente en dispositivo
  (con clave real de Gemini configurada por Kevin).
- Funciona sin romper nada del resto de la app si no hay clave/internet.
- 147+ pruebas pasando, tsc sin errores.
- Commit con Conventional Commits, rama `feature/ia-crear-meta`.
- **No mergear a main hasta confirmación visual/funcional explícita de
  Kevin.**
