# Historia 10: Cambiar estado de una meta

**Como** usuario
**Quiero** cambiar el estado de una meta (pausarla, marcarla completada, o abandonarla)
**Para** reflejar la realidad de en qué metas sigo trabajando activamente

## Contexto de diseño

El campo `estado` en `metas` existe desde la Historia 2 (default
`'activa'`), pero nunca se agregó forma de cambiarlo. Del documento
original: estados posibles son Activa, Pausada, Completada, Abandonada,
Archivada — esta historia implementa Activa/Pausada/Completada/
Abandonada (deja Archivada fuera, es un estado más de gestión a largo
plazo que no aporta ahora).

## Criterios de aceptación (Given-When-Then)

1. **Given** que estoy en el detalle de una meta
   **When** toco su estado actual (ej. "Estado: activa")
   **Then** veo las opciones disponibles (Activa, Pausada, Completada, Abandonada) para cambiarlo.

2. **Given** que selecciono un nuevo estado
   **When** confirmo el cambio
   **Then** el estado se actualiza inmediatamente y se refleja tanto en el detalle como en la lista de Metas.

3. **Given** una meta marcada como Completada o Abandonada
   **When** la veo en la lista de Metas
   **Then** se distingue visualmente de las activas (ej. texto atenuado/gris), sin ocultarla de la lista — sigue siendo visible, solo con indicación clara de que no está activa.

4. **Given** que cambié el estado de una meta
   **When** cierro la app completamente y la reabro
   **Then** el estado persiste correctamente.

## Alcance técnico

- `actualizarEstadoMeta(metaId: number, nuevoEstado: string)` en
  `app/db/metas.ts` — un `UPDATE` simple, sin migración (la columna ya existe).
- En `MetaDetalleScreen.tsx`: reemplazar el texto estático de estado por
  un control simple (ej. botones pequeños "Activa | Pausada | Completada
  | Abandonada", resaltando el actual) que dispare la actualización.
- En `MetasScreen.tsx`: aplicar un estilo visual atenuado (ej. color de
  texto gris) cuando `estado !== 'activa'`.

## Fuera de alcance

- Estado "Archivada".
- Cualquier lógica automática de cambio de estado (ej. auto-completar
  cuando todas las tareas están hechas) — el cambio siempre es manual,
  decidido por el usuario (coherente con "el usuario decide" del
  documento original).
- Confirmación tipo Alert antes de cambiar — es reversible, no hace falta.

## Definition of Done aplicable

- TypeScript sin `any` innecesarios.
- Verificar los 4 estados y que el cambio persiste tras cerrar/reabrir.
- Funciona 100% offline.
- Commit con Conventional Commits (`feat: ...`).
- Verificado en Expo Go sobre la instalación existente.
