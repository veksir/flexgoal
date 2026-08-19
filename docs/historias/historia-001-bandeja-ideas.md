# Historia: Bandeja de ideas (walking skeleton — Fase 1)

**Como** usuario
**Quiero** capturar una idea rápida y verla en una lista persistida
**Para** no perder pensamientos sin tener que organizarlos de inmediato

## Criterios de aceptación (Given-When-Then)

1. **Given** que abro la app por primera vez
   **When** no hay ideas guardadas
   **Then** veo un estado vacío que invita a crear la primera idea (no una pantalla en blanco ni un error).

2. **Given** que estoy en la pantalla de ideas
   **When** escribo un texto y presiono "Guardar"
   **Then** la idea aparece inmediatamente en la lista, con su fecha de creación.

3. **Given** que tengo varias ideas guardadas
   **When** cierro completamente la app y la vuelvo a abrir
   **Then** todas las ideas siguen ahí, ordenadas de la más reciente a la más antigua (esto valida persistencia real en SQLite, no solo estado en memoria).

4. **Given** una idea en la lista
   **When** la mantengo presionada
   **Then** puedo eliminarla, y desaparece de la lista y de la base de datos.

5. **Given** que intento guardar una idea vacía
   **When** presiono "Guardar" sin haber escrito texto
   **Then** no se guarda nada y no se genera un registro vacío.

## Dependencias
- ADR-002 (SQLite vía `expo-sqlite`) — ✅ Resuelto.
- Proyecto Expo ya inicializado en `app/` — ✅ Resuelto.

## Alcance técnico (para quien implemente)
- Una sola tabla: `ideas (id INTEGER PRIMARY KEY, texto TEXT NOT NULL, creado_en TEXT NOT NULL)`.
- Una sola pantalla (`App.tsx` o `screens/IdeasScreen.tsx` si prefieres separarlo ya).
- Sin librería de navegación todavía — no hace falta para una sola pantalla.
- Sin diseño elaborado — esto es esqueleto, no producto pulido. Estilos mínimos legibles.

## Fuera de alcance (explícitamente, no lo pidas)
- Convertir idea en meta (eso es la siguiente historia, no esta).
- Categorías, etiquetas o prioridad de ideas.
- Edición de una idea existente (solo crear y eliminar por ahora).
- Cualquier lógica de IA.

## Definition of Done aplicable
- Código sigue convenciones del proyecto (TypeScript, sin `any` innecesarios).
- Funciona 100% offline (ya debería ser automático con SQLite local, pero verificarlo).
- Commit siguiendo Conventional Commits (`feat: ...`).
- Verificado corriendo en Expo Go antes de dar por terminada la historia.
