# flexgoal desktop

App de escritorio (Electron + Next.js) — sistema separado de la app
móvil que vive en `../app`. Ver la sección "Escritorio" del
[README de la raíz](../README.md#escritorio-electron--nextjs) para el
contexto completo (por qué está separada, modelo de datos, etc.).

## Arranca en blanco

Clonar y correr esto por primera vez no trae ningún dato de ejemplo
precargado. Si querés ver la app con contenido de muestra, andá a
**Tiempo → "Restaurar ejemplo"** una vez que la app esté corriendo.

## Correr

```bash
npm install

# Desarrollo:
npm run electron:dev

# Instalable para tu sistema (.dmg/.exe/.AppImage):
npm run electron:pack
```

## Estructura

- `app/` — rutas de Next.js (App Router): Hoy, Semana, Metas, Ideas, Tiempo, Diseño.
- `components/` — componentes de UI, incluida la ventana de sesión enfocada y los relojes animados.
- `lib/flexgoal/` — el corazón de la app:
  - `types.ts` — modelo de datos (Idea → Meta → Objetivo → Tarea → Sesión).
  - `engine.ts` — cálculo de carga/capacidad, sugerencias de ajuste, progreso.
  - `store.tsx` — persistencia en `localStorage`, todas las acciones.
  - `seed.ts` — `estadoVacio()` (arranque real) y `estadoInicial()` (dataset de ejemplo, solo para "Restaurar ejemplo").
  - `ia.ts` — integración con Gemini.
  - `cronometro.tsx` — cronómetro de sesión en vivo, Pomodoro.
  - `tema.tsx` — sistema de personalización visual.
  - `confirmacion.tsx` — diálogos de confirmación con el estilo propio de la app (reemplazo de `window.confirm`).
- `electron/` — proceso principal de Electron (`main.js`) y el puente seguro con el renderer (`preload.js`).

## Clave de API de Gemini

Se guarda cifrada con el llavero del sistema operativo (`safeStorage`
de Electron: Keychain en macOS, DPAPI en Windows, libsecret en
Linux), no en texto plano. No es obligatoria — sin ella, todo lo
demás de la app funciona igual (creación manual de metas/objetivos/
tareas).
