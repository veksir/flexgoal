# Tarea técnica 16: Partir App.tsx — hook useSesion + componente BottomNav

**Tipo:** Refactor de arquitectura — no agrega funcionalidad, no cambia
el modelo de datos.

## Contexto

La auditoría de código identificó `App.tsx` como un "God Component" de
490 líneas: navegación manual por switch de strings, +15 useState, lógica
de Pomodoro, formularios y estado global, todo junto.

## Cambio

- Nuevo archivo `app/hooks/useSesion.ts`: hook que encapsula toda la
  lógica de sesión activa, Pomodoro, cronómetro y configuración.
  - Tipos `SesionActiva` exportados desde aquí.
- Nuevo archivo `app/components/BottomNav.tsx`: componente de navegación
  inferior con tipo `Vista` y constante `VISTAS`.
- `App.tsx`: reescrito como orquestador delgado (~170 líneas).
  - Usa `useSesion()` para toda la lógica de tiempo.
  - Usa `BottomNav` para la navegación.
  - Re-exporta `SesionActiva` para mantener compatibilidad.

## Criterios de aceptación

1. La app compila sin errores TypeScript.
2. Las 147 pruebas existentes siguen pasando.
3. La funcionalidad es idéntica (navegación, sesiones, Pomodoro).
4. `App.tsx` tiene menos de 200 líneas.

## Alcance técnico adicional

- Sin migración de base de datos.
- `SesionActiva` se re-exporta desde `App.tsx` para no romper imports
  existentes.

## Definition of Done aplicable

- Verificar los 4 criterios de aceptación anteriores.
- Commit con Conventional Commits, rama `refactor/split-app-tsx`.
- **No mergear a main hasta confirmación visual/funcional explícita
  de Kevin.**
